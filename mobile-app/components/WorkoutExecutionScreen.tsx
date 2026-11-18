import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  ArrowRight,
  Bell,
  Check,
  CheckCircle2,
  Clock3,
  Dumbbell,
  HeartPulse,
  Minus,
  Play,
  Plus,
  Save,
  Video,
  X,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { ProgressTrack, Tag } from "@/components/ui";
import { useWorkout } from "@/context/WorkoutContext";
import {
  cancelAppNotifications,
  scheduleCardioMilestones,
} from "@/services/notifications";

function formatTime(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60).toString().padStart(2, "0");
  const seconds = (safe % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function VideoPlaceholder() {
  return (
    <View className="mt-5 aspect-video items-center justify-center overflow-hidden rounded-[24px] border border-dashed border-white/20 bg-white/[0.06]">
      <View className="h-14 w-14 items-center justify-center rounded-full bg-lime">
        <Video color="#17211B" size={24} />
      </View>
      <Text className="mt-3 text-[12px] font-extrabold text-white">Vídeo demonstrativo</Text>
      <Text className="mt-1 text-[10px] text-white/45">O vídeo deste exercício será adicionado aqui</Text>
    </View>
  );
}

function NumberField({
  label,
  value,
  unit,
  onChange,
  step,
}: {
  label: string;
  value: number;
  unit: string;
  onChange: (value: number) => void;
  step: number;
}) {
  return (
    <View className="flex-1 rounded-[20px] bg-white p-3.5">
      <Text className="text-[9px] font-extrabold tracking-[1px] text-[#858A82]">{label}</Text>
      <View className="mt-3 flex-row items-center justify-between">
        <Pressable onPress={() => onChange(Math.max(0, value - step))} className="h-8 w-8 items-center justify-center rounded-full bg-[#F0F0E9]">
          <Minus color="#17211B" size={14} />
        </Pressable>
        <View className="items-center">
          <TextInput
            value={String(value)}
            onChangeText={(raw) => onChange(Math.max(0, Number(raw.replace(",", ".")) || 0))}
            keyboardType="decimal-pad"
            selectTextOnFocus
            className="min-w-[46px] p-0 text-center text-[24px] font-black text-ink"
          />
          <Text className="text-[9px] font-semibold text-muted">{unit}</Text>
        </View>
        <Pressable onPress={() => onChange(value + step)} className="h-8 w-8 items-center justify-center rounded-full bg-[#F0F0E9]">
          <Plus color="#17211B" size={14} />
        </Pressable>
      </View>
    </View>
  );
}

export default function WorkoutExecutionScreen() {
  const {
    activeSession,
    hydrated,
    completedSets,
    totalSets,
    isComplete,
    updateCurrentSet,
    updateExerciseFeedback,
    beginRest,
    saveCurrentSetAndAdvance,
    updateCardioTimer,
    saveAndPause,
    finishWorkout,
  } = useWorkout();
  const [saving, setSaving] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!activeSession) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [activeSession?.phase, activeSession?.restEndsAt, activeSession?.cardioStartedAt]);

  if (!hydrated) {
    return <SafeAreaView className="flex-1 items-center justify-center bg-ink"><StatusBar style="light" /><ActivityIndicator color="#C8EF73" /></SafeAreaView>;
  }

  if (!activeSession) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-ink px-7">
        <StatusBar style="light" />
        <Text className="text-[20px] font-extrabold text-white">Nenhum treino ativo</Text>
        <Text className="mt-2 text-center text-[12px] text-white/60">Escolha uma sessão na aba Treinos para começar.</Text>
        <Pressable onPress={() => router.replace("/(tabs)/treinos")} className="mt-6 rounded-xl bg-lime px-5 py-3">
          <Text className="text-[12px] font-extrabold text-ink">Ver meus treinos</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const exercise = activeSession.exercises[activeSession.currentExerciseIndex];
  const set = exercise?.sets[activeSession.currentSetIndex];
  const progress = totalSets ? completedSets / totalSets * 100 : 0;
  const restRemaining = activeSession.restEndsAt
    ? Math.max(0, Math.ceil((Date.parse(activeSession.restEndsAt) - now) / 1000))
    : 0;
  const cardioElapsed = activeSession.cardioElapsedSeconds
    + (activeSession.cardioStartedAt ? Math.max(0, Math.floor((now - Date.parse(activeSession.cardioStartedAt)) / 1000)) : 0);
  const cardioRemaining = Math.max(0, activeSession.cardioDurationSeconds - cardioElapsed);
  const cardioProgress = activeSession.cardioDurationSeconds
    ? Math.min(100, cardioElapsed / activeSession.cardioDurationSeconds * 100)
    : 0;
  const isLastSet = Boolean(exercise && activeSession.currentSetIndex === exercise.sets.length - 1
    && activeSession.currentExerciseIndex === activeSession.exercises.length - 1);

  async function pauseAndExit() {
    setSaving(true);
    try {
      await saveAndPause();
      router.replace("/(tabs)");
    } finally {
      setSaving(false);
    }
  }

  async function finish() {
    if (activeSession.cardioNotificationIds.length) {
      await cancelAppNotifications(activeSession.cardioNotificationIds);
    }
    await finishWorkout();
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace("/(tabs)");
  }

  function confirmFinishEarly() {
    Alert.alert(
      "Finalizar treino agora?",
      `Você registrou ${completedSets} de ${totalSets} séries. O que já foi salvo ficará no histórico deste dispositivo.`,
      [
        { text: "Continuar treino", style: "cancel" },
        { text: "Finalizar treino", style: "destructive", onPress: () => void finish() },
      ],
    );
  }

  async function startOrResumeCardio() {
    let notificationIds: string[] = [];
    let notificationsEnabled = activeSession.cardioNotificationsEnabled;

    if (notificationsEnabled) {
      const result = await scheduleCardioMilestones(activeSession.cardioDurationSeconds, activeSession.cardioElapsedSeconds);
      notificationIds = result.ids;
      if (!result.permissionGranted) {
        notificationsEnabled = false;
        Alert.alert("Notificações desativadas", "O cronômetro vai funcionar normalmente, mas o sistema não poderá avisar os marcos de 25%, 50%, 75% e 100%.");
      }
    }

    updateCardioTimer({
      cardioStartedAt: new Date().toISOString(),
      cardioNotificationIds: notificationIds,
      cardioNotificationsEnabled: notificationsEnabled,
    });
  }

  async function pauseCardio() {
    await cancelAppNotifications(activeSession.cardioNotificationIds);
    updateCardioTimer({
      cardioStartedAt: null,
      cardioElapsedSeconds: cardioElapsed,
      cardioNotificationIds: [],
    });
  }

  async function toggleCardioTimer(enabled: boolean) {
    if (!enabled) {
      await cancelAppNotifications(activeSession.cardioNotificationIds);
      updateCardioTimer({
        cardioTimerEnabled: false,
        cardioStartedAt: null,
        cardioElapsedSeconds: 0,
        cardioNotificationIds: [],
      });
      return;
    }
    updateCardioTimer({ cardioTimerEnabled: true, cardioStartedAt: null, cardioElapsedSeconds: 0 });
  }

  async function toggleCardioNotifications(enabled: boolean) {
    if (!enabled) {
      await cancelAppNotifications(activeSession.cardioNotificationIds);
      updateCardioTimer({ cardioNotificationsEnabled: false, cardioNotificationIds: [] });
      return;
    }

    if (activeSession.cardioStartedAt) {
      const result = await scheduleCardioMilestones(activeSession.cardioDurationSeconds, cardioElapsed);
      if (!result.permissionGranted) {
        Alert.alert("Permissão necessária", "Ative as notificações do Treino System nas configurações do aparelho para receber os avisos do cardio.");
        return;
      }
      updateCardioTimer({ cardioNotificationsEnabled: true, cardioNotificationIds: result.ids });
      return;
    }
    updateCardioTimer({ cardioNotificationsEnabled: true });
  }

  function markSetComplete() {
    beginRest();
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  if (activeSession.workoutKind === "cardio") {
    return (
      <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-ink">
        <StatusBar style="light" />
        <View className="flex-row items-center justify-between px-5 pt-2">
          <Pressable onPress={() => void pauseAndExit()} disabled={saving} className="h-10 w-10 items-center justify-center rounded-full bg-white/10"><X color="#FFFFFF" size={18} /></Pressable>
          <View className="items-center"><Text className="text-[9px] font-bold uppercase tracking-[1.7px] text-white/45">SESSÃO DE CARDIO</Text><Text className="mt-1 text-[12px] font-extrabold text-white">{activeSession.workoutName}</Text></View>
          <Pressable onPress={() => void pauseAndExit()} disabled={saving} className="h-10 flex-row items-center gap-1.5 rounded-full bg-white/10 px-3"><Save color="#C8EF73" size={14} /><Text className="text-[9px] font-bold text-white">{saving ? "Salvando" : "Salvar"}</Text></Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="px-5 pb-8">
          <View className="mt-7 flex-row items-center gap-2"><Tag tone="lime">CARDIO</Tag><Text className="text-[10px] font-semibold text-white/45">Condicionamento cardiovascular</Text></View>
          <Text className="mt-4 text-[29px] font-black tracking-[-1px] text-white">{exercise?.name ?? activeSession.workoutName}</Text>
          <Text className="mt-2 text-[11px] text-white/50">Faça no seu ritmo e acompanhe o tempo se quiser.</Text>
          <VideoPlaceholder />

          <View className="mt-5 rounded-[24px] border border-white/10 bg-white/[0.05] p-5">
            <View className="flex-row items-center justify-between"><Text className="text-[10px] font-bold uppercase tracking-[1.2px] text-white/50">Cronômetro do cardio</Text><Clock3 color="#C8EF73" size={17} /></View>
            <View className="mt-4 flex-row items-center justify-between">
              <View className="flex-1 pr-3"><Text className="text-[12px] font-bold text-white">Ativar cronômetro</Text><Text className="mt-1 text-[10px] leading-4 text-white/45">Opcional. Você pode fazer a atividade sem contar o tempo.</Text></View>
              <Switch value={activeSession.cardioTimerEnabled} onValueChange={(value) => void toggleCardioTimer(value)} trackColor={{ false: "#48534B", true: "#78934E" }} thumbColor={activeSession.cardioTimerEnabled ? "#C8EF73" : "#E5E7EB"} />
            </View>

            {activeSession.cardioTimerEnabled ? (
              <>
                <View className="mt-5 items-center rounded-[20px] bg-white/[0.06] py-5">
                  <Text className="text-[10px] font-bold uppercase tracking-[1.5px] text-white/45">TEMPO DECORRIDO</Text>
                  <Text className="mt-2 text-[48px] font-black tabular-nums tracking-[-2px] text-white">{formatTime(cardioElapsed)}</Text>
                  <Text className="mt-1 text-[10px] font-semibold text-lime">Meta: {formatTime(activeSession.cardioDurationSeconds)}</Text>
                  <View className="mt-5 w-full px-5"><ProgressTrack value={cardioProgress} dark /></View>
                  <Text className="mt-2 text-[10px] font-bold text-white/55">{Math.floor(cardioProgress)}% concluídos · {formatTime(cardioRemaining)} restantes</Text>
                </View>

                <View className="mt-4 flex-row items-center justify-between rounded-2xl bg-white/[0.06] p-4">
                  <View className="flex-1 pr-3"><View className="flex-row items-center gap-2"><Bell color="#C8EF73" size={15} /><Text className="text-[11px] font-bold text-white">Avisos com som</Text></View><Text className="mt-1 text-[10px] leading-4 text-white/45">Notificar em 25%, 50%, 75% e 100% do tempo.</Text></View>
                  <Switch value={activeSession.cardioNotificationsEnabled} onValueChange={(value) => void toggleCardioNotifications(value)} trackColor={{ false: "#48534B", true: "#78934E" }} thumbColor={activeSession.cardioNotificationsEnabled ? "#C8EF73" : "#E5E7EB"} />
                </View>

                {activeSession.cardioStartedAt ? (
                  <Pressable onPress={() => void pauseCardio()} className="mt-4 h-12 flex-row items-center justify-center gap-2 rounded-xl border border-white/15"><Text className="text-[12px] font-extrabold text-white">Pausar cronômetro</Text></Pressable>
                ) : (
                  <Pressable onPress={() => void startOrResumeCardio()} className="mt-4 h-12 flex-row items-center justify-center gap-2 rounded-xl bg-lime"><Play color="#17211B" size={16} fill="#17211B" /><Text className="text-[12px] font-extrabold text-ink">{cardioElapsed > 0 ? "Retomar cronômetro" : "Iniciar cronômetro"}</Text></Pressable>
                )}
              </>
            ) : (
              <View className="mt-4 rounded-xl bg-white/[0.06] p-4"><Text className="text-[11px] font-semibold text-white/75">Cronômetro desativado</Text><Text className="mt-1 text-[10px] leading-4 text-white/45">A atividade não será cronometrada e nenhum aviso de progresso será enviado.</Text></View>
            )}
          </View>

          <Pressable onPress={confirmFinishEarly} className="mt-5 h-14 flex-row items-center justify-center gap-2 rounded-2xl bg-lime"><CheckCircle2 color="#17211B" size={18} /><Text className="text-[13px] font-extrabold text-ink">Finalizar cardio</Text></Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-ink">
      <StatusBar style="light" />
      <View className="px-5 pt-2">
        <View className="flex-row items-center justify-between">
          <Pressable onPress={() => void pauseAndExit()} disabled={saving} className="h-10 w-10 items-center justify-center rounded-full bg-white/10"><X color="#FFFFFF" size={18} /></Pressable>
          <View className="items-center"><Text className="text-[9px] font-bold uppercase tracking-[1.7px] text-white/45">SESSÃO EM ANDAMENTO</Text><Text className="mt-1 text-[12px] font-extrabold text-white">{activeSession.workoutName}</Text></View>
          <Pressable onPress={() => void pauseAndExit()} disabled={saving} className="h-10 flex-row items-center gap-1.5 rounded-full bg-white/10 px-3"><Save color="#C8EF73" size={14} /><Text className="text-[9px] font-bold text-white">{saving ? "Salvando" : "Salvar"}</Text></Pressable>
        </View>
        <View className="mt-5 flex-row items-center justify-between"><Text className="text-[10px] font-semibold text-white/55">{completedSets} de {totalSets} séries registradas</Text><Text className="text-[10px] font-extrabold text-lime">{Math.round(progress)}%</Text></View>
        <View className="mt-2"><ProgressTrack value={progress} dark /></View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="px-5 pb-8">
        {activeSession.phase === "completed" || isComplete ? (
          <View className="mt-12 items-center rounded-[28px] border border-white/10 bg-white/[0.05] p-6">
            <View className="h-20 w-20 items-center justify-center rounded-full bg-lime"><CheckCircle2 color="#17211B" size={38} /></View>
            <Text className="mt-6 text-center text-[27px] font-black tracking-[-1px] text-white">Treino concluído.</Text>
            <Text className="mt-2 text-center text-[12px] leading-5 text-white/55">Você registrou {completedSets} séries em {activeSession.workoutName}. Bom trabalho!</Text>
            <View className="mt-6 w-full rounded-2xl bg-white/[0.06] p-4"><Text className="text-[10px] font-bold uppercase tracking-[1px] text-white/45">Resumo da sessão</Text><View className="mt-3 flex-row justify-between"><Text className="text-[11px] text-white/70">Séries registradas</Text><Text className="text-[11px] font-extrabold text-lime">{completedSets}/{totalSets}</Text></View><View className="mt-2 flex-row justify-between"><Text className="text-[11px] text-white/70">Exercícios</Text><Text className="text-[11px] font-extrabold text-white">{activeSession.exercises.length}</Text></View></View>
            <Pressable onPress={() => void finish()} className="mt-6 h-14 w-full items-center justify-center rounded-2xl bg-lime"><Text className="text-[13px] font-extrabold text-ink">Finalizar e voltar ao início</Text></Pressable>
          </View>
        ) : activeSession.phase === "rest" && exercise && set ? (
          <>
            <View className="mt-7 flex-row items-center justify-between"><Tag tone="lime">DESCANSO ENTRE SÉRIES</Tag><Text className="text-[10px] font-semibold text-white/45">SÉRIE {activeSession.currentSetIndex + 1} / {exercise.sets.length}</Text></View>
            <Text className="mt-4 text-[25px] font-black tracking-[-0.8px] text-white">Recupere e registre.</Text>
            <Text className="mt-1 text-[11px] text-white/50">{exercise.name}</Text>

            <View className="mt-5 items-center rounded-[26px] border border-white/10 bg-white/[0.05] p-5">
              <Text className="text-[10px] font-bold uppercase tracking-[1.5px] text-white/45">TEMPO DE DESCANSO</Text>
              <Text className="mt-2 text-[54px] font-black tabular-nums tracking-[-2px] text-lime">{formatTime(restRemaining)}</Text>
              <Text className="mt-1 text-[10px] text-white/45">{restRemaining > 0 ? "O descanso está contando" : "Descanso concluído"}</Text>
              <View className="mt-4 w-full"><ProgressTrack value={activeSession.restDurationSeconds ? (1 - restRemaining / activeSession.restDurationSeconds) * 100 : 100} dark /></View>
            </View>

            <View className="mt-5 flex-row items-center justify-between"><Text className="text-[12px] font-extrabold text-white">O que você realmente fez?</Text><Tag>Prescrição: {set.targetReps} reps · {set.targetLoad} kg</Tag></View>
            <View className="mt-3 flex-row gap-3">
              <NumberField label="CARGA REAL" value={set.load} unit="kg" step={2} onChange={(load) => updateCurrentSet({ load })} />
              <NumberField label="REPETIÇÕES" value={set.reps} unit="reps" step={1} onChange={(reps) => updateCurrentSet({ reps })} />
            </View>
            <View className="mt-3 rounded-[20px] border border-white/10 bg-white/[0.05] p-4">
              <View className="flex-row items-center justify-between"><View><Text className="text-[10px] font-bold uppercase tracking-[1.2px] text-white/50">RIR realizado</Text><Text className="mt-1 text-[10px] text-white/55">Quantas repetições ainda conseguiria fazer?</Text></View><Text className="text-[24px] font-black text-lime">{set.rir}</Text></View>
              <View className="mt-3 flex-row gap-2">{[0, 1, 2, 3, 4, 5].map((value) => <Pressable key={value} onPress={() => updateCurrentSet({ rir: value })} className={`h-10 flex-1 items-center justify-center rounded-xl ${set.rir === value ? "bg-lime" : "bg-white/10"}`}><Text className={`text-[12px] font-extrabold ${set.rir === value ? "text-ink" : "text-white/60"}`}>{value}</Text></Pressable>)}</View>
            </View>

            <View className="mt-3 rounded-[20px] border border-white/10 bg-white/[0.05] p-4">
              <Text className="text-[10px] font-bold uppercase tracking-[1.2px] text-white/50">Como você se sentiu?</Text>
              <View className="mt-3 flex-row gap-2">{([{ value: "none", label: "Sem dor" }, { value: "discomfort", label: "Desconforto" }, { value: "pain", label: "Dor" }] as const).map((option) => <Pressable key={option.value} onPress={() => updateExerciseFeedback({ painStatus: option.value })} className={`flex-1 items-center justify-center rounded-xl px-2 py-3 ${exercise.painStatus === option.value ? "bg-lime" : "bg-white/10"}`}><Text className={`text-[9px] font-extrabold ${exercise.painStatus === option.value ? "text-ink" : "text-white/65"}`}>{option.label}</Text></Pressable>)}</View>
              <TextInput value={exercise.feedback} onChangeText={(feedback) => updateExerciseFeedback({ feedback })} placeholder="Observação para seu personal (opcional)" placeholderTextColor="#8C958C" multiline textAlignVertical="top" className="mt-3 min-h-[64px] rounded-xl bg-white/10 px-3 py-3 text-[11px] text-white" />
            </View>

            <Pressable onPress={() => saveCurrentSetAndAdvance(false)} className="mt-5 h-14 flex-row items-center justify-center gap-2 rounded-2xl bg-lime"><CheckCircle2 color="#17211B" size={18} /><Text className="text-[12px] font-extrabold text-ink">{isLastSet ? "Salvar e finalizar treino" : "Salvar valores e próxima série"}</Text><ArrowRight color="#17211B" size={16} /></Pressable>
            <Pressable onPress={() => saveCurrentSetAndAdvance(true)} className="mt-3 h-12 flex-row items-center justify-center gap-2 rounded-2xl border border-white/15"><Check color="#C8EF73" size={16} /><Text className="text-[11px] font-bold text-white">Seguir com o padrão do personal</Text></Pressable>
          </>
        ) : exercise && set ? (
          <>
            <View className="mt-7 flex-row items-center justify-between"><Tag tone="lime">EXERCÍCIO {activeSession.currentExerciseIndex + 1} / {activeSession.exercises.length}</Tag><Text className="text-[10px] font-semibold text-white/45">{exercise.muscle}</Text></View>
            <Text className="mt-4 text-[29px] font-black leading-[34px] tracking-[-1px] text-white">{exercise.name}</Text>
            <Text className="mt-2 text-[11px] text-white/50">Execute a série conforme a orientação do seu personal.</Text>
            <VideoPlaceholder />

            <View className="mt-5 rounded-[24px] border border-white/10 bg-white/[0.05] p-5">
              <Text className="text-[10px] font-bold uppercase tracking-[1.3px] text-white/45">PRESCRIÇÃO DO EXERCÍCIO</Text>
              <View className="mt-4 flex-row gap-2">
                <View className="flex-1 rounded-2xl bg-white/[0.06] p-3"><Text className="text-[9px] font-bold text-white/45">SÉRIES</Text><Text className="mt-1 text-[22px] font-black text-white">{exercise.sets.length}</Text></View>
                <View className="flex-1 rounded-2xl bg-white/[0.06] p-3"><Text className="text-[9px] font-bold text-white/45">PESO ESTIMADO</Text><Text className="mt-1 text-[22px] font-black text-lime">{set.targetLoad}<Text className="text-[11px]"> kg</Text></Text></View>
                <View className="flex-1 rounded-2xl bg-white/[0.06] p-3"><Text className="text-[9px] font-bold text-white/45">DESCANSO</Text><Text className="mt-1 text-[22px] font-black text-white">{exercise.rest}</Text></View>
              </View>
              <View className="mt-4 flex-row items-center justify-between"><Text className="text-[10px] font-semibold text-white/55">Meta por série</Text><Text className="text-[12px] font-extrabold text-white">{set.targetReps} repetições · RIR {set.targetRir}</Text></View>
            </View>

            <View className="mt-4 rounded-[22px] border border-white/10 bg-white/[0.05] p-4">
              <View className="flex-row items-center justify-between"><Text className="text-[10px] font-bold uppercase tracking-[1.2px] text-white/50">Séries do exercício</Text><Text className="text-[10px] font-bold text-lime">{exercise.sets.filter((item) => item.completed).length}/{exercise.sets.length} registradas</Text></View>
              <View className="mt-4 flex-row gap-2">{exercise.sets.map((item, index) => {
                const active = index === activeSession.currentSetIndex;
                return <View key={index} className={`h-11 flex-1 items-center justify-center rounded-xl ${item.completed ? "bg-lime" : active ? "border border-lime bg-lime/10" : "bg-white/10"}`}>{item.completed ? <Check color="#17211B" size={17} strokeWidth={3} /> : <Text className={`text-[12px] font-extrabold ${active ? "text-lime" : "text-white/55"}`}>{index + 1}</Text>}</View>;
              })}</View>
            </View>

            {exercise.note ? <View className="mt-4 rounded-2xl bg-[#26352A] p-4"><Text className="text-[9px] font-extrabold uppercase tracking-[1px] text-lime">Orientação do personal</Text><Text className="mt-2 text-[11px] leading-5 text-white/75">{exercise.note}</Text></View> : null}

            <Pressable onPress={markSetComplete} className="mt-6 h-14 flex-row items-center justify-center gap-2 rounded-2xl bg-lime"><CheckCircle2 color="#17211B" size={18} /><Text className="text-[13px] font-extrabold text-ink">Concluir série {activeSession.currentSetIndex + 1}</Text></Pressable>
            <Pressable onPress={confirmFinishEarly} className="mt-3 h-11 items-center justify-center"><Text className="text-[10px] font-bold text-white/50">Finalizar treino agora</Text></Pressable>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
