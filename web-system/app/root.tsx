
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
  let message = "Não foi possível carregar esta página";
  let details = "Ocorreu uma falha inesperada. Tente novamente ou volte ao painel.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      message = "Página não encontrada";
      details = "O endereço pode ter mudado ou a página não existe mais.";
    } else if (error.status === 403) {
      message = "Acesso não autorizado";
      details = "Sua conta não possui permissão para acessar este conteúdo.";
    } else if (error.status === 401) {
      message = "Sessão não autorizada";
      details = "Entre novamente para continuar.";
    } else if (error.status >= 500) {
      message = "Serviço temporariamente indisponível";
      details = "Não foi possível concluir o carregamento. Aguarde um instante e tente novamente.";
    }
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="grid min-h-[70vh] place-items-center px-5 py-12">
      <section role="alert" className="w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-xl shadow-zinc-900/5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a85f60]">Treino System</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-800">{message}</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-500">{details}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => window.location.reload()} className="rounded-xl bg-[#a85f60] px-5 py-3 text-xs font-semibold text-white transition hover:bg-[#914f50]">
            Tentar novamente
          </button>
          <a href="/" className="rounded-xl border border-zinc-200 px-5 py-3 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50">
            Voltar ao início
          </a>
        </div>
      </section>
      {stack && (
        <pre className="mx-auto mt-6 w-full max-w-4xl overflow-x-auto rounded-xl bg-zinc-950 p-4 text-left text-xs text-zinc-100"><code>{stack}</code></pre>
      )}
    </main>
  );
}
