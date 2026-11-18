import { apiGet, apiPatch, apiPost, apiPut } from "./api";

export interface FeedbackAluno {
    id: string;
    alunoId: string;
    alunoNome: string;
    personalId?: string | null;
    personalNome?: string | null;
    categoria: string;
    nota: number;
    comentario: string;
    status: string;
    respostaEquipe?: string | null;
    criadoEm: string;
}

export interface TarefaPersonal {
    id: string;
    personalId: string;
    personalNome: string;
    alunoId?: string | null;
    alunoNome?: string | null;
    criadoPor: string;
    criadoPorTipo: string;
    titulo: string;
    descricao: string;
    dicaContexto?: string | null;
    categoria: string;
    prioridade: string;
    status: string;
    dataLimite?: string | null;
    criadaEm: string;
    concluidaEm?: string | null;
}

export interface ConfiguracaoAcompanhamento {
    personalId?: string | null;
    intervaloReavaliacaoDias: number;
    intervaloRevisaoTreinoDias: number;
    antecedenciaSugestaoDias: number;
    controleAvancadoHabilitado: boolean;
    atualizadaEm?: string | null;
}

export interface IndicadoresPersonal {
    personalId: string;
    nome: string;
    alunosAtivos: number;
    treinosAtivos: number;
    avaliacoesNoPeriodo: number;
    tarefasAbertas: number;
    tarefasConcluidas: number;
    notaMediaFeedback?: number | null;
    feedbacksRecebidos: number;
    acoesRegistradas: number;
}

export interface IndicadoresEquipe {
    inicio: string;
    fim: string;
    personais: IndicadoresPersonal[];
}

export interface VerificacaoSistema {
    nome: string;
    status: "OK" | "AVISO" | "ERRO";
    detalhe: string;
    duracaoMs?: number | null;
}

export interface SaudeSistema {
    statusGeral: string;
    verificadoEm: string;
    uptimeSegundos: number;
    verificacoes: VerificacaoSistema[];
}

export interface RegistroManutencao {
    id: string;
    criadoPorUsuarioId: string;
    criadoPor: string;
    responsavelUsuarioId?: string | null;
    responsavel?: string | null;
    titulo: string;
    descricao: string;
    categoria: string;
    prioridade: string;
    status: string;
    resolucao?: string | null;
    criadoEm: string;
    atualizadoEm: string;
    resolvidoEm?: string | null;
}

export const adminExtrasService = {
    listarFeedback: () => apiGet<FeedbackAluno[]>("/api/feedback"),
    meusFeedbacks: () => apiGet<FeedbackAluno[]>("/api/feedback/meus"),
    personaisDoAluno: () => apiGet<Array<{ personalId: string; nome: string }>>("/api/feedback/personais"),
    criarFeedback: (payload: { personalId?: string; categoria: string; nota: number; comentario: string }) => apiPost<FeedbackAluno>("/api/feedback", payload),
    atualizarFeedback: (id: string, payload: { status: string; respostaEquipe?: string }) => apiPatch<void>(`/api/feedback/${id}`, payload),
    listarTarefas: (personalId?: string) => apiGet<TarefaPersonal[]>(`/api/tarefas${personalId ? `?personalId=${encodeURIComponent(personalId)}` : ""}`),
    criarTarefa: (payload: { personalId?: string; alunoId?: string; titulo: string; descricao: string; dicaContexto?: string; categoria: string; prioridade: string; dataLimite?: string }) => apiPost<TarefaPersonal>("/api/tarefas", payload),
    atualizarTarefa: (id: string, payload: { titulo: string; descricao: string; dicaContexto?: string; categoria: string; prioridade: string; status: string; dataLimite?: string | null }) => apiPut<TarefaPersonal>(`/api/tarefas/${id}`, payload),
    obterConfiguracao: (personalId?: string) => apiGet<ConfiguracaoAcompanhamento>(`/api/tarefas/configuracao${personalId ? `?personalId=${encodeURIComponent(personalId)}` : ""}`),
    salvarConfiguracao: (payload: ConfiguracaoAcompanhamento) => apiPut<ConfiguracaoAcompanhamento>("/api/tarefas/configuracao", payload),
    personais: () => apiGet<Array<{ id: string; nome: string; email: string }>>("/api/tarefas/personais"),
    alunosDoPersonal: (personalId?: string) => apiGet<Array<{ alunoId: string; nome: string }>>(`/api/tarefas/alunos${personalId ? `?personalId=${encodeURIComponent(personalId)}` : ""}`),
    indicadoresEquipe: (inicio: string, fim: string) => apiGet<IndicadoresEquipe>(`/api/indicadores-equipe?inicio=${inicio}&fim=${fim}`),
    saudeSistema: () => apiGet<SaudeSistema>("/api/admin/saude"),
    listarManutencao: () => apiGet<RegistroManutencao[]>("/api/manutencao"),
    criarManutencao: (payload: { titulo: string; descricao: string; categoria: string; prioridade: string }) => apiPost<RegistroManutencao>("/api/manutencao", payload),
    atualizarManutencao: (id: string, payload: { responsavelUsuarioId?: string | null; status: string; resolucao?: string; prioridade: string }) => apiPut<RegistroManutencao>(`/api/manutencao/${id}`, payload),
    responsaveisManutencao: () => apiGet<Array<{ id: string; nome: string; tipo: string }>>("/api/manutencao/responsaveis"),
};
