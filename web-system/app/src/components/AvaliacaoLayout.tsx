
import { Navigate, Outlet, useLocation, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import NavTool from "../components/navTool";
import { useAvaliacao } from "../context/avaliacaoContext";
import { cadastroService, mapearAvaliacaoApiParaFisica } from "../service/cadastroService";
import { API_READ_FINISHED_EVENT, API_READ_STARTED_EVENT } from "../service/api";

export default function AvaliacaoLayout() {
    const {
        avaliacao,
        alunoSelecionadoId,
        carregarAvaliacao,
        alteracoesPendentes,
        limparAvaliacao,
        autoSaveEnabled,
        autoSaveStatus,
        autoSaveLastSavedAt,
    } = useAvaliacao();
    const navigate = useNavigate();
    const location = useLocation();
    const [tema] = useState<"light" | "dark">(() => {
        if (typeof window === "undefined") return "light";

        return localStorage.getItem("painel_tema") === "dark"
            ? "dark"
            : "light";
    });
    const [criandoFicha, setCriandoFicha] = useState(false);
    const [erroCriacaoFicha, setErroCriacaoFicha] = useState("");
    const [requisicoesApiPendentes, setRequisicoesApiPendentes] = useState(0);
    const [mostrarLoadingApi, setMostrarLoadingApi] = useState(false);

    useEffect(() => {
        const iniciar = () => setRequisicoesApiPendentes(atual => atual + 1);
        const finalizar = () => setRequisicoesApiPendentes(atual => Math.max(0, atual - 1));
        window.addEventListener(API_READ_STARTED_EVENT, iniciar);
        window.addEventListener(API_READ_FINISHED_EVENT, finalizar);
        return () => {
            window.removeEventListener(API_READ_STARTED_EVENT, iniciar);
            window.removeEventListener(API_READ_FINISHED_EVENT, finalizar);
        };
    }, []);

    useEffect(() => {
        if (requisicoesApiPendentes === 0) {
            setMostrarLoadingApi(false);
            return;
        }
        const timeout = window.setTimeout(() => setMostrarLoadingApi(true), 250);
        return () => window.clearTimeout(timeout);
    }, [requisicoesApiPendentes]);
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
        if (autoSaveEnabled && alteracoesPendentes) {
            window.alert(
                autoSaveStatus === "error"
                    ? "O salvamento automático falhou. Salve a ficha manualmente antes de encerrar o atendimento."
                    : "A ficha ainda tem alterações aguardando salvamento. Aguarde a confirmação antes de encerrar o atendimento.",
            );
            return;
        }
        if (!confirmarSaida()) return;
        limparAvaliacao();
        navigate("/");
    }

    async function criarFichaInicial() {
        if (!alunoSelecionadoId || criandoFicha) return;

        setCriandoFicha(true);
        setErroCriacaoFicha("");
        try {
            const registro = await cadastroService.criarAvaliacao(alunoSelecionadoId);
            const novaAvaliacao = mapearAvaliacaoApiParaFisica(registro);
            carregarAvaliacao(
                {
                    ...avaliacao,
                    avaliacoes: [...avaliacao.avaliacoes, novaAvaliacao].sort(
                        (a, b) => a.numero - b.numero,
                    ),
                },
                alunoSelecionadoId,
            );
            navigate(`/avaliacoes/${novaAvaliacao.id}`);
        } catch (error) {
            setErroCriacaoFicha(
                error instanceof Error ? error.message : "Não foi possível criar a ficha inicial.",
            );
        } finally {
            setCriandoFicha(false);
        }
    }

    const fichaInicializada = avaliacao.avaliacoes.length > 0;
    const precisaInicializarFicha = !fichaInicializada && location.pathname !== "/avaliacoes";

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
                            <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                                {autoSaveLastSavedAt
                                    ? `Último salvamento: ${autoSaveLastSavedAt.toLocaleString("pt-BR")}`
                                    : "Ainda não há salvamento confirmado neste navegador"}
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
                    {mostrarLoadingApi && (
                        <div role="status" aria-live="polite" className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--accent-soft)] px-5 py-2 text-xs font-medium text-[var(--accent-text)]">
                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" />
                            Carregando dados da API...
                        </div>
                    )}
                    {precisaInicializarFicha ? (
                        <section className="mx-auto flex min-h-[65vh] w-full max-w-3xl items-center justify-center px-5 py-10">
                            <div className="w-full rounded-3xl border border-[var(--border)] bg-[var(--surface-raised)] p-7 text-center shadow-sm md:p-10">
                                <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-[var(--accent-soft)] text-2xl font-bold text-[var(--accent)]">
                                    +
                                </div>
                                <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
                                    Ficha ainda não iniciada
                                </p>
                                <h1 className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
                                    Este aluno ainda não possui avaliações
                                </h1>
                                <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[var(--text-secondary)]">
                                    Para acessar comparação, prescrição, periodização, volume e intensidade,
                                    primeiro é necessário criar a avaliação inicial do aluno.
                                </p>
                                <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                                    <button
                                        type="button"
                                        onClick={() => void criarFichaInicial()}
                                        disabled={criandoFicha}
                                        className="rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--on-accent)] transition hover:bg-[var(--accent-hover)]"
                                    >
                                        {criandoFicha ? "Criando ficha..." : "Criar ficha"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={encerrarAtendimento}
                                        className="rounded-xl border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-hover)]"
                                    >
                                        Sair e voltar ao painel
                                    </button>
                                </div>
                                {erroCriacaoFicha && (
                                    <p role="alert" className="mt-4 text-sm text-[var(--danger)]">
                                        {erroCriacaoFicha}
                                    </p>
                                )}
                            </div>
                        </section>
                    ) : (
                        <Outlet />
                    )}
                </main>
            </div>

        </div>
    );
}

export function ErrorBoundary({ error }: { error: unknown }) {
    const navigate = useNavigate();
    const { alunoSelecionadoId, autoSaveLastSavedAt } = useAvaliacao();
    const mensagem = error instanceof Error
        ? error.message
        : "Ocorreu um erro inesperado ao montar esta tela.";

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            navigate("/", {
                replace: true,
                state: {
                    apiRecoveryError: `A tela não conseguiu ser carregada. ${mensagem}`,
                    lastSavedAt: autoSaveLastSavedAt?.toISOString() ?? null,
                    alunoId: alunoSelecionadoId,
                },
            });
        }, 6000);
        return () => window.clearTimeout(timeout);
    }, [navigate, mensagem, autoSaveLastSavedAt, alunoSelecionadoId]);

    return (
        <main className="painel-theme flex min-h-screen items-center justify-center bg-[var(--surface-secondary)] px-5 py-10">
            <section role="alert" className="w-full max-w-xl rounded-3xl border border-[var(--danger)]/25 bg-[var(--surface-raised)] p-7 text-center shadow-xl">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[var(--danger-soft)] text-xl font-bold text-[var(--danger)]">!</div>
                <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--danger)]">Falha ao carregar a tela</p>
                <h1 className="mt-2 text-2xl font-bold text-[var(--text-primary)]">Estamos recuperando sua navegação</h1>
                <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{mensagem}</p>
                <p className="mt-4 rounded-xl bg-[var(--surface-secondary)] px-4 py-3 text-xs text-[var(--text-secondary)]">
                    Último salvamento confirmado: <strong className="text-[var(--text-primary)]">{autoSaveLastSavedAt ? autoSaveLastSavedAt.toLocaleString("pt-BR") : "Não há horário confirmado neste navegador para este aluno"}</strong>
                </p>
                <p className="mt-4 text-xs text-[var(--text-muted)]">Você será redirecionado ao Painel em alguns segundos. O horário indica a última gravação confirmada, não alterações que ainda estavam pendentes.</p>
                <button type="button" onClick={() => navigate("/", { replace: true, state: { apiRecoveryError: `A tela não conseguiu ser carregada. ${mensagem}`, lastSavedAt: autoSaveLastSavedAt?.toISOString() ?? null, alunoId: alunoSelecionadoId } })} className="mt-6 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--on-accent)] transition hover:bg-[var(--accent-hover)]">
                    Voltar ao Painel agora
                </button>
            </section>
        </main>
    );
}
