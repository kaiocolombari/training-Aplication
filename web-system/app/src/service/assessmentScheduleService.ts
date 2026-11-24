import { apiGet, apiPatch, apiPost } from "./api";

export interface AgendaAvaliacaoApi {
    id: string;
    alunoId: string;
    alunoNome: string;
    origem: "ALUNO" | "PERSONAL" | string;
    dataDesejada: string;
    dataAgendada?: string | null;
    motivo?: string | null;
    descricaoAgendamento?: string | null;
    status: "PENDENTE" | "AGENDADA" | "RECUSADA" | "CANCELADA" | string;
    urgente: boolean;
    enviadaEm?: string | null;
    criadaEm: string;
    analisadaEm?: string | null;
    analisadaPorNome?: string | null;
}

export const assessmentScheduleService = {
    listarPendentes: () =>
        apiGet<AgendaAvaliacaoApi[]>("/api/avaliacoes/solicitacoes/pendentes"),
    listar: (alunoId: string) =>
        apiGet<AgendaAvaliacaoApi[]>(`/api/alunos/${alunoId}/avaliacoes/agenda`),
    agendar: (alunoId: string, dataAgendada: string, descricao: string, solicitacaoId?: string) =>
        apiPost<AgendaAvaliacaoApi>(`/api/alunos/${alunoId}/avaliacoes/agendamentos`, {
            dataAgendada,
            descricao: descricao.trim() || null,
            solicitacaoId: solicitacaoId ?? null,
        }),
    recusar: (solicitacaoId: string) =>
        apiPatch<void>(`/api/avaliacoes/solicitacoes/${solicitacaoId}/recusar`),
};
