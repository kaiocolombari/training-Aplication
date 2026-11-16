import { apiGet, apiPost } from "./api";

export interface SolicitacaoCadastro {
    alunoId: string;
    nomeCompleto: string;
    email: string;
    telefone?: string | null;
    criadoEm: string;
    enviadaEm: string;
    respostas: Record<string, unknown>;
}

export const cadastroAlunoService = {
    enviarRespostas: (respostas: Record<string, unknown>) =>
        apiPost<void>("/api/cadastro-aluno/respostas", { respostas }),
    listarSolicitacoes: () =>
        apiGet<SolicitacaoCadastro[]>("/api/cadastro-aluno/solicitacoes"),
    aprovar: (alunoId: string, personalId?: string) =>
        apiPost<void>(`/api/cadastro-aluno/${alunoId}/aprovar`, { personalId }),
};
