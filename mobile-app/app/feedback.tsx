import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from "react-native";
import { ArrowLeft, MessageSquareText, Send, Star } from "lucide-react-native";
import { router } from "expo-router";

import { AppScreen, Eyebrow, IconButton, SectionTitle, Tag } from "@/components/ui";
import { useStudentData } from "@/context/StudentDataContext";
import type { StudentFeedback } from "@/services/studentService";

const categories: { id: StudentFeedback["categoria"]; label: string }[] = [
  { id: "ACOMPANHAMENTO", label: "Acompanhamento" },
  { id: "TREINAMENTO", label: "Treinamento" },
  { id: "SISTEMA", label: "Aplicativo" },
  { id: "SUGESTAO", label: "Sugestão" },
];

function feedbackStatus(status: string) {
  if (status === "RESPONDIDO") return { label: "Respondido", tone: "lime" as const };
  if (status === "EM_ANALISE") return { label: "Em análise", tone: "dark" as const };
  if (status === "ARQUIVADO") return { label: "Arquivado", tone: "light" as const };
  return { label: "Recebido", tone: "light" as const };
}

export default function FeedbackScreen() {
  const { data, submitFeedback } = useStudentData();
  const [category, setCategory] = useState<StudentFeedback["categoria"]>("ACOMPANHAMENTO");
  const [rating, setRating] = useState(5);
  const [personalId, setPersonalId] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(true);
  const selectedPersonalName = useMemo(
    () => data.feedbackPersonals.find((item) => item.personalId === personalId)?.nome,
    [data.feedbackPersonals, personalId],
  );

  async function send() {
    const normalized = comment.trim();
    if (normalized.length < 5) {
      Alert.alert("Conte um pouco mais", "Escreva pelo menos 5 caracteres para que a equipe consiga entender seu feedback.");
      return;
    }
    setSending(true);
    try {
      await submitFeedback({ personalId, categoria: category, nota: rating, comentario: normalized });
      setComment("");
      setRating(5);
      Alert.alert("Feedback enviado", "Sua mensagem foi registrada. Você poderá acompanhar a resposta da equipe nesta tela.");
    } catch (cause) {
      Alert.alert("Não foi possível enviar", cause instanceof Error ? cause.message : "Tente novamente.");
    } finally {
      setSending(false);
    }
  }

  return (
    <AppScreen>
      <View className="flex-row items-center justify-between pt-3">
        <IconButton onPress={() => router.back()}><ArrowLeft color="#17211B" size={19} /></IconButton>
        <Eyebrow>ESCUTA E MELHORIA CONTÍNUA</Eyebrow>
        <View className="w-11" />
      </View>

      <View className="mt-6 rounded-[26px] bg-ink p-5">
        <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white/10"><MessageSquareText color="#C8EF73" size={21} /></View>
        <Text className="mt-4 text-[25px] font-black tracking-[-0.8px] text-white">Sua opinião importa.</Text>
        <Text className="mt-2 text-[11px] leading-5 text-white/65">Compartilhe como está sendo seu acompanhamento. Seu feedback fica registrado e a equipe pode responder diretamente por aqui.</Text>
        <View className="mt-4 flex-row gap-2">
          <View className="rounded-full bg-white/10 px-3 py-1.5"><Text className="text-[9px] font-bold text-white/80">{data.feedbacks.length} registros</Text></View>
          <View className="rounded-full bg-lime px-3 py-1.5"><Text className="text-[9px] font-extrabold text-ink">Canal direto com a equipe</Text></View>
        </View>
      </View>

      <SectionTitle>Enviar feedback</SectionTitle>
      <View className="rounded-[24px] border border-line bg-white p-4">
        <Text className="text-[9px] font-extrabold uppercase tracking-[1.2px] text-muted">Sobre o que deseja falar?</Text>
        <View className="mt-3 flex-row flex-wrap gap-2">
          {categories.map((item) => (
            <Pressable key={item.id} onPress={() => setCategory(item.id)} className={`rounded-full border px-3 py-2 ${category === item.id ? "border-ink bg-ink" : "border-line bg-[#F7F6F2]"}`}>
              <Text className={`text-[9px] font-bold ${category === item.id ? "text-white" : "text-[#6E756A]"}`}>{item.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text className="mt-5 text-[9px] font-extrabold uppercase tracking-[1.2px] text-muted">Para quem deseja enviar?</Text>
        <View className="mt-3 flex-row flex-wrap gap-2">
          <Pressable onPress={() => setPersonalId(null)} className={`rounded-full border px-3 py-2 ${personalId === null ? "border-ink bg-ink" : "border-line bg-[#F7F6F2]"}`}>
            <Text className={`text-[9px] font-bold ${personalId === null ? "text-white" : "text-[#6E756A]"}`}>Toda a equipe</Text>
          </Pressable>
          {data.feedbackPersonals.map((personal) => (
            <Pressable key={personal.personalId} onPress={() => setPersonalId(personal.personalId)} className={`rounded-full border px-3 py-2 ${personalId === personal.personalId ? "border-ink bg-ink" : "border-line bg-[#F7F6F2]"}`}>
              <Text className={`text-[9px] font-bold ${personalId === personal.personalId ? "text-white" : "text-[#6E756A]"}`}>{personal.nome}</Text>
            </Pressable>
          ))}
        </View>
        <Text className="mt-2 text-[9px] text-muted">{selectedPersonalName ? `Seu feedback será direcionado para ${selectedPersonalName}.` : "A equipe vinculada poderá visualizar e tratar este feedback."}</Text>

        <Text className="mt-5 text-[9px] font-extrabold uppercase tracking-[1.2px] text-muted">Como você avalia sua experiência?</Text>
        <View className="mt-3 flex-row items-center gap-3">
          <View className="flex-row gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <Pressable key={value} onPress={() => setRating(value)} accessibilityRole="button" accessibilityLabel={`Nota ${value} de 5`} className="p-1">
                <Star size={27} color={value <= rating ? "#B58A38" : "#D8D9D1"} fill={value <= rating ? "#E7C56B" : "transparent"} />
              </Pressable>
            ))}
          </View>
          <Text className="text-[11px] font-extrabold text-ink">{rating}/5</Text>
        </View>

        <Text className="mt-5 text-[9px] font-extrabold uppercase tracking-[1.2px] text-muted">Seu comentário</Text>
        <TextInput value={comment} onChangeText={setComment} maxLength={2000} multiline textAlignVertical="top" placeholder="Conte o que está funcionando bem ou o que podemos melhorar..." placeholderTextColor="#999D94" className="mt-2 min-h-[118px] rounded-2xl bg-[#F4F3EE] px-4 py-3 text-[11px] leading-5 text-ink" />
        <View className="mt-2 flex-row items-center justify-between"><Text className="text-[9px] text-muted">Mínimo de 5 caracteres</Text><Text className="text-[9px] text-muted">{comment.length}/2000</Text></View>
        <Pressable onPress={() => void send()} disabled={sending || comment.trim().length < 5} className={`mt-4 h-12 flex-row items-center justify-center gap-2 rounded-xl bg-lime ${(sending || comment.trim().length < 5) ? "opacity-50" : ""}`}>
          {sending ? <ActivityIndicator color="#17211B" size="small" /> : <Send color="#17211B" size={15} />}
          <Text className="text-[10px] font-extrabold text-ink">{sending ? "Enviando..." : "Enviar feedback"}</Text>
        </Pressable>
      </View>

      <SectionTitle action={<Pressable onPress={() => setHistoryExpanded((value) => !value)}><Text className="text-[10px] font-bold text-[#68765A]">{historyExpanded ? "Recolher" : "Expandir"}</Text></Pressable>}>Seu histórico</SectionTitle>
      {historyExpanded ? data.feedbacks.length > 0 ? data.feedbacks.map((item) => {
        const status = feedbackStatus(item.status);
        return (
          <View key={item.id} className="mb-3 rounded-[22px] border border-line bg-white p-4">
            <View className="flex-row items-center justify-between gap-2"><Tag tone={status.tone}>{status.label}</Tag><Text className="text-[9px] text-muted">{new Date(item.criadoEm).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}</Text></View>
            <View className="mt-3 flex-row items-center justify-between"><Text className="text-[10px] font-extrabold text-ink">{categories.find((categoryItem) => categoryItem.id === item.categoria)?.label ?? item.categoria}</Text><View className="flex-row items-center gap-1"><Star color="#B58A38" fill="#E7C56B" size={12} /><Text className="text-[10px] font-extrabold text-ink">{item.nota}/5</Text></View></View>
            <Text className="mt-2 text-[11px] leading-5 text-[#596257]">{item.comentario}</Text>
            {item.personalNome ? <Text className="mt-2 text-[9px] text-muted">Direcionado para {item.personalNome}</Text> : null}
            {item.respostaEquipe ? <View className="mt-3 rounded-xl bg-[#EDF2E5] p-3"><Text className="text-[8px] font-extrabold uppercase tracking-[1px] text-[#647B4D]">Resposta da equipe</Text><Text className="mt-1 text-[10px] leading-5 text-[#4E5E45]">{item.respostaEquipe}</Text></View> : null}
          </View>
        );
      }) : <View className="items-center rounded-[22px] border border-dashed border-line bg-white p-6"><MessageSquareText color="#899183" size={22} /><Text className="mt-3 text-[11px] font-extrabold text-ink">Nenhum feedback enviado</Text><Text className="mt-1 text-center text-[10px] leading-4 text-muted">Seus comentários e as respostas da equipe aparecerão aqui.</Text></View> : null}
      <View className="mb-5 mt-2 rounded-2xl bg-[#E9E6DD] p-4"><Text className="text-[10px] font-extrabold text-ink">Transparência</Text><Text className="mt-1 text-[9px] leading-4 text-[#737B6F]">O envio não altera seu treino automaticamente. Use a conversa com seu personal para dúvidas urgentes sobre exercícios, dores ou ajustes do planejamento.</Text></View>
    </AppScreen>
  );
}
