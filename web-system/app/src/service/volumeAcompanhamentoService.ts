import { apiGet, apiPost } from "./api";

export interface VolumeMesAcompanhamento {
    mesCiclo: number;
    inicio: string;
    fim: string;
    series: number | null;
    origem: "REFERENCIA" | "REGISTRO" | "SEM_REGISTRO";
    diferencaReferencia: number | null;
    variacaoReferenciaPercentual: number | null;
    classificacaoReferencia: "REFERENCIA" | "EVOLUCAO" | "MANUTENCAO" | "QUEDA" | null;
    diferencaMesAnterior: number | null;
    variacaoMesAnteriorPercentual: number | null;
    classificacaoMesAnterior: "EVOLUCAO" | "MANUTENCAO" | "QUEDA" | null;
    registradoEm: string | null;
    observacao: string | null;
    podeRegistrar: boolean;
}

export interface VolumeCicloAcompanhamento {
    id: string;
    treinoId: string;
    treinoNome: string;
    dataInicio: string;
    referenciaSeries: number;
    criadoEm: string;
    encerradoEm: string | null;
    encerrado: boolean;
    exercicios: Array<{ exercicio: string; seriesPlanejadas: number }>;
    meses: VolumeMesAcompanhamento[];
}

export interface IniciarCicloVolumePayload {
    treinoId: string;
    dataInicio: string;
}

export interface RegistrarVolumeMensalPayload {
    mesCiclo: number;
    seriesInformadas: number;
    observacao?: string;
}

export const volumeAcompanhamentoService = {
    listar: (alunoId: string) =>
        apiGet<VolumeCicloAcompanhamento[]>(`/api/alunos/${alunoId}/volume-ciclos`),
    iniciar: (alunoId: string, payload: IniciarCicloVolumePayload) =>
        apiPost<VolumeCicloAcompanhamento>(`/api/alunos/${alunoId}/volume-ciclos`, payload),
    registrar: (cicloId: string, payload: RegistrarVolumeMensalPayload) =>
        apiPost<VolumeCicloAcompanhamento>(`/api/volume-ciclos/${cicloId}/registros`, payload),
};
