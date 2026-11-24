import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { ArrowLeft, Check, CheckCheck, RefreshCw, Send } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { communicationService, type ChatMessage } from "@/services/communicationService";

export default function MessagesScreen() {
  const params = useLocalSearchParams<{ destinatarioId: string; nome: string; conversaId?: string }>();
  const [conversationId, setConversationId] = useState(params.conversaId ?? "");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(Boolean(params.conversaId));
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!conversationId) return;
    let active = true;
    void communicationService.listMessages(conversationId)
      .then((result) => { if (active) { setMessages(result); setError(null); } })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Não foi possível carregar as mensagens."); })
      .finally(() => { if (active) setIsLoading(false); });
    const interval = setInterval(() => {
      void communicationService.listMessages(conversationId)
        .then((result) => { if (active) { setMessages(result); setError(null); } })
        .catch(() => undefined);
    }, 15000);
    return () => { active = false; clearInterval(interval); };
  }, [conversationId]);

  async function send() {
    const content = draft.trim();
    if (!content || !params.destinatarioId || isSending) return;
    setIsSending(true);
    try {
      const result = await communicationService.sendMessage(params.destinatarioId, content);
      setConversationId(result.conversaId);
      setDraft("");
      setError(null);
    } catch (cause) {
      Alert.alert("Não foi possível enviar", cause instanceof Error ? cause.message : "Tente novamente.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-[#F3F1EB]">
      <View className="flex-row items-center border-b border-line bg-white px-4 py-3">
        <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-[#F3F1EB]"><ArrowLeft color="#17211B" size={18} /></Pressable>
        <View className="ml-3 flex-1"><Text className="text-[13px] font-extrabold text-ink">{params.nome ?? "Personal"}</Text><Text className="mt-0.5 text-[9px] text-muted">Conversa com seu personal</Text></View>
        <Pressable onPress={() => void loadMessages()} className="h-10 w-10 items-center justify-center rounded-full bg-[#F3F1EB]"><RefreshCw color="#526447" size={16} /></Pressable>
      </View>

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={8}>
        <ScrollView className="flex-1" contentContainerClassName="px-4 py-5" keyboardShouldPersistTaps="handled">
          {isLoading ? <View className="items-center py-10"><ActivityIndicator color="#526447" /><Text className="mt-3 text-[10px] text-muted">Carregando conversa...</Text></View> : null}
          {error ? <Pressable onPress={() => void loadMessages()} className="rounded-2xl border border-[#E8D8CE] bg-[#FBF1EA] p-4"><Text className="text-[10px] text-[#8D4F3E]">{error} · Toque para tentar novamente.</Text></Pressable> : null}
          {!isLoading && messages.length === 0 ? (
            <View className="mt-16 items-center px-8"><View className="h-14 w-14 items-center justify-center rounded-2xl bg-[#E8EDDE]"><Send color="#526447" size={22} /></View><Text className="mt-4 text-[15px] font-extrabold text-ink">Comece a conversa</Text><Text className="mt-2 text-center text-[10px] leading-5 text-muted">Envie uma dúvida sobre seu treino, execução ou planejamento. A mensagem será entregue ao personal vinculado.</Text></View>
          ) : null}
          {messages.map((message) => {
            const own = message.remetenteTipo === "ALUNO";
            return (
              <View key={message.id} className={`mb-3 max-w-[88%] rounded-[20px] px-4 py-3 ${own ? "self-end rounded-br-md bg-ink" : "self-start rounded-bl-md border border-line bg-white"}`}>
                {!own ? <Text className="mb-1 text-[9px] font-extrabold text-[#66745C]">{message.remetenteNome}</Text> : null}
                <Text className={`text-[12px] leading-5 ${own ? "text-white" : "text-ink"}`}>{message.conteudo}</Text>
                <View className="mt-2 flex-row items-center justify-end gap-1">
                  <Text className={`text-[8px] ${own ? "text-white/45" : "text-muted"}`}>{new Date(message.enviadaEm).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</Text>
                  {own ? message.lidaEm ? <CheckCheck color="#C8EF73" size={11} /> : <Check color="#FFFFFF80" size={11} /> : null}
                </View>
              </View>
            );
          })}
        </ScrollView>

        <View className="flex-row items-end gap-2 border-t border-line bg-white px-4 py-3">
          <TextInput value={draft} onChangeText={setDraft} placeholder="Escreva sua mensagem..." placeholderTextColor="#92968E" multiline maxLength={4000} className="max-h-28 min-h-12 flex-1 rounded-2xl bg-[#F3F1EB] px-4 py-3 text-[12px] text-ink" />
          <Pressable onPress={() => void send()} disabled={!draft.trim() || isSending} className={`h-12 w-12 items-center justify-center rounded-2xl bg-lime ${!draft.trim() || isSending ? "opacity-50" : ""}`}>
            {isSending ? <ActivityIndicator color="#17211B" size="small" /> : <Send color="#17211B" size={18} />}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
