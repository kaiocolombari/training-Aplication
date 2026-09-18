import { api } from "./api";

export interface CriarPersonal {
    nomeCompleto: string;
    email: string;
    telefone?: string;
    senha: string;
}

export interface Personal {
    id: string;
    usuarioId: string;
    nomeCompleto: string;
    email: string;
    telefone?: string;
}

export async function criarPersonal(
    dados: CriarPersonal
): Promise<Personal> {
    return api("/api/Personal", {
        method: "POST",
        body: JSON.stringify(dados),
    });
}