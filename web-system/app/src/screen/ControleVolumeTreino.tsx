import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { BsArrowClockwise, BsGraphUp, BsPlayCircle, BsPlusCircle } from "react-icons/bs";
import { LoadingState } from "../components/LoadingState";
import VolumeCicloChart from "../components/VolumeCicloChart";
import type { Treino } from "../interface/interfaceTreino";
import { volumeAcompanhamentoService } from "../service/volumeAcompanhamentoService";

function hojeLocal() {
    return new Date(Date.now() - new Date().getTimezoneOffset() * 60_000)
        .toISOString()
        .slice(0, 10);
}

export default function ControleVolumeTreino({
    alunoId,
    treinos,
}: {
    alunoId: string;
    treinos: Treino[];
}) {
    const client = useQueryClient();
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");
    const ciclos = useQuery({
        queryKey: ["volume-acompanhamento", alunoId],
        queryFn: () => volumeAcompanhamentoService.listar(alunoId),
    });
    const iniciar = useMutation({
        mutationFn: (treinoId: string) =>
            volumeAcompanhamentoService.iniciar(alunoId, {
                treinoId,
                dataInicio: hojeLocal(),
            }),
        onSuccess: async ciclo => {
            setErro("");
            setSucesso(
                `Ciclo de ${ciclo.treinoNome} iniciado com ${ciclo.referenciaSeries} séries de referência.`,
            );
            await client.invalidateQueries({ queryKey: ["volume-acompanhamento", alunoId] });
        },
        onError: (error: Error) => {
            setSucesso("");
            setErro(error.message);
        },
    });

    const listaCiclos = ciclos.data ?? [];

    function iniciarCiclo(treino: Treino) {
        const atual = listaCiclos.find(ciclo => ciclo.treinoId === treino.id && !ciclo.encerrado);
        if (
            atual &&
            !window.confirm(
                `Já existe um ciclo em andamento para ${treino.nome}. Iniciar outro ciclo encerrará o atual, preservando todo o histórico. Deseja continuar?`,
            )
        )
            return;
        setErro("");
        setSucesso("");
        iniciar.mutate(treino.id);
    }

    return (
        <div className="space-y-5">
            <header>
                <p className="text-[9px] font-bold uppercase tracking-[.16em] text-[var(--accent-text)]">
                    Primeira métrica do controle contínuo
                </p>
                <h3 className="mt-1 text-[15px] font-semibold text-[var(--text-primary)]">
                    Evolução mensal do volume por treino
                </h3>
                <p className="mt-1 max-w-3xl text-[10px] leading-5 text-[var(--text-muted)]">
                    Cada ciclo guarda uma cópia da prescrição e uma referência fixa. No fechamento
                    de cada período, o aluno informa quantas séries consegue concluir em uma sessão
                    comparável ao treino de referência. A quantidade isolada não comprova ganho de
                    condicionamento; interprete junto de carga, repetições, esforço e contexto do
                    aluno. ADMIN/PERSONAL consulta e inicia ciclos; somente o próprio aluno registra
                    a autoavaliação pelo portal ou pelo aplicativo mobile.
                </p>
            </header>

            <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
                <div className="flex items-center gap-2">
                    <BsPlusCircle className="text-[var(--accent-text)]" />
                    <h4 className="text-[12px] font-semibold text-[var(--text-primary)]">
                        Iniciar acompanhamento
                    </h4>
                </div>
                <p className="mt-1 text-[9px] leading-4 text-[var(--text-muted)]">
                    A referência é calculada pela API somando as séries dos exercícios principais.
                    Variações são alternativas e não entram na soma.
                </p>
                {treinos.length ? (
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                        {treinos.map(treino => {
                            const total = treino.exercicios.reduce(
                                (sum, exercicio) =>
                                    sum + Math.max(0, Number(exercicio.series) || 0),
                                0,
                            );
                            const possuiCiclo = listaCiclos.some(
                                ciclo => ciclo.treinoId === treino.id && !ciclo.encerrado,
                            );
                            return (
                                <div
                                    key={treino.id}
                                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] p-3"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-[11px] font-semibold text-[var(--text-primary)]">
                                            {treino.nome || "Treino sem nome"}
                                        </p>
                                        <p className="mt-1 text-[9px] text-[var(--text-muted)]">
                                            {total} séries planejadas · {treino.exercicios.length}{" "}
                                            exercícios
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => iniciarCiclo(treino)}
                                        disabled={
                                            ciclos.isLoading ||
                                            ciclos.isError ||
                                            iniciar.isPending ||
                                            total <= 0
                                        }
                                        className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg bg-[var(--accent)] px-3 text-[10px] font-semibold text-white transition hover:brightness-105 disabled:opacity-45"
                                    >
                                        {possuiCiclo ? <BsArrowClockwise /> : <BsPlayCircle />}
                                        {possuiCiclo ? "Novo ciclo" : "Iniciar ciclo"}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="mt-3 rounded-xl border border-dashed border-[var(--border)] p-4 text-center text-[10px] text-[var(--text-muted)]">
                        Cadastre um treino com séries planejadas para iniciar o acompanhamento.
                    </p>
                )}
                {erro && (
                    <p
                        role="alert"
                        className="mt-3 rounded-lg bg-[var(--danger-soft)] p-2.5 text-[10px] text-[var(--danger)]"
                    >
                        {erro}
                    </p>
                )}
                {sucesso && (
                    <p
                        role="status"
                        className="ui-feedback-enter mt-3 rounded-lg bg-[var(--success-soft)] p-2.5 text-[10px] text-[var(--success)]"
                    >
                        {sucesso}
                    </p>
                )}
            </section>

            <div className="flex items-center justify-between gap-3">
                <div>
                    <h4 className="text-[12px] font-semibold text-[var(--text-primary)]">
                        Histórico dos ciclos
                    </h4>
                    <p className="mt-0.5 text-[9px] text-[var(--text-muted)]">
                        Ciclos anteriores permanecem disponíveis após uma nova referência.
                    </p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[9px] text-[var(--text-muted)]">
                    <BsGraphUp /> {listaCiclos.length} ciclos
                </span>
            </div>

            {ciclos.isLoading && <LoadingState label="Carregando histórico de volume..." />}
            {ciclos.isError && (
                <div
                    role="alert"
                    className="rounded-xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-4 text-[10px] text-[var(--danger)]"
                >
                    Não foi possível carregar os ciclos de volume.
                    <button
                        type="button"
                        onClick={() => void ciclos.refetch()}
                        className="ml-2 font-semibold underline"
                    >
                        Tentar novamente
                    </button>
                </div>
            )}
            {!ciclos.isLoading && !ciclos.isError && listaCiclos.length === 0 && (
                <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-secondary)] px-6 py-8 text-center">
                    <BsGraphUp className="mx-auto text-2xl text-[var(--text-muted)]" />
                    <p className="mt-3 text-[12px] font-semibold text-[var(--text-primary)]">
                        Nenhum ciclo iniciado
                    </p>
                    <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                        Inicie um ciclo acima para salvar a referência inicial deste treino.
                    </p>
                </div>
            )}
            <div className="space-y-4">
                {listaCiclos.map(ciclo => (
                    <VolumeCicloChart key={ciclo.id} ciclo={ciclo} />
                ))}
            </div>
        </div>
    );
}
