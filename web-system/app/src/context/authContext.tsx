import React, { createContext, useContext, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, AUTH_SESSION_EXPIRED_EVENT } from "../service/api";
import { authService, type AuthUser, type LoginPayload, type RegisterStudentPayload } from "../service/authService";

interface AuthContextValue {
    user: AuthUser | null;
    isLoading: boolean;
    isError: boolean;
    error: unknown;
    login: (payload: LoginPayload) => Promise<AuthUser>;
    registerStudent: (payload: RegisterStudentPayload) => Promise<AuthUser>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    retrySession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const queryClient = useQueryClient();
    const session = useQuery({
        queryKey: ["auth", "me"],
        queryFn: authService.me,
        retry: (count, error) => !(error instanceof ApiError && error.status === 401) && count < 1,
        staleTime: 30_000,
        refetchOnWindowFocus: true,
        refetchInterval: query =>
            query.state.data?.tipo === "ALUNO" &&
            query.state.data.statusCadastro === "PENDENTE" &&
            query.state.data.formularioEnviado
                ? 30_000
                : false,
        enabled: typeof window !== "undefined",
    });

    useEffect(() => {
        function handleSessionExpired() {
            queryClient.setQueryData(["auth", "me"], null);
            queryClient.removeQueries({ predicate: query => query.queryKey[0] !== "auth" });
        }

        window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);
        return () => window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);
    }, [queryClient]);

    const value = useMemo<AuthContextValue>(() => ({
        user: session.data ?? null,
        isLoading: session.isPending,
        isError: session.isError,
        error: session.error,
        login: async (payload) => {
            const user = await authService.login(payload);
            queryClient.setQueryData(["auth", "me"], user);
            return user;
        },
        registerStudent: async (payload) => {
            const user = await authService.registerStudent(payload);
            queryClient.setQueryData(["auth", "me"], user);
            return user;
        },
        logout: async () => {
            try {
                // Evita que uma consulta /me iniciada antes do logout restaure o usuário no cache.
                await queryClient.cancelQueries({ queryKey: ["auth", "me"], exact: true });
                await authService.logout();
            } finally {
                queryClient.setQueryData(["auth", "me"], null);
                queryClient.removeQueries({ predicate: query => query.queryKey[0] !== "auth" });
            }
        },
        refreshUser: async () => {
            await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
        },
        retrySession: async () => {
            await queryClient.invalidateQueries({ queryKey: ["auth", "me"], exact: true });
        },
    }), [session.data, session.isPending, session.isError, session.error, queryClient]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth precisa ser usado dentro de AuthProvider.");
    return context;
}
