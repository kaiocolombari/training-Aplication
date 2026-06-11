import type { ExercicioTreino } from "./interfaceExercicio";

export interface Treino {
    id: string;
    nome: string;
    exercicios: ExercicioTreino[];
}