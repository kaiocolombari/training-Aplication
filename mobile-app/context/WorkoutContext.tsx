import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/context/AuthContext";
import { WORKOUTS, type ExerciseVariationPlan, type WorkoutPlan } from "@/data/workouts";
import { submitWorkoutSession } from "@/services/executionService";

const STORAGE_KEY = "@treino-system/active-session";
const HISTORY_KEY = "@treino-system/session-history";
const PENDING_SUBMISSIONS_KEY = "@treino-system/pending-workout-submissions";

const storageKeyFor = (prefix: string, studentId: string) => `${prefix}:${studentId}`;

function parseRestDurationSeconds(rest: string) {
  const normalized = rest.trim().toLowerCase();
  const clockMatch = normalized.match(/^(\d+):(\d{1,2})$/);
  if (clockMatch) return Number(clockMatch[1]) * 60 + Number(clockMatch[2]);

  const minutes = normalized.match(/(\d+(?:[.,]\d+)?)\s*(?:minutos|min|min\.?|m)\b/);
  const seconds = normalized.match(/(\d+(?:[.,]\d+)?)\s*(?:segundos|seg|s)\b/);
  if (minutes || seconds) {
    return Math.round(
      Number((minutes?.[1] ?? "0").replace(",", ".")) * 60
      + Number((seconds?.[1] ?? "0").replace(",", ".")),
    );
  }

  const numericValue = Number.parseFloat(normalized.replace(",", "."));
  return Number.isFinite(numericValue) ? Math.max(0, Math.round(numericValue)) : 0;
}

export type SessionSet = {
  targetReps: string;
  targetLoad: number;
  targetRir: number;
  reps: number;
  load: number;
  rir: number;
  actualRestSeconds: number;
  hasActualRestRecorded: boolean;
  hasRecorded: boolean;
  completed: boolean;
};

export type SessionExercise = {
  id: string;
  name: string;
  muscle: string;
  rest: string;
  note?: string;
  prescriptionMissingFields?: Array<"series" | "reps" | "load" | "rir" | "rest">;
  variations: ExerciseVariationPlan[];
  selectedVariationId: string | null;
  painStatus: "none" | "discomfort" | "pain";
  feedback: string;
  sets: SessionSet[];
};

export type ActiveSession = {
  workoutId: string;
  workoutName: string;
  workoutKind: "strength" | "cardio";
  startedAt: string;
  finishedAt: string | null;
  durationSeconds: number | null;
  expectedDurationMinutes: number;
  currentExerciseIndex: number;
  currentSetIndex: number;
  phase: "exercise" | "rest" | "cardio" | "completed";
  restEndsAt: string | null;
  restDurationSeconds: number;
  restPausedRemainingSeconds: number | null;
  restElapsedSeconds: number;
  restStartedAt: string | null;
  cardioDurationSeconds: number;
  cardioTimerEnabled: boolean;
  cardioNotificationsEnabled: boolean;
  cardioStartedAt: string | null;
  cardioElapsedSeconds: number;
  cardioNotificationIds: string[];
  exercises: SessionExercise[];
};

export type WorkoutSubmissionPayload = {
  sessionId: string;
  workoutId: string;
  workoutName: string;
  workoutKind: ActiveSession["workoutKind"];
  startedAt: string;
  finishedAt: string;
  durationSeconds: number;
  expectedDurationMinutes: number;
  completedSets: number;
  totalSets: number;
  exercises: Array<{
    exerciseId: string;
    variationId: string | null;
    name: string;
    muscle: string;
    prescribedRest: string;
    painStatus: SessionExercise["painStatus"];
    feedback: string;
    sets: Array<{
      setNumber: number;
      completed: boolean;
      prescribed: { reps: string; load: number; rir: number; restSeconds: number };
      performed: { reps: number | null; load: number | null; rir: number | null; restSeconds: number | null; usedPrescription: boolean };
    }>;
  }>;
  cardio: { plannedDurationSeconds: number; activityDurationSeconds: number | null } | null;
};

type WorkoutContextValue = {
  activeSession: ActiveSession | null;
  hydrated: boolean;
  completedSets: number;
  totalSets: number;
  isComplete: boolean;
  beginWorkout: (workout: WorkoutPlan) => void;
  updateCurrentSet: (patch: Partial<Pick<SessionSet, "reps" | "load" | "rir" | "actualRestSeconds">>) => void;
  updateExerciseFeedback: (patch: Partial<Pick<SessionExercise, "painStatus" | "feedback">>) => void;
  selectExerciseVariation: (variationId: string) => void;
  beginRest: () => void;
  pauseRestStopwatch: (elapsedSeconds: number) => void;
  resumeRestStopwatch: () => void;
  restartRestStopwatch: () => void;
  saveCurrentSetAndAdvance: (usePrescription?: boolean) => void;
  prepareWorkoutSummary: (cardioElapsedSeconds?: number) => void;
  updateCardioTimer: (patch: Partial<Pick<ActiveSession, "cardioTimerEnabled" | "cardioNotificationsEnabled" | "cardioStartedAt" | "cardioElapsedSeconds" | "cardioNotificationIds">>) => void;
  saveAndPause: () => Promise<void>;
  finishWorkout: (cardioElapsedSeconds?: number) => Promise<boolean>;
  syncPendingSubmissions: () => Promise<number>;
};

function getSessionDurationSeconds(startedAt: string, finishedAt: string) {
  return Math.max(0, Math.floor((Date.parse(finishedAt) - Date.parse(startedAt)) / 1000));
}

export function buildWorkoutSubmissionPayload(session: ActiveSession): WorkoutSubmissionPayload {
  const finishedAt = session.finishedAt ?? new Date().toISOString();
  const durationSeconds = session.durationSeconds ?? getSessionDurationSeconds(session.startedAt, finishedAt);
  const allSets = session.exercises.flatMap((exercise) => exercise.sets);

  return {
    sessionId: `${session.workoutId}-${Date.parse(session.startedAt)}`,
    workoutId: session.workoutId,
    workoutName: session.workoutName,
    workoutKind: session.workoutKind,
    startedAt: session.startedAt,
    finishedAt,
    durationSeconds,
    expectedDurationMinutes: session.expectedDurationMinutes,
    completedSets: allSets.filter((set) => set.completed).length,
    totalSets: allSets.length,
    exercises: session.exercises.map((exercise) => ({
      exerciseId: exercise.id,
      variationId: exercise.selectedVariationId,
      name: exercise.name,
      muscle: exercise.muscle,
      prescribedRest: exercise.rest,
      painStatus: exercise.painStatus,
      feedback: exercise.feedback,
      sets: exercise.sets.map((set, index) => ({
        setNumber: index + 1,
        completed: set.completed,
        prescribed: {
          reps: set.targetReps,
          load: set.targetLoad,
          rir: set.targetRir,
          restSeconds: parseRestDurationSeconds(exercise.rest),
        },
        performed: {
          reps: session.workoutKind === "strength" && (set.hasRecorded ? set.reps > 0 : set.completed && !exercise.prescriptionMissingFields?.includes("reps")) ? set.reps : null,
          load: session.workoutKind === "strength" && (set.hasRecorded ? set.load > 0 || !exercise.prescriptionMissingFields?.includes("load") : set.completed && !exercise.prescriptionMissingFields?.includes("load")) ? set.load : null,
          rir: session.workoutKind === "strength" && (set.hasRecorded ? set.rir > 0 || !exercise.prescriptionMissingFields?.includes("rir") : set.completed && !exercise.prescriptionMissingFields?.includes("rir")) ? set.rir : null,
          restSeconds: set.hasActualRestRecorded ? set.actualRestSeconds : null,
          usedPrescription: session.workoutKind === "strength" && set.completed && !set.hasRecorded
            && !exercise.prescriptionMissingFields?.some((field) => field === "reps" || field === "load" || field === "rir"),
        },
      })),
    })),
    cardio: session.workoutKind === "cardio" ? {
      plannedDurationSeconds: session.cardioDurationSeconds,
      activityDurationSeconds: session.cardioElapsedSeconds > 0 ? session.cardioElapsedSeconds : null,
    } : null,
  };
}

export async function getPendingWorkoutSubmissions(studentId: string): Promise<WorkoutSubmissionPayload[]> {
  const saved = await AsyncStorage.getItem(storageKeyFor(PENDING_SUBMISSIONS_KEY, studentId));
  return saved ? JSON.parse(saved) as WorkoutSubmissionPayload[] : [];
}

export async function removePendingWorkoutSubmission(studentId: string, sessionId: string) {
  const pending = await getPendingWorkoutSubmissions(studentId);
  await AsyncStorage.setItem(
    storageKeyFor(PENDING_SUBMISSIONS_KEY, studentId),
    JSON.stringify(pending.filter((item) => item.sessionId !== sessionId)),
  );
}

export async function flushPendingWorkoutSubmissions(
  studentId: string,
  sendBatch: (payload: WorkoutSubmissionPayload) => Promise<unknown>,
  isCurrentUser: () => boolean = () => true,
) {
  const pending = await getPendingWorkoutSubmissions(studentId);
  let sentCount = 0;

  for (const payload of pending) {
    if (!isCurrentUser()) break;
    await sendBatch(payload);
    await removePendingWorkoutSubmission(studentId, payload.sessionId);
    sentCount += 1;
  }

  return sentCount;
}

const pendingFlushes = new Map<string, Promise<number>>();

function syncPendingWorkoutSubmissions(studentId: string, isCurrentUser: () => boolean) {
  const existing = pendingFlushes.get(studentId);
  if (existing) return existing;

  const task = flushPendingWorkoutSubmissions(studentId, submitWorkoutSession, isCurrentUser)
    .finally(() => {
      if (pendingFlushes.get(studentId) === task) pendingFlushes.delete(studentId);
    });
  pendingFlushes.set(studentId, task);
  return task;
}

const WorkoutContext = createContext<WorkoutContextValue | null>(null);

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const studentId = user?.tipo === "ALUNO" && user.statusCadastro === "APROVADO" ? user.alunoId : null;
  const studentIdRef = useRef<string | null>(studentId);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [activeSessionOwnerId, setActiveSessionOwnerId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const activeSessionForUser = activeSessionOwnerId === studentId ? activeSession : null;

  useLayoutEffect(() => {
    studentIdRef.current = studentId;
  }, [studentId]);

  useEffect(() => {
    if (authLoading) return;
    let mounted = true;
    setHydrated(false);
    setActiveSession(null);
    setActiveSessionOwnerId(null);

    if (!studentId) {
      setHydrated(true);
      return () => { mounted = false; };
    }

    AsyncStorage.getItem(storageKeyFor(STORAGE_KEY, studentId))
      .then((value) => {
        if (mounted && value) {
          const saved = JSON.parse(value) as Partial<ActiveSession>;
          const restoredRestDurationSeconds = saved.restDurationSeconds && saved.restDurationSeconds > 0
            ? saved.restDurationSeconds
            : saved.phase === "rest"
              ? parseRestDurationSeconds(saved.exercises?.[saved.currentExerciseIndex ?? 0]?.rest ?? "")
              : 0;
          setActiveSession({
            ...saved,
            workoutKind: saved.workoutKind ?? "strength",
            finishedAt: saved.finishedAt ?? null,
            durationSeconds: saved.durationSeconds ?? null,
            expectedDurationMinutes: saved.expectedDurationMinutes
              ?? WORKOUTS.find((workout) => workout.id === saved.workoutId)?.duration
              ?? 0,
            phase: saved.phase ?? "exercise",
            restEndsAt: saved.restEndsAt ?? null,
            restDurationSeconds: restoredRestDurationSeconds,
            restPausedRemainingSeconds: saved.restPausedRemainingSeconds ?? null,
            restElapsedSeconds: Math.min(restoredRestDurationSeconds, saved.restElapsedSeconds ?? 0),
            restStartedAt: saved.restStartedAt ?? null,
            cardioDurationSeconds: saved.cardioDurationSeconds ?? 0,
            cardioTimerEnabled: saved.cardioTimerEnabled ?? false,
            cardioNotificationsEnabled: saved.cardioNotificationsEnabled ?? true,
            cardioStartedAt: saved.cardioStartedAt ?? null,
            cardioElapsedSeconds: saved.cardioElapsedSeconds ?? 0,
            cardioNotificationIds: saved.cardioNotificationIds ?? [],
            exercises: (saved.exercises ?? []).map((exercise) => ({
              ...exercise,
              variations: exercise.variations ?? [],
              selectedVariationId: exercise.selectedVariationId ?? null,
              sets: exercise.sets.map((set) => ({
                ...set,
                actualRestSeconds: set.actualRestSeconds ?? 0,
                hasActualRestRecorded: set.hasActualRestRecorded ?? false,
                hasRecorded: set.hasRecorded ?? (
                  set.load !== set.targetLoad
                  || set.reps !== (Number.parseInt(set.targetReps, 10) || 10)
                  || set.rir !== set.targetRir
                ),
              })),
            })),
          } as ActiveSession);
          setActiveSessionOwnerId(studentId);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (mounted) setHydrated(true);
      });
    return () => { mounted = false; };
  }, [authLoading, studentId]);

  useEffect(() => {
    if (!hydrated || !studentId || activeSessionOwnerId !== studentId) return;
    const key = storageKeyFor(STORAGE_KEY, studentId);
    if (activeSessionForUser) {
      AsyncStorage.setItem(key, JSON.stringify(activeSessionForUser)).catch(() => undefined);
    } else {
      AsyncStorage.removeItem(key).catch(() => undefined);
    }
  }, [activeSessionForUser, activeSessionOwnerId, hydrated, studentId]);

  const beginWorkout = useCallback((workout: WorkoutPlan) => {
    if (!studentId) return;
    setActiveSessionOwnerId(studentId);
    setActiveSession({
      workoutId: workout.id,
      workoutName: workout.name,
      workoutKind: workout.kind,
      startedAt: new Date().toISOString(),
      finishedAt: null,
      durationSeconds: null,
      expectedDurationMinutes: workout.duration,
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      phase: workout.kind === "cardio" ? "cardio" : "exercise",
      restEndsAt: null,
      restDurationSeconds: 0,
      restPausedRemainingSeconds: null,
      restElapsedSeconds: 0,
      restStartedAt: null,
      cardioDurationSeconds: workout.cardioDurationSeconds ?? 0,
      cardioTimerEnabled: false,
      cardioNotificationsEnabled: true,
      cardioStartedAt: null,
      cardioElapsedSeconds: 0,
      cardioNotificationIds: [],
      exercises: workout.exercises.map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        muscle: exercise.muscle,
        rest: exercise.rest,
        note: exercise.note,
        prescriptionMissingFields: exercise.prescriptionMissingFields ?? [],
        variations: exercise.variations ?? [],
        selectedVariationId: null,
        painStatus: "none",
        feedback: "",
        sets: Array.from({ length: exercise.sets }, () => ({
          targetReps: exercise.reps,
          targetLoad: exercise.load,
          targetRir: exercise.rir,
          reps: 0,
          load: 0,
          rir: 0,
          actualRestSeconds: 0,
          hasActualRestRecorded: false,
          hasRecorded: false,
          completed: false,
        })),
      })),
    });
  }, [studentId]);

  const completedSets = activeSessionForUser?.exercises.reduce(
    (sum, exercise) => sum + exercise.sets.filter((set) => set.completed).length,
    0,
  ) ?? 0;
  const totalSets = activeSessionForUser?.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0) ?? 0;
  const isComplete = totalSets > 0 && completedSets === totalSets;

  const updateCurrentSet = useCallback((patch: Partial<Pick<SessionSet, "reps" | "load" | "rir" | "actualRestSeconds">>) => {
    setActiveSession((current) => {
      if (!current) return current;
      const safePatch = {
        ...patch,
        ...(patch.load !== undefined ? { load: Math.min(2000, Math.max(0, patch.load)) } : {}),
        ...(patch.reps !== undefined ? { reps: Math.min(1000, Math.max(0, Math.floor(patch.reps))) } : {}),
        ...(patch.rir !== undefined ? { rir: Math.min(5, Math.max(0, patch.rir)) } : {}),
        ...(patch.actualRestSeconds !== undefined ? { actualRestSeconds: Math.min(3600, Math.max(0, Math.floor(patch.actualRestSeconds))) } : {}),
      };
      const exercises = current.exercises.map((exercise, exerciseIndex) => {
        if (exerciseIndex !== current.currentExerciseIndex) return exercise;
        return {
          ...exercise,
          sets: exercise.sets.map((set, setIndex) => {
            if (setIndex !== current.currentSetIndex) return set;
            const recordsPerformance = "load" in safePatch || "reps" in safePatch || "rir" in safePatch;
            const firstPerformanceEdit = recordsPerformance && !set.hasRecorded;
            return {
              ...set,
              ...(firstPerformanceEdit ? {
                reps: Number.parseInt(set.targetReps, 10) || set.reps,
                load: set.targetLoad,
                rir: set.targetRir,
              } : {}),
              ...safePatch,
              ...(patch.actualRestSeconds !== undefined ? { hasActualRestRecorded: true } : {}),
              hasRecorded: set.hasRecorded || recordsPerformance,
            };
          }),
        };
      });
      return { ...current, exercises };
    });
  }, []);

  const beginRest = useCallback(() => {
    setActiveSession((current) => {
      if (!current || current.phase !== "exercise") return current;
      return {
        ...current,
        phase: "rest",
        restDurationSeconds: parseRestDurationSeconds(current.exercises[current.currentExerciseIndex]?.rest ?? ""),
        restPausedRemainingSeconds: null,
        restEndsAt: null,
        restElapsedSeconds: 0,
        restStartedAt: null,
      };
    });
  }, []);

  const pauseRestStopwatch = useCallback((elapsedSeconds: number) => {
    setActiveSession((current) => current && current.phase === "rest" ? {
      ...current,
      restElapsedSeconds: Math.min(current.restDurationSeconds, Math.max(0, elapsedSeconds)),
      restStartedAt: null,
    } : current);
  }, []);

  const resumeRestStopwatch = useCallback(() => {
    setActiveSession((current) => {
      if (!current || current.phase !== "rest" || current.restStartedAt
        || current.restElapsedSeconds >= current.restDurationSeconds) return current;
      return {
        ...current,
        restStartedAt: new Date().toISOString(),
      };
    });
  }, []);

  const restartRestStopwatch = useCallback(() => {
    setActiveSession((current) => {
      if (!current || current.phase !== "rest") return current;
      return {
        ...current,
        restDurationSeconds: current.restDurationSeconds,
        restPausedRemainingSeconds: null,
        restEndsAt: null,
        restElapsedSeconds: 0,
        restStartedAt: null,
      };
    });
  }, []);

  const saveCurrentSetAndAdvance = useCallback((usePrescription = false) => {
    setActiveSession((current) => {
      if (!current || current.phase !== "rest") return current;
      const exercises = current.exercises.map((item, exerciseIndex) => {
        if (exerciseIndex !== current.currentExerciseIndex) return item;
        return {
          ...item,
          sets: item.sets.map((set, setIndex) => setIndex === current.currentSetIndex
            ? {
              ...set,
              reps: usePrescription || !set.hasRecorded ? Number.parseInt(set.targetReps, 10) || set.reps : set.reps,
              load: usePrescription || !set.hasRecorded ? set.targetLoad : set.load,
              rir: usePrescription || !set.hasRecorded ? set.targetRir : set.rir,
              completed: true,
            }
            : set),
        };
      });

      let nextExerciseIndex = current.currentExerciseIndex;
      let nextSetIndex = current.currentSetIndex + 1;
      if (nextSetIndex >= exercises[nextExerciseIndex].sets.length) {
        nextExerciseIndex += 1;
        nextSetIndex = 0;
      }
      if (nextExerciseIndex >= exercises.length) {
        const finishedAt = new Date().toISOString();
        return {
          ...current,
          exercises,
          phase: "completed",
          finishedAt,
          durationSeconds: getSessionDurationSeconds(current.startedAt, finishedAt),
          restEndsAt: null,
          restStartedAt: null,
        };
      }
      return {
        ...current,
        exercises,
        currentExerciseIndex: nextExerciseIndex,
        currentSetIndex: nextSetIndex,
        phase: "exercise",
        restEndsAt: null,
        restDurationSeconds: 0,
        restPausedRemainingSeconds: null,
        restElapsedSeconds: 0,
        restStartedAt: null,
      };
    });
  }, []);

  const updateCardioTimer = useCallback((patch: Partial<Pick<ActiveSession, "cardioTimerEnabled" | "cardioNotificationsEnabled" | "cardioStartedAt" | "cardioElapsedSeconds" | "cardioNotificationIds">>) => {
    setActiveSession((current) => current ? { ...current, ...patch } : current);
  }, []);

  const prepareWorkoutSummary = useCallback((cardioElapsedSeconds?: number) => {
    setActiveSession((current) => {
      if (!current) return current;
      const finishedAt = new Date().toISOString();
      const finishedSession = current.workoutKind === "cardio"
        ? {
          ...current,
          cardioElapsedSeconds: cardioElapsedSeconds ?? current.cardioElapsedSeconds,
          cardioStartedAt: null,
          cardioNotificationIds: [],
          exercises: current.exercises.map((exercise) => ({
            ...exercise,
            sets: exercise.sets.map((set) => ({ ...set, completed: true })),
          })),
        }
        : current;
      return {
        ...finishedSession,
        phase: "completed",
        finishedAt,
        durationSeconds: getSessionDurationSeconds(current.startedAt, finishedAt),
        restEndsAt: null,
        restStartedAt: null,
      };
    });
  }, []);

  const updateExerciseFeedback = useCallback((patch: Partial<Pick<SessionExercise, "painStatus" | "feedback">>) => {
    setActiveSession((current) => {
      if (!current) return current;
      return {
        ...current,
        exercises: current.exercises.map((exercise, index) =>
          index === current.currentExerciseIndex ? { ...exercise, ...patch } : exercise,
        ),
      };
    });
  }, []);

  const selectExerciseVariation = useCallback((variationId: string) => {
    setActiveSession((current) => {
      if (!current || current.phase !== "exercise" || current.currentSetIndex !== 0) return current;
      const exercises = current.exercises.map((exercise, index) => {
        if (index !== current.currentExerciseIndex) return exercise;
        const variation = exercise.variations.find((item) => item.id === variationId);
        if (!variation) return exercise;
        return {
          ...exercise,
          name: variation.name,
          rest: variation.rest,
          note: variation.note,
          selectedVariationId: variation.id,
          sets: Array.from({ length: variation.sets }, () => ({
            targetReps: variation.reps,
            targetLoad: variation.load,
            targetRir: variation.rir,
            reps: 0,
            load: 0,
            rir: 0,
            actualRestSeconds: 0,
            hasActualRestRecorded: false,
            hasRecorded: false,
            completed: false,
          })),
        };
      });
      return { ...current, exercises };
    });
  }, []);

  const saveAndPause = useCallback(async () => {
    if (studentId && activeSessionForUser) {
      await AsyncStorage.setItem(storageKeyFor(STORAGE_KEY, studentId), JSON.stringify(activeSessionForUser));
    }
  }, [activeSessionForUser, studentId]);

  const finishWorkout = useCallback(async (cardioElapsedSeconds?: number) => {
    let synced = true;
    const session = activeSessionForUser;
    if (studentId && session) {
      const historyKey = storageKeyFor(HISTORY_KEY, studentId);
      const pendingKey = storageKeyFor(PENDING_SUBMISSIONS_KEY, studentId);
      const finishedAt = session.finishedAt ?? new Date().toISOString();
      const finishedSession: ActiveSession = {
        ...session,
        cardioElapsedSeconds: cardioElapsedSeconds ?? session.cardioElapsedSeconds,
        cardioStartedAt: null,
        cardioNotificationIds: [],
        phase: "completed",
        finishedAt,
        durationSeconds: session.durationSeconds ?? getSessionDurationSeconds(session.startedAt, finishedAt),
      };
      const [savedHistory, savedSubmissions] = await Promise.all([
        AsyncStorage.getItem(historyKey),
        AsyncStorage.getItem(pendingKey),
      ]);
      const history = savedHistory ? JSON.parse(savedHistory) as ActiveSession[] : [];
      const submissions = savedSubmissions ? JSON.parse(savedSubmissions) as WorkoutSubmissionPayload[] : [];
      const payload = buildWorkoutSubmissionPayload(finishedSession);
      const nextSubmissions = submissions.some((item) => item.sessionId === payload.sessionId)
        ? submissions
        : [payload, ...submissions];
      const nextHistory = [
        finishedSession,
        ...history.filter((item) => `${item.workoutId}-${Date.parse(item.startedAt)}` !== payload.sessionId),
      ].slice(0, 30);
      await AsyncStorage.multiSet([
        [historyKey, JSON.stringify(nextHistory)],
        [pendingKey, JSON.stringify(nextSubmissions)],
      ]);
      try {
        await syncPendingWorkoutSubmissions(studentId, () => studentIdRef.current === studentId);
        synced = !(await getPendingWorkoutSubmissions(studentId)).some((item) => item.sessionId === payload.sessionId);
      } catch {
        synced = false;
      }
    }
    if (studentId) await AsyncStorage.removeItem(storageKeyFor(STORAGE_KEY, studentId));
    if (studentIdRef.current === studentId) {
      setActiveSession(null);
      setActiveSessionOwnerId(null);
    }
    return synced;
  }, [activeSessionForUser, studentId]);

  const syncPendingSubmissions = useCallback(() => {
    if (!studentId) return Promise.resolve(0);
    return syncPendingWorkoutSubmissions(studentId, () => studentIdRef.current === studentId);
  }, [studentId]);

  const value = useMemo(() => ({
    activeSession: activeSessionForUser,
    hydrated,
    completedSets,
    totalSets,
    isComplete,
    beginWorkout,
    updateCurrentSet,
    updateExerciseFeedback,
    selectExerciseVariation,
    beginRest,
    pauseRestStopwatch,
    resumeRestStopwatch,
    restartRestStopwatch,
    saveCurrentSetAndAdvance,
    prepareWorkoutSummary,
    updateCardioTimer,
    saveAndPause,
    finishWorkout,
    syncPendingSubmissions,
  }), [activeSessionForUser, hydrated, completedSets, totalSets, isComplete, beginWorkout, updateCurrentSet, updateExerciseFeedback, selectExerciseVariation, beginRest, pauseRestStopwatch, resumeRestStopwatch, restartRestStopwatch, saveCurrentSetAndAdvance, prepareWorkoutSummary, updateCardioTimer, saveAndPause, finishWorkout, syncPendingSubmissions]);

  return <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>;
}

export function useWorkout() {
  const context = useContext(WorkoutContext);
  if (!context) throw new Error("useWorkout precisa ser usado dentro de WorkoutProvider");
  return context;
}
