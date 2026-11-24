import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  AlertTriangle,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Plus,
  Send,
  X,
} from "lucide-react-native";

import type { StudentEvaluation } from "@/services/studentService";
import {
  assessmentScheduleService,
  type AssessmentScheduleItem,
} from "@/services/assessmentScheduleService";

type Props = { evaluations: StudentEvaluation[] };
type CalendarEvent = {
  id: string;
  date: string;
  title: string;
  kind: "REALIZADA" | "AGENDADA" | "PENDENTE" | "RECUSADA";
  urgent?: boolean;
  detail?: string | null;
  sentAt?: string | null;
};

const weekdays = ["D", "S", "T", "Q", "Q", "S", "S"];
const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function dateFromKey(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(value?: string | null) {
  if (!value) return "Não definida";
  return dateFromKey(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

function formatDateTime(value?: string | null) {
  if (!value) return "Envio não registrado";
  return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function getMonthDays(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay());
  return Array.from({ length: 42 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index));
}

export default function AssessmentCalendar({ evaluations }: Props) {
  const todayKey = dateKey(new Date());
  const [expanded, setExpanded] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [agenda, setAgenda] = useState<AssessmentScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestOpen, setRequestOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [expansion] = useState(() => new Animated.Value(0));

  async function loadAgenda() {
    setError(null);
    try {
      setAgenda(await assessmentScheduleService.listMine());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível carregar o calendário.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    assessmentScheduleService.listMine()
      .then((items) => { if (active) setAgenda(items); })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : "Não foi possível carregar o calendário.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    Animated.spring(expansion, {
      toValue: expanded ? 1 : 0,
      useNativeDriver: true,
      damping: 20,
      stiffness: 180,
      mass: 0.8,
    }).start();
  }, [expanded, expansion]);

  const events = useMemo<CalendarEvent[]>(() => [
    ...evaluations.map((item) => ({
      id: `evaluation-${item.id}`,
      date: item.realizadaEm.slice(0, 10),
      title: `Avaliação #${item.numero} realizada`,
      kind: "REALIZADA" as const,
      detail: item.peso == null ? "Registro físico concluído" : `Peso registrado: ${item.peso.toLocaleString("pt-BR")} kg`,
    })),
    ...agenda.filter((item) => item.status !== "CANCELADA").map((item) => ({
      id: item.id,
      date: (item.dataAgendada ?? item.dataDesejada).slice(0, 10),
      title: item.status === "AGENDADA" ? "Avaliação agendada" : item.status === "PENDENTE" ? "Solicitação em análise" : "Solicitação recusada",
      kind: item.status === "AGENDADA" ? "AGENDADA" as const : item.status === "PENDENTE" ? "PENDENTE" as const : "RECUSADA" as const,
      urgent: item.urgente,
      detail: item.descricaoAgendamento ?? item.motivo,
      sentAt: item.enviadaEm,
    })),
  ], [evaluations, agenda]);

  const monthDays = useMemo(() => getMonthDays(visibleMonth), [visibleMonth]);
  const selectedEvents = events.filter((event) => event.date === selectedDate);
  const latestEvaluation = [...evaluations].sort((a, b) => b.realizadaEm.localeCompare(a.realizadaEm))[0];
  const nextAppointment = agenda
    .filter((item) => item.status === "AGENDADA" && item.dataAgendada && item.dataAgendada >= todayKey)
    .sort((a, b) => (a.dataAgendada ?? "").localeCompare(b.dataAgendada ?? ""))[0];
  const pendingRequest = agenda.some((item) => item.status === "PENDENTE");

  function changeMonth(offset: number) {
    const next = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + offset, 1);
    setVisibleMonth(next);
    setSelectedDate(dateKey(new Date(next.getFullYear(), next.getMonth(), 1)));
  }

  function toggleUrgent() {
    if (urgent) {
      setUrgent(false);
      return;
    }
    Alert.alert(
      "Solicitar prioridade urgente?",
      "A solicitação será destacada para seus personais e terá prioridade maior na análise. Confirma que é urgente?",
      [
        { text: "Não, voltar", style: "cancel" },
        { text: "Sim, é urgente", style: "destructive", onPress: () => setUrgent(true) },
      ],
    );
  }

  async function submitRequest() {
    if (selectedDate < todayKey) {
      Alert.alert("Data inválida", "Escolha hoje ou uma data futura no calendário.");
      return;
    }
    setSaving(true);
    try {
      await assessmentScheduleService.request(selectedDate, reason, urgent);
      setRequestOpen(false);
      setReason("");
      setUrgent(false);
      await loadAgenda();
      Alert.alert("Solicitação enviada", "Seus personais foram notificados e poderão analisar a data desejada.");
    } catch (cause) {
      Alert.alert("Não foi possível enviar", cause instanceof Error ? cause.message : "Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View className="mt-6 overflow-hidden rounded-[24px] border border-line bg-white">
      <Pressable onPress={() => setExpanded((value) => !value)} className="flex-row items-center justify-between px-4 py-4">
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#EDF2E5]"><CalendarDays color="#627B4A" size={19} /></View>
          <View>
            <Text className="text-[12px] font-extrabold text-ink">Agenda de avaliações</Text>
            <Text className="mt-0.5 text-[9px] text-muted">Histórico e próximas atualizações da ficha</Text>
          </View>
        </View>
        <View className="h-8 w-8 items-center justify-center rounded-full bg-[#F2F1EC]">
          <Animated.View style={{ transform: [{ rotate: expansion.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] }) }] }}>
            <ChevronDown color="#66705F" size={17} />
          </Animated.View>
        </View>
      </Pressable>

      <View className="flex-row gap-2 px-4 pb-4">
        <View className="flex-1 rounded-xl bg-[#F5F4EF] p-3">
          <Text className="text-[8px] font-extrabold uppercase tracking-[1px] text-[#858A82]">Última atualização da ficha</Text>
          <Text className="mt-1 text-[11px] font-extrabold text-ink">{latestEvaluation ? formatDate(latestEvaluation.realizadaEm) : "Sem avaliação"}</Text>
        </View>
        <View className="flex-1 rounded-xl bg-[#F5F4EF] p-3">
          <Text className="text-[8px] font-extrabold uppercase tracking-[1px] text-[#858A82]">Próxima atualização</Text>
          <Text className="mt-1 text-[11px] font-extrabold text-ink">{nextAppointment ? formatDate(nextAppointment.dataAgendada) : "Não agendada"}</Text>
        </View>
      </View>

      {expanded ? (
        <Animated.View style={{ opacity: expansion, transform: [{ translateY: expansion.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }] }} className="border-t border-[#F0EEE8] px-4 pb-4 pt-4">
          <View className="flex-row items-center justify-between">
            <Pressable onPress={() => changeMonth(-1)} className="h-9 w-9 items-center justify-center rounded-full bg-[#F3F2EC]"><ChevronLeft color="#59634F" size={17} /></Pressable>
            <View className="items-center"><Text className="text-[14px] font-black text-ink">{monthNames[visibleMonth.getMonth()]}</Text><Text className="text-[9px] font-semibold text-muted">{visibleMonth.getFullYear()}</Text></View>
            <Pressable onPress={() => changeMonth(1)} className="h-9 w-9 items-center justify-center rounded-full bg-[#F3F2EC]"><ChevronRight color="#59634F" size={17} /></Pressable>
          </View>
          <View className="mt-4 flex-row">
            {weekdays.map((day, index) => <Text key={`${day}-${index}`} className="flex-1 text-center text-[9px] font-extrabold text-[#92978D]">{day}</Text>)}
          </View>
          <View className="mt-2 flex-row flex-wrap">
            {monthDays.map((day) => {
              const key = dateKey(day);
              const dayEvents = events.filter((event) => event.date === key);
              const selected = key === selectedDate;
              const inMonth = day.getMonth() === visibleMonth.getMonth();
              return (
                <Pressable key={key} onPress={() => setSelectedDate(key)} className="h-11 w-[14.2857%] items-center justify-center">
                  <View className={`h-8 w-8 items-center justify-center rounded-full ${selected ? "bg-ink" : key === todayKey ? "border border-[#91A776]" : ""}`}>
                    <Text className={`text-[10px] font-bold ${selected ? "text-white" : inMonth ? "text-ink" : "text-[#C3C6BE]"}`}>{day.getDate()}</Text>
                  </View>
                  <View className="absolute bottom-0 flex-row gap-0.5">
                    {dayEvents.slice(0, 3).map((event) => <View key={event.id} className={`h-1 w-1 rounded-full ${event.kind === "AGENDADA" ? "bg-[#78935B]" : event.kind === "PENDENTE" ? "bg-[#D39A45]" : event.kind === "RECUSADA" ? "bg-[#B87564]" : "bg-[#8D9690]"}`} />)}
                  </View>
                </Pressable>
              );
            })}
          </View>
          <View className="mt-4 flex-row flex-wrap gap-x-3 gap-y-2">
            {[{ color: "bg-[#8D9690]", label: "Realizada" }, { color: "bg-[#78935B]", label: "Agendada" }, { color: "bg-[#D39A45]", label: "Em análise" }].map((item) => <View key={item.label} className="flex-row items-center gap-1.5"><View className={`h-1.5 w-1.5 rounded-full ${item.color}`} /><Text className="text-[8px] font-semibold text-muted">{item.label}</Text></View>)}
          </View>

          <View className="mt-4 rounded-2xl bg-[#F7F6F1] p-3">
            <View className="flex-row items-center justify-between"><Text className="text-[10px] font-extrabold text-ink">{formatDate(selectedDate)}</Text><Text className="text-[9px] font-semibold text-muted">{selectedEvents.length} registro(s)</Text></View>
            {loading ? <View className="py-4"><ActivityIndicator color="#627B4A" /></View> : null}
            {!loading && selectedEvents.length === 0 ? <Text className="py-3 text-[10px] text-muted">Nenhuma avaliação ou solicitação nesta data.</Text> : null}
            {selectedEvents.map((event) => (
              <View key={event.id} className="mt-3 border-t border-[#EAE8E0] pt-3">
                <View className="flex-row items-center justify-between gap-2">
                  <Text className="flex-1 text-[10px] font-extrabold text-ink">{event.title}</Text>
                  {event.urgent ? <View className="flex-row items-center gap-1 rounded-full bg-[#F9E9E3] px-2 py-1"><AlertTriangle color="#A65B45" size={10} /><Text className="text-[8px] font-extrabold text-[#A65B45]">URGENTE</Text></View> : null}
                </View>
                {event.detail ? <Text className="mt-1 text-[9px] leading-4 text-muted">{event.detail}</Text> : null}
                {event.sentAt ? <View className="mt-1 flex-row items-center gap-1"><Clock3 color="#92978D" size={10} /><Text className="text-[8px] text-muted">Solicitada em {formatDateTime(event.sentAt)}</Text></View> : null}
              </View>
            ))}
          </View>

          {error ? <Pressable onPress={() => void loadAgenda()} className="mt-3 rounded-xl bg-[#FBF1EA] p-3"><Text className="text-[9px] font-semibold text-[#8D4F3E]">{error} · Toque para tentar novamente.</Text></Pressable> : null}
          {pendingRequest ? <View className="mt-4 rounded-xl border border-[#EBD9B8] bg-[#FBF5E9] p-3"><Text className="text-[10px] font-extrabold text-[#8D672D]">Solicitação em análise</Text><Text className="mt-1 text-[9px] leading-4 text-[#8D7651]">Seus personais já foram notificados. Aguarde o retorno antes de enviar outra solicitação.</Text></View> : (
            <Pressable onPress={() => { setReason(""); setUrgent(false); setRequestOpen(true); }} className="mt-4 h-11 flex-row items-center justify-center gap-2 rounded-xl bg-lime"><Plus color="#17211B" size={15} /><Text className="text-[10px] font-extrabold text-ink">Solicitar nova avaliação</Text></Pressable>
          )}
        </Animated.View>
      ) : null}

      <Modal visible={requestOpen} transparent animationType="slide" onRequestClose={() => setRequestOpen(false)}>
        <View className="flex-1 justify-end bg-black/45">
          <View className="rounded-t-[28px] bg-white px-5 pb-8 pt-5">
            <View className="flex-row items-center justify-between"><Text className="text-[17px] font-black text-ink">Solicitar avaliação</Text><Pressable onPress={() => setRequestOpen(false)} className="h-8 w-8 items-center justify-center rounded-full bg-[#F1F0EB]"><X color="#687163" size={16} /></Pressable></View>
            <Text className="mt-1 text-[10px] text-muted">A solicitação será enviada a todos os personais vinculados à sua conta.</Text>
            <Text className="mt-5 text-[9px] font-extrabold uppercase tracking-[1px] text-[#737B6F]">Data desejada</Text>
            <View className="mt-2 flex-row items-center gap-2 rounded-xl bg-[#F3F1EB] px-4 py-3"><CalendarDays color="#627B4A" size={15} /><Text className="text-[12px] font-extrabold text-ink">{formatDate(selectedDate)}</Text></View>
            <Text className="mt-4 text-[9px] font-extrabold uppercase tracking-[1px] text-[#737B6F]">Motivo (opcional)</Text>
            <TextInput value={reason} onChangeText={setReason} maxLength={1000} multiline textAlignVertical="top" placeholder="Conte por que gostaria de realizar uma nova avaliação..." placeholderTextColor="#999D94" className="mt-2 min-h-[88px] rounded-xl bg-[#F3F1EB] px-4 py-3 text-[11px] text-ink" />
            <Pressable onPress={toggleUrgent} className={`mt-4 flex-row items-center gap-3 rounded-xl border p-3 ${urgent ? "border-[#E7C6B9] bg-[#FBF0EB]" : "border-line bg-white"}`}>
              <View className={`h-8 w-8 items-center justify-center rounded-lg ${urgent ? "bg-[#F4DDD4]" : "bg-[#F3F2EC]"}`}><AlertTriangle color={urgent ? "#A65B45" : "#8B9186"} size={15} /></View>
              <View className="flex-1"><Text className={`text-[10px] font-extrabold ${urgent ? "text-[#A65B45]" : "text-ink"}`}>Marcar como urgente</Text><Text className="mt-0.5 text-[9px] text-muted">A solicitação terá prioridade maior na análise.</Text></View>
              <View className={`h-5 w-9 justify-center rounded-full px-0.5 ${urgent ? "bg-[#B56D56]" : "bg-[#D9DBD3]"}`}><View className={`h-4 w-4 rounded-full bg-white ${urgent ? "self-end" : "self-start"}`} /></View>
            </Pressable>
            <View className="mt-5 flex-row gap-2">
              <Pressable onPress={() => setRequestOpen(false)} disabled={saving} className="h-12 flex-1 items-center justify-center rounded-xl border border-line"><Text className="text-[10px] font-bold text-muted">Cancelar</Text></Pressable>
              <Pressable onPress={() => void submitRequest()} disabled={saving || selectedDate < todayKey} className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-lime">{saving ? <ActivityIndicator color="#17211B" size="small" /> : <><Send color="#17211B" size={14} /><Text className="text-[10px] font-extrabold text-ink">Enviar solicitação</Text></>}</Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
