import type Serie from "./interfaceSeriesRIR";
import type { ResultadoExercicio } from "./resultadoExercicio";

export interface ExecucaoExercicio {
    exercicioId: string;

    nome: string;

    series: Serie[];

    resultado: {

        hardSets: number;

        intensidade: number;

        tonelagem: number;

        estimulo: number;

    }
}