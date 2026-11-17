import { Link, Navigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useAvaliacao } from "../context/avaliacaoContext";
import { salvarFicha } from "../service/cadastroService";
import { ApiError } from "../service/api";

const nomesTelas: Record<string, string> = {
    aluno: "Dados do aluno",
    avaliacoes: "Avaliações físicas",
    comparacao: "Comparação",
    prescricao: "Prescrição de treino",
    periodizacao: "Periodização",
    volume: "Volume semanal",
    intensidade: "Intensidade",
};

export default function SalvarFicha() {
    const {
        avaliacao,
        alunoSelecionadoId,
        alteracoesPendentes,
        alteracoesPorTela,
        carregarAvaliacao,
        marcarComoSalvo,
        isAlunoSelecionado,
        autoSaveEnabled,
        setAutoSaveEnabled,
        autoSaveDelayMs,
        setAutoSaveDelayMs,
        autoSaveStatus,
        setAutoSaveStatus,
        autoSaveLastSavedAt,
        setAutoSaveLastSavedAt,
        autoSaveError,
        setAutoSaveError,
    } = useAvaliacao();
    const queryClient = useQueryClient();
    const estadoAtualRef = useRef({ avaliacao, alunoSelecionadoId });
    const componenteMontado = useRef(false);
    estadoAtualRef.current = { avaliacao, alunoSelecionadoId };

    useEffect(() => {
        componenteMontado.current = true;
        return () => {
            componenteMontado.current = false;
        };
    }, []);

    const salvar = useMutation({
        onMutate: ({ alunoId }: { alunoId: string; snapshot: typeof avaliacao }) => {
            if (isAlunoSelecionado(alunoId)) {
                setAutoSaveStatus("saving");
                setAutoSaveError(null);
            }
        },
        mutationFn: async ({
            alunoId,
            snapshot,
        }: {
            alunoId: string;
            snapshot: typeof avaliacao;
        }) => {
            return salvarFicha(alunoId, snapshot);
        },
        onSuccess: (dadosAtualizados, variables) => {
            if (isAlunoSelecionado(variables.alunoId)) {
                const estadoMudouDuranteSave =
                    componenteMontado.current &&
                    JSON.stringify(estadoAtualRef.current.avaliacao) !==
                        JSON.stringify(variables.snapshot);
                const marcado = marcarComoSalvo(variables.snapshot, variables.alunoId);
                if (marcado && componenteMontado.current && !estadoMudouDuranteSave) {
                    carregarAvaliacao(dadosAtualizados, variables.alunoId);
                }
                setAutoSaveStatus("saved");
                setAutoSaveLastSavedAt(new Date());
                setAutoSaveError(null);
            }
            void queryClient.invalidateQueries({ queryKey: ["alunos"] });
        },
        onError: (error, variables) => {
            if (isAlunoSelecionado(variables.alunoId)) {
                setAutoSaveStatus(autoSaveEnabled ? "error" : "idle");
                setAutoSaveError(
                    error instanceof Error ? error.message : "Não foi possível salvar a ficha.",
                );
            }
        },
    });

    if (!alunoSelecionadoId) return <Navigate to="/" replace />;

    const telasAlteradas = Object.entries(alteracoesPorTela)
        .filter(([, alterada]) => alterada)
        .map(([tela]) => tela);

    const statusTexto = !autoSaveEnabled
        ? "Salvamento automático desativado. Você pode salvar manualmente."
        : autoSaveStatus === "waiting"
          ? `Salvamento agendado para ${autoSaveDelayMs / 1000}s após a última edição.`
          : autoSaveStatus === "saving"
            ? "Enviando alterações para o banco de dados..."
            : autoSaveStatus === "error"
              ? "O último salvamento automático não foi concluído."
              : autoSaveStatus === "saved"
                ? "As alterações foram sincronizadas."
                : "Ativo e aguardando alterações.";

    return (
        <main className="min-h-full bg-[var(--surface-sunken)] p-4 text-[var(--text-primary)] md:p-6 lg:p-8">
            <div className="mx-auto w-full max-w-5xl">
                <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
                            Persistência da ficha
                        </p>
                        <h1 className="mt-2 text-2xl font-black tracking-tight text-[var(--text-primary)] md:text-3xl">
                            Salvar alterações
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
                            Revise o estado da ficha e sincronize as alterações com a API e o PostgreSQL.
                        </p>
                    </div>
                    <Link
                        to="/"
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[var(--border-strong)] bg-[var(--surface-raised)] px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                    >
                        Voltar ao painel
                    </Link>
                </header>

                <section className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface-raised)] shadow-sm">
                    <div className="flex flex-col gap-4 border-b border-[var(--border)] bg-[var(--surface-secondary)] p-5 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-6">
                        <div className="min-w-0">
                            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                                Atendimento atual
                            </p>
                            <h2 className="mt-1 truncate text-base font-bold text-[var(--text-primary)]">
                                {avaliacao.aluno.nomeCompleto || "Aluno selecionado"}
                            </h2>
                            <p className="mt-1 truncate text-xs text-[var(--text-secondary)]">
                                {avaliacao.aluno.email || "Sem e-mail cadastrado"}
                            </p>
                        </div>
                        <span
                            className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-[10px] font-bold ${alteracoesPendentes ? "bg-[var(--warning-soft)] text-[var(--warning)]" : "bg-[var(--success-soft)] text-[var(--success)]"}`}
                        >
                            <span className={`h-1.5 w-1.5 rounded-full ${alteracoesPendentes ? "bg-[var(--warning)]" : "bg-[var(--success)]"}`} />
                            {alteracoesPendentes ? "Alterações pendentes" : "Tudo sincronizado"}
                        </span>
                    </div>

                    <div className="grid gap-6 p-5 sm:p-7">
                        <section>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <h3 className="text-sm font-bold text-[var(--text-primary)]">Resumo das alterações</h3>
                                    <p className="mt-1 text-xs text-[var(--text-secondary)]">
                                        Seções da ficha que possuem mudanças desde a última gravação.
                                    </p>
                                </div>
                                <span className="rounded-lg bg-[var(--surface-tertiary)] px-2.5 py-1.5 text-[10px] font-bold text-[var(--text-secondary)]">
                                    {telasAlteradas.length} {telasAlteradas.length === 1 ? "seção" : "seções"}
                                </span>
                            </div>
                            {telasAlteradas.length ? (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {telasAlteradas.map(tela => (
                                        <span key={tela} className="rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] px-3 py-2 text-[10px] font-semibold text-[var(--text-secondary)]">
                                            {nomesTelas[tela] ?? tela}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="mt-4 rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-secondary)] px-4 py-5 text-xs text-[var(--text-muted)]">
                                    Nenhuma alteração local pendente. A ficha está sincronizada com o último estado confirmado.
                                </p>
                            )}
                        </section>

                        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] p-4 sm:p-5">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                    <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--accent)]">
                                        Preferência de persistência
                                    </p>
                                    <h3 className="mt-1 text-sm font-bold text-[var(--text-primary)]">
                                        Salvamento automático
                                    </h3>
                                    <p className="mt-1 max-w-xl text-xs leading-5 text-[var(--text-secondary)]">
                                        Quando ativado, as alterações são enviadas ao banco após um período sem edição.
                                    </p>
                                </div>
                                <label className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)]">
                                    <input
                                        type="checkbox"
                                        checked={autoSaveEnabled}
                                        onChange={event => setAutoSaveEnabled(event.target.checked)}
                                        className="h-4 w-4 accent-[var(--accent)]"
                                    />
                                    {autoSaveEnabled ? "Ativado" : "Desativado"}
                                </label>
                            </div>

                            {autoSaveEnabled && (
                                <label className="mt-4 flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-4 text-xs font-medium text-[var(--text-secondary)]">
                                    Salvar após
                                    <select
                                        value={autoSaveDelayMs}
                                        onChange={event => setAutoSaveDelayMs(Number(event.target.value))}
                                        className="min-h-9 rounded-lg border border-[var(--border-strong)] bg-[var(--surface-raised)] px-3 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                                    >
                                        <option value={2000}>2 segundos</option>
                                        <option value={4000}>4 segundos</option>
                                        <option value={6000}>6 segundos</option>
                                        <option value={10000}>10 segundos</option>
                                    </select>
                                    de inatividade
                                </label>
                            )}

                            <div className="mt-4 flex flex-col gap-2 border-t border-[var(--border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
                                <p role="status" className="text-xs font-medium text-[var(--text-secondary)]">
                                    {statusTexto}
                                </p>
                                <p className="text-[10px] text-[var(--text-muted)] sm:text-right">
                                    Último salvamento confirmado: {autoSaveLastSavedAt ? autoSaveLastSavedAt.toLocaleString("pt-BR") : "Ainda não registrado"}
                                </p>
                            </div>
                            {autoSaveEnabled && autoSaveError && (
                                <div className="mt-3 flex flex-col gap-2 rounded-xl border border-[var(--danger)]/25 bg-[var(--danger-soft)] p-3 sm:flex-row sm:items-center sm:justify-between">
                                    <p role="alert" className="text-xs leading-5 text-[var(--danger)]">
                                        {autoSaveError} Você ainda pode salvar manualmente.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAutoSaveError(null);
                                            setAutoSaveStatus("idle");
                                        }}
                                        className="shrink-0 text-left text-[11px] font-bold text-[var(--accent)] underline underline-offset-2"
                                    >
                                        Tentar novamente
                                    </button>
                                </div>
                            )}
                        </section>

                        {salvar.isError && (
                            <div role="alert" className="rounded-xl border border-[var(--danger)]/25 bg-[var(--danger-soft)] px-4 py-3 text-xs leading-5 text-[var(--danger)]">
                                {salvar.error instanceof ApiError
                                    ? salvar.error.message
                                    : "Não foi possível salvar a ficha. Verifique a conexão com a API."}
                            </div>
                        )}

                        {salvar.isSuccess && !alteracoesPendentes && (
                            <div role="status" className="rounded-xl border border-[var(--success)]/25 bg-[var(--success-soft)] px-4 py-3 text-xs font-medium text-[var(--success)]">
                                Ficha sincronizada com sucesso.
                            </div>
                        )}

                        <div className="flex flex-col-reverse gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
                            <p className="max-w-lg text-[10px] leading-5 text-[var(--text-muted)]">
                                Os dados da ficha são persistidos no PostgreSQL. O navegador guarda apenas o horário da última gravação confirmada.
                            </p>
                            <button
                                type="button"
                                onClick={() => {
                                    if (!alunoSelecionadoId) return;
                                    salvar.mutate({
                                        alunoId: alunoSelecionadoId,
                                        snapshot: JSON.parse(JSON.stringify(avaliacao)) as typeof avaliacao,
                                    });
                                }}
                                disabled={salvar.isPending || autoSaveStatus === "saving" || !alteracoesPendentes}
                                aria-busy={salvar.isPending || autoSaveStatus === "saving"}
                                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--accent)] px-6 text-xs font-bold text-[var(--on-accent)] shadow-sm transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {salvar.isPending ? "Salvando no banco..." : "Salvar alterações"}
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
