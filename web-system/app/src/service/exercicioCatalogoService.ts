import { API_BASE_URL, api } from "./api";

export type VideoExercicio = {
    id: string;
    titulo: string;
    url: string;
    origem: string;
    licenca: string;
    fonte?: string | null;
    duracaoSegundos?: number | null;
    principal: boolean;
};

export type ExercicioCatalogo = {
    id: string;
    nome: string;
    grupoMuscular?: string | null;
    equipamento?: string | null;
    dificuldade?: string | null;
    descricao?: string | null;
    instrucoes?: string | null;
    sinonimos: string[];
    videos: VideoExercicio[];
    videoPrincipalUrl?: string | null;
};

export type SalvarExercicioCatalogo = {
    nome: string;
    grupoMuscular: string | null;
    equipamento: string | null;
    dificuldade: string | null;
    descricao: string | null;
    instrucoes: string | null;
    sinonimos: string[];
};

export function resolverUrlVideo(url: string) {
    return url.startsWith("http") ? url : `${API_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
}

export const exercicioCatalogoService = {
    listar: (q = "") =>
        api<ExercicioCatalogo[]>(`/api/exercicios/catalogo?limite=500${q.trim() ? `&q=${encodeURIComponent(q.trim())}` : ""}`),

    buscar: (q: string) =>
        api<Array<ExercicioCatalogo & { pontuacao: number; tipoCorrespondencia: string }>>(
            `/api/exercicios/catalogo/buscar?q=${encodeURIComponent(q)}`,
        ),

    criar: (payload: SalvarExercicioCatalogo) =>
        api<ExercicioCatalogo>("/api/exercicios/catalogo", {
            method: "POST",
            body: JSON.stringify(payload),
        }),

    atualizar: (id: string, payload: SalvarExercicioCatalogo) =>
        api<ExercicioCatalogo>(`/api/exercicios/catalogo/${id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
        }),

    enviarVideo: (id: string, form: FormData) =>
        api<VideoExercicio>(`/api/exercicios/catalogo/${id}/videos`, {
            method: "POST",
            body: form,
        }),

    definirPrincipal: (id: string, videoId: string) =>
        api<void>(`/api/exercicios/catalogo/${id}/videos/${videoId}/principal`, {
            method: "POST",
        }),

    excluirVideo: (id: string, videoId: string) =>
        api<void>(`/api/exercicios/catalogo/${id}/videos/${videoId}`, {
            method: "DELETE",
        }),
};
