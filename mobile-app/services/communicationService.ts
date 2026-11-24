import { apiGet, apiPost, apiUpload, getApiBaseUrl, getFreshAccessToken } from "./api";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

export type ChatMessage = {
  id: string;
  remetenteId: string;
  remetenteNome: string;
  remetenteTipo: "ALUNO" | "PERSONAL" | "ADMIN" | string;
  conteudo: string;
  enviadaEm: string;
  entregueEm?: string | null;
  lidaEm?: string | null;
  anexos?: Array<{ id: string; nomeOriginal: string; tipoConteudo: string; tamanhoBytes: number }>;
};

export const communicationService = {
  listMessages: (conversationId: string) =>
    apiGet<ChatMessage[]>(`/api/comunicacao/conversas/${conversationId}/mensagens`),
  sendMessage: (recipientId: string, conteudo: string) =>
    apiPost<{ conversaId: string }>(`/api/comunicacao/mensagens/para/${recipientId}`, { conteudo }),
  ensureConversation: (recipientId: string) =>
    apiPost<{ conversaId: string }>(`/api/comunicacao/conversas/para/${recipientId}`),
  uploadAttachment: (conversationId: string, file: { uri: string; name: string; type: string }, legenda = "") => {
    const form = new FormData();
    form.append("arquivo", { uri: file.uri, name: file.name, type: file.type } as unknown as Blob);
    form.append("legenda", legenda);
    return apiUpload<{ mensagemId: string }>(`/api/comunicacao/conversas/${conversationId}/anexos`, form);
  },
  downloadAttachment: async (attachmentId: string, filename: string) => {
    const safeName = filename.replace(/[\\/:*?"<>|]/g, "_");
    const destination = new File(Paths.cache, `${Date.now()}-${safeName}`);
    const token = await getFreshAccessToken();
    if (!token) throw new Error("Sua sessão expirou. Entre novamente.");
    const downloaded = await File.downloadFileAsync(
      `${getApiBaseUrl()}/api/comunicacao/anexos/${attachmentId}`,
      destination,
      { headers: { Authorization: `Bearer ${token}` }, idempotent: true },
    );
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(downloaded.uri);
    return downloaded.uri;
  },
};
