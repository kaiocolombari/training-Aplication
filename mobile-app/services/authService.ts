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
  statusCadastro: "PENDENTE" | "APROVADO" | "REPROVADO" | null;
  formularioEnviado: boolean;
  observacaoAnalise?: string | null;
  controleAvancadoHabilitado: boolean;
  convidadoPorPersonalNome?: string | null;
  convidadoPorPersonalTelefone?: string | null;
}

export interface LoginPayload {
  email: string;
  senha: string;
}

export interface AuthSessionResponse extends AuthTokens {
  usuario: AuthUser;
}



export const authService = {
  me: () => apiGet<AuthUser>("/api/auth/me"),

  login: (payload: LoginPayload) =>
    apiPost<AuthSessionResponse>("/api/auth/mobile/login", payload, 20000),
  refresh: (refreshToken: string) =>
    apiPost<AuthSessionResponse>("/api/auth/mobile/refresh", { refreshToken }),
  logout: (refreshToken: string) =>
    apiPost<void>("/api/auth/mobile/logout", { refreshToken }),
};
