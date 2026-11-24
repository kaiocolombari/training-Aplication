import { apiGet, apiPost } from "./api";

export type ChatMessage = {
  id: string;
  remetenteId: string;
  remetenteNome: string;
  remetenteTipo: "ALUNO" | "PERSONAL" | "ADMIN" | string;
  conteudo: string;
  enviadaEm: string;
  lidaEm?: string | null;
};

export const communicationService = {
  listMessages: (conversationId: string) =>
    apiGet<ChatMessage[]>(`/api/comunicacao/conversas/${conversationId}/mensagens`),
  sendMessage: (recipientId: string, conteudo: string) =>
    apiPost<{ conversaId: string }>(`/api/comunicacao/mensagens/para/${recipientId}`, { conteudo }),
};
