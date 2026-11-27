import { apiPost, apiGet, apiDelete } from "./api";

export interface ConvitePublico {
    valido: boolean;
    personalNome: string;
    apelido: string;
}

export interface ConviteResumo {
    id: string;
    apelido: string;
    criadoEm: string;
    expiraEm: string;
    revogadoEm: string | null;
    utilizacoes: number;
    ativo: boolean;
}

export interface ConviteCriado extends Omit<ConviteResumo, "revogadoEm" | "ativo"> {
    token: string;
}

export interface ConvitesPersonalResumo {
    personalId: string;
    personalNome: string;
    convitesCriados: number;
    pessoasRegistradas: number;
    cadastrosPendentes: number;
    cadastrosAprovados: number;
    cadastrosReprovados: number;
    convidados: Array<{
        alunoId: string;
        nome: string;
        email: string;
        statusCadastro: string;
        criadoEm: string;
        conviteApelido: string | null;
    }>;
}

export const conviteService = {
    validar: (token: string) => apiPost<ConvitePublico>("/api/convites/validar", { token }),
    criar: (apelido: string, nomePersonal?: string) => apiPost<ConviteCriado>("/api/convites", { apelido, nomePersonal }),
    meus: () => apiGet<ConviteResumo[]>("/api/convites/meus"),
    revogar: (id: string) => apiDelete<void>(`/api/convites/${id}`),
    equipe: () => apiGet<ConvitesPersonalResumo[]>("/api/convites/equipe"),
};
