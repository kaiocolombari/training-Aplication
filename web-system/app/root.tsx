
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import "./app.css";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AvaliacaoProvider, useAvaliacao } from "./src/context/avaliacaoContext";
import { AuthProvider } from "./src/context/authContext";
import AutoSaveController from "./src/components/AutoSaveController";
import ForbiddenRedirector from "./src/components/ForbiddenRedirector";
import { API_READ_FAILURE_EVENT } from "./src/service/api";
import type { Route } from "./+types/root";

function ApiReadFailureRedirector() {
  const navigate = useNavigate();
  const location = useLocation();
  const { alunoSelecionadoId, autoSaveLastSavedAt } = useAvaliacao();

  useEffect(() => {
    const rotasDeFicha = [
      "/avaliacoes",
      "/comparacao",
      "/prescricao",
      "/periodizacao",
      "/volume",
      "/intensidade",
      "/salvar",
    ];

    const tratarFalha = (event: Event) => {
      const estaEmTelaDeFicha = rotasDeFicha.some(
        (rota) => location.pathname === rota || location.pathname.startsWith(`${rota}/`),
      );
      if (!estaEmTelaDeFicha) return;

      const detalhe = (event as CustomEvent<{ message?: string; endpoint?: string }>).detail;
      navigate("/", {
        replace: true,
        state: {
          apiRecoveryError: detalhe?.message || "Não foi possível carregar os dados da tela.",
          apiRecoveryEndpoint: detalhe?.endpoint || null,
          lastSavedAt: autoSaveLastSavedAt?.toISOString() ?? null,
          alunoId: alunoSelecionadoId,
        },
      });
    };

    window.addEventListener(API_READ_FAILURE_EVENT, tratarFalha);
    return () => window.removeEventListener(API_READ_FAILURE_EVENT, tratarFalha);
  }, [location.pathname, navigate, alunoSelecionadoId, autoSaveLastSavedAt]);

  return null;
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
      mutations: { retry: 0 },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AvaliacaoProvider>
          <ForbiddenRedirector />
          <ApiReadFailureRedirector />
          <AutoSaveController />
          <Outlet />
        </AvaliacaoProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
