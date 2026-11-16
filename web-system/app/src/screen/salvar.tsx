import { Link, Navigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAvaliacao } from "../context/avaliacaoContext";
import { salvarFicha } from "../service/cadastroService";
import { ApiError } from "../service/api";

export default function SalvarFicha() {
    const {
        avaliacao,
        alunoSelecionadoId,
        alteracoesPendentes,
        alteracoesPorTela,
        carregarAvaliacao,
    } = useAvaliacao();
    const queryClient = useQueryClient();

    const salvar = useMutation({
        mutationFn: async () => {
            if (!alunoSelecionadoId) throw new Error("Selecione um aluno antes de salvar.");
            return salvarFicha(alunoSelecionadoId, avaliacao);
        },
        onSuccess: (dadosAtualizados) => {
            carregarAvaliacao(dadosAtualizados, alunoSelecionadoId ?? undefined);
            void queryClient.invalidateQueries({ queryKey: ["alunos"] });
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
                                    {tela}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="mt-2 text-xs text-zinc-500">Nenhuma alteração local pendente.</p>
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
                        onClick={() => void salvar.mutateAsync()}
                        disabled={salvar.isPending || !alteracoesPendentes}
                        className="inline-flex h-11 items-center justify-center rounded-xl bg-[#a85f60] px-6 text-xs font-bold text-white shadow-sm transition hover:bg-[#914f50] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {salvar.isPending ? "Salvando..." : "Salvar no PostgreSQL"}
                    </button>
                </div>
            </section>
        </main>
    );
}
