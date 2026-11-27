import { apiGet, apiPost } from "./api";

export interface SolicitacaoCadastro {
    alunoId: string;
    nomeCompleto: string;
    email: string;
    telefone?: string | null;
    criadoEm: string;
    enviadaEm?: string | null;
    formularioEnviado: boolean;
    convidadoPorPersonal?: string | null;
    statusAnalise?: string;
    observacaoAnalise?: string | null;
    analisadaEm?: string | null;
    respostas: Record<string, unknown>;
}

export interface ResumoSolicitacoesCadastro {
    total: number;
    enviados: number;
    aguardandoFormulario: number;
}

export const cadastroAlunoService = {
    enviarRespostas: (respostas: Record<string, unknown>, captchaToken: string, website?: string) =>
        apiPost<void>("/api/cadastro-aluno/respostas", { respostas, captchaToken, website }),
    listarSolicitacoes: () =>
        apiGet<SolicitacaoCadastro[]>("/api/cadastro-aluno/solicitacoes"),
    obterResumo: () =>
        apiGet<ResumoSolicitacoesCadastro>("/api/cadastro-aluno/solicitacoes/resumo"),
    aprovar: (alunoId: string, observacao?: string) =>
        apiPost<void>(`/api/cadastro-aluno/${alunoId}/aprovar`, { observacao }),
    reprovar: (alunoId: string, observacao: string) =>
        apiPost<void>(`/api/cadastro-aluno/${alunoId}/reprovar`, { observacao }),
};
