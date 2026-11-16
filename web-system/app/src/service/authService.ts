import { apiGet, apiPost } from "./api";

export type UserRole = "ADMIN" | "PERSONAL" | "ALUNO";

export interface AuthUser {
    usuarioId: string;
    email: string;
    tipo: UserRole;
    personalId: string | null;
    alunoId: string | null;
    nome: string;
    statusCadastro: "PENDENTE" | "APROVADO" | null;
    formularioEnviado: boolean;
}

export interface LoginPayload {
    email: string;
    senha: string;
}

export interface RegisterStudentPayload {
    nomeCompleto: string;
    email: string;
    telefone?: string;
    senha: string;
}

export const authService = {
    me: () => apiGet<AuthUser>("/api/auth/me"),
    login: (payload: LoginPayload) => apiPost<AuthUser>("/api/auth/login", payload),
    registerStudent: (payload: RegisterStudentPayload) => apiPost<AuthUser>("/api/auth/register", payload),
    logout: () => apiPost<void>("/api/auth/logout"),
};
