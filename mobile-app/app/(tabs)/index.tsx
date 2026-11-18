import { router } from "expo-router";
import { ArrowRight, Bell, CalendarDays, Check, ChevronRight, Clock3, Dumbbell, Flame, Play, Sparkles } from "lucide-react-native";
import { Alert, Pressable, Text, View } from "react-native";

import { AppScreen, Eyebrow, MetricCard, ProgressTrack, SectionTitle, Tag } from "@/components/ui";
import { useWorkout } from "@/context/WorkoutContext";
import { TODAY_WORKOUT, WORKOUTS } from "@/data/workouts";

const week = [
  { day: "SEG", date: "16", state: "done" },
  { day: "TER", date: "17", state: "today" },
  { day: "QUA", date: "18", state: "rest" },
  { day: "QUI", date: "19", state: "planned" },
  { day: "SEX", date: "20", state: "rest" },
  { day: "SÁB", date: "21", state: "planned" },
  { day: "DOM", date: "22", state: "rest" },
];

export default function HomeScreen() {
  const { activeSession, completedSets, totalSets, beginWorkout } = useWorkout();
  const hasSession = Boolean(activeSession);
  const activePlan = WORKOUTS.find((workout) => workout.id === activeSession?.workoutId) ?? TODAY_WORKOUT;
  const workoutName = activeSession?.workoutName ?? TODAY_WORKOUT.name;
  const progress = totalSets ? (completedSets / totalSets) * 100 : 0;
  const dateLabel = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).format(new Date());

  function openWorkout() {
    if (!activeSession) beginWorkout(TODAY_WORKOUT);
    router.push("/execucao");
  }

  return (
    <AppScreen>
      <View className="flex-row items-center justify-between pt-3">
        <View className="flex-row items-center gap-2.5">
          <View className="h-9 w-9 items-center justify-center rounded-xl bg-ink"><Dumbbell color="#C8EF73" size={18} strokeWidth={2.5} /></View>
          <View><Text className="text-[13px] font-black tracking-[1.4px] text-ink">TREINO SYSTEM</Text><Text className="text-[9px] font-semibold uppercase tracking-[1.6px] text-muted">Área do aluno</Text></View>
        </View>
        <Pressable onPress={() => Alert.alert("Notificações", "Você está em dia. Nenhum aviso novo por enquanto.")} className="h-10 w-10 items-center justify-center rounded-full border border-line bg-white"><Bell color="#29332B" size={18} /></Pressable>
      </View>

      <View className="mt-8">
        <Eyebrow>{dateLabel}</Eyebrow>
        <Text className="mt-2 text-[31px] font-black leading-[36px] tracking-[-1.2px] text-ink">Vamos evoluir{"\n"}um treino de cada vez.</Text>
        <Text className="mt-2 text-[13px] leading-5 text-[#777D74]">Seu planejamento está pronto. Bora manter o ritmo?</Text>
      </View>

      <View className="mt-7 overflow-hidden rounded-[28px] bg-ink p-6">
        <View className="absolute -right-10 -top-12 h-44 w-44 rounded-full border-[28px] border-white/[0.04]" />
        <View className="flex-row items-center justify-between">
          <Tag tone="lime">{hasSession ? "TREINO EM ANDAMENTO" : "TREINO DE HOJE"}</Tag>
          <Sparkles color="#C8EF73" size={17} />
        </View>
        <Text className="mt-5 text-[29px] font-black tracking-[-1px] text-white">{workoutName}</Text>
        <Text className="mt-1 text-[12px] text-white/60">{hasSession ? "Continue de onde você parou" : TODAY_WORKOUT.focus}</Text>
        <View className="mt-5 flex-row items-center gap-5">
          <View className="flex-row items-center gap-1.5"><Clock3 color="#C8EF73" size={14} /><Text className="text-[11px] font-semibold text-white/80">{activePlan.duration} min</Text></View>
          <View className="flex-row items-center gap-1.5"><Dumbbell color="#C8EF73" size={14} /><Text className="text-[11px] font-semibold text-white/80">{hasSession ? `${completedSets}/${totalSets} séries` : `${TODAY_WORKOUT.exercises.length} exercícios`}</Text></View>
        </View>
        {hasSession ? <View className="mt-5"><View className="mb-2 flex-row justify-between"><Text className="text-[10px] font-semibold text-white/60">Progresso da sessão</Text><Text className="text-[10px] font-bold text-lime">{Math.round(progress)}%</Text></View><ProgressTrack value={progress} dark /></View> : null}
        <Pressable onPress={openWorkout} className="mt-6 h-14 flex-row items-center justify-center gap-2 rounded-2xl bg-lime active:opacity-80">
          <Play color="#17211B" size={17} fill="#17211B" /><Text className="text-[13px] font-extrabold text-ink">{hasSession ? "Continuar treino" : "Começar treino"}</Text><ArrowRight color="#17211B" size={17} />
        </Pressable>
      </View>

      <SectionTitle action={<Pressable onPress={() => router.push("/(tabs)/treinos")} className="flex-row items-center gap-1"><Text className="text-[11px] font-bold text-[#66715F]">Ver semana</Text><ChevronRight color="#66715F" size={15} /></Pressable>}>Sua semana</SectionTitle>
      <View className="flex-row justify-between rounded-[22px] border border-line bg-white px-2 py-4">
        {week.map((item) => (
          <View key={item.day} className="items-center gap-2 px-1">
            <Text className={`text-[9px] font-bold ${item.state === "today" ? "text-ink" : "text-[#9A9D96]"}`}>{item.day}</Text>
            <View className={`h-9 w-9 items-center justify-center rounded-full ${item.state === "today" ? "bg-ink" : item.state === "done" ? "bg-lime" : "bg-[#F2F0EA]"}`}>
              {item.state === "done" ? <Check color="#17211B" size={15} strokeWidth={3} /> : <Text className={`text-[11px] font-bold ${item.state === "today" ? "text-lime" : "text-[#73796F]"}`}>{item.date}</Text>}
            </View>
            <View className={`h-1 w-1 rounded-full ${item.state === "planned" ? "bg-[#B6C1A7]" : "bg-transparent"}`} />
          </View>
        ))}
      </View>

      <SectionTitle>Seu ritmo</SectionTitle>
      <View className="flex-row gap-3">
        <MetricCard label="Sessões na semana" value="2" unit="/ 4" caption="Meta semanal" />
        <MetricCard label="Sequência atual" value="4" unit="dias" caption="Consistência em alta" />
      </View>

      <View className="mt-4 flex-row items-center gap-3 rounded-[22px] border border-line bg-white p-4">
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#F0E9DF]"><Flame color="#A85F45" size={19} /></View>
        <View className="flex-1"><Text className="text-[12px] font-bold text-ink">Um recado do seu personal</Text><Text className="mt-1 text-[10px] leading-4 text-[#858A82]">Priorize a execução controlada. Aumentar a carga vem depois.</Text></View>
        <CalendarDays color="#9A9E95" size={17} />
      </View>
      <View className="mb-5 mt-6 flex-row items-center justify-center gap-1"><Text className="text-[9px] font-medium text-[#A1A39D]">Seu plano é acompanhado por</Text><Text className="text-[9px] font-extrabold tracking-wide text-[#626B5E]">CARLOS HENRIQUE</Text></View>
    </AppScreen>
  );
}
