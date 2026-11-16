import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/authContext";
import { cadastroAlunoService } from "../service/cadastroAlunoService";
import { cadastroService } from "../service/cadastroService";
import { perguntasCadastro } from "./cadastroPerguntas";
import { ApiError } from "../service/api";
import { LoadingState } from "../components/LoadingState";

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
        mutationFn: (alunoId: string) =>
            cadastroAlunoService.aprovar(
                alunoId,
                user?.tipo === "ADMIN" ? personalIdAdmin : undefined,
            ),
        onSuccess: async () => {
            setErro("");
            setSucesso("Cadastro aprovado. As respostas foram removidas do banco de dados.");
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["solicitacoes-cadastro"] }),
                queryClient.invalidateQueries({ queryKey: ["solicitacoes-cadastro", "resumo"] }),
                queryClient.invalidateQueries({ queryKey: ["alunos"] }),
                queryClient.invalidateQueries({ queryKey: ["relatorios"] }),
            ]);
        },
        onError: error => {
            setSucesso("");
            setErro(
                error instanceof ApiError ? error.message : "Não foi possível aprovar o cadastro.",
            );
        },
    });
    const quantidade = solicitacoes.data?.length ?? 0;
    const aguardandoFormulario = (solicitacoes.data ?? []).filter(
        item => !item.formularioEnviado,
    ).length;
    const titulos = useMemo(
        () => new Map(perguntasCadastro.map(pergunta => [pergunta.id, pergunta.titulo])),
        [],
    );

    return (
        <section className="w-full max-w-[1100px]">
            <div className="mb-7 border-b border-[var(--border)] pb-6">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[.16em] text-[var(--accent-text)]">
                    Workspace / Entrada de alunos
                </p>
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="text-[30px] font-semibold tracking-[-.045em] text-[var(--text-primary)]">
                            Solicitações de cadastro
                        </h1>
                        <p className="mt-1.5 text-[13px] text-[var(--text-secondary)]">
                            Analise as respostas enviadas antes de liberar o acesso do aluno.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)]">
                            {quantidade} em análise
                        </span>
                        {aguardandoFormulario > 0 && (
                            <span className="rounded-full bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-600">
                                {aguardandoFormulario} aguardando formulário
                            </span>
                        )}
                    </div>
                </div>
            </div>
            {user?.tipo === "ADMIN" && (
                <label className="mb-5 block max-w-sm text-xs font-semibold text-[var(--text-secondary)]">
                    Vincular aprovações ao personal
                    <select
                        value={personalIdAdmin}
                        onChange={event => setPersonalAdminId(event.target.value)}
                        className="mt-2 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--input-bg)] px-3 py-2.5 text-sm text-[var(--text-primary)]"
                    >
                        <option value="">Selecione um personal</option>
                        {(personais.data ?? []).map(personal => (
                            <option key={personal.id} value={personal.id}>
                                {personal.nomeCompleto}
                            </option>
                        ))}
                    </select>
                </label>
            )}
            {erro && (
                <p
                    role="alert"
                    className="mb-4 rounded-lg bg-[var(--danger-soft)] p-3 text-xs text-[var(--danger)]"
                >
                    {erro}
                </p>
            )}
            {sucesso && (
                <p className="mb-4 rounded-lg bg-[var(--accent-soft)] p-3 text-xs text-[var(--accent-text)]">
                    {sucesso}
                </p>
            )}
            {solicitacoes.isLoading && (
                <LoadingState label="Carregando solicitações..." className="py-10" />
            )}
            {solicitacoes.isError && (
                <p className="py-10 text-center text-sm text-[var(--danger)]">
                    Não foi possível carregar as solicitações.
                </p>
            )}
            {!solicitacoes.isLoading && quantidade === 0 && (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-6 py-14 text-center">
                    <span className="text-2xl text-[var(--text-muted)]">✓</span>
                    <h2 className="mt-3 text-sm font-semibold text-[var(--text-primary)]">
                        Nenhuma solicitação pendente
                    </h2>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                        Novos cadastros enviados aparecerão aqui.
                    </p>
                </div>
            )}
            <div className="ui-stagger space-y-4">
                {(solicitacoes.data ?? []).map(solicitacao => (
                    <article
                        key={solicitacao.alunoId}
                        className="ui-card rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6"
                    >
                        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border)] pb-4">
                            <div>
                                <h2 className="text-base font-semibold text-[var(--text-primary)]">
                                    {solicitacao.nomeCompleto}
                                </h2>
                                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                                    {solicitacao.email}
                                    {solicitacao.telefone ? ` · ${solicitacao.telefone}` : ""}
                                </p>
                                <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                                    Criado em{" "}
                                    {new Date(solicitacao.criadoEm).toLocaleString("pt-BR")}
                                </p>
                                {solicitacao.formularioEnviado && solicitacao.enviadaEm && (
                                    <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                                        Formulário enviado em{" "}
                                        {new Date(solicitacao.enviadaEm).toLocaleString("pt-BR")}
                                    </p>
                                )}
                            </div>
                            <span
                                className={`rounded-full px-3 py-1 text-[10px] font-bold ${solicitacao.formularioEnviado ? "bg-amber-500/10 text-amber-600" : "bg-sky-500/10 text-sky-600"}`}
                            >
                                {solicitacao.formularioEnviado
                                    ? "Pronto para análise"
                                    : "Aguardando formulário"}
                            </span>
                        </div>
                        {solicitacao.formularioEnviado ? (
                            <div className="grid gap-3 py-4 sm:grid-cols-2">
                                {Object.entries(solicitacao.respostas).map(([chave, valor]) => (
                                    <div
                                        key={chave}
                                        className="rounded-xl bg-[var(--surface-secondary)] p-3"
                                    >
                                        <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
                                            {titulos.get(chave) ?? chave}
                                        </p>
                                        <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-[var(--text-primary)]">
                                            {formatarResposta(valor)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="my-4 rounded-xl border border-sky-500/20 bg-sky-500/5 p-4">
                                <p className="text-xs font-semibold text-[var(--text-primary)]">
                                    O aluno ainda não enviou o formulário inicial.
                                </p>
                                <p className="mt-1 text-[11px] leading-5 text-[var(--text-secondary)]">
                                    A conta está registrada e aparece na fila de acompanhamento, mas
                                    a aprovação fica bloqueada até o envio das respostas.
                                </p>
                            </div>
                        )}
                        <div className="flex justify-end border-t border-[var(--border)] pt-4">
                            <button
                                type="button"
                                disabled={
                                    !solicitacao.formularioEnviado ||
                                    aprovar.isPending ||
                                    (user?.tipo === "ADMIN" && !personalIdAdmin)
                                }
                                aria-busy={aprovar.isPending}
                                onClick={() => aprovar.mutate(solicitacao.alunoId)}
                                className="rounded-lg bg-[var(--accent)] px-4 py-2.5 text-xs font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {aprovar.isPending ? "Aprovando..." : "Aprovar cadastro"}
                            </button>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}
