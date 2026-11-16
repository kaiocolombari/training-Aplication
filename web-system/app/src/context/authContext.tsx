import React, { createContext, useContext, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "../service/api";
import { authService, type AuthUser, type LoginPayload, type RegisterStudentPayload } from "../service/authService";

interface AuthContextValue {
    user: AuthUser | null;
    isLoading: boolean;
    login: (payload: LoginPayload) => Promise<AuthUser>;
    registerStudent: (payload: RegisterStudentPayload) => Promise<AuthUser>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
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

    const value = useMemo<AuthContextValue>(() => ({
        user: session.data ?? null,
        isLoading: session.isPending,
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
                await authService.logout();
            } finally {
                queryClient.setQueryData(["auth", "me"], null);
                queryClient.removeQueries({ predicate: query => query.queryKey[0] !== "auth" });
            }
        },
        refreshUser: async () => {
            await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
        },
    }), [session.data, session.isPending, queryClient]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth precisa ser usado dentro de AuthProvider.");
    return context;
}
