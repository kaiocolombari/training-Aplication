
import { Navigate, Outlet, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import NavTool from "../components/navTool";
import { useAvaliacao } from "../context/avaliacaoContext";

export default function AvaliacaoLayout() {
    const {
        avaliacao,
        alunoSelecionadoId,
        alteracoesPendentes,
        limparAvaliacao,
    } = useAvaliacao();
    const navigate = useNavigate();
    const [tema] = useState<"light" | "dark">(() => {
        if (typeof window === "undefined") return "light";

        return localStorage.getItem("painel_tema") === "dark"
            ? "dark"
            : "light";
    });
    useEffect(() => {
        if (!alunoSelecionadoId) return;
        const avisarSaida = (event: BeforeUnloadEvent) => {
            if (!alteracoesPendentes) return;
            event.preventDefault();
            event.returnValue = "";
        };
        window.addEventListener("beforeunload", avisarSaida);
        return () => window.removeEventListener("beforeunload", avisarSaida);
    }, [alunoSelecionadoId, alteracoesPendentes]);

    if (!alunoSelecionadoId) return <Navigate to="/" replace />;

    function confirmarSaida() {
        if (!alteracoesPendentes) return true;
        return window.confirm(
            "Existem alterações que ainda não foram salvas. Se continuar, elas serão descartadas. Deseja continuar?",
        );
    }

    function trocarAluno() {
        // Returning to the student list does not discard the in-memory draft.
        navigate("/");
    }

    function encerrarAtendimento() {
        if (!confirmarSaida()) return;
        limparAvaliacao();
        navigate("/");
    }

    return (
        <div
            className="painel-theme"
            data-theme={tema}
        >
            <div className="flex min-h-screen w-full items-start">
                <NavTool />

                <main className="min-w-0 flex-1">
                    <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface-raised)]/95 px-4 py-2.5 backdrop-blur md:px-6">
                        <div className="min-w-0">
                            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Atendimento atual</p>
                            <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                                {avaliacao.aluno.nomeCompleto || "Aluno selecionado"}
                            </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                            <button type="button" onClick={trocarAluno} className="rounded-lg border border-[var(--border)] px-3 py-2 text-[11px] font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-hover)]">
                                Trocar aluno
                            </button>
                            <button type="button" onClick={encerrarAtendimento} className="rounded-lg px-3 py-2 text-[11px] font-semibold text-[var(--danger)] transition hover:bg-[var(--danger-soft)]">
                                Encerrar atendimento
                            </button>
                        </div>
                    </div>
                    <Outlet />
                </main>
            </div>

        </div>
    );
}
