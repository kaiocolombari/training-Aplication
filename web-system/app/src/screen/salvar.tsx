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
        return () => { componenteMontado.current = false; };
    }, []);

    const salvar = useMutation({
        onMutate: ({ alunoId }: { alunoId: string; snapshot: typeof avaliacao }) => {
            if (isAlunoSelecionado(alunoId)) {
                setAutoSaveStatus("saving");
                setAutoSaveError(null);
            }
        },
        mutationFn: async ({ alunoId, snapshot }: { alunoId: string; snapshot: typeof avaliacao }) => {
            return salvarFicha(alunoId, snapshot);
        },
        onSuccess: (dadosAtualizados, variables) => {
            if (isAlunoSelecionado(variables.alunoId)) {
                const estadoMudouDuranteSave = componenteMontado.current &&
                    JSON.stringify(estadoAtualRef.current.avaliacao) !== JSON.stringify(variables.snapshot);
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
                setAutoSaveError(error instanceof Error ? error.message : "Não foi possível salvar a ficha.");
            }
        },
    });

    if (!alunoSelecionadoId) return <Navigate to="/" replace />;

    const telasAlteradas = Object.entries(alteracoesPorTela)
        .filter(([, alterada]) => alterada)
        .map(([tela]) => tela);

    return (
        <main className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8">
            <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a85f60]">Persistência da ficha</p>
                    <h1 className="mt-2 text-2xl font-bold text-zinc-800">Salvar alterações</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                        Os dados são enviados à API e persistidos no PostgreSQL. As medidas e informações clínicas não ficam salvas no armazenamento local do navegador.
                    </p>
                </div>
                <Link to="/" className="rounded-lg border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50">
                    Voltar ao painel
                </Link>
            </div>

            <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
                <div className="flex items-center justify-between gap-4 border-b border-zinc-100 pb-4">
                    <div>
                        <h2 className="text-sm font-bold text-zinc-800">{avaliacao.aluno.nomeCompleto || "Aluno selecionado"}</h2>
                        <p className="mt-1 text-xs text-zinc-500">{avaliacao.aluno.email}</p>
                    </div>
                    <span className={"rounded-full px-3 py-1 text-[10px] font-bold " + (alteracoesPendentes ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700")}>
                        {alteracoesPendentes ? "Alterações pendentes" : "Tudo salvo"}
                    </span>
                </div>

                <div className="py-5">
                    <p className="text-xs font-semibold text-zinc-700">Seções alteradas</p>
                    {telasAlteradas.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {telasAlteradas.map(tela => (
                                <span key={tela} className="rounded-lg bg-zinc-100 px-3 py-1.5 text-[10px] font-medium text-zinc-600">
                                    {nomesTelas[tela] ?? tela}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="mt-2 text-xs text-zinc-500">Nenhuma alteração local pendente.</p>
                    )}
                </div>

                <div className="mb-5 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h3 className="text-xs font-bold text-zinc-800">Salvamento automático</h3>
                            <p className="mt-1 text-[11px] leading-5 text-zinc-500">
                                Salva a ficha no banco depois que você parar de editar.
                            </p>
                        </div>
                        <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-zinc-700">
                            <input
                                type="checkbox"
                                checked={autoSaveEnabled}
                                onChange={event => setAutoSaveEnabled(event.target.checked)}
                                className="h-4 w-4 accent-[#a85f60]"
                            />
                            Ativar
                        </label>
                    </div>

                    {autoSaveEnabled && (
                        <label className="mt-4 flex flex-wrap items-center gap-3 text-[11px] font-medium text-zinc-600">
                            Salvar após
                            <select
                                value={autoSaveDelayMs}
                                onChange={event => setAutoSaveDelayMs(Number(event.target.value))}
                                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700 outline-none focus:border-[#a85f60]"
                            >
                                <option value={2000}>2 segundos</option>
                                <option value={4000}>4 segundos</option>
                                <option value={6000}>6 segundos</option>
                                <option value={10000}>10 segundos</option>
                            </select>
                            de inatividade
                        </label>
                    )}

                    <p role="status" className="mt-3 text-[11px] font-medium text-zinc-600">
                        {!autoSaveEnabled && "Desativado. Você pode continuar salvando manualmente."}
                        {autoSaveEnabled && autoSaveStatus === "idle" && "Ativo. Aguardando alterações."}
                        {autoSaveEnabled && autoSaveStatus === "waiting" && `Salvando ${autoSaveDelayMs / 1000}s após a última alteração...`}
                        {autoSaveEnabled && autoSaveStatus === "saving" && "Salvando no banco..."}
                        {autoSaveEnabled && autoSaveStatus === "saved" && `Salvo${autoSaveLastSavedAt ? ` às ${autoSaveLastSavedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : ""}.`}
                        {autoSaveEnabled && autoSaveStatus === "error" && "Não foi possível salvar automaticamente."}
                    </p>
                    {autoSaveEnabled && autoSaveError && (
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                            <p role="alert" className="text-[11px] text-red-600">{autoSaveError} Você ainda pode salvar manualmente.</p>
                            <button
                                type="button"
                                onClick={() => { setAutoSaveError(null); setAutoSaveStatus("idle"); }}
                                className="text-[11px] font-bold text-[#a85f60] underline underline-offset-2"
                            >
                                Tentar novamente
                            </button>
                        </div>
                    )}
                </div>

                {salvar.isError && (
                    <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                        {salvar.error instanceof ApiError ? salvar.error.message : "Não foi possível salvar a ficha. Verifique a conexão com a API."}
                    </div>
                )}

                {salvar.isSuccess && (
                    <div role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
                        Ficha sincronizada com sucesso.
                    </div>
                )}

                <div className="flex flex-wrap items-center justify-end gap-3 border-t border-zinc-100 pt-5">
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
                        className="inline-flex h-11 items-center justify-center rounded-xl bg-[#a85f60] px-6 text-xs font-bold text-white shadow-sm transition hover:bg-[#914f50] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {salvar.isPending ? "Salvando..." : "Salvar no PostgreSQL"}
                    </button>
                </div>
            </section>
        </main>
    );
}
