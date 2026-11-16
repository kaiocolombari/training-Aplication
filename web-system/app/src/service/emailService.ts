import { apiGet, apiPost } from "./api";

export type TipoDestinatarioEmail = "ALUNO" | "PERSONAL";

export interface EmailStatus {
    configurado: boolean;
    marca: string;
    remetenteNome: string;
    remetenteEmail: string;
    corPrincipal: string;
    mensagem: string;
}

export interface EmailDestinatario {
    usuarioId: string;
    nome: string;
    email: string;
    tipo: TipoDestinatarioEmail;
}

export interface EnviarEmailPayload {
    destinatariosIds: string[];
    assunto: string;
    mensagem: string;
}

export interface EmailResultadoDestinatario {
    usuarioId: string;
    nome: string;
    sucesso: boolean;
    mensagem: string;
}

export interface EmailEnvioResultado {
    totalDestinatarios: number;
    enviados: number;
    falhas: number;
    resultados: EmailResultadoDestinatario[];
}

export const emailService = {
    obterStatus: () => apiGet<EmailStatus>("/api/emails/status"),
    listarDestinatarios: (tipo: TipoDestinatarioEmail, busca = "") => {
        const params = new URLSearchParams({ tipo });
        if (busca.trim()) params.set("busca", busca.trim());
        return apiGet<EmailDestinatario[]>("/api/emails/destinatarios?" + params.toString());
    },
    enviar: (payload: EnviarEmailPayload) =>
        apiPost<EmailEnvioResultado>("/api/emails/enviar", payload),
};
