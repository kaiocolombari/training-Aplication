import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { ArrowLeft, Check, CheckCheck, Paperclip, RefreshCw, Send } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useChatRealtime } from "@/context/ChatRealtimeContext";
import { communicationService, type ChatMessage } from "@/services/communicationService";

const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "application/pdf",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export default function MessagesScreen() {
  const params = useLocalSearchParams<{ destinatarioId: string; nome: string; conversaId?: string }>();
  const { user } = useAuth();
  const [conversationId, setConversationId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isOtherOnline, setIsOtherOnline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const connection = useChatRealtime();

  const loadMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      setMessages(await communicationService.listMessages(conversationId));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível carregar as mensagens.");
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    if (conversationId || !params.destinatarioId) return;
    let active = true;
    void communicationService.ensureConversation(params.destinatarioId)
      .then(result => { if (active) setConversationId(result.conversaId); })
      .catch(cause => {
        if (active) {
          setError(cause instanceof Error ? cause.message : "Não foi possível iniciar a conversa.");
          setIsLoading(false);
        }
      });
    return () => { active = false; };
  }, [conversationId, params.destinatarioId]);

  useEffect(() => {
    if (!conversationId) return;
    let active = true;
    void communicationService.listMessages(conversationId)
      .then(result => { if (active) { setMessages(result); setError(null); } })
      .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : "Não foi possível carregar as mensagens."); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;
    let active = true;
    if (!connection) return;
    const onMessage = (message: ChatMessage) => {
      if (!active) return;
      setMessages((current) => current.some((item) => item.id === message.id)
        ? current
        : [...current, message].sort((a, b) => new Date(a.enviadaEm).getTime() - new Date(b.enviadaEm).getTime()));
      if (message.remetenteId !== user?.usuarioId) {
        void connection.invoke("MarcarLida", conversationId).catch(() => undefined);
      }
    };
    const onNewMessage = (event: { mensagemId?: string; conversaId?: string }) => {
      if (event.conversaId === conversationId && event.mensagemId) {
        void connection.invoke("ConfirmarEntrega", event.mensagemId).catch(() => undefined);
      }
    };
    const onStatus = (status: { mensagemIds: string[]; status: string; em: string }) => {
      if (!active) return;
      setMessages((current) => current.map((item) => {
        if (!status.mensagemIds.includes(item.id)) return item;
        return status.status === "LIDA"
          ? { ...item, entregueEm: item.entregueEm ?? status.em, lidaEm: status.em }
          : { ...item, entregueEm: status.em };
      }));
    };
    const onTyping = (event: { usuarioId: string; digitando: boolean }) => {
      if (event.usuarioId !== user?.usuarioId) setIsTyping(event.digitando);
    };
    const onPresenceInitial = (event: { usuarioId: string; online: boolean }) => {
      if (event.usuarioId === params.destinatarioId) setIsOtherOnline(event.online);
    };
    const onPresence = (usuarioId: string, online: boolean) => {
      if (usuarioId === params.destinatarioId) setIsOtherOnline(online);
    };
    connection.on("MensagemRecebida", onMessage);
    connection.on("NovaMensagem", onNewMessage);
    connection.on("StatusMensagemAtualizado", onStatus);
    connection.on("UsuarioDigitando", onTyping);
    connection.on("PresencaInicial", onPresenceInitial);
    connection.on("PresencaAtualizada", onPresence);
    const onReconnected = async () => {
      if (!active) return;
      await connection.invoke("EntrarConversa", conversationId);
      const latest = await communicationService.listMessages(conversationId);
      if (active) setMessages(latest);
      await connection.invoke("MarcarLida", conversationId);
    };
    connection.onreconnected(onReconnected);

    if (connection.state === "Connected") {
      void connection.invoke("EntrarConversa", conversationId)
        .then(async () => {
          const latest = await communicationService.listMessages(conversationId);
          if (active) setMessages(latest);
          await connection.invoke("MarcarLida", conversationId);
        })
        .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Chat em tempo real indisponível. O envio continuará pela API."); });
    }

    return () => {
      active = false;
      connection.off("MensagemRecebida", onMessage);
      connection.off("NovaMensagem", onNewMessage);
      connection.off("StatusMensagemAtualizado", onStatus);
      connection.off("UsuarioDigitando", onTyping);
      connection.off("PresencaInicial", onPresenceInitial);
      connection.off("PresencaAtualizada", onPresence);
      void connection.invoke("SairConversa", conversationId).catch(() => undefined);
    };
  }, [connection, conversationId, params.destinatarioId, user?.usuarioId]);

  useEffect(() => {
    if (!connection || connection.state !== "Connected" || !conversationId) return;
    let stopTimer: ReturnType<typeof setTimeout> | undefined;
    if (!draft.trim()) {
      void connection.invoke("UsuarioDigitando", conversationId, false).catch(() => undefined);
      return;
    }
    const startTimer = setTimeout(() => {
      void connection.invoke("UsuarioDigitando", conversationId, true).catch(() => undefined);
      stopTimer = setTimeout(() => {
        void connection.invoke("UsuarioDigitando", conversationId, false).catch(() => undefined);
      }, 2500);
    }, 250);
    return () => {
      clearTimeout(startTimer);
      if (stopTimer) clearTimeout(stopTimer);
    };
  }, [connection, conversationId, draft]);

  async function send() {
    const content = draft.trim();
    if (!content || !params.destinatarioId || isSending) return;
    setIsSending(true);
    try {
      if (conversationId && connection?.state === "Connected") {
        try {
          await connection.invoke("EnviarMensagem", conversationId, content);
        } catch (error) {
          if (!(error instanceof Error) || !error.message.toLowerCase().includes("expir")) throw error;
          const result = await communicationService.sendMessage(params.destinatarioId, content);
          setConversationId(result.conversaId);
          setMessages(await communicationService.listMessages(result.conversaId));
        }
      } else {
        const result = await communicationService.sendMessage(params.destinatarioId, content);
        setConversationId(result.conversaId);
        setMessages(await communicationService.listMessages(result.conversaId));
      }
      setDraft("");
      setError(null);
    } catch (cause) {
      Alert.alert("Não foi possível enviar", cause instanceof Error ? cause.message : "Tente novamente.");
    } finally {
      setIsSending(false);
    }
  }

  async function pickAttachment() {
    if (!params.destinatarioId || isUploading) return;
    try {
      const selection = await DocumentPicker.getDocumentAsync({
        type: ALLOWED_FILE_TYPES,
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (selection.canceled || !selection.assets[0]) return;
      const file = selection.assets[0];
      if (file.size && file.size > 20 * 1024 * 1024) {
        Alert.alert("Arquivo muito grande", "Cada anexo pode ter no máximo 20 MB.");
        return;
      }

      setIsUploading(true);
      const targetConversationId = (await communicationService.ensureConversation(params.destinatarioId)).conversaId;
      if (targetConversationId !== conversationId) setConversationId(targetConversationId);
      await communicationService.uploadAttachment(targetConversationId, {
        uri: file.uri,
        name: file.name,
        type: file.mimeType ?? "application/octet-stream",
      });
      setMessages(await communicationService.listMessages(targetConversationId));
      Alert.alert("Arquivo verificado", "O anexo foi aprovado pela verificação de segurança e enviado.");
    } catch (cause) {
      Alert.alert("Não foi possível enviar o arquivo", cause instanceof Error ? cause.message : "O arquivo foi rejeitado ou a verificação está indisponível.");
    } finally {
      setIsUploading(false);
    }
  }

  async function openAttachment(id: string, filename: string) {
    try {
      await communicationService.downloadAttachment(id, filename);
    } catch (cause) {
      Alert.alert("Não foi possível abrir o anexo", cause instanceof Error ? cause.message : "Tente novamente.");
    }
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-[#F3F1EB]">
      <View className="flex-row items-center border-b border-line bg-white px-4 py-3">
        <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-[#F3F1EB]"><ArrowLeft color="#17211B" size={18} /></Pressable>
        <View className="ml-3 flex-1">
          <Text className="text-[13px] font-extrabold text-ink">{params.nome ?? "Personal"}</Text>
          <Text className="mt-0.5 text-[9px] text-muted">{isOtherOnline ? "Online agora" : "Offline"} · Chat temporário · apaga após 48h sem mensagens</Text>
          {isTyping ? <Text className="mt-0.5 text-[9px] font-bold text-[#647B4D]">Digitando...</Text> : null}
        </View>
        <Pressable onPress={() => void loadMessages()} className="h-10 w-10 items-center justify-center rounded-full bg-[#F3F1EB]"><RefreshCw color="#526447" size={16} /></Pressable>
      </View>

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={8}>
        <ScrollView className="flex-1" contentContainerClassName="px-4 py-5" keyboardShouldPersistTaps="handled">
          {isLoading ? <View className="items-center py-10"><ActivityIndicator color="#526447" /><Text className="mt-3 text-[10px] text-muted">Carregando conversa...</Text></View> : null}
          {error ? <Pressable onPress={() => void loadMessages()} className="rounded-2xl border border-[#E8D8CE] bg-[#FBF1EA] p-4"><Text className="text-[10px] text-[#8D4F3E]">{error} · Toque para tentar novamente.</Text></Pressable> : null}
          {!isLoading && messages.length === 0 ? (
            <View className="mt-16 items-center px-8"><View className="h-14 w-14 items-center justify-center rounded-2xl bg-[#E8EDDE]"><Send color="#526447" size={22} /></View><Text className="mt-4 text-[15px] font-extrabold text-ink">Comece a conversa</Text><Text className="mt-2 text-center text-[10px] leading-5 text-muted">Envie uma dúvida sobre seu treino, execução ou planejamento. Somente o personal escolhido e você terão acesso.</Text></View>
          ) : null}
          {messages.map((message) => {
            const own = message.remetenteId === user?.usuarioId;
            return (
              <View key={message.id} className={`mb-3 max-w-[88%] rounded-[20px] px-4 py-3 ${own ? "self-end rounded-br-md bg-ink" : "self-start rounded-bl-md border border-line bg-white"}`}>
                {!own ? <Text className="mb-1 text-[9px] font-extrabold text-[#66745C]">{message.remetenteNome}</Text> : null}
                {message.conteudo ? <Text className={`text-[12px] leading-5 ${own ? "text-white" : "text-ink"}`}>{message.conteudo}</Text> : null}
                {message.anexos?.map((attachment) => (
                  <Pressable key={attachment.id} onPress={() => void openAttachment(attachment.id, attachment.nomeOriginal)} className={`mt-2 rounded-xl px-3 py-2 ${own ? "bg-white/10" : "bg-[#F3F1EB]"}`}>
                    <Text className={`text-[10px] font-bold ${own ? "text-lime" : "text-ink"}`}>{attachment.nomeOriginal}</Text>
                    <Text className={`mt-0.5 text-[8px] ${own ? "text-white/60" : "text-muted"}`}>Anexo verificado · {(attachment.tamanhoBytes / 1024 / 1024).toFixed(1)} MB · toque para abrir</Text>
                  </Pressable>
                ))}
                <View className="mt-2 flex-row items-center justify-end gap-1">
                  <Text className={`text-[8px] ${own ? "text-white/45" : "text-muted"}`}>{new Date(message.enviadaEm).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</Text>
                  {own ? message.lidaEm ? <CheckCheck color="#C8EF73" size={11} /> : message.entregueEm ? <CheckCheck color="#FFFFFFB0" size={11} /> : <Check color="#FFFFFF80" size={11} /> : null}
                </View>
              </View>
            );
          })}
        </ScrollView>

        <View className="flex-row items-end gap-2 border-t border-line bg-white px-4 py-3">
          <Pressable onPress={() => void pickAttachment()} disabled={isUploading || isLoading} className="h-12 w-11 items-center justify-center rounded-2xl bg-[#F3F1EB]">
            {isUploading ? <ActivityIndicator color="#526447" size="small" /> : <Paperclip color="#526447" size={18} />}
          </Pressable>
          <TextInput value={draft} onChangeText={setDraft} editable={!isLoading} placeholder="Escreva uma mensagem..." placeholderTextColor="#92968E" multiline maxLength={4000} className="max-h-28 min-h-12 flex-1 rounded-2xl bg-[#F3F1EB] px-4 py-3 text-[12px] text-ink" />
          <Pressable onPress={() => void send()} disabled={!draft.trim() || isSending || isLoading} className={`h-12 w-12 items-center justify-center rounded-2xl bg-lime ${!draft.trim() || isSending || isLoading ? "opacity-50" : ""}`}>
            {isSending ? <ActivityIndicator color="#17211B" size="small" /> : <Send color="#17211B" size={18} />}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
