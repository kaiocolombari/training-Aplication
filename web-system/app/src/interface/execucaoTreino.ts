import type { ExecucaoExercicio } from "./execucaoExercicio";

export interface ExecucaoTreino {
    treinoId: string;

    data: string;

    exercicios: ExecucaoExercicio[];
}