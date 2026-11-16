import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/authContext";
import { cadastroAlunoService } from "../service/cadastroAlunoService";
import { cadastroService } from "../service/cadastroService";
import { perguntasCadastro } from "./cadastroPerguntas";
import { ApiError } from "../service/api";

function formatarResposta(valor: unknown): string {
    if (valor === null || valor === undefined || valor === "") return "Não informado";
    if (Array.isArray(valor)) return valor.map(formatarResposta).join(", ");
    if (typeof valor === "object") return JSON.stringify(valor);
    return String(valor);
}

export default function SolicitacoesCadastro() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [personalAdminId, setPersonalAdminId] = useState("");
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");
    const solicitacoes = useQuery({
        queryKey: ["solicitacoes-cadastro"],
        queryFn: cadastroAlunoService.listarSolicitacoes,
    });
    const personais = useQuery({
        queryKey: ["personais"],
        queryFn: cadastroService.listarPersonais,
        enabled: user?.tipo === "ADMIN",
    });
    const personalIdAdmin = personalAdminId || personais.data?.[0]?.id || "";
    const aprovar = useMutation({
        mutationFn: (alunoId: string) => cadastroAlunoService.aprovar(alunoId, user?.tipo === "ADMIN" ? personalIdAdmin : undefined),
        onSuccess: async () => {
            setErro("");
            setSucesso("Cadastro aprovado. As respostas foram removidas do banco de dados.");
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["solicitacoes-cadastro"] }),
                queryClient.invalidateQueries({ queryKey: ["alunos"] }),
            ]);
        },
        onError: error => {
            setSucesso("");
            setErro(error instanceof ApiError ? error.message : "Não foi possível aprovar o cadastro.");
        },
    });
    const quantidade = solicitacoes.data?.length ?? 0;
    const titulos = useMemo(() => new Map(perguntasCadastro.map(pergunta => [pergunta.id, pergunta.titulo])), []);

    return (
        <section className="w-full max-w-[1100px]">
            <div className="mb-7 border-b border-[var(--border)] pb-6">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[.16em] text-[var(--accent-text)]">Workspace / Entrada de alunos</p>
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="text-[30px] font-semibold tracking-[-.045em] text-[var(--text-primary)]">Solicitações de cadastro</h1>
                        <p className="mt-1.5 text-[13px] text-[var(--text-secondary)]">Analise as respostas enviadas antes de liberar o acesso do aluno.</p>
                    </div>
                    <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)]">{quantidade} pendente(s)</span>
                </div>
            </div>
            {user?.tipo === "ADMIN" && (
                <label className="mb-5 block max-w-sm text-xs font-semibold text-[var(--text-secondary)]">
                    Vincular aprovações ao personal
                    <select value={personalIdAdmin} onChange={event => setPersonalAdminId(event.target.value)} className="mt-2 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-[var(--text-primary)]">
                        <option value="">Selecione um personal</option>
                        {(personais.data ?? []).map(personal => <option key={personal.id} value={personal.id}>{personal.nomeCompleto}</option>)}
                    </select>
                </label>
            )}
            {erro && <p role="alert" className="mb-4 rounded-lg bg-[var(--danger-soft)] p-3 text-xs text-[var(--danger)]">{erro}</p>}
            {sucesso && <p className="mb-4 rounded-lg bg-[var(--accent-soft)] p-3 text-xs text-[var(--accent-text)]">{sucesso}</p>}
            {solicitacoes.isLoading && <p className="py-10 text-center text-sm text-[var(--text-muted)]">Carregando solicitações...</p>}
            {solicitacoes.isError && <p className="py-10 text-center text-sm text-[var(--danger)]">Não foi possível carregar as solicitações.</p>}
            {!solicitacoes.isLoading && quantidade === 0 && (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-6 py-14 text-center">
                    <span className="text-2xl text-[var(--text-muted)]">✓</span>
                    <h2 className="mt-3 text-sm font-semibold text-[var(--text-primary)]">Nenhuma solicitação pendente</h2>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">Novos cadastros enviados aparecerão aqui.</p>
                </div>
            )}
            <div className="space-y-4">
                {(solicitacoes.data ?? []).map(solicitacao => (
                    <article key={solicitacao.alunoId} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
                        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border)] pb-4">
                            <div>
                                <h2 className="text-base font-semibold text-[var(--text-primary)]">{solicitacao.nomeCompleto}</h2>
                                <p className="mt-1 text-xs text-[var(--text-secondary)]">{solicitacao.email}{solicitacao.telefone ? ` · ${solicitacao.telefone}` : ""}</p>
                                <p className="mt-1 text-[10px] text-[var(--text-muted)]">Enviado em {new Date(solicitacao.enviadaEm).toLocaleString("pt-BR")}</p>
                            </div>
                            <span className="rounded-full bg-amber-500/10 px-3 py-1 text-[10px] font-bold text-amber-600">Aguardando análise</span>
                        </div>
                        <div className="grid gap-3 py-4 sm:grid-cols-2">
                            {Object.entries(solicitacao.respostas).map(([chave, valor]) => (
                                <div key={chave} className="rounded-xl bg-[var(--surface-secondary)] p-3">
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">{titulos.get(chave) ?? chave}</p>
                                    <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-[var(--text-primary)]">{formatarResposta(valor)}</p>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end border-t border-[var(--border)] pt-4">
                            <button type="button" disabled={aprovar.isPending || (user?.tipo === "ADMIN" && !personalIdAdmin)} onClick={() => aprovar.mutate(solicitacao.alunoId)} className="rounded-lg bg-[var(--accent)] px-4 py-2.5 text-xs font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
                                {aprovar.isPending ? "Aprovando..." : "Aprovar cadastro"}
                            </button>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}
