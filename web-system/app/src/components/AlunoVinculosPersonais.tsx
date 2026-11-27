import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BsArrowLeftRight, BsLink45Deg, BsPersonPlus, BsXCircle } from "react-icons/bs";
import {
    cadastroService,
    type PersonalResumoApi,
} from "../service/cadastroService";

export default function AlunoVinculosPersonais({
    alunoId,
    personais,
    convidadoPorPersonalNome,
}: {
    alunoId: string;
    personais: PersonalResumoApi[];
    convidadoPorPersonalNome?: string | null;
}) {
    const queryClient = useQueryClient();
    const [personalSelecionadoId, setPersonalSelecionadoId] = useState("");
    const [mensagem, setMensagem] = useState("");
    const vinculosQuery = useQuery({
        queryKey: ["aluno", "vinculos-personais", alunoId],
        queryFn: () => cadastroService.listarVinculosAluno(alunoId),
    });
    const ativos = useMemo(
        () => (vinculosQuery.data ?? []).filter(vinculo => vinculo.ativo),
        [vinculosQuery.data],
    );
    const personaisDisponiveis = personais.filter(
        personal => !ativos.some(vinculo => vinculo.personalId === personal.id),
    );
    const personalSelecionadoTemHistorico = (vinculosQuery.data ?? []).some(
        vinculo => !vinculo.ativo && vinculo.personalId === personalSelecionadoId,
    );
    const atualizar = async () => {
        await queryClient.invalidateQueries({ queryKey: ["aluno", "vinculos-personais", alunoId] });
        await queryClient.invalidateQueries({ queryKey: ["alunos"] });
    };
    const vincularMutation = useMutation({
        mutationFn: (personalId: string) => cadastroService.vincularAlunoPersonal(alunoId, personalId),
        onSuccess: async () => {
            setPersonalSelecionadoId("");
            setMensagem("Vínculo associado. O acesso compartilhado da equipe não foi alterado.");
            await atualizar();
        },
        onError: () => setMensagem("Não foi possível associar este personal ao aluno."),
    });
    const removerMutation = useMutation({
        mutationFn: (vinculoId: string) => cadastroService.atualizarVinculoPersonal(vinculoId, {
            ativo: false,
            motivo: "REORGANIZACAO_EQUIPE",
            detalhe: "Associação administrativa atualizada no controle do aluno.",
        }),
        onSuccess: async () => {
            setMensagem("Vínculo removido. O aluno continua visível para toda a equipe.");
            await atualizar();
        },
        onError: () => setMensagem("Não foi possível remover este vínculo."),
    });

    return (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[.15em] text-[var(--accent-text)]">Administração do aluno</p>
                    <h3 className="mt-1 text-[14px] font-semibold text-[var(--text-primary)]">Vínculos com personais</h3>
                    <p className="mt-1 max-w-[650px] text-[10px] leading-5 text-[var(--text-muted)]">
                        Associação para organização e rastreabilidade. Não define responsável exclusivo nem restringe quem pode visualizar ou editar o aluno.
                    </p>
                </div>
                <span className="rounded-full bg-[var(--success-soft)] px-2.5 py-1 text-[9px] font-semibold text-[var(--success)]">Equipe compartilhada</span>
            </div>

            <div className="mt-4 rounded-xl bg-[var(--surface-secondary)] p-3">
                <p className="text-[9px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Convite original</p>
                <p className="mt-1 text-[11px] font-semibold text-[var(--text-primary)]">
                    {convidadoPorPersonalNome || "Origem não registrada"}
                </p>
                <p className="mt-1 text-[9px] leading-4 text-[var(--text-muted)]">Este dado histórico não muda ao reorganizar os vínculos atuais.</p>
            </div>

            {vinculosQuery.isLoading ? (
                <p className="mt-4 text-[10px] text-[var(--text-muted)]">Carregando vínculos...</p>
            ) : vinculosQuery.isError ? (
                <p role="alert" className="mt-4 text-[10px] text-[var(--danger)]">Não foi possível carregar os vínculos deste aluno.</p>
            ) : (
                <div className="mt-4 space-y-2">
                    {ativos.length ? ativos.map(vinculo => (
                        <div key={vinculo.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] px-3 py-2.5">
                            <div className="flex min-w-0 items-center gap-2.5">
                                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent-text)]"><BsLink45Deg /></span>
                                <div className="min-w-0">
                                    <p className="truncate text-[11px] font-semibold text-[var(--text-primary)]">{vinculo.personalNome}</p>
                                    <p className="text-[9px] text-[var(--text-muted)]">Associado em {new Date(vinculo.criadoEm).toLocaleDateString("pt-BR")}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                disabled={removerMutation.isPending}
                                onClick={() => {
                                    if (window.confirm(`Remover o vínculo de ${vinculo.personalNome}? O histórico do aluno e o acesso da equipe serão preservados.`)) {
                                        setMensagem("");
                                        removerMutation.mutate(vinculo.id);
                                    }
                                }}
                                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--border)] px-2.5 text-[9px] font-semibold text-[var(--text-secondary)] hover:border-[var(--danger)] hover:text-[var(--danger)] disabled:opacity-50"
                            >
                                <BsXCircle /> Remover vínculo
                            </button>
                        </div>
                    )) : (
                        <p className="rounded-xl border border-dashed border-[var(--border-strong)] px-3 py-4 text-center text-[10px] text-[var(--text-muted)]">Nenhum vínculo ativo. O aluno continua acessível pela equipe.</p>
                    )}
                    {(vinculosQuery.data ?? []).some(vinculo => !vinculo.ativo) ? (
                        <details className="rounded-xl border border-[var(--border)] px-3 py-2">
                            <summary className="cursor-pointer text-[9px] font-semibold text-[var(--text-muted)]">Ver vínculos anteriores ({(vinculosQuery.data ?? []).filter(vinculo => !vinculo.ativo).length})</summary>
                            <div className="mt-2 space-y-1">
                                {(vinculosQuery.data ?? []).filter(vinculo => !vinculo.ativo).map(vinculo => (
                                    <div key={vinculo.id} className="flex flex-wrap items-center justify-between gap-2 py-1 text-[9px] text-[var(--text-muted)]">
                                        <span>{vinculo.personalNome} · {new Date(vinculo.criadoEm).toLocaleDateString("pt-BR")}</span>
                                        <button type="button" disabled={vincularMutation.isPending} onClick={() => vincularMutation.mutate(vinculo.personalId)} className="font-semibold text-[var(--accent-text)] hover:underline">Reativar</button>
                                    </div>
                                ))}
                            </div>
                        </details>
                    ) : null}
                </div>
            )}

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <select value={personalSelecionadoId} onChange={event => setPersonalSelecionadoId(event.target.value)} className="h-9 min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-[10px] text-[var(--text-primary)]">
                    <option value="">Selecionar personal para associar</option>
                    {personaisDisponiveis.map(personal => <option key={personal.id} value={personal.id}>{personal.nomeCompleto}</option>)}
                </select>
                <button
                    type="button"
                    disabled={!personalSelecionadoId || vincularMutation.isPending}
                    onClick={() => { setMensagem(""); vincularMutation.mutate(personalSelecionadoId); }}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-3 text-[10px] font-semibold text-[var(--on-accent)] disabled:opacity-50"
                >
                    {personalSelecionadoTemHistorico ? <BsArrowLeftRight /> : <BsPersonPlus />}
                    {vincularMutation.isPending ? "Salvando..." : "Associar personal"}
                </button>
            </div>
            {mensagem ? <p role="status" className="mt-3 text-[10px] text-[var(--text-secondary)]">{mensagem}</p> : null}
        </section>
    );
}
