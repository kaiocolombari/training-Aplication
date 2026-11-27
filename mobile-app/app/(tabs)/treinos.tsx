import { router } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";
import { Check, ChevronRight, Clock3, Dumbbell, Repeat2, RefreshCw } from "lucide-react-native";

import { AppScreen, EnteringView, Eyebrow, MotionPressable, ProgressTrack, SectionTitle, Tag } from "@/components/ui";
import { useStudentData } from "@/context/StudentDataContext";
import { useWorkout } from "@/context/WorkoutContext";
import { DataUnavailableNotice } from "@/components/DataUnavailableNotice";
import { ScheduleSkeleton, WorkoutListSkeleton } from "@/components/Skeletons";

export default function WorkoutsScreen() {
  const { activeSession, completedSets, totalSets, completedHistory } = useWorkout();
  const { data, isLoading, isRefreshing, error, refresh } = useStudentData();
  const totalExercises = data.workouts.reduce((sum, workout) => sum + workout.exercises.length, 0);
  const agendaIndisponivel = data.unavailableSections.includes("periodizacao");
  const fichaIndisponivel = Boolean(error) && data.workouts.length === 0;
  const now = new Date();
  const completedThisMonth = completedHistory.filter(item => {
    const date = new Date(item.finishedAt);
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  });

  return (
    <AppScreen refreshing={isRefreshing} onRefresh={() => void refresh().catch(() => undefined)}>
      <View className="flex-row items-start justify-between pt-4">
        <View className="flex-1">
          <Eyebrow>PLANEJAMENTO</Eyebrow>
          <Text className="mt-2 text-[30px] font-black tracking-[-1px] text-ink">Seus treinos</Text>
          <Text className="mt-1 text-[12px] text-muted">Sua ficha e periodização publicadas pelo personal.</Text>
        </View>
        <MotionPressable accessibilityRole="button" accessibilityLabel="Recarregar treinos" onPress={() => void refresh().catch(() => undefined)} disabled={isRefreshing} className="mt-2 h-10 w-10 items-center justify-center rounded-full border border-line bg-white">
          {isRefreshing ? <ActivityIndicator size="small" color="#526447" /> : <RefreshCw color="#29332B" size={16} />}
        </MotionPressable>
      </View>

      <SectionTitle action={data.periodization ? <Tag tone="lime">SEMANA {data.periodization.currentWeek} / {data.periodization.totalWeeks || "—"}</Tag> : undefined}>Agenda semanal</SectionTitle>
      {isLoading && data.schedule.length === 0 ? <ScheduleSkeleton /> : agendaIndisponivel || fichaIndisponivel ? (
        <DataUnavailableNotice title="Agenda indisponível" detail="Não foi possível consultar sua periodização. Isso não significa que você esteja sem treinos programados." onRetry={() => void refresh().catch(() => undefined)} retrying={isRefreshing} />
      ) : data.schedule.length > 0 ? (
        <View className="rounded-[24px] border border-line bg-white p-4">
          {data.schedule.map((item, index) => {
            const date = new Date(`${item.date}T00:00:00`);
            const isToday = item.date === (() => {
              const now = new Date();
              return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
            })();
            const isDone = data.executions.some((execution) => execution.data.slice(0, 10) === item.date && execution.fim);
            const label = item.workouts.map((workout) => workout.name).join(" + ") || "Descanso";
            return (
              <View key={item.id} className={`flex-row items-center gap-3 py-3 ${index < data.schedule.length - 1 ? "border-b border-[#F0EEE8]" : ""}`}>
                <View className={`h-11 w-11 items-center justify-center rounded-2xl ${isToday ? "bg-ink" : isDone ? "bg-lime" : "bg-[#F3F1EB]"}`}>
                  <Text className={`text-[9px] font-bold ${isToday ? "text-lime" : "text-[#858A82]"}`}>{new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(date).replace(".", "").toUpperCase()}</Text>
                  <Text className={`text-[14px] font-black ${isToday ? "text-white" : "text-ink"}`}>{date.getDate()}</Text>
                </View>
                <View className="flex-1"><Text className="text-[12px] font-bold text-ink">{label}</Text><Text className="mt-0.5 text-[10px] text-muted">{isToday ? "Programado para hoje" : isDone ? "Sessão concluída" : item.workouts.length ? "Conforme sua periodização" : "Recuperação"}</Text></View>
                {isDone ? <Check color="#647C4B" size={17} /> : isToday ? <Tag tone="lime">HOJE</Tag> : null}
              </View>
            );
          })}
        </View>
      ) : (
        <View className="rounded-[24px] border border-dashed border-line bg-white p-5">
          <Text className="text-[12px] font-extrabold text-ink">Nenhuma agenda disponível</Text>
          <Text className="mt-1 text-[10px] leading-4 text-muted">A periodização será exibida assim que seu personal cadastrar os dias e associar os treinos.</Text>
        </View>
      )}

      <SectionTitle>Ficha atual <Text className="text-[11px] font-medium text-muted">· {data.workouts.length} sessões · {totalExercises} exercícios</Text></SectionTitle>
      {isLoading && data.workouts.length === 0 ? (
        <WorkoutListSkeleton />
      ) : error && data.workouts.length === 0 ? (
        <DataUnavailableNotice title="Ficha indisponível" detail={error} onRetry={() => void refresh().catch(() => undefined)} retrying={isRefreshing} />
      ) : data.workouts.length > 0 ? (
        data.workouts.map((workout, index) => {
          const isActive = activeSession?.workoutId === workout.id;
          return (
            <EnteringView key={workout.id} delay={index * 55}>
            <MotionPressable onPress={() => router.push({ pathname: "/treino/[id]", params: { id: workout.id } })} className="mb-3 rounded-[24px] border border-line bg-white p-4 active:opacity-80">
              <View className="flex-row items-start gap-3">
                <View className={`h-12 w-12 items-center justify-center rounded-2xl ${index % 3 === 0 ? "bg-[#E8EDDE]" : index % 3 === 1 ? "bg-[#EEE7DF]" : "bg-[#E6E9E7]"}`}><Dumbbell color="#27352A" size={21} /></View>
                <View className="flex-1">
                  <View className="flex-row flex-wrap items-center gap-2"><Text className="text-[15px] font-extrabold text-ink">{workout.name}</Text>{isActive ? <Tag tone="lime">EM ANDAMENTO</Tag> : null}</View>
                  <Text className="mt-1 text-[10px] text-muted">{workout.focus}</Text>
                  <View className="mt-3 flex-row items-center gap-4">
                    <View className="flex-row items-center gap-1"><Dumbbell color="#8D938A" size={12} /><Text className="text-[10px] text-[#777D74]">{workout.exercises.length} exercícios</Text></View>
                    <View className="flex-row items-center gap-1"><Clock3 color="#8D938A" size={12} /><Text className="text-[10px] text-[#777D74]">{workout.duration > 0 ? `~${workout.duration} min` : "Duração não estimada"}</Text></View>
                  </View>
                </View>
                <ChevronRight color="#A2A59D" size={19} />
              </View>
              {isActive ? <View className="mt-4"><View className="mb-2 flex-row justify-between"><Text className="text-[9px] font-bold text-muted">Progresso salvo</Text><Text className="text-[9px] font-bold text-ink">{completedSets}/{totalSets} séries</Text></View><ProgressTrack value={totalSets ? completedSets / totalSets * 100 : 0} /></View> : null}
            </MotionPressable>
            </EnteringView>
          );
        })
      ) : (
        <View className="rounded-[24px] border border-dashed border-line bg-white p-5">
          <Text className="text-[12px] font-extrabold text-ink">Sua ficha está vazia</Text>
          <Text className="mt-1 text-[10px] leading-4 text-muted">Quando seu personal publicar os treinos, eles aparecerão aqui automaticamente.</Text>
        </View>
      )}
      {error && data.workouts.length > 0 ? <DataUnavailableNotice compact title="Não foi possível atualizar a ficha" detail="Exibindo os treinos carregados anteriormente." onRetry={() => void refresh().catch(() => undefined)} retrying={isRefreshing} /> : null}

      <SectionTitle action={<Tag>{completedThisMonth.length} sessões</Tag>}>Concluídos neste mês</SectionTitle>
      {completedThisMonth.length ? completedThisMonth.map((item, index) => (
        <EnteringView key={item.sessionId} delay={index * 40}>
        <View className="mb-2 rounded-[20px] border border-line bg-white p-4">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text className="text-[12px] font-extrabold text-ink">{item.workoutName}</Text>
              <Text className="mt-1 text-[9px] text-muted">{new Date(item.finishedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })} · {Math.round(item.durationSeconds / 60)} min</Text>
            </View>
            <View className="rounded-xl bg-[#EDF2E5] px-2.5 py-2"><Text className="text-[10px] font-black text-[#627B4A]">{item.completedSets}/{item.totalSets}</Text><Text className="text-[7px] font-bold uppercase text-[#718263]">séries</Text></View>
          </View>
          <Text numberOfLines={3} className="mt-3 text-[9px] leading-4 text-[#777D74]">{item.exercises.slice(0, 4).map(exercise => `${exercise.name} · ${exercise.completedSets} séries${exercise.bestLoad > 0 ? ` · até ${exercise.bestLoad.toLocaleString("pt-BR")} kg` : ""}`).join("\n")}{item.exercises.length > 4 ? `\n+${item.exercises.length - 4} exercícios` : ""}</Text>
        </View>
        </EnteringView>
      )) : (
        <View className="rounded-[20px] border border-dashed border-line bg-white p-5">
          <Text className="text-[11px] font-extrabold text-ink">Seu histórico começa no próximo treino</Text>
          <Text className="mt-1 text-[10px] leading-4 text-muted">Quando concluir uma sessão, ela ficará salva aqui por até 30 dias, sem ocupar espaço com todos os detalhes de execução.</Text>
        </View>
      )}

      {data.unavailableSections.includes("periodizacao") ? (
        <DataUnavailableNotice compact title="Periodização não disponível" detail="As informações do ciclo e da semana não puderam ser carregadas." />
      ) : data.periodization ? (
        <View className="mt-3 rounded-[22px] bg-ink p-5">
          <View className="flex-row items-center gap-2"><Repeat2 color="#C8EF73" size={16} /><Eyebrow light>PERIODIZAÇÃO</Eyebrow></View>
          <Text className="mt-3 text-[18px] font-extrabold text-white">{data.periodization.name}</Text>
          <Text className="mt-1 text-[11px] leading-5 text-white/60">Semana {data.periodization.currentWeek} de {data.periodization.totalWeeks || "—"} · Objetivo definido pelo seu personal.</Text>
          {data.periodization.totalWeeks > 0 ? <View className="mt-4"><ProgressTrack value={Math.min(100, data.periodization.currentWeek / data.periodization.totalWeeks * 100)} dark /><Text className="mt-2 text-right text-[9px] font-bold text-lime">{Math.round(data.periodization.currentWeek / data.periodization.totalWeeks * 100)}% DO CICLO</Text></View> : <Text className="mt-3 text-[9px] text-white/50">Duração total do ciclo não informada.</Text>}
        </View>
      ) : null}
      {isRefreshing ? <View className="mb-4 mt-2 flex-row items-center justify-center gap-2"><ActivityIndicator size="small" color="#526447" /><Text className="text-[9px] text-muted">Atualizando dados...</Text></View> : null}
    </AppScreen>
  );
}
