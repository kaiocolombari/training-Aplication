import type { ExercisePlan, ExerciseVariationPlan, WorkoutPlan } from "@/data/workouts";
import { ApiError, apiGet, apiPatch, apiPost } from "./api";

type ApiWorkout = {
  id: string;
  alunoId: string;
  nome: string;
  criadoEm?: string | null;
};

type ApiExercise = {
  id: string;
  treinoId: string;
  exercicio: string;
  ordem?: number | null;
  series?: number | null;
  repeticoes?: number | null;
  intervalo?: number | null;
  carga?: number | null;
  rirMax?: number | null;
  observacoes?: string | null;
  variacoes?: Array<{
    id: string;
    exercicio: string;
    series?: number | null;
    repeticoes?: number | null;
    intervalo?: number | null;
    carga?: number | null;
    rirMax?: number | null;
    observacoes?: string | null;
  }>;
};

export type WorkoutExecution = {
  id: string;
  sessionId?: string | null;
  treinoId: string;
  data: string;
  inicio?: string | null;
  fim?: string | null;
  duracaoSegundos?: number | null;
  duracaoEsperadaMinutos?: number | null;
  tipoTreino?: "strength" | "cardio" | string;
  duracaoPlanejadaCardioSegundos?: number | null;
  duracaoRealCardioSegundos?: number | null;
  exercicios: Array<{
    id: string;
    treinoExercicioId?: string | null;
    nome: string;
    musculo?: string | null;
    ordem: number;
    variacaoId?: string | null;
    statusDor?: string | null;
    feedback?: string | null;
    hardSets: number;
    intensidade: number;
    tonelagem: number;
    estimulo: number;
    series: Array<{
      numero: number;
      carga: number;
      repeticoes: number;
      rir?: number | null;
      descanso?: number | null;
      descansoPrescrito?: number | null;
      concluida: boolean;
      usouPrescricao: boolean;
    }>;
  }>;
};

export type StudentEvaluation = {
  id: string;
  alunoId: string;
  numero: number;
  peso?: number | null;
  altura?: number | null;
  percentualGordura?: number | null;
  realizadaEm: string;
  objetivo?: string | null;
  observacoes?: string | null;
};

export type VolumeCycle = {
  id: string;
  treinoId: string;
  treinoNome: string;
  dataInicio: string;
  referenciaSeries: number;
  encerrado: boolean;
  exercicios: Array<{ exercicio: string; seriesPlanejadas: number }>;
  meses: Array<{
    mesCiclo: number;
    inicio: string;
    fim: string;
    series?: number | null;
    origem: string;
    diferencaReferencia?: number | null;
    variacaoReferenciaPercentual?: number | null;
    observacao?: string | null;
    podeRegistrar: boolean;
  }>;
};

export type StudentNotification = {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: string;
  referenciaId?: string | null;
  criadaEm: string;
  lidaEm?: string | null;
};

export type PersonalConversation = {
  alunoId: string;
  outroUsuarioId: string;
  outroUsuarioNome: string;
  outroUsuarioTipo: string;
  conversaId?: string | null;
  ultimaMensagem?: string | null;
  ultimaMensagemEm?: string | null;
  naoLidas: number;
};

export type StudentFeedback = {
  id: string;
  alunoId: string;
  alunoNome: string;
  personalId?: string | null;
  personalNome?: string | null;
  categoria: "ACOMPANHAMENTO" | "TREINAMENTO" | "SISTEMA" | "SUGESTAO" | string;
  nota: number;
  comentario: string;
  status: "NOVO" | "EM_ANALISE" | "RESPONDIDO" | "ARQUIVADO" | string;
  respostaEquipe?: string | null;
  criadoEm: string;
};

export type FeedbackPersonal = { personalId: string; nome: string };

export type StudentScheduleDay = {
  id: string;
  date: string;
  dayOfWeek: number;
  workouts: WorkoutPlan[];
};

export type StudentDashboardData = {
  workouts: WorkoutPlan[];
  schedule: StudentScheduleDay[];
  periodization: { name: string; currentWeek: number; totalWeeks: number } | null;
  evaluations: StudentEvaluation[];
  executions: WorkoutExecution[];
  volumeCycles: VolumeCycle[];
  notifications: StudentNotification[];
  personals: PersonalConversation[];
  feedbacks: StudentFeedback[];
  feedbackPersonals: FeedbackPersonal[];
};

type ApiPeriodization = { id: string; nome?: string | null; dataInicio: string };
type ApiWeek = { id: string; numero: number };
type ApiDay = { id: string; data: string; diaSemana: number };
type ApiDayWorkout = { treinoId: string; ordem: number };

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateFromKey(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function mapVariation(item: NonNullable<ApiExercise["variacoes"]>[number], base: ApiExercise): ExerciseVariationPlan {
  return {
    id: item.id,
    name: item.exercicio,
    sets: Math.max(0, item.series ?? base.series ?? 0),
    reps: (item.repeticoes ?? base.repeticoes) ? String(item.repeticoes ?? base.repeticoes) : "—",
    load: item.carga ?? base.carga ?? 0,
    rir: item.rirMax ?? base.rirMax ?? 0,
    rest: item.intervalo === null || item.intervalo === undefined
      ? base.intervalo === null || base.intervalo === undefined ? "—" : `${base.intervalo} s`
      : `${item.intervalo} s`,
    note: item.observacoes ?? base.observacoes ?? undefined,
  };
}

function mapExercise(item: ApiExercise): ExercisePlan {
  return {
    id: item.id,
    name: item.exercicio,
    muscle: "Grupo muscular não informado",
    sets: Math.max(0, item.series ?? 0),
    reps: item.repeticoes ? String(item.repeticoes) : "—",
    load: item.carga ?? 0,
    rir: item.rirMax ?? 0,
    rest: item.intervalo === null || item.intervalo === undefined ? "—" : `${item.intervalo} s`,
    note: item.observacoes ?? undefined,
    variations: (item.variacoes ?? []).map((variation) => mapVariation(variation, item)),
  };
}

function estimateWorkoutMinutes(exercises: ExercisePlan[]) {
  const seconds = exercises.reduce((total, exercise) => {
    const restSeconds = Number.parseInt(exercise.rest, 10) || 0;
    return total + exercise.sets * 45 + Math.max(0, exercise.sets - 1) * restSeconds;
  }, 0);
  return Math.max(1, Math.ceil(seconds / 60));
}

function mapWorkout(record: ApiWorkout, exercises: ExercisePlan[], day = "") : WorkoutPlan {
  return {
    id: record.id,
    name: record.nome,
    kind: "strength",
    subtitle: "Prescrição do seu personal",
    day,
    duration: estimateWorkoutMinutes(exercises),
    focus: exercises.slice(0, 3).map((item) => item.name).join(" · ") || "Treino sem exercícios cadastrados",
    exercises,
  };
}

async function optionalGet<T>(endpoint: string, fallback: T): Promise<T> {
  try {
    return await apiGet<T>(endpoint);
  } catch (cause) {
    // Only a missing optional route may fall back; auth and server failures must stay visible.
    if (cause instanceof ApiError && cause.status === 404) return fallback;
    throw cause;
  }
}

export const studentService = {
  async getDashboard(alunoId: string): Promise<StudentDashboardData> {
    const workoutRecords = await apiGet<ApiWorkout[]>("/api/treinos");
    const workoutDetails = await Promise.all(workoutRecords.map(async (record) => {
      const [exerciseRecords, executions] = await Promise.all([
        apiGet<ApiExercise[]>(`/api/treinos/${record.id}/exercicios`),
        optionalGet<WorkoutExecution[]>(`/api/treinos/${record.id}/execucoes`, []),
      ]);
      const exercises = [...exerciseRecords].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0)).map(mapExercise);
      return { record, plan: mapWorkout(record, exercises), executions };
    }));

    const [periodizations, evaluations, volumeCycles, notifications, personals, feedbacks, feedbackPersonals] = await Promise.all([
      optionalGet<ApiPeriodization[]>(`/api/alunos/${alunoId}/periodizacoes`, []),
      optionalGet<StudentEvaluation[]>(`/api/alunos/${alunoId}/avaliacoes`, []),
      optionalGet<VolumeCycle[]>(`/api/alunos/${alunoId}/volume-ciclos`, []),
      optionalGet<StudentNotification[]>("/api/comunicacao/notificacoes", []),
      optionalGet<PersonalConversation[]>("/api/comunicacao/conversas/personais", []),
      optionalGet<StudentFeedback[]>("/api/feedback/meus", []),
      optionalGet<FeedbackPersonal[]>("/api/feedback/personais", []),
    ]);

    const selectedPeriodization = [...periodizations].sort((a, b) =>
      dateFromKey(b.dataInicio).getTime() - dateFromKey(a.dataInicio).getTime(),
    )[0];
    let periodization: StudentDashboardData["periodization"] = null;
    let schedule: StudentScheduleDay[] = [];

    if (selectedPeriodization) {
      const weeks = await optionalGet<ApiWeek[]>(`/api/periodizacoes/${selectedPeriodization.id}/semanas`, []);
      const start = dateFromKey(selectedPeriodization.dataInicio);
      const currentWeekNumber = Math.max(1, Math.floor((dateFromKey(localDateKey(new Date())).getTime() - start.getTime()) / (7 * 86400000)) + 1);
      const selectedWeek = weeks.find((week) => week.numero === currentWeekNumber)
        ?? [...weeks].sort((a, b) => Math.abs(a.numero - currentWeekNumber) - Math.abs(b.numero - currentWeekNumber))[0];

      periodization = {
        name: selectedPeriodization.nome?.trim() || "Periodização atual",
        currentWeek: selectedWeek?.numero ?? currentWeekNumber,
        totalWeeks: weeks.length,
      };

      if (selectedWeek) {
        const days = await optionalGet<ApiDay[]>(`/api/periodizacao-semanas/${selectedWeek.id}/dias`, []);
        const planById = new Map(workoutDetails.map(({ record, plan }) => [record.id, plan]));
        schedule = await Promise.all(days.map(async (day) => {
          const links = await optionalGet<ApiDayWorkout[]>(`/api/periodizacao-dias/${day.id}/treinos`, []);
          const workouts = [...links]
            .sort((a, b) => a.ordem - b.ordem)
            .map((link) => planById.get(link.treinoId))
            .filter((plan): plan is WorkoutPlan => Boolean(plan));
          return { id: day.id, date: day.data.slice(0, 10), dayOfWeek: day.diaSemana, workouts };
        }));
        schedule.sort((a, b) => a.date.localeCompare(b.date));
      }
    }

    const workouts = workoutDetails.map(({ record, plan }) => {
      const scheduledDay = schedule.find((day) => day.workouts.some((item) => item.id === record.id));
      return { ...plan, day: scheduledDay ? dayLabel(scheduledDay.date) : "" };
    });
    const executions = workoutDetails.flatMap(({ executions: history }) => history);

    return {
      workouts,
      schedule: schedule.map((day) => ({
        ...day,
        workouts: day.workouts.map((scheduled) => workouts.find((item) => item.id === scheduled.id) ?? scheduled),
      })),
      periodization,
      evaluations: [...evaluations].sort((a, b) => a.realizadaEm.localeCompare(b.realizadaEm)),
      executions: [...executions].sort((a, b) =>
        a.data.localeCompare(b.data) || (a.fim ?? a.inicio ?? "").localeCompare(b.fim ?? b.inicio ?? ""),
      ),
      volumeCycles,
      notifications: [...notifications].sort((a, b) => b.criadaEm.localeCompare(a.criadaEm)),
      personals,
      feedbacks: [...feedbacks].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)),
      feedbackPersonals,
    };
  },

  listPersonalConversations: () => optionalGet<PersonalConversation[]>("/api/comunicacao/conversas/personais", []),
  listChatNotifications: () => optionalGet<StudentNotification[]>("/api/comunicacao/notificacoes", []),

  markNotificationRead: (id: string) =>
    apiPatch<void>(`/api/comunicacao/notificacoes/${id}/lida`),

  markAllNotificationsRead: () =>
    apiPost<void>("/api/comunicacao/notificacoes/lidas"),

  registerVolumeMonth: (cycleId: string, mesCiclo: number, seriesInformadas: number, observacao: string) =>
    apiPost<VolumeCycle>(`/api/volume-ciclos/${cycleId}/registros`, { mesCiclo, seriesInformadas, observacao: observacao.trim() || null }),

  createFeedback: (payload: { personalId: string | null; categoria: StudentFeedback["categoria"]; nota: number; comentario: string }) =>
    apiPost<StudentFeedback>("/api/feedback", payload),
};

function dayLabel(date: string) {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short" })
    .format(dateFromKey(date)).replace(".", "").toUpperCase();
}
