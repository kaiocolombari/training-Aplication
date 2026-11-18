import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import type { WorkoutPlan } from "@/data/workouts";

const STORAGE_KEY = "@treino-system/active-session";
const HISTORY_KEY = "@treino-system/session-history";

export type SessionSet = {
  targetReps: string;
  targetLoad: number;
  targetRir: number;
  reps: number;
  load: number;
  rir: number;
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
  currentExerciseIndex: number;
  currentSetIndex: number;
  phase: "exercise" | "rest" | "cardio" | "completed";
  restEndsAt: string | null;
  restDurationSeconds: number;
  cardioDurationSeconds: number;
  cardioTimerEnabled: boolean;
  cardioNotificationsEnabled: boolean;
  cardioStartedAt: string | null;
  cardioElapsedSeconds: number;
  cardioNotificationIds: string[];
  exercises: SessionExercise[];
};

type WorkoutContextValue = {
  activeSession: ActiveSession | null;
  hydrated: boolean;
  completedSets: number;
  totalSets: number;
  isComplete: boolean;
  beginWorkout: (workout: WorkoutPlan) => void;
  updateCurrentSet: (patch: Partial<Pick<SessionSet, "reps" | "load" | "rir">>) => void;
  updateExerciseFeedback: (patch: Partial<Pick<SessionExercise, "painStatus" | "feedback">>) => void;
  beginRest: () => void;
  saveCurrentSetAndAdvance: (usePrescription?: boolean) => void;
  updateCardioTimer: (patch: Partial<Pick<ActiveSession, "cardioTimerEnabled" | "cardioNotificationsEnabled" | "cardioStartedAt" | "cardioElapsedSeconds" | "cardioNotificationIds">>) => void;
  saveAndPause: () => Promise<void>;
  finishWorkout: () => Promise<void>;
};

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
          setActiveSession({
            ...saved,
            workoutKind: saved.workoutKind ?? "strength",
            phase: saved.phase ?? "exercise",
            restEndsAt: saved.restEndsAt ?? null,
            restDurationSeconds: saved.restDurationSeconds ?? 0,
            cardioDurationSeconds: saved.cardioDurationSeconds ?? 0,
            cardioTimerEnabled: saved.cardioTimerEnabled ?? false,
            cardioNotificationsEnabled: saved.cardioNotificationsEnabled ?? true,
            cardioStartedAt: saved.cardioStartedAt ?? null,
            cardioElapsedSeconds: saved.cardioElapsedSeconds ?? 0,
            cardioNotificationIds: saved.cardioNotificationIds ?? [],
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
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      phase: workout.kind === "cardio" ? "cardio" : "exercise",
      restEndsAt: null,
      restDurationSeconds: 0,
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
          reps: Number.parseInt(exercise.reps, 10) || 10,
          load: exercise.load,
          rir: exercise.rir,
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

  const updateCurrentSet = useCallback((patch: Partial<Pick<SessionSet, "reps" | "load" | "rir">>) => {
    setActiveSession((current) => {
      if (!current) return current;
      const exercises = current.exercises.map((exercise, exerciseIndex) => {
        if (exerciseIndex !== current.currentExerciseIndex) return exercise;
        return {
          ...exercise,
          sets: exercise.sets.map((set, setIndex) =>
            setIndex === current.currentSetIndex ? { ...set, ...patch } : set,
          ),
        };
      });
      return { ...current, exercises };
    });
  }, []);

  const beginRest = useCallback(() => {
    if (!activeSession || activeSession.phase !== "exercise") return;
    const exercise = activeSession.exercises[activeSession.currentExerciseIndex];
    if (!exercise) return;
    const match = exercise.rest.match(/(\d+(?:[.,]\d+)?)\s*(min|m|s|seg)?/i);
    const amount = match ? Number(match[1].replace(",", ".")) : 60;
    const unit = match?.[2]?.toLowerCase();
    const restDurationSeconds = unit === "min" || unit === "m" ? amount * 60 : amount;
    setActiveSession((current) => current ? {
      ...current,
      phase: "rest",
      restDurationSeconds,
      restEndsAt: new Date(Date.now() + restDurationSeconds * 1000).toISOString(),
    } : current);
  }, [activeSession]);

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
              reps: usePrescription ? Number.parseInt(set.targetReps, 10) || set.reps : set.reps,
              load: usePrescription ? set.targetLoad : set.load,
              rir: usePrescription ? set.targetRir : set.rir,
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
        return { ...current, exercises, phase: "completed", restEndsAt: null };
      }
      return {
        ...current,
        exercises,
        currentExerciseIndex: nextExerciseIndex,
        currentSetIndex: nextSetIndex,
        phase: "exercise",
        restEndsAt: null,
        restDurationSeconds: 0,
      };
    });
  }, []);

  const updateCardioTimer = useCallback((patch: Partial<Pick<ActiveSession, "cardioTimerEnabled" | "cardioNotificationsEnabled" | "cardioStartedAt" | "cardioElapsedSeconds" | "cardioNotificationIds">>) => {
    setActiveSession((current) => current ? { ...current, ...patch } : current);
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

  const finishWorkout = useCallback(async () => {
    if (activeSession) {
      const savedHistory = await AsyncStorage.getItem(HISTORY_KEY);
      const history = savedHistory ? JSON.parse(savedHistory) as Array<ActiveSession & { finishedAt: string }> : [];
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify([
        { ...activeSession, finishedAt: new Date().toISOString() },
        ...history,
      ].slice(0, 30)));
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
    saveCurrentSetAndAdvance,
    updateCardioTimer,
    saveAndPause,
    finishWorkout,
  }), [activeSession, hydrated, completedSets, totalSets, isComplete, beginWorkout, updateCurrentSet, updateExerciseFeedback, beginRest, saveCurrentSetAndAdvance, updateCardioTimer, saveAndPause, finishWorkout]);

  return <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>;
}

export function useWorkout() {
  const context = useContext(WorkoutContext);
  if (!context) throw new Error("useWorkout precisa ser usado dentro de WorkoutProvider");
  return context;
}
