import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { WORKOUTS, type WorkoutPlan } from "@/data/workouts";

const STORAGE_KEY = "@treino-system/active-session";
const HISTORY_KEY = "@treino-system/session-history";
const PENDING_SUBMISSIONS_KEY = "@treino-system/pending-workout-submissions";

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
  hasRecorded: boolean;
  completed: boolean;
};

export type SessionExercise = {
  id: string;
  name: string;
  muscle: string;
  rest: string;
  note?: string;
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
  beginRest: () => void;
  pauseRestStopwatch: (elapsedSeconds: number) => void;
  resumeRestStopwatch: () => void;
  restartRestStopwatch: () => void;
  saveCurrentSetAndAdvance: (usePrescription?: boolean) => void;
  prepareWorkoutSummary: (cardioElapsedSeconds?: number) => void;
  updateCardioTimer: (patch: Partial<Pick<ActiveSession, "cardioTimerEnabled" | "cardioNotificationsEnabled" | "cardioStartedAt" | "cardioElapsedSeconds" | "cardioNotificationIds">>) => void;
  saveAndPause: () => Promise<void>;
  finishWorkout: (cardioElapsedSeconds?: number) => Promise<void>;
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
          reps: session.workoutKind === "strength" && (set.completed || set.hasRecorded) ? set.reps : null,
          load: session.workoutKind === "strength" && (set.completed || set.hasRecorded) ? set.load : null,
          rir: session.workoutKind === "strength" && (set.completed || set.hasRecorded) ? set.rir : null,
          restSeconds: set.actualRestSeconds > 0 ? set.actualRestSeconds : null,
          usedPrescription: session.workoutKind === "strength" && set.completed && !set.hasRecorded,
        },
      })),
    })),
    cardio: session.workoutKind === "cardio" ? {
      plannedDurationSeconds: session.cardioDurationSeconds,
      activityDurationSeconds: session.cardioElapsedSeconds > 0 ? session.cardioElapsedSeconds : null,
    } : null,
  };
}

export async function getPendingWorkoutSubmissions(): Promise<WorkoutSubmissionPayload[]> {
  const saved = await AsyncStorage.getItem(PENDING_SUBMISSIONS_KEY);
  return saved ? JSON.parse(saved) as WorkoutSubmissionPayload[] : [];
}

export async function removePendingWorkoutSubmission(sessionId: string) {
  const pending = await getPendingWorkoutSubmissions();
  await AsyncStorage.setItem(
    PENDING_SUBMISSIONS_KEY,
    JSON.stringify(pending.filter((item) => item.sessionId !== sessionId)),
  );
}

export async function flushPendingWorkoutSubmissions(
  sendBatch: (payload: WorkoutSubmissionPayload) => Promise<unknown>,
) {
  const pending = await getPendingWorkoutSubmissions();
  let sentCount = 0;

  for (const payload of pending) {
    await sendBatch(payload);
    await removePendingWorkoutSubmission(payload.sessionId);
    sentCount += 1;
  }

  return sentCount;
}

const WorkoutContext = createContext<WorkoutContextValue | null>(null);

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
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
              sets: exercise.sets.map((set) => ({
                ...set,
                actualRestSeconds: set.actualRestSeconds ?? 0,
                hasRecorded: set.hasRecorded ?? (
                  set.load !== set.targetLoad
                  || set.reps !== (Number.parseInt(set.targetReps, 10) || 10)
                  || set.rir !== set.targetRir
                ),
              })),
            })),
          } as ActiveSession);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (mounted) setHydrated(true);
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (activeSession) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(activeSession)).catch(() => undefined);
    } else {
      AsyncStorage.removeItem(STORAGE_KEY).catch(() => undefined);
    }
  }, [activeSession, hydrated]);

  const beginWorkout = useCallback((workout: WorkoutPlan) => {
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
          hasRecorded: false,
          completed: false,
        })),
      })),
    });
  }, []);

  const completedSets = activeSession?.exercises.reduce(
    (sum, exercise) => sum + exercise.sets.filter((set) => set.completed).length,
    0,
  ) ?? 0;
  const totalSets = activeSession?.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0) ?? 0;
  const isComplete = totalSets > 0 && completedSets === totalSets;

  const updateCurrentSet = useCallback((patch: Partial<Pick<SessionSet, "reps" | "load" | "rir" | "actualRestSeconds">>) => {
    setActiveSession((current) => {
      if (!current) return current;
      const exercises = current.exercises.map((exercise, exerciseIndex) => {
        if (exerciseIndex !== current.currentExerciseIndex) return exercise;
        return {
          ...exercise,
          sets: exercise.sets.map((set, setIndex) => {
            if (setIndex !== current.currentSetIndex) return set;
            const recordsPerformance = "load" in patch || "reps" in patch || "rir" in patch;
            const firstPerformanceEdit = recordsPerformance && !set.hasRecorded;
            return {
              ...set,
              ...(firstPerformanceEdit ? {
                reps: Number.parseInt(set.targetReps, 10) || set.reps,
                load: set.targetLoad,
                rir: set.targetRir,
              } : {}),
              ...patch,
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

  const saveAndPause = useCallback(async () => {
    if (activeSession) await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(activeSession));
  }, [activeSession]);

  const finishWorkout = useCallback(async (cardioElapsedSeconds?: number) => {
    if (activeSession) {
      const finishedAt = activeSession.finishedAt ?? new Date().toISOString();
      const finishedSession: ActiveSession = {
        ...activeSession,
        cardioElapsedSeconds: cardioElapsedSeconds ?? activeSession.cardioElapsedSeconds,
        cardioStartedAt: null,
        cardioNotificationIds: [],
        phase: "completed",
        finishedAt,
        durationSeconds: activeSession.durationSeconds ?? getSessionDurationSeconds(activeSession.startedAt, finishedAt),
      };
      const [savedHistory, savedSubmissions] = await Promise.all([
        AsyncStorage.getItem(HISTORY_KEY),
        AsyncStorage.getItem(PENDING_SUBMISSIONS_KEY),
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
        [HISTORY_KEY, JSON.stringify(nextHistory)],
        [PENDING_SUBMISSIONS_KEY, JSON.stringify(nextSubmissions)],
      ]);
    }
    await AsyncStorage.removeItem(STORAGE_KEY);
    setActiveSession(null);
  }, [activeSession]);

  const value = useMemo(() => ({
    activeSession,
    hydrated,
    completedSets,
    totalSets,
    isComplete,
    beginWorkout,
    updateCurrentSet,
    updateExerciseFeedback,
    beginRest,
    pauseRestStopwatch,
    resumeRestStopwatch,
    restartRestStopwatch,
    saveCurrentSetAndAdvance,
    prepareWorkoutSummary,
    updateCardioTimer,
    saveAndPause,
    finishWorkout,
  }), [activeSession, hydrated, completedSets, totalSets, isComplete, beginWorkout, updateCurrentSet, updateExerciseFeedback, beginRest, pauseRestStopwatch, resumeRestStopwatch, restartRestStopwatch, saveCurrentSetAndAdvance, prepareWorkoutSummary, updateCardioTimer, saveAndPause, finishWorkout]);

  return <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>;
}

export function useWorkout() {
  const context = useContext(WorkoutContext);
  if (!context) throw new Error("useWorkout precisa ser usado dentro de WorkoutProvider");
  return context;
}
