import { apiPut } from "./api";
import type { WorkoutSubmissionPayload } from "@/context/WorkoutContext";

type SaveExecutionPayload = {
  sessionId: string;
  data: string;
  inicio: string;
  fim: string;
  duracaoSegundos: number;
  duracaoEsperadaMinutos: number;
  tipoTreino: "strength" | "cardio";
  duracaoPlanejadaCardioSegundos: number | null;
  duracaoRealCardioSegundos: number | null;
  exercicios: Array<{
    treinoExercicioId: string;
    nome: string;
    musculo: string | null;
    ordem: number;
    variacaoId: string | null;
    statusDor: "none" | "discomfort" | "pain";
    feedback: string | null;
    series: Array<{
      numero: number;
      carga: number;
      repeticoes: number;
      rir: number | null;
      descanso: number | null;
      descansoPrescrito: number;
      concluida: boolean;
      usouPrescricao: boolean;
    }>;
  }>;
};

function localDateFromIso(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export async function submitWorkoutSession(payload: WorkoutSubmissionPayload) {
  const request: SaveExecutionPayload = {
    sessionId: payload.sessionId,
    data: localDateFromIso(payload.finishedAt),
    inicio: payload.startedAt,
    fim: payload.finishedAt,
    duracaoSegundos: payload.durationSeconds,
    duracaoEsperadaMinutos: payload.expectedDurationMinutes,
    tipoTreino: payload.workoutKind,
    duracaoPlanejadaCardioSegundos: payload.cardio?.plannedDurationSeconds ?? null,
    duracaoRealCardioSegundos: payload.cardio?.activityDurationSeconds ?? null,
    exercicios: payload.exercises.map((exercise, order) => ({
      treinoExercicioId: exercise.exerciseId,
      nome: exercise.name,
      musculo: exercise.muscle === "Grupo muscular não informado" ? null : exercise.muscle,
      ordem: order,
      variacaoId: exercise.variationId,
      statusDor: exercise.painStatus,
      feedback: exercise.feedback.trim() || null,
      series: exercise.sets.map((set) => ({
        numero: set.setNumber,
        carga: set.performed.load ?? 0,
        repeticoes: set.performed.reps ?? 0,
        rir: set.performed.rir ?? (set.performed.usedPrescription ? set.prescribed.rir : null),
        descanso: set.performed.restSeconds,
        descansoPrescrito: set.prescribed.restSeconds,
        concluida: set.completed,
        usouPrescricao: set.performed.usedPrescription,
      })),
    })),
  };

  return apiPut(`/api/treinos/${payload.workoutId}/execucoes/atual`, request);
}
