import { apiGet, apiPost } from "./api";
import type { AuthTokens } from "./api";

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
  controleAvancadoHabilitado: boolean;
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

export interface AuthSessionResponse extends AuthTokens {
  usuario: AuthUser;
}



export const authService = {
  me: () => apiGet<AuthUser>("/api/auth/me"),

  login: (payload: LoginPayload) =>
    apiPost<AuthSessionResponse>("/api/auth/mobile/login", payload, 20000),
  registerStudent: (payload: RegisterStudentPayload) =>

    apiPost<AuthSessionResponse>("/api/auth/mobile/register", payload),
  refresh: (refreshToken: string) =>
    apiPost<AuthSessionResponse>("/api/auth/mobile/refresh", { refreshToken }),
  logout: (refreshToken: string) =>
    apiPost<void>("/api/auth/mobile/logout", { refreshToken }),
  sendRegistrationAnswers: (respostas: Record<string, string>) =>
    apiPost<void>("/api/cadastro-aluno/respostas", { respostas }),
};
