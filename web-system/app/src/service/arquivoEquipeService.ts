import { api, apiBlob, apiDelete, apiGet } from "./api";

export type PrazoRetencaoArquivo = "24H" | "7D" | "1M" | "6M" | "1A";

export interface ArquivoEquipeAnexo {
    id: string;
    nomeOriginal: string;
    tamanhoBytes: number;
    enviadoEm: string;
}

export interface ArquivoEquipePublicacao {
    id: string;
    nome: string;
    descricao: string;
    prazoRetencao: PrazoRetencaoArquivo;
    criadoPorNome: string;
    criadoEm: string;
    expiraEm: string;
    avisoExpiracaoEnviadoEm: string | null;
    arquivos: ArquivoEquipeAnexo[];
}

export const arquivoEquipeService = {
    listar: () => apiGet<ArquivoEquipePublicacao[]>("/api/arquivos-equipe"),
    criar: (form: FormData) => api<{ id: string }>("/api/arquivos-equipe", { method: "POST", body: form }),
    atualizar: (id: string, form: FormData) => api<void>(`/api/arquivos-equipe/${id}`, { method: "PUT", body: form }),
    excluir: (id: string) => apiDelete<void>(`/api/arquivos-equipe/${id}`),
    baixar: (publicacaoId: string, arquivoId: string) =>
        apiBlob(`/api/arquivos-equipe/${publicacaoId}/arquivos/${arquivoId}`),
};
