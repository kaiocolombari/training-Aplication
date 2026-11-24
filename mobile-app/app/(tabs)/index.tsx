import { router } from "expo-router";
import { ArrowRight, Bell, CalendarDays, Check, ChevronRight, Clock3, Dumbbell, Flame, Play, RefreshCw, Sparkles } from "lucide-react-native";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";

import { AppScreen, Eyebrow, MetricCard, ProgressTrack, SectionTitle, Tag } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useStudentData } from "@/context/StudentDataContext";
import { useWorkout } from "@/context/WorkoutContext";

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function HomeScreen() {
  const { activeSession, completedSets, totalSets, beginWorkout } = useWorkout();
  const { user } = useAuth();
  const { data, isLoading, isRefreshing, error, unreadNotifications, todayWorkout, refresh } = useStudentData();
  const hasSession = Boolean(activeSession);
  const activePlan = data.workouts.find((workout) => workout.id === activeSession?.workoutId) ?? todayWorkout;
  const workoutName = activeSession?.workoutName ?? todayWorkout?.name ?? "Dia de recuperação";
  const progress = totalSets ? (completedSets / totalSets) * 100 : 0;
  const dateLabel = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).format(new Date());
  const todayKey = dateKey(new Date());
  const monday = new Date();
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const weekStart = dateKey(monday);
  const sessionsThisWeek = data.executions.filter((item) => item.data >= weekStart && item.data <= todayKey && item.fim).length;
  const completedDates = new Set(data.executions.filter((item) => item.fim).map((item) => item.data.slice(0, 10)));
  let streak = 0;
  const streakDate = new Date();
  if (!completedDates.has(dateKey(streakDate))) streakDate.setDate(streakDate.getDate() - 1);
  while (completedDates.has(dateKey(streakDate)) && streak < 365) {
    streak += 1;
    streakDate.setDate(streakDate.getDate() - 1);
  }

  function openWorkout() {
    if (!activeSession && todayWorkout && todayWorkout.exercises.length === 0) {
      Alert.alert("Treino sem exercícios", "Seu personal ainda não adicionou exercícios a esta ficha.");
      return;
    }
    if (!activeSession && todayWorkout) beginWorkout(todayWorkout);
    if (activeSession || todayWorkout) router.push("/execucao");
    else Alert.alert("Nenhum treino programado", "Seu personal ainda não vinculou um treino para hoje. Confira a agenda ou fale com ele.");
  }

  function openNotifications() {
    router.push("/notificacoes");
  }

  return (
    <AppScreen>
      <View className="flex-row items-center justify-between pt-3">
        <View className="flex-row items-center gap-2.5">
          <View className="h-9 w-9 items-center justify-center rounded-xl bg-ink"><Dumbbell color="#C8EF73" size={18} strokeWidth={2.5} /></View>
          <View><Text className="text-[13px] font-black tracking-[1.4px] text-ink">TREINO SYSTEM</Text><Text className="text-[9px] font-semibold uppercase tracking-[1.6px] text-muted">Área do aluno</Text></View>
        </View>
        <View className="flex-row items-center gap-2">
          <Pressable onPress={() => void refresh().catch((cause) => Alert.alert("Não foi possível atualizar", cause instanceof Error ? cause.message : "Tente novamente."))} className="h-10 w-10 items-center justify-center rounded-full border border-line bg-white"><RefreshCw color="#29332B" size={16} /></Pressable>
          <Pressable onPress={openNotifications} className="h-10 w-10 items-center justify-center rounded-full border border-line bg-white">
            <Bell color="#29332B" size={18} />
            {unreadNotifications > 0 ? <View className="absolute right-1 top-1 h-4 min-w-4 items-center justify-center rounded-full bg-[#A85F45] px-1"><Text className="text-[8px] font-black text-white">{unreadNotifications > 9 ? "9+" : unreadNotifications}</Text></View> : null}
          </Pressable>
        </View>
      </View>

      <View className="mt-8">
        <Eyebrow>{dateLabel}</Eyebrow>
        <Text className="mt-2 text-[31px] font-black leading-[36px] tracking-[-1.2px] text-ink">Vamos evoluir, {user?.nome?.split(" ")[0] ?? "aluno"}.{"\n"}Um treino de cada vez.</Text>
        <Text className="mt-2 text-[13px] leading-5 text-[#777D74]">Seu planejamento e seus resultados, atualizados com seu personal.</Text>
      </View>

      {error ? (
        <Pressable onPress={() => void refresh().catch(() => undefined)} className="mt-5 rounded-2xl border border-[#E8D8CE] bg-[#FBF1EA] p-4">
          <Text className="text-[11px] font-extrabold text-[#8D4F3E]">Não foi possível sincronizar seus dados</Text>
          <Text className="mt-1 text-[10px] leading-4 text-[#8D6254]">{error} · Toque para tentar novamente.</Text>
        </Pressable>
      ) : null}

      <View className="mt-7 overflow-hidden rounded-[28px] bg-ink p-6">
        <View className="absolute -right-10 -top-12 h-44 w-44 rounded-full border-[28px] border-white/[0.04]" />
        <View className="flex-row items-center justify-between">
          <Tag tone="lime">{hasSession ? "TREINO EM ANDAMENTO" : todayWorkout ? "TREINO DE HOJE" : "AGENDA DE HOJE"}</Tag>
          <Sparkles color="#C8EF73" size={17} />
        </View>
        <Text className="mt-5 text-[29px] font-black tracking-[-1px] text-white">{workoutName}</Text>
        <Text className="mt-1 text-[12px] text-white/60">{hasSession ? "Continue de onde você parou" : todayWorkout?.focus ?? "Hoje também faz parte da sua evolução."}</Text>
        <View className="mt-5 flex-row items-center gap-5">
          <View className="flex-row items-center gap-1.5"><Clock3 color="#C8EF73" size={14} /><Text className="text-[11px] font-semibold text-white/80">{activePlan ? `~${activePlan.duration} min` : "Sem duração"}</Text></View>
          <View className="flex-row items-center gap-1.5"><Dumbbell color="#C8EF73" size={14} /><Text className="text-[11px] font-semibold text-white/80">{hasSession ? `${completedSets}/${totalSets} séries` : todayWorkout ? `${todayWorkout.exercises.length} exercícios` : "Descanso"}</Text></View>
        </View>
        {hasSession ? <View className="mt-5"><View className="mb-2 flex-row justify-between"><Text className="text-[10px] font-semibold text-white/60">Progresso da sessão</Text><Text className="text-[10px] font-bold text-lime">{Math.round(progress)}%</Text></View><ProgressTrack value={progress} dark /></View> : null}
        <Pressable onPress={openWorkout} disabled={isLoading && !hasSession} className={`mt-6 h-14 flex-row items-center justify-center gap-2 rounded-2xl bg-lime active:opacity-80 ${isLoading && !hasSession ? "opacity-60" : ""}`}>
          {isLoading && !hasSession ? <ActivityIndicator color="#17211B" /> : <><Play color="#17211B" size={17} fill="#17211B" /><Text className="text-[13px] font-extrabold text-ink">{hasSession ? "Continuar treino" : todayWorkout ? "Começar treino" : "Ver planejamento"}</Text><ArrowRight color="#17211B" size={17} /></>}
        </Pressable>
      </View>

      <SectionTitle action={<Pressable onPress={() => router.push("/(tabs)/treinos")} className="flex-row items-center gap-1"><Text className="text-[11px] font-bold text-[#66715F]">Ver planejamento</Text><ChevronRight color="#66715F" size={15} /></Pressable>}>Sua semana</SectionTitle>
      {data.schedule.length > 0 ? (
        <View className="rounded-[22px] border border-line bg-white px-3 py-3">
          {data.schedule.map((item) => {
            const date = new Date(`${item.date}T00:00:00`);
            const isToday = item.date === todayKey;
            const isDone = completedDates.has(item.date);
            const label = item.workouts.map((workout) => workout.name).join(" + ") || "Descanso";
            return (
              <View key={item.id} className="flex-row items-center gap-3 py-2.5">
                <View className={`h-10 w-10 items-center justify-center rounded-xl ${isToday ? "bg-ink" : isDone ? "bg-lime" : "bg-[#F2F0EA]"}`}>
                  <Text className={`text-[8px] font-bold ${isToday ? "text-lime" : "text-[#858A82]"}`}>{new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(date).replace(".", "").toUpperCase()}</Text>
                  <Text className={`text-[13px] font-black ${isToday ? "text-white" : "text-ink"}`}>{date.getDate()}</Text>
                </View>
                <View className="flex-1"><Text className="text-[11px] font-bold text-ink">{label}</Text><Text className="mt-0.5 text-[9px] text-muted">{isToday ? "Hoje" : isDone ? "Sessão registrada" : item.workouts.length ? "Conforme sua periodização" : "Dia de recuperação"}</Text></View>
                {isDone ? <Check color="#647C4B" size={17} /> : isToday ? <Tag tone="lime">HOJE</Tag> : null}
              </View>
            );
          })}
        </View>
      ) : (
        <View className="rounded-[22px] border border-dashed border-line bg-white p-5">
          <CalendarDays color="#8A9382" size={20} />
          <Text className="mt-2 text-[11px] font-extrabold text-ink">Sua agenda ainda não foi vinculada</Text>
          <Text className="mt-1 text-[10px] leading-4 text-muted">Quando seu personal publicar a periodização, os dias de treino aparecerão aqui.</Text>
        </View>
      )}

      <SectionTitle>Seu ritmo</SectionTitle>
      <View className="flex-row gap-3">
        <MetricCard label="Sessões na semana" value={String(sessionsThisWeek)} caption="Treinos sincronizados" />
        <MetricCard label="Sequência atual" value={String(streak)} unit="dias" caption="Dias consecutivos" />
      </View>

      <View className="mt-4 flex-row items-center gap-3 rounded-[22px] border border-line bg-white p-4">
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#F0E9DF]"><Flame color="#A85F45" size={19} /></View>
        <View className="flex-1"><Text className="text-[12px] font-bold text-ink">Seu acompanhamento</Text><Text className="mt-1 text-[10px] leading-4 text-[#858A82]">{data.personals.length > 0 ? `Seu plano está vinculado a ${data.personals.map((item) => item.outroUsuarioNome).join(", ")}.` : "Seu personal aparecerá aqui quando o vínculo estiver ativo."}</Text></View>
        <CalendarDays color="#9A9E95" size={17} />
      </View>
      <View className="mb-5 mt-6 flex-row items-center justify-center gap-1"><Text className="text-[9px] font-medium text-[#A1A39D]">Dados sincronizados com</Text><Text className="text-[9px] font-extrabold tracking-wide text-[#626B5E]">TREINO SYSTEM</Text>{isRefreshing ? <ActivityIndicator size="small" color="#6B8154" /> : null}</View>
    </AppScreen>
  );
}
