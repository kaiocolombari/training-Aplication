import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { BsCheck2Circle, BsClipboard2Pulse } from "react-icons/bs";
import { LoadingState } from "../components/LoadingState";
import VolumeCicloChart from "../components/VolumeCicloChart";
import { volumeAcompanhamentoService } from "../service/volumeAcompanhamentoService";

function dataPt(value: string) {
    const date = new Date(`${value.slice(0, 10)}T12:00:00`);
    return Number.isNaN(date.getTime())
        ? value
        : date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AcompanhamentoVolumePortal({ alunoId }: { alunoId: string | null }) {
    const client = useQueryClient();
    const [meses, setMeses] = useState<Record<string, string>>({});
    const [series, setSeries] = useState<Record<string, string>>({});
    const [observacoes, setObservacoes] = useState<Record<string, string>>({});
    const [erro, setErro] = useState("");
    const ciclos = useQuery({
        queryKey: ["volume-acompanhamento", alunoId],
        queryFn: () => volumeAcompanhamentoService.listar(alunoId!),
        enabled: Boolean(alunoId),
        refetchInterval: 60_000,
    });
    const registrar = useMutation({
        mutationFn: ({
            cicloId,
            mesCiclo,
            seriesInformadas,
            observacao,
        }: {
            cicloId: string;
            mesCiclo: number;
            seriesInformadas: number;
            observacao?: string;
        }) =>
            volumeAcompanhamentoService.registrar(cicloId, {
                mesCiclo,
                seriesInformadas,
                observacao,
            }),
        onSuccess: async (_ciclo, variables) => {
            setErro("");
            setMeses(current => ({ ...current, [variables.cicloId]: "" }));
            setSeries(current => ({ ...current, [variables.cicloId]: "" }));
            setObservacoes(current => ({ ...current, [variables.cicloId]: "" }));
            await client.invalidateQueries({ queryKey: ["volume-acompanhamento", alunoId] });
        },
        onError: (error: Error) => setErro(error.message),
    });

    return (
        <section className="mt-10 space-y-5 text-left">
            <div>
                <p className="text-[10px] font-bold uppercase tracking-[.2em] text-emerald-300">
                    Seu acompanhamento
                </p>
                <h2 className="mt-2 text-xl font-semibold">Evolução mensal dos treinos</h2>
                <p className="mt-2 text-xs leading-6 text-white/55">
                    Ao final de cada período, informe quantas séries você consegue concluir em uma
                    sessão comparável ao treino de referência. Não some todas as sessões do mês.
                    Esse número acompanha o volume por sessão e, sozinho, não determina ganho
                    físico.
                </p>
            </div>

            {!alunoId && (
                <p className="rounded-xl border border-white/10 p-4 text-xs text-white/50">
                    Não foi possível identificar seu perfil de aluno nesta sessão.
                </p>
            )}
            {ciclos.isLoading && (
                <LoadingState label="Carregando seus ciclos..." className="justify-start py-4" />
            )}
            {ciclos.isError && (
                <p
                    role="alert"
                    className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-4 text-xs text-rose-200"
                >
                    Não foi possível carregar seu acompanhamento. Atualize a página e tente
                    novamente.
                </p>
            )}
            {!ciclos.isLoading && !ciclos.isError && (ciclos.data ?? []).length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[.025] px-5 py-8 text-center">
                    <BsClipboard2Pulse className="mx-auto text-2xl text-white/30" />
                    <p className="mt-3 text-sm font-semibold text-white/80">
                        Seu primeiro ciclo ainda não começou
                    </p>
                    <p className="mt-1 text-xs leading-5 text-white/45">
                        Quando seu Personal iniciar o acompanhamento de um treino, a referência e os
                        registros aparecerão aqui.
                    </p>
                </div>
            )}

            {erro && (
                <p role="alert" className="rounded-lg bg-rose-400/10 p-3 text-xs text-rose-200">
                    {erro}
                </p>
            )}
            {registrar.isSuccess && (
                <p
                    role="status"
                    className="ui-feedback-enter flex items-center gap-2 rounded-lg bg-emerald-300/10 p-3 text-xs text-emerald-200"
                >
                    <BsCheck2Circle /> Registro mensal salvo. Seu histórico foi atualizado.
                </p>
            )}

            <div className="space-y-4">
                {(ciclos.data ?? []).map(ciclo => {
                    const disponiveis = ciclo.meses.filter(mes => mes.podeRegistrar);
                    const proximo = ciclo.meses.find(
                        mes => mes.mesCiclo > 1 && mes.series === null,
                    );
                    const mesSelecionado = Number(meses[ciclo.id] || disponiveis[0]?.mesCiclo || 0);
                    return (
                        <article key={ciclo.id} className="space-y-3">
                            <VolumeCicloChart ciclo={ciclo} dark />
                            {!ciclo.encerrado && disponiveis.length > 0 ? (
                                <form
                                    onSubmit={event => {
                                        event.preventDefault();
                                        const quantidade = Number(series[ciclo.id]);
                                        if (
                                            !Number.isInteger(quantidade) ||
                                            quantidade < 0 ||
                                            quantidade > 1000
                                        ) {
                                            setErro(
                                                "Informe um número inteiro entre 0 e 1000 séries.",
                                            );
                                            return;
                                        }
                                        setErro("");
                                        registrar.mutate({
                                            cicloId: ciclo.id,
                                            mesCiclo: mesSelecionado,
                                            seriesInformadas: quantidade,
                                            observacao: observacoes[ciclo.id]?.trim() || undefined,
                                        });
                                    }}
                                    className="space-y-3 rounded-2xl border border-emerald-300/20 bg-emerald-300/[.045] p-4 sm:p-5"
                                >
                                    <div>
                                        <p className="text-[9px] font-bold uppercase tracking-[.16em] text-emerald-300">
                                            Fechamento mensal disponível
                                        </p>
                                        <h3 className="mt-1 text-sm font-semibold text-white">
                                            Como foi sua capacidade neste período?
                                        </h3>
                                        <p className="mt-1 text-[10px] leading-5 text-white/50">
                                            Use o mesmo treino de referência como base. Este número
                                            representa uma sessão comparável, não a soma de todos os
                                            treinos realizados no mês.
                                        </p>
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <label className="grid gap-1.5 text-[10px] font-semibold text-white/65">
                                            Período
                                            <select
                                                required
                                                value={mesSelecionado || ""}
                                                onChange={event =>
                                                    setMeses(current => ({
                                                        ...current,
                                                        [ciclo.id]: event.target.value,
                                                    }))
                                                }
                                                className="h-10 rounded-lg border border-white/10 bg-[#191d1b] px-3 text-xs text-white"
                                            >
                                                {disponiveis.map(mes => (
                                                    <option key={mes.mesCiclo} value={mes.mesCiclo}>
                                                        Mês {mes.mesCiclo} · {dataPt(mes.inicio)} a{" "}
                                                        {dataPt(mes.fim)}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                        <label className="grid gap-1.5 text-[10px] font-semibold text-white/65">
                                            Total de séries que consegue concluir
                                            <input
                                                required
                                                type="number"
                                                min={0}
                                                max={1000}
                                                step={1}
                                                value={series[ciclo.id] ?? ""}
                                                onChange={event =>
                                                    setSeries(current => ({
                                                        ...current,
                                                        [ciclo.id]: event.target.value,
                                                    }))
                                                }
                                                placeholder={`Referência: ${ciclo.referenciaSeries}`}
                                                className="h-10 rounded-lg border border-white/10 bg-[#191d1b] px-3 text-xs text-white outline-none focus:border-emerald-300"
                                            />
                                        </label>
                                    </div>
                                    <label className="grid gap-1.5 text-[10px] font-semibold text-white/65">
                                        Observação (opcional)
                                        <textarea
                                            rows={2}
                                            maxLength={500}
                                            value={observacoes[ciclo.id] ?? ""}
                                            onChange={event =>
                                                setObservacoes(current => ({
                                                    ...current,
                                                    [ciclo.id]: event.target.value,
                                                }))
                                            }
                                            placeholder="Conte se houve alguma mudança importante na execução..."
                                            className="resize-y rounded-lg border border-white/10 bg-[#191d1b] px-3 py-2 text-xs text-white outline-none focus:border-emerald-300"
                                        />
                                    </label>
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <span className="text-[9px] text-white/40">
                                            Cada período aceita um único registro.
                                        </span>
                                        <button
                                            type="submit"
                                            disabled={
                                                registrar.isPending || !series[ciclo.id]?.trim()
                                            }
                                            aria-busy={registrar.isPending}
                                            className="h-10 rounded-lg bg-emerald-300 px-5 text-[10px] font-bold text-[#102019] disabled:opacity-50"
                                        >
                                            {registrar.isPending ? "Salvando..." : "Registrar mês"}
                                        </button>
                                    </div>
                                </form>
                            ) : !ciclo.encerrado ? (
                                <div className="rounded-xl border border-white/10 bg-white/[.025] p-4">
                                    <p className="text-xs font-semibold text-white/75">
                                        Próximo fechamento
                                    </p>
                                    <p className="mt-1 text-[10px] leading-5 text-white/45">
                                        {proximo
                                            ? `O mês ${proximo.mesCiclo} poderá ser registrado após ${dataPt(proximo.fim)}.`
                                            : "Todos os períodos disponíveis já foram registrados."}
                                    </p>
                                </div>
                            ) : null}
                        </article>
                    );
                })}
            </div>
        </section>
    );
}
