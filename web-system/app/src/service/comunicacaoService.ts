import { apiGet, apiPost, apiPatch } from "./api";

export interface MembroEquipe {
    usuarioId: string;
    nome: string;
    email: string;
    tipo: "ADMIN" | "PERSONAL";
}

export interface ConversaEquipe {
    id: string;
    outroUsuarioId: string;
    outroUsuarioNome: string;
    outroUsuarioTipo: "ADMIN" | "PERSONAL";
    ultimaMensagem: string | null;
    ultimaMensagemEm: string | null;
    naoLidas: number;
}

export interface MensagemEquipe {
    id: string;
    remetenteId: string;
    remetenteNome: string;
    remetenteTipo: "ADMIN" | "PERSONAL";
    conteudo: string;
    enviadaEm: string;
    lidaEm: string | null;
}

export interface AvisoGlobal {
    id: string;
    autorId: string;
    autorNome: string;
    titulo: string;
    conteudo: string;
    publicadoEm: string;
}

export interface Notificacao {
    id: string;
    titulo: string;
    mensagem: string;
    tipo: "CHAT" | "MURAL" | "ALERTA" | "SISTEMA";
    referenciaId: string | null;
    criadaEm: string;
    lidaEm: string | null;
}

export const comunicacaoService = {
    listarEquipe: () => apiGet<MembroEquipe[]>("/api/comunicacao/equipe"),
    listarConversas: () => apiGet<ConversaEquipe[]>("/api/comunicacao/conversas"),
    listarMensagens: (conversaId: string) =>
        apiGet<MensagemEquipe[]>(`/api/comunicacao/conversas/${conversaId}/mensagens`),
    enviarMensagem: (destinatarioId: string, conteudo: string) =>
        apiPost<{ conversaId: string }>(`/api/comunicacao/mensagens/para/${destinatarioId}`, { conteudo }),
    listarAvisos: () => apiGet<AvisoGlobal[]>("/api/comunicacao/avisos"),
    publicarAviso: (titulo: string, conteudo: string) =>
        apiPost<void>("/api/comunicacao/avisos", { titulo, conteudo }),
    listarNotificacoes: () => apiGet<Notificacao[]>("/api/comunicacao/notificacoes"),
    marcarNotificacaoLida: (id: string) =>
        apiPatch<void>(`/api/comunicacao/notificacoes/${id}/lida`),
    marcarTodasLidas: () => apiPost<void>("/api/comunicacao/notificacoes/lidas"),
    marcarAvisosLidos: () => apiPost<void>("/api/comunicacao/notificacoes/mural-lidas"),
    criarAlerta: (titulo: string, mensagem: string, usuarioDestinoId?: string) =>
        apiPost<void>("/api/comunicacao/alertas", { titulo, mensagem, usuarioDestinoId }),
};
