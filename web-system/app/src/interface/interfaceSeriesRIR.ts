export default interface Serie {
    numero: number;

    carga: number;

    repeticoes: number;

    rir: number;

    descanso: number;

    velocidade?: number;

    rpe?: number;

    cluster?: {
        ativo: boolean;
        blocos: number[];
    };

    dropSet?: boolean;

    restPause?: boolean;

    falha?: boolean;
}