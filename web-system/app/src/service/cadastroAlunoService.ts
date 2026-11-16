import { apiGet, apiPost } from "./api";

export interface SolicitacaoCadastro {
    alunoId: string;
    nomeCompleto: string;
    email: string;
    telefone?: string | null;
    criadoEm: string;
    enviadaEm?: string | null;
    formularioEnviado: boolean;
    respostas: Record<string, unknown>;
}

export interface ResumoSolicitacoesCadastro {
    total: number;
    enviados: number;
    aguardandoFormulario: number;
}

export const cadastroAlunoService = {
    enviarRespostas: (respostas: Record<string, unknown>) =>
        apiPost<void>("/api/cadastro-aluno/respostas", { respostas }),
    listarSolicitacoes: () =>
        apiGet<SolicitacaoCadastro[]>("/api/cadastro-aluno/solicitacoes"),
    obterResumo: () =>
        apiGet<ResumoSolicitacoesCadastro>("/api/cadastro-aluno/solicitacoes/resumo"),
    aprovar: (alunoId: string, personalId?: string) =>
        apiPost<void>(`/api/cadastro-aluno/${alunoId}/aprovar`, { personalId }),
};
