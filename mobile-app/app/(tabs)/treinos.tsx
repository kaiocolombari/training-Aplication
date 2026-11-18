import { router } from "expo-router";
import { Check, ChevronRight, Clock3, Dumbbell, Repeat2 } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { AppScreen, Eyebrow, ProgressTrack, SectionTitle, Tag } from "@/components/ui";
import { useWorkout } from "@/context/WorkoutContext";
import { PERIODIZATION_PLAN, WORKOUTS } from "@/data/workouts";

const schedule = [
  { day: "SEG", date: "16", label: "Descanso" },
  { day: "TER", date: "17", label: "Superior A" },
  { day: "QUA", date: "18", label: "Mobilidade" },
  { day: "QUI", date: "19", label: "Inferior B" },
  { day: "SEX", date: "20", label: "Descanso" },
  { day: "SÁB", date: "21", label: "Full body C" },
  { day: "DOM", date: "22", label: "Descanso" },
];

export default function WorkoutsScreen() {
  const { activeSession, completedSets, totalSets } = useWorkout();
  return (
    <AppScreen>
      <View className="pt-4"><Eyebrow>PLANEJAMENTO</Eyebrow><Text className="mt-2 text-[30px] font-black tracking-[-1px] text-ink">Seus treinos</Text><Text className="mt-1 text-[12px] text-muted">Tudo organizado para você focar na execução.</Text></View>

      <SectionTitle action={<Tag tone="lime">SEMANA 04 / 08</Tag>}>Agenda semanal</SectionTitle>
      <View className="rounded-[24px] border border-line bg-white p-4">
        {schedule.map((item, index) => {
          const isToday = index === 1;
          const isDone = index === 0;
          return (
            <View key={item.day} className={`flex-row items-center gap-3 py-3 ${index < schedule.length - 1 ? "border-b border-[#F0EEE8]" : ""}`}>
              <View className={`h-11 w-11 items-center justify-center rounded-2xl ${isToday ? "bg-ink" : isDone ? "bg-lime" : "bg-[#F3F1EB]"}`}>
                <Text className={`text-[9px] font-bold ${isToday ? "text-lime" : "text-[#858A82]"}`}>{item.day}</Text>
                <Text className={`text-[14px] font-black ${isToday ? "text-white" : "text-ink"}`}>{item.date}</Text>
              </View>
              <View className="flex-1"><Text className="text-[12px] font-bold text-ink">{item.label}</Text><Text className="mt-0.5 text-[10px] text-muted">{isToday ? "Treino programado para hoje" : isDone ? "Sessão concluída" : "Conforme sua periodização"}</Text></View>
              {isDone ? <Check color="#647C4B" size={17} /> : isToday ? <Tag tone="lime">HOJE</Tag> : <View className="h-2 w-2 rounded-full bg-[#D8D7D0]" />}
            </View>
          );
        })}
      </View>

      <SectionTitle>Ficha atual <Text className="text-[11px] font-medium text-muted">· 3 sessões</Text></SectionTitle>
      {WORKOUTS.map((workout, index) => {
        const isActive = activeSession?.workoutId === workout.id;
        return (
          <Pressable key={workout.id} onPress={() => router.push({ pathname: "/treino/[id]", params: { id: workout.id } })} className="mb-3 rounded-[24px] border border-line bg-white p-4 active:opacity-80">
            <View className="flex-row items-start gap-3">
              <View className={`h-12 w-12 items-center justify-center rounded-2xl ${index === 0 ? "bg-[#E8EDDE]" : index === 1 ? "bg-[#EEE7DF]" : "bg-[#E6E9E7]"}`}><Dumbbell color="#27352A" size={21} /></View>
              <View className="flex-1"><View className="flex-row items-center gap-2"><Text className="text-[15px] font-extrabold text-ink">{workout.name}</Text>{isActive ? <Tag tone="lime">EM ANDAMENTO</Tag> : null}</View><Text className="mt-1 text-[10px] text-muted">{workout.focus}</Text><View className="mt-3 flex-row items-center gap-4"><View className="flex-row items-center gap-1"><Dumbbell color="#8D938A" size={12} /><Text className="text-[10px] text-[#777D74]">{workout.exercises.length} exercícios</Text></View><View className="flex-row items-center gap-1"><Clock3 color="#8D938A" size={12} /><Text className="text-[10px] text-[#777D74]">{workout.duration} min</Text></View></View></View>
              <ChevronRight color="#A2A59D" size={19} />
            </View>
            {isActive ? <View className="mt-4"><View className="mb-2 flex-row justify-between"><Text className="text-[9px] font-bold text-muted">Progresso salvo</Text><Text className="text-[9px] font-bold text-ink">{completedSets}/{totalSets} séries</Text></View><ProgressTrack value={totalSets ? completedSets / totalSets * 100 : 0} /></View> : null}
          </Pressable>
        );
      })}

      <View className="mt-3 rounded-[22px] bg-ink p-5">
        <View className="flex-row items-center gap-2"><Repeat2 color="#C8EF73" size={16} /><Eyebrow light>PERIODIZAÇÃO</Eyebrow></View>
        <Text className="mt-3 text-[18px] font-extrabold text-white">{PERIODIZATION_PLAN.objectiveGeneral || "Objetivo não definido"}</Text>
        <Text className="mt-1 text-[11px] leading-5 text-white/60">Semana {PERIODIZATION_PLAN.currentWeek} de {PERIODIZATION_PLAN.totalWeeks} · Objetivo geral da periodização.</Text>
        <View className="mt-4"><ProgressTrack value={PERIODIZATION_PLAN.totalWeeks ? PERIODIZATION_PLAN.currentWeek / PERIODIZATION_PLAN.totalWeeks * 100 : 0} dark /><Text className="mt-2 text-right text-[9px] font-bold text-lime">{Math.round(PERIODIZATION_PLAN.totalWeeks ? PERIODIZATION_PLAN.currentWeek / PERIODIZATION_PLAN.totalWeeks * 100 : 0)}% DO CICLO</Text></View>
      </View>
    </AppScreen>
  );
}
