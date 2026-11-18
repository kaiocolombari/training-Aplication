import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CircleHelp,
  Dumbbell,
  HeartPulse,
  Info,
  Pause,
  Pencil,
  Play,
  Save,
  RotateCcw,
  Video,
  X,
} from "lucide-react-native";

import { ProgressTrack, Tag } from "@/components/ui";
import { useWorkout } from "@/context/WorkoutContext";
import {
  cancelAppNotifications,
  scheduleCardioMilestones,
} from "@/services/notifications";
import { BlurView } from "expo-blur";

function formatTime(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60).toString().padStart(2, "0");
  const seconds = (safe % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function getCardioElapsedSeconds(session: { cardioElapsedSeconds: number; cardioStartedAt: string | null }) {
  return session.cardioElapsedSeconds + (session.cardioStartedAt
    ? Math.max(0, Math.floor((Date.now() - Date.parse(session.cardioStartedAt)) / 1000))
    : 0);
}

function VideoPlaceholder({ dark = false }: { dark?: boolean }) {
  return (
    <View className={`aspect-video items-center justify-center overflow-hidden rounded-[24px] border border-dashed ${dark ? "border-white/15 bg-white/[0.06]" : "border-[#D8D5CA] bg-[#EAE8E0]"}`}>
      <View className={`h-12 w-12 items-center justify-center rounded-full ${dark ? "bg-lime" : "bg-ink"}`}>
        <Video color={dark ? "#17211B" : "#C8EF73"} size={21} />
      </View>
      <Text className={`mt-3 text-[12px] font-extrabold ${dark ? "text-white" : "text-ink"}`}>Demonstração do movimento</Text>
      <Text className={`mt-1 text-[10px] ${dark ? "text-white/45" : "text-[#858A82]"}`}>O vídeo do exercício aparecerá aqui</Text>
    </View>
  );
}

function NumberField({
  label,
  value,
  unit,
  onChange,
  decimals = false,
}: {
  label: string;
  value: number;
  unit: string;
  onChange: (value: number) => void;
  decimals?: boolean;
}) {
  return (
    <View className="min-w-0 flex-1 rounded-2xl border border-[#DCE4D1] bg-white px-3 py-3">
      <View className="flex-row items-center justify-between gap-1">
        <Text className="flex-1 text-[9px] font-extrabold uppercase tracking-[0.8px] text-[#687263]">{label}</Text>
        <Pencil color="#82916F" size={12} />
      </View>
      <View className="mt-2 flex-row items-center justify-center rounded-xl bg-[#F3F5EF] px-2">
        <TextInput
          accessibilityLabel={label}
          value={String(value)}
          onChangeText={(raw) => {
            const parsed = Number(raw.replace(",", "."));
            onChange(raw.trim() === "" ? 0 : Math.max(0, Number.isFinite(parsed) ? (decimals ? parsed : Math.floor(parsed)) : 0));
          }}
          keyboardType={decimals ? "decimal-pad" : "number-pad"}
          selectTextOnFocus
          className="min-w-0 flex-1 py-2 text-center text-[25px] font-black text-ink"
        />
        <Text className="text-[11px] font-bold text-[#747D6D]">{unit}</Text>
      </View>
      <Text className="mt-2 text-center text-[9px] font-semibold text-[#858A82]">Toque no valor para editar</Text>
    </View>
  );
}

function ExerciseDescription({ description }: { description?: string }) {
  return (
    <View className="mt-3 rounded-2xl border border-[#E7E4DC] bg-white p-4">
      <View className="flex-row items-center gap-2">
        <Info color="#687A58" size={16} />
        <Text className="text-[10px] font-extrabold uppercase tracking-[1px] text-ink">Descrição do exercício</Text>
      </View>
      <Text className="mt-2 text-[11px] leading-5 text-[#626A5E]">
        {description?.trim() || "Seu personal ainda não adicionou orientações extras para este exercício."}
      </Text>
      <Text className="mt-2 text-[9px] leading-4 text-[#92968D]">
        Siga estas orientações junto com a demonstração em vídeo.
      </Text>
    </View>
  );
}

function ScreenHeader({
  title,
  subtitle,
  onClose,
  onSave,
  saving,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <View className="bg-ink px-5 pb-4 pt-2">
      <View className="flex-row items-center justify-between">
        <Pressable onPress={onClose} disabled={saving} className="h-10 w-10 items-center justify-center rounded-full bg-white/10">
          <X color="#FFFFFF" size={18} />
        </Pressable>
        <View className="flex-1 items-center px-3">
          <Text className="text-[9px] font-bold uppercase tracking-[1.6px] text-white/45">{subtitle}</Text>
          <Text numberOfLines={1} className="mt-1 text-[12px] font-extrabold text-white">{title}</Text>
        </View>
        <Pressable onPress={onSave} disabled={saving} className="h-10 w-10 items-center justify-center rounded-full bg-white/10">
          {saving ? <ActivityIndicator size="small" color="#C8EF73" /> : <Save color="#C8EF73" size={16} />}
        </Pressable>
      </View>
    </View>
  );
}

function FixedAction({
  title,
  onPress,
  secondaryTitle,
  onSecondary,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  secondaryTitle?: string;
  onSecondary?: () => void;
  disabled?: boolean;
}) {
  return (
    <View className="border-t border-[#E9E6DE] bg-white px-5 pb-4 pt-3">
      <Pressable
        onPress={onPress}
        disabled={disabled}
        className={`h-[54px] flex-row items-center justify-center gap-2 rounded-2xl bg-lime ${disabled ? "opacity-50" : "active:opacity-80"}`}
      >
        <Text className="text-[13px] font-extrabold text-ink">{title}</Text>
        <ArrowRight color="#17211B" size={17} />
      </Pressable>
      {secondaryTitle && onSecondary ? (
        <Pressable onPress={onSecondary} className="mt-2 h-10 items-center justify-center">
          <Text className="text-[11px] font-bold text-[#6F756B]">{secondaryTitle}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function WorkoutExecutionScreen() {
  const {
    activeSession,
    hydrated,
    completedSets,
    totalSets,
    updateCurrentSet,
    updateExerciseFeedback,
    beginRest,
    pauseRestStopwatch,
    resumeRestStopwatch,
    restartRestStopwatch,
    saveCurrentSetAndAdvance,
    updateCardioTimer,
    saveAndPause,
    finishWorkout,
  } = useWorkout();

  const [saving, setSaving] = useState(false);
  const [now, setNow] = useState(0);
  const [feedbackExpanded, setFeedbackExpanded] = useState(false);
  const [inactivityVisible, setInactivityVisible] = useState(false);
  const [setTransition] = useState(() => new Animated.Value(0));
  const [carouselState, setCarouselState] = useState({ key: "0-0", index: 0 });
  const [pageOffset] = useState(() => new Animated.Value(0));
  const carouselKey = `${activeSession?.currentExerciseIndex ?? 0}-${activeSession?.currentSetIndex ?? 0}`;
  const carouselIndex = carouselState.key === carouselKey ? carouselState.index : 0;
  const inactivityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionRef = useRef(activeSession);
  const inactivityPauseRef = useRef({ rest: false, cardio: false });
  const [modalVariable, setModalVariable] = useState(false);
  useEffect(() => {
    sessionRef.current = activeSession;
  }, [activeSession]);

  const shouldTick = Boolean(activeSession && (
    (activeSession.phase === "rest" && Boolean(activeSession.restStartedAt))
    || activeSession.cardioStartedAt
  ));
  const restElapsed = activeSession
    ? activeSession.restElapsedSeconds
    + (activeSession.restStartedAt ? Math.max(0, Math.floor((now - Date.parse(activeSession.restStartedAt)) / 1000)) : 0)
    : 0;
  const restRemaining = activeSession
    ? Math.max(0, activeSession.restDurationSeconds - restElapsed)
    : 0;

  useEffect(() => {
    if (!shouldTick) return;
    const syncClock = () => setNow(Date.now());
    const initialSync = setTimeout(syncClock, 0);
    const interval = setInterval(syncClock, 1000);
    return () => {
      clearTimeout(initialSync);
      clearInterval(interval);
    };
  }, [shouldTick, activeSession?.restStartedAt]);

  useEffect(() => {
    if (activeSession?.phase === "rest"
      && activeSession.restStartedAt
      && activeSession.restDurationSeconds > 0
      && restRemaining === 0) {
      pauseRestStopwatch(activeSession.restDurationSeconds);
    }
  }, [activeSession?.phase, activeSession?.restStartedAt, activeSession?.restDurationSeconds, restRemaining, pauseRestStopwatch]);

  const registerInteraction = useCallback(() => {
    if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
    if (!sessionRef.current || inactivityVisible) return;

    inactivityTimeoutRef.current = setTimeout(async () => {
      const current = sessionRef.current;
      if (!current) return;

      const pauseState = { rest: false, cardio: false };
      if (current.phase === "rest" && current.restStartedAt) {
        const elapsed = current.restElapsedSeconds + Math.max(0, Math.floor((Date.now() - Date.parse(current.restStartedAt)) / 1000));
        if (elapsed >= 0) {
          pauseRestStopwatch(elapsed);
          pauseState.rest = true;
        }
      }

      if (current.cardioStartedAt) {
        const elapsed = getCardioElapsedSeconds(current);
        await cancelAppNotifications(current.cardioNotificationIds);
        updateCardioTimer({ cardioStartedAt: null, cardioElapsedSeconds: elapsed, cardioNotificationIds: [] });
        pauseState.cardio = true;
      }

      inactivityPauseRef.current = pauseState;
      setInactivityVisible(true);
    }, 30 * 60 * 1000);
  }, [inactivityVisible, pauseRestStopwatch, updateCardioTimer]);

  useEffect(() => {
    if (!hydrated || !sessionRef.current || sessionRef.current.phase === "completed") {
      if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
      return;
    }
    registerInteraction();
    return () => {
      if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
    };
  }, [activeSession?.startedAt, activeSession?.phase, hydrated, registerInteraction]);

  useEffect(() => {
    setTransition.setValue(0);
    Animated.spring(setTransition, {
      toValue: 1,
      useNativeDriver: true,
      damping: 18,
      stiffness: 180,
      mass: 0.7,
    }).start();
  }, [activeSession?.currentExerciseIndex, activeSession?.currentSetIndex, setTransition]);

  if (!hydrated) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-ink">
        <StatusBar style="light" />
        <ActivityIndicator color="#C8EF73" />
      </SafeAreaView>
    );
  }

  if (!activeSession) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-ink px-7">
        <StatusBar style="light" />
        <Text className="text-[20px] font-extrabold text-white">Nenhuma sessão ativa</Text>
        <Text className="mt-2 text-center text-[12px] leading-5 text-white/60">Escolha um treino na sua ficha para começar.</Text>
        <Pressable onPress={() => router.replace("/(tabs)/treinos")} className="mt-6 rounded-xl bg-lime px-5 py-3">
          <Text className="text-[12px] font-extrabold text-ink">Ver meus treinos</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const session = activeSession;
  const exercise = session.exercises[session.currentExerciseIndex];
  const set = exercise?.sets[session.currentSetIndex];
  const progress = totalSets ? completedSets / totalSets * 100 : 0;
  const cardioElapsed = session.cardioElapsedSeconds
    + (session.cardioStartedAt ? Math.max(0, Math.floor((now - Date.parse(session.cardioStartedAt)) / 1000)) : 0);
  const cardioProgress = session.cardioDurationSeconds
    ? Math.min(100, cardioElapsed / session.cardioDurationSeconds * 100)
    : 0;
  const cardioRemaining = Math.max(0, session.cardioDurationSeconds - cardioElapsed);
  const isLastSet = Boolean(exercise && session.currentSetIndex === exercise.sets.length - 1
    && session.currentExerciseIndex === session.exercises.length - 1);
  const nextExercise = session.exercises[session.currentExerciseIndex + (exercise && session.currentSetIndex === exercise.sets.length - 1 ? 1 : 0)];
  const nextSetNumber = exercise && session.currentSetIndex < exercise.sets.length - 1
    ? session.currentSetIndex + 2
    : 1;

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
    await cancelAppNotifications(session.cardioNotificationIds);
    await finishWorkout(session.workoutKind === "cardio" ? getCardioElapsedSeconds(session) : undefined);
    router.replace("/(tabs)");
  }

  function confirmFinishEarly() {
    const detail = session.workoutKind === "cardio"
      ? (session.cardioTimerEnabled || session.cardioElapsedSeconds > 0 || Boolean(session.cardioStartedAt)
        ? `Tempo acompanhado: ${formatTime(getCardioElapsedSeconds(session))}.`
        : "O cronômetro ficou desativado, então a duração desta atividade não foi medida.")
      : `Você registrou ${completedSets} de ${totalSets} séries. O que já foi registrado ficará no histórico deste aparelho.`;
    Alert.alert("Encerrar sessão?", detail, [
      { text: "Continuar", style: "cancel" },
      { text: "Encerrar", style: "destructive", onPress: () => void finish() },
    ]);
  }

  function completeSet() {
    setFeedbackExpanded(false);
    beginRest();
  }

  function goToCarouselPage(index: number) {
    const nextIndex = Math.max(0, Math.min(1, index));
    if (nextIndex === carouselIndex) return;
    pageOffset.setValue(nextIndex > carouselIndex ? 24 : -24);
    setCarouselState({ key: carouselKey, index: nextIndex });
    Animated.spring(pageOffset, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 190, mass: 0.7 }).start();
  }

  const meuModal = (
    <Modal
      animationType="fade"
      transparent={true}
      visible={modalVariable}
      onRequestClose={() => setModalVariable(false)}
    >
      <View className="flex-1 justify-center items-center bg-black/50 px-6">
        <View className="w-full bg-white p-5 rounded-2xl shadow-lg">
          <Text className="text-lg font-bold text-gray-900 mb-3">
            Editar texto
          </Text>

          <Pressable
            className="bg-blue-600 py-3 rounded-lg items-center active:bg-blue-700"
            onPress={() => setModalVariable(false)}
          >
            <Text className="text-white font-bold">Confirmar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );

  function advanceSet(usePrescription: boolean) {
    setFeedbackExpanded(false);
    saveCurrentSetAndAdvance(usePrescription);
  }

  async function startOrResumeCardio() {
    let notificationIds: string[] = [];
    if (session.cardioNotificationsEnabled && session.cardioDurationSeconds > 0) {
      const result = await scheduleCardioMilestones(session.cardioDurationSeconds, getCardioElapsedSeconds(session));
      if (!result.permissionGranted) {
        updateCardioTimer({ cardioNotificationsEnabled: false });
        Alert.alert(
          "Avisos não autorizados",
          "O cronômetro continuará funcionando. Para receber os avisos, permita notificações do app nas configurações do aparelho.",
        );
      } else {
        notificationIds = result.ids;
      }
    }

    const startedAt = new Date().toISOString();
    setNow(Date.now());
    updateCardioTimer({
      cardioStartedAt: startedAt,
      cardioNotificationIds: notificationIds,
    });
  }

  async function resumeAfterInactivity() {
    const paused = inactivityPauseRef.current;
    inactivityPauseRef.current = { rest: false, cardio: false };
    setInactivityVisible(false);
    setNow(Date.now());

    if (paused.rest) resumeRestStopwatch();
    if (paused.cardio) await startOrResumeCardio();
  }

  async function pauseCardio() {
    await cancelAppNotifications(session.cardioNotificationIds);
    updateCardioTimer({
      cardioStartedAt: null,
      cardioElapsedSeconds: getCardioElapsedSeconds(session),
      cardioNotificationIds: [],
    });
  }

  async function toggleCardioTimer(enabled: boolean) {
    if (!enabled) {
      await cancelAppNotifications(session.cardioNotificationIds);
      updateCardioTimer({
        cardioTimerEnabled: false,
        cardioStartedAt: null,
        cardioElapsedSeconds: getCardioElapsedSeconds(session),
        cardioNotificationIds: [],
      });
      return;
    }
    updateCardioTimer({ cardioTimerEnabled: true });
  }

  async function toggleCardioNotifications(enabled: boolean) {
    if (!enabled) {
      await cancelAppNotifications(session.cardioNotificationIds);
      updateCardioTimer({ cardioNotificationsEnabled: false, cardioNotificationIds: [] });
      return;
    }

    if (session.cardioStartedAt && session.cardioDurationSeconds > 0) {
      const result = await scheduleCardioMilestones(session.cardioDurationSeconds, cardioElapsed);
      if (!result.permissionGranted) {
        Alert.alert("Permissão necessária", "Permita notificações do Treino System nas configurações do aparelho para receber os marcos do cardio.");
        return;
      }
      updateCardioTimer({ cardioNotificationsEnabled: true, cardioNotificationIds: result.ids });
      return;
    }
    updateCardioTimer({ cardioNotificationsEnabled: true });
  }

  const screenHeader = (
    <>
      <ScreenHeader
        title={session.workoutName}
        subtitle={session.workoutKind === "cardio" ? "SESSÃO DE CARDIO" : "SESSÃO EM ANDAMENTO"}
        onClose={confirmFinishEarly}
        onSave={() => void pauseAndExit()}
        saving={saving}
      />
      <Modal
        visible={inactivityVisible}
        transparent
        animationType="fade"
        onRequestClose={() => void resumeAfterInactivity()}
      >
        <View className="flex-1 items-center justify-center bg-black/65 px-6">
          <View className="w-full rounded-[28px] bg-white p-6">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#E8EDDE]">
              <Pause color="#526447" size={22} />
            </View>
            <Text className="mt-4 text-[20px] font-black text-ink">Pausamos sua sessão</Text>
            <Text className="mt-2 text-[12px] leading-5 text-[#687064]">
              Ficamos 30 minutos sem detectar interação. Pausamos os cronômetros que estavam ativos e preservamos o tempo já acumulado, sem contar o período de inatividade.
            </Text>
            <Pressable onPress={() => void resumeAfterInactivity()} className="mt-6 h-12 items-center justify-center rounded-2xl bg-lime">
              <Text className="text-[12px] font-extrabold text-ink">Retomar sessão</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );

  if (session.phase === "completed") {
    return (
      <SafeAreaView onTouchStart={registerInteraction} edges={["top", "bottom"]} className="flex-1 bg-[#F3F1EB]">
        <StatusBar style="dark" />
        {screenHeader}
        <View className="flex-1 justify-center px-6">
          <View className="items-center rounded-[28px] bg-ink px-6 py-8">
            <View className="h-20 w-20 items-center justify-center rounded-full bg-lime">
              <CheckCircle2 color="#17211B" size={38} />
            </View>
            <Text className="mt-6 text-center text-[27px] font-black tracking-[-1px] text-white">Sessão concluída.</Text>
            <Text className="mt-2 text-center text-[12px] leading-5 text-white/55">
              {session.workoutKind === "cardio"
                ? `Você acompanhou ${formatTime(cardioElapsed)} de atividade.`
                : `${completedSets} séries registradas em ${session.workoutName}.`}
            </Text>
            <Pressable onPress={() => void finish()} className="mt-7 h-14 w-full items-center justify-center rounded-2xl bg-lime">
              <Text className="text-[13px] font-extrabold text-ink">Finalizar e voltar</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (session.workoutKind === "cardio") {
    return (
      <SafeAreaView onTouchStart={registerInteraction} edges={["top", "bottom"]} className="flex-1 bg-[#F3F1EB]">
        <StatusBar style="dark" />
        {screenHeader}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="px-5 pb-6 pt-5">
          <View className="flex-row items-center gap-2">
            <Tag tone="lime">CARDIO</Tag>
            <Text className="text-[10px] font-semibold text-[#858A82]">Ritmo contínuo · atividade aeróbica</Text>
          </View>
          <Text className="mt-3 text-[28px] font-black tracking-[-1px] text-ink">
            {exercise?.name ?? session.workoutName}
          </Text>
          <Text className="mt-1 text-[11px] leading-5 text-[#777D74]">
            Faça no seu ritmo. O cronômetro e os avisos são opcionais.
          </Text>

          <View className="mt-5">
            <VideoPlaceholder />
          </View>
          <ExerciseDescription description={exercise?.note} />

          <View className="mt-5 rounded-[26px] bg-ink p-5">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-[9px] font-bold uppercase tracking-[1.4px] text-white/45">DURAÇÃO PLANEJADA</Text>
                <Text className="mt-1 text-[17px] font-extrabold text-white">
                  {session.cardioDurationSeconds > 0 ? formatTime(session.cardioDurationSeconds) : "Sem meta definida"}
                </Text>
              </View>
              <View className="h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                <HeartPulse color="#C8EF73" size={20} />
              </View>
            </View>

            <View className="mt-5 flex-row items-center justify-between border-t border-white/10 pt-4">
              <View className="flex-1 pr-3">
                <Text className="text-[12px] font-extrabold text-white">Acompanhar tempo</Text>
                <Text className="mt-1 text-[10px] leading-4 text-white/50">Ative se quiser medir a duração da atividade.</Text>
              </View>
              <Switch
                value={session.cardioTimerEnabled}
                onValueChange={(value) => void toggleCardioTimer(value)}
                trackColor={{ false: "#48534B", true: "#78934E" }}
                thumbColor={session.cardioTimerEnabled ? "#C8EF73" : "#E5E7EB"}
              />
            </View>

            {session.cardioTimerEnabled ? (
              <View className="mt-4 rounded-[22px] bg-white/[0.07] p-4">
                <Text className="text-center text-[9px] font-bold uppercase tracking-[1.5px] text-white/45">TEMPO DECORRIDO</Text>
                <Text className="mt-2 text-center text-[48px] font-black tabular-nums tracking-[-2px] text-white">
                  {formatTime(cardioElapsed)}
                </Text>
                {session.cardioDurationSeconds > 0 ? (
                  <>
                    <View className="mt-4"><ProgressTrack value={cardioProgress} dark /></View>
                    <View className="mt-2 flex-row justify-between">
                      <Text className="text-[10px] font-semibold text-lime">{Math.floor(cardioProgress)}% concluídos</Text>
                      <Text className="text-[10px] font-semibold text-white/50">{formatTime(cardioRemaining)} restantes</Text>
                    </View>
                  </>
                ) : (
                  <Text className="mt-2 text-center text-[10px] text-white/50">Sem duração-alvo para calcular os marcos.</Text>
                )}

                <View className="mt-5 flex-row items-center justify-between border-t border-white/10 pt-4">
                  <View className="flex-1 pr-2">
                    <View className="flex-row items-center gap-2">
                      <Bell color="#C8EF73" size={15} />
                      <Text className="text-[11px] font-extrabold text-white">Avisos de progresso</Text>
                    </View>
                    <Text className="mt-1 text-[10px] leading-4 text-white/50">Som e incentivo em 25%, 50%, 75% e 100%.</Text>
                  </View>
                  <Switch
                    value={session.cardioNotificationsEnabled}
                    onValueChange={(value) => void toggleCardioNotifications(value)}
                    trackColor={{ false: "#48534B", true: "#78934E" }}
                    thumbColor={session.cardioNotificationsEnabled ? "#C8EF73" : "#E5E7EB"}
                  />
                </View>
                {session.cardioStartedAt ? (
                  <Pressable onPress={() => void pauseCardio()} className="mt-4 h-11 flex-row items-center justify-center gap-2 rounded-xl border border-white/15">
                    <Pause color="#FFFFFF" size={15} />
                    <Text className="text-[11px] font-bold text-white">Pausar cronômetro</Text>
                  </Pressable>
                ) : (
                  <Pressable onPress={() => void startOrResumeCardio()} className="mt-4 h-11 flex-row items-center justify-center gap-2 rounded-xl bg-lime">
                    <Play color="#17211B" size={15} fill="#17211B" />
                    <Text className="text-[11px] font-extrabold text-ink">{cardioElapsed > 0 ? "Retomar cronômetro" : "Iniciar cronômetro"}</Text>
                  </Pressable>
                )}
              </View>
            ) : (
              <View className="mt-4 rounded-2xl bg-white/[0.07] p-4">
                <Text className="text-[11px] font-bold text-white">Atividade sem cronômetro</Text>
                <Text className="mt-1 text-[10px] leading-4 text-white/50">Você pode concluir normalmente, mas a duração não será medida nem enviada no registro.</Text>
              </View>
            )}
          </View>
        </ScrollView>
        <FixedAction title="Finalizar cardio" onPress={confirmFinishEarly} />
      </SafeAreaView>
    );
  }

  if (exercise && set) {
    const isResting = session.phase === "rest";

    return (
      <SafeAreaView onTouchStart={registerInteraction} edges={["top", "bottom"]} className="flex-1 bg-[#F3F1EB]">
        <StatusBar style="dark" />
        {screenHeader}
        <View className="bg-white px-5 py-3">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-[10px] font-bold text-[#777D74]">{completedSets} / {totalSets} séries concluídas</Text>
            <Text className="text-[10px] font-extrabold text-ink">{Math.round(progress)}%</Text>
          </View>
          <ProgressTrack value={progress} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="px-5 pb-6 pt-5">
          <View className="flex-row items-center justify-between">
            <Tag tone="lime">EXERCÍCIO {session.currentExerciseIndex + 1} DE {session.exercises.length}</Tag>
            <Text className="text-[10px] font-bold text-[#858A82]">{exercise.muscle}</Text>
          </View>
          <Text className="mt-3 text-[28px] font-black tracking-[-1px] text-ink">{exercise.name}</Text>
          <Text className="mt-1 text-[11px] text-[#777D74]">{isResting ? "Série registrada. Use o cronômetro se quiser acompanhar seu descanso." : "Alterne entre a prescrição e a edição pelos controles do card."}</Text>
          {session.currentSetIndex === 0 ? (
            <Pressable onPress={() => setModalVariable(true)} className="mt-4 h-11 w-full flex-row items-center justify-center rounded-[10px] bg-lime">
              <Text className="font-bold text-black">Variações disponíveis: 5</Text>
            </Pressable>
          ) : null}
          <View className="mt-4 rounded-2xl border border-[#E7E4DC] bg-white p-4">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-[9px] font-extrabold uppercase tracking-[1px] text-[#858A82]">PROGRESSO DO EXERCÍCIO</Text>
                <Text className="mt-1 text-[13px] font-black text-ink">Série {session.currentSetIndex + 1} de {exercise.sets.length}</Text>
              </View>
              <Tag tone="lime">{exercise.sets.filter((item) => item.completed).length} concluídas</Tag>
            </View>
            <View className="mt-3 flex-row gap-2">
              {exercise.sets.map((item, index) => (
                <View key={`${exercise.id}-set-${index}`} className={`h-2 flex-1 rounded-full ${item.completed ? "bg-[#9DBB69]" : index === session.currentSetIndex ? "bg-ink" : "bg-[#E8E7E0]"}`} />
              ))}
            </View>
            <View className="mt-2 flex-row justify-between">
              <Text className="text-[9px] font-semibold text-[#858A82]">{completedSets} de {totalSets} séries no treino</Text>
              <Text className="text-[9px] font-extrabold text-[#526447]">{Math.round(progress)}%</Text>
            </View>
          </View>
          {modalVariable && (
            <BlurView
              intensity={50}
              tint="dark"
              experimentalBlurMethod="dimezisBlurView"
              style={StyleSheet.absoluteFill}
            />
          )}
          {meuModal}

          <Animated.View
            style={{
              opacity: setTransition,
              transform: [{ translateX: setTransition.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
            }}
          >
            <View className="mt-4 flex-row rounded-2xl bg-white p-1">
              <Pressable onPress={() => goToCarouselPage(0)} className={`flex-1 items-center rounded-xl py-3 ${carouselIndex === 0 ? "bg-ink" : "bg-transparent"}`}>
                <Text className={`text-[10px] font-extrabold ${carouselIndex === 0 ? "text-lime" : "text-[#858A82]"}`}>1. Prescrição</Text>
              </Pressable>
              <Pressable onPress={() => goToCarouselPage(1)} className={`flex-1 items-center rounded-xl py-3 ${carouselIndex === 1 ? "bg-ink" : "bg-transparent"}`}>
                <Text className={`text-[10px] font-extrabold ${carouselIndex === 1 ? "text-lime" : "text-[#858A82]"}`}>2. Editar valores</Text>
              </Pressable>
            </View>
            <Animated.View
              key={carouselKey}
              style={{
                opacity: pageOffset.interpolate({ inputRange: [-24, 0, 24], outputRange: [0.75, 1, 0.75] }),
                transform: [{ translateX: pageOffset }],
              }}
              className="mt-4"
            >
              {carouselIndex === 0 ? (
                <View className="rounded-[24px] bg-white p-5">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[9px] font-extrabold uppercase tracking-[1.4px] text-[#858A82]">O QUE FAZER</Text>
                    <Tag tone="lime">PRESCRIÇÃO</Tag>
                  </View>
                  <Text className="mt-3 text-[42px] font-black tracking-[-1.5px] text-ink">{set.targetReps}</Text>
                  <Text className="text-[10px] font-semibold text-[#858A82]">repetições planejadas · somente leitura</Text>
                  <View className="mt-4 flex-row gap-2">
                    <View className="flex-1 rounded-2xl bg-[#F3F2EC] p-3">
                      <Text className="text-[9px] font-bold uppercase tracking-[0.8px] text-[#858A82]">CARGA</Text>
                      <Text className="mt-1 text-[20px] font-black text-ink">{set.targetLoad}<Text className="text-[10px] font-bold text-[#777D74]"> kg</Text></Text>
                    </View>
                    <View className="flex-1 rounded-2xl bg-[#F3F2EC] p-3">
                      <Text className="text-[9px] font-bold uppercase tracking-[0.8px] text-[#858A82]">RIR</Text>
                      <Text className="mt-1 text-[20px] font-black text-ink">{set.targetRir}</Text>
                    </View>
                    <View className="flex-1 rounded-2xl bg-[#F3F2EC] p-3">
                      <Text className="text-[9px] font-bold uppercase tracking-[0.8px] text-[#858A82]">DESCANSO</Text>
                      <Text className="mt-1 text-[20px] font-black text-ink">{exercise.rest}</Text>
                    </View>
                  </View>
                  <Text className="mt-4 text-[10px] leading-4 text-[#858A82]">Siga os valores definidos pelo personal. Toque em “Editar valores” para registrar o que realmente executou.</Text>
                </View>
              ) : (
                <View className="rounded-[24px] border border-[#DCE4D1] bg-white p-5">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[9px] font-extrabold uppercase tracking-[1.4px] text-[#526447]">O QUE FOI FEITO</Text>
                    <Tag tone="lime">EDITÁVEL</Tag>
                  </View>
                  <Text className="mt-2 text-[10px] leading-4 text-[#858A82]">Preencha os valores que realmente conseguiu executar. Os campos começam em zero.</Text>
                  <View className="mt-3 flex-row gap-2">
                    <NumberField label="Carga realizada" value={set.load} unit="kg" decimals onChange={(load) => updateCurrentSet({ load })} />
                    <NumberField label="Repetições feitas" value={set.reps} unit="reps" onChange={(reps) => updateCurrentSet({ reps })} />
                  </View>
                  <View className="mt-3 rounded-2xl border border-[#E9E6DE] bg-[#FAFAF7] p-4">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1 pr-3">
                        <Text className="text-[10px] font-extrabold uppercase tracking-[1px] text-[#777D74]">RIR REALIZADO</Text>
                        <Text className="mt-1 text-[10px] text-[#858A82]">Quantas repetições ainda conseguiria fazer?</Text>
                      </View>
                      <Text className="text-[22px] font-black text-ink">{set.rir}</Text>
                    </View>
                    <View className="mt-3 flex-row gap-2">
                      {[0, 1, 2, 3, 4, 5].map((value) => (
                        <Pressable key={value} onPress={() => updateCurrentSet({ rir: value })} className={`h-10 flex-1 items-center justify-center rounded-xl ${set.rir === value ? "bg-ink" : "bg-[#F1F0EB]"}`}>
                          <Text className={`text-[12px] font-extrabold ${set.rir === value ? "text-lime" : "text-[#73796F]"}`}>{value}</Text>
                        </Pressable>
                      ))}
                    </View>
                    <Text className="mt-2 text-[9px] text-[#858A82]">Prescrito pelo personal: RIR {set.targetRir}</Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Por que registrar os dados da série?"
                    onPress={() => Alert.alert(
                      "Como esses dados ajudam?",
                      "Registre a carga, as repetições e o RIR que realmente realizou. Assim, seu personal consegue comparar o planejado com o executado e ajustar os próximos treinos. Se não alterar nenhum campo, a prescrição do personal será usada automaticamente.",
                      [{ text: "Entendi" }],
                    )}
                    className="mt-3 flex-row items-center gap-2 self-start rounded-full bg-[#E8EDDE] px-3 py-2"
                  >
                    <CircleHelp color="#526447" size={16} />
                    <Text className="text-[9px] font-bold text-[#526447]">Por que registrar?</Text>
                  </Pressable>
                </View>
              )}
            </Animated.View>
            {/* */}
          </Animated.View>

          <ExerciseDescription description={exercise.note} />

          <View className="mt-4">
            <VideoPlaceholder />
          </View>

          <Pressable onPress={() => setFeedbackExpanded((value) => !value)} className="mt-3 flex-row items-center justify-between rounded-2xl border border-[#E9E6DE] bg-white px-4 py-4">
            <View className="flex-row items-center gap-2">
              <Info color="#747B70" size={16} />
              <View>
                <Text className="text-[11px] font-extrabold text-ink">Dor ou observação</Text>
                <Text className="mt-0.5 text-[9px] text-[#858A82]">Opcional · compartilhar com seu personal</Text>
              </View>
            </View>
            <ChevronDown color="#747B70" size={17} />
          </Pressable>

          {feedbackExpanded ? (
            <View className="mt-2 rounded-2xl border border-[#E9E6DE] bg-white p-4">
              <Text className="text-[10px] font-extrabold uppercase tracking-[1px] text-[#777D74]">Como se sentiu?</Text>
              <View className="mt-3 flex-row gap-2">
                {([{ value: "none", label: "Sem dor" }, { value: "discomfort", label: "Desconforto" }, { value: "pain", label: "Dor" }] as const).map((option) => (
                  <Pressable key={option.value} onPress={() => updateExerciseFeedback({ painStatus: option.value })} className={`flex-1 items-center justify-center rounded-xl px-2 py-3 ${exercise.painStatus === option.value ? "bg-lime" : "bg-[#F1F0EB]"}`}>
                    <Text className={`text-[9px] font-extrabold ${exercise.painStatus === option.value ? "text-ink" : "text-[#73796F]"}`}>{option.label}</Text>
                  </Pressable>
                ))}
              </View>
              <TextInput
                value={exercise.feedback}
                onChangeText={(feedback) => updateExerciseFeedback({ feedback })}
                placeholder="Ex.: senti desconforto no ombro..."
                placeholderTextColor="#999D94"
                multiline
                textAlignVertical="top"
                className="mt-3 min-h-[72px] rounded-xl bg-[#F5F4EF] px-3 py-3 text-[11px] text-ink"
              />
            </View>
          ) : null}
          <View className="mt-4 rounded-[24px] bg-ink p-5">
            {isResting ? (
              <>
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="text-[9px] font-bold uppercase tracking-[1.4px] text-white/45">CRONÔMETRO DE DESCANSO</Text>
                    <Text className="mt-1 text-[11px] text-white/55">Tempo restante do intervalo prescrito</Text>
                  </View>
                  <Text className="text-[36px] font-black tabular-nums tracking-[-1px] text-lime">{formatTime(restRemaining)}</Text>
                </View>
                <View className="mt-4 flex-row gap-2">
                  {session.restStartedAt ? (
                    <Pressable onPress={() => pauseRestStopwatch(restElapsed)} className="h-11 flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-white/15">
                      <Pause color="#FFFFFF" size={15} />
                      <Text className="text-[10px] font-bold text-white">Pausar</Text>
                    </Pressable>
                  ) : (
                    <Pressable onPress={resumeRestStopwatch} disabled={restRemaining === 0} className={`h-11 flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-lime ${restRemaining === 0 ? "opacity-50" : ""}`}>
                      <Play color="#17211B" size={15} fill="#17211B" />
                      <Text className="text-[10px] font-extrabold text-ink">{restRemaining === 0 ? "Concluído" : restElapsed > 0 ? "Continuar" : "Iniciar"}</Text>
                    </Pressable>
                  )}
                  <Pressable onPress={restartRestStopwatch} className="h-11 w-12 items-center justify-center rounded-xl border border-white/15">
                    <RotateCcw color="#C8EF73" size={16} />
                  </Pressable>
                </View>
                <Text className="mt-2 text-[10px] leading-4 text-white/50">A contagem começa no tempo definido pelo personal e diminui até 00:00. Ao terminar, ela para sem avançar a série automaticamente. Use reiniciar para voltar ao tempo prescrito.</Text>
              </>
            ) : (
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                  <Text className="text-[12px] font-extrabold text-white">Descanso da série</Text>
                  <Text className="mt-1 text-[10px] leading-4 text-white/50">Ao concluir a série, você poderá iniciar o cronômetro manualmente.</Text>
                </View>
                <Clock3 color="#C8EF73" size={25} />
              </View>
            )}
          </View>
          
          {nextExercise ? (
            <View className="mt-4 flex-row items-center rounded-2xl border border-[#E7E4DC] bg-white p-3">
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-[#F0EFE9]"><Dumbbell color="#69745F" size={17} /></View>
              <View className="ml-3 flex-1">
                <Text className="text-[9px] font-bold uppercase tracking-[1px] text-[#858A82]">PRÓXIMA ETAPA</Text>
                <Text className="mt-0.5 text-[11px] font-extrabold text-ink">{nextExercise.id === exercise.id ? `Série ${nextSetNumber} · ${exercise.name}` : `Novo exercício · ${nextExercise.name}`}</Text>
              </View>
              <ChevronRight color="#A2A59D" size={17} />
            </View>
          ) : null}

        </ScrollView>
        <FixedAction
          title={isResting
            ? (isLastSet ? "Salvar e concluir agora" : "Salvar e avançar agora")
            : `Concluir série ${session.currentSetIndex + 1} e iniciar descanso`}
          onPress={isResting ? () => advanceSet(false) : completeSet}
          secondaryTitle={isResting
            ? (isLastSet ? "Usar prescrição e concluir" : "Usar prescrição e avançar")
            : "Encerrar treino"}
          onSecondary={isResting ? () => advanceSet(true) : confirmFinishEarly}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-[#F3F1EB]">
      <Text className="text-[14px] font-bold text-ink">Preparando sua sessão...</Text>
    </SafeAreaView>
  );
}
