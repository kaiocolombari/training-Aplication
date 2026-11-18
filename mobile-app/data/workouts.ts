export type ExercisePlan = {
  id: string;
  name: string;
  muscle: string;
  sets: number;
  reps: string;
  load: number;
  rir: number;
  rest: string;
  note?: string;
};

export type WorkoutPlan = {
  id: string;
  name: string;
  kind: "strength" | "cardio";
  subtitle: string;
  day: string;
  duration: number;
  focus: string;
  cardioDurationSeconds?: number;
  exercises: ExercisePlan[];
};

export const PERIODIZATION_PLAN = {
  objectiveGeneral: "Hipertrofia",
  currentWeek: 4,
  totalWeeks: 8,
};

export const WORKOUTS: WorkoutPlan[] = [
  {
    id: "superior-a",
    name: "Superior A",
    kind: "strength",
    subtitle: "Força e construção de volume",
    day: "TER",
    duration: 55,
    focus: "Peito · Costas · Ombros",
    exercises: [
      { id: "supino-reto", name: "Supino reto com barra", muscle: "Peito", sets: 4, reps: "8–10", load: 40, rir: 2, rest: "90 s", note: "Controle a descida e mantenha os pés firmes no chão." },
      { id: "remada-curvada", name: "Remada curvada", muscle: "Costas", sets: 3, reps: "10–12", load: 32, rir: 2, rest: "90 s" },
      { id: "supino-inclinado", name: "Supino inclinado com halteres", muscle: "Peito", sets: 3, reps: "10–12", load: 16, rir: 2, rest: "75 s" },
      { id: "puxada-frontal", name: "Puxada frontal", muscle: "Costas", sets: 3, reps: "10–12", load: 45, rir: 1, rest: "75 s" },
      { id: "elevacao-lateral", name: "Elevação lateral", muscle: "Ombros", sets: 3, reps: "12–15", load: 8, rir: 1, rest: "60 s" },
      { id: "triceps-corda", name: "Tríceps na corda", muscle: "Tríceps", sets: 2, reps: "12–15", load: 22, rir: 1, rest: "60 s" },
    ],
  },
  {
    id: "inferior-b",
    name: "Inferior B",
    kind: "strength",
    subtitle: "Estabilidade e força de pernas",
    day: "QUI",
    duration: 60,
    focus: "Quadríceps · Posterior · Glúteos",
    exercises: [
      { id: "agachamento", name: "Agachamento livre", muscle: "Quadríceps", sets: 4, reps: "8–10", load: 50, rir: 2, rest: "120 s" },
      { id: "terra-romeno", name: "Levantamento terra romeno", muscle: "Posterior", sets: 3, reps: "10–12", load: 40, rir: 2, rest: "90 s" },
      { id: "leg-press", name: "Leg press 45°", muscle: "Quadríceps", sets: 3, reps: "12–15", load: 120, rir: 1, rest: "90 s" },
      { id: "mesa-flexora", name: "Mesa flexora", muscle: "Posterior", sets: 3, reps: "12–15", load: 30, rir: 1, rest: "60 s" },
    ],
  },
  {
    id: "full-body-c",
    name: "Full body C",
    kind: "strength",
    subtitle: "Sessão complementar da semana",
    day: "SÁB",
    duration: 45,
    focus: "Corpo inteiro",
    exercises: [
      { id: "desenvolvimento", name: "Desenvolvimento com halteres", muscle: "Ombros", sets: 3, reps: "10–12", load: 14, rir: 2, rest: "75 s" },
      { id: "remada-baixa", name: "Remada baixa", muscle: "Costas", sets: 3, reps: "10–12", load: 40, rir: 2, rest: "75 s" },
      { id: "cadeira-extensora", name: "Cadeira extensora", muscle: "Quadríceps", sets: 3, reps: "12–15", load: 25, rir: 1, rest: "60 s" },
    ],
  },
  {
    id: "cardio-caminhada",
    name: "Caminhada moderada",
    kind: "cardio",
    subtitle: "Condicionamento cardiovascular",
    day: "DOM",
    duration: 30,
    cardioDurationSeconds: 30 * 60,
    focus: "Cardio · Ritmo contínuo",
    exercises: [
      { id: "caminhada", name: "Caminhada moderada", muscle: "Cardiorrespiratório", sets: 1, reps: "30 min", load: 0, rir: 0, rest: "0 s" },
    ],
  },
];

export const TODAY_WORKOUT = WORKOUTS[0];
