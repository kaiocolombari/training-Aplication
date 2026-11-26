import { apiGet, apiPatch } from "./api";

export interface AlunoAcompanhamento {
    alunoId: string;
    nomeCompleto: string;
    email: string;
    possuiFichaTecnica: boolean;
    treinosAtivos: number;
    sessoesNosUltimos7Dias: number;
    enviosAguardandoRevisao: number;
    alertasDeDor: number;
    ultimaExecucaoEm?: string | null;
}

export interface ExecucaoRecebida {
    id: string;
    alunoId: string;
    nomeAluno: string;
    treinoId: string;
    nomeTreino: string;
    data: string;
    inicio?: string | null;
    fim?: string | null;
    duracaoSegundos?: number | null;
    tipoTreino: string;
    seriesConcluidas: number;
    seriesTotais: number;
    adesaoPercentual: number | null;
    tonelagem: number | null;
    relatosDor: number;
    alertas: string[];
    feedbacks: string[];
    revisadaEm?: string | null;
    aguardandoRevisao: boolean;
}

export interface PendenciaAcompanhamento {
    tipo: string;
    titulo: string;
    descricao: string;
    prioridade: string;
    alunoId?: string | null;
    nomeAluno?: string | null;
    referenciaId?: string | null;
    criadaEm: string;
    dataLimite?: string | null;
}

export interface AcompanhamentoPersonal {
    geradoEm: string;
    alunosAtivos: number;
    sessoesNosUltimos7Dias: number;
    enviosAguardandoRevisao: number;
    alertasDeDor: number;
    solicitacoesAvaliacaoPendentes: number;
    feedbacksNovos: number;
    tarefasAtrasadas: number;
    alunos: AlunoAcompanhamento[];
    execucoesRecentes: ExecucaoRecebida[];
    pendencias: PendenciaAcompanhamento[];
}

export const acompanhamentoPersonalService = {
    obterPainel: () => apiGet<AcompanhamentoPersonal>("/api/personal/acompanhamento"),
    revisarExecucao: (id: string, revisada = true) =>
        apiPatch<void>(`/api/personal/acompanhamento/execucoes/${id}/revisao`, { revisada }),
};
