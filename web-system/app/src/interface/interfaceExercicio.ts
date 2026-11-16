export interface ExercicioTreino {
    id: string;
    exercicio: string;
    series: string;
    repeticoes: string;
    intervalo: string;
    carga: string;
    rirMax: string;
    observacoes: string;
    variacoes: ExercicioTreino[];
    seriesIntensidade?: SerieIntensidade[];
}

export interface SerieIntensidade {
    reps?: string;
    carga?: string;
    rir?: string;
    descanso?: number;
    velocidade?: number;
    rpe?: number;
    cluster?: { ativo: boolean; blocos: number[] };
    dropSet?: boolean;
    restPause?: boolean;
    falha?: boolean;
}
