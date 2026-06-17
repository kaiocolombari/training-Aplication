import { useState, useEffect, useMemo } from "react";
import navTool from "../components/navTool";
import { useAvaliacao } from "../context/avaliacaoContext";



export default function periodizacao() {
    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = "";
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };

    }, []);

    const [dataInicio, setDataInicio] = useState(new Date());
    const { avaliacao, setAvaliacao } = useAvaliacao();

    let exercicios = avaliacao.treino.map((treino) => treino.nome);
    console.log(exercicios);

    const formatDateInput = (date: Date) => {
        return date.toISOString().split("T")[0];
    };

    const opcoesTreino = avaliacao.treino.map((treino) => ({
        id: treino.id,
        nome: treino.nome,
    }));
    const nomesDias = [
        "Dom",
        "Seg",
        "Ter",
        "Qua",
        "Qui",
        "Sex",
        "Sab",
    ];

    const atualizarDia = (
        semanaIndex: number,
        diaIndex: number,
        slotIndex: number,
        treinoId: string
    ) => {
        setAvaliacao((prev) => {
            const semanas = [...prev.periodizacao.semanas];

            const treinoIds = [
                ...semanas[semanaIndex].dias[diaIndex].treinoIds,
            ];

            treinoIds[slotIndex] = treinoId;

            semanas[semanaIndex].dias[diaIndex] = {
                ...semanas[semanaIndex].dias[diaIndex],
                treinoIds,
            };

            return {
                ...prev,
                periodizacao: {
                    ...prev.periodizacao,
                    semanas,
                },
            };
        });
    };

    const datasPeriodizacao = useMemo(() => {
        if (isNaN(dataInicio.getTime())) {
            return [];
        }

        return Array.from({ length: 12 }, (_, semanaIndex) =>
            Array.from({ length: 7 }, (_, diaIndex) => {
                const data = new Date(dataInicio);

                data.setDate(
                    data.getDate() +
                    semanaIndex * 7 +
                    diaIndex
                );

                return {
                    data,
                    texto: `${data.toLocaleDateString("pt-BR")} (${nomesDias[data.getDay()]})`,
                };
            })
        );
    }, [dataInicio]);

    const dataFim = useMemo(() => {
        const fim = new Date(dataInicio);

        fim.setDate(fim.getDate() + 83);

        return fim;
    }, [dataInicio]);

    const calcularQuilagemTreino = (treinoId: string) => {
        const treino = avaliacao.treino.find(
            (t) => t.id === treinoId
        );

        if (!treino) return 0;

        return treino.exercicios.reduce(
            (total, exercicio) => {
                const carga =
                    Number(exercicio.carga) || 0;

                return (
                    total + carga
                );
            },
            0
        );
    };

    const calcularQuilagemSemana = (
        semanaIndex: number
    ) => {
        const semana =
            avaliacao.periodizacao.semanas[
            semanaIndex
            ];

        let total = 0;

        semana.dias.forEach((dia) => {
            dia.treinoIds.forEach((treinoId) => {
                total += calcularQuilagemTreino(
                    treinoId
                );
            });
        });

        return total;
    };

    return (
        <main className="h-full bg-[#ececec] p-3 md:p-5">
            <hr className="mb-5 my-4 rounded-2xl border-[3px] border-zinc-400" />

            <div className="flex flex-col">
                <h1 className="mb-3 text-3xl font-bold italic text-zinc-600">
                    Periodização do Treino
                </h1>
            </div>

            <div className="mt-10 flex flex-col">
                <h1 className="w-full border-b-2 border-[#b88b8b] pb-1 text-lg font-bold italic uppercase tracking-wide text-[#a85f60]">
                    Informações do Treino
                </h1>
            </div>
            <div className="grid grid-cols-[0.3fr_0.3fr_1.5fr_0.3fr_0.3fr] gap-3 mt-2">
                <div className="pb-1 py-1 text-x font-bold italic uppercase text-zinc-600 flex flex-col gap-2">
                    <text className="text-center">Início</text>
                    <input
                        type="date"
                        className="h-9 w-full border border-zinc-950 bg-white px-3 text-center text-xl font-medium text-zinc-700 outline-none transition focus:border-zinc-600"
                        value={formatDateInput(dataInicio)}
                        onChange={(e) => {
                            setDataInicio(new Date(`${e.target.value}T00:00:00`));
                        }}
                    />
                </div>
                <div className="pb-1 py-1 text-x font-bold italic uppercase text-zinc-600 flex flex-col gap-2">
                    <text className="text-center">Término</text>
                    <input
                        type="date"
                        value={formatDateInput(dataFim)}
                        readOnly
                        className="h-9 w-full border border-zinc-950 bg-white px-3 text-center text-xl font-medium text-zinc-700 outline-none"
                    />
                </div>
                <div className="pb-1 py-1 text-x font-bold italic uppercase text-zinc-600 flex flex-col gap-2 ">
                    <text className="">Objetivo Geral</text>
                    <input className="h-9 w-full border border-zinc-950 bg-white px-3  text-xl font-medium text-zinc-700 outline-none transition focus:border-zinc-600"
                        type="text"
                    />
                </div>
                <div className="pb-1 py-1 text-x font-bold italic uppercase text-zinc-600 flex flex-col gap-2">
                    <text className="text-center">Meta 1 (M MUS)</text>
                    <input className="h-9 w-full border border-zinc-950 bg-white px-3 text-center text-xl font-medium text-zinc-700 outline-none transition focus:border-zinc-600"
                        type="text" />
                </div>
                <div className="pb-1 py-1 text-x font-bold italic uppercase text-zinc-600 flex flex-col gap-2">
                    <text className="text-center">Meta 2 (ΣDC)</text>
                    <input className="h-9 w-full border border-zinc-950 bg-white px-3 text-center text-xl font-medium text-zinc-700 outline-none transition focus:border-zinc-600"
                        type="text" />
                </div>
            </div>
            {avaliacao.periodizacao.semanas.map((semana, semanaIndex) => (
                <div className="grid grid-cols-[1fr_0.3fr]">
                    <div
                        key={semana.numero}
                        className="mt-10 p-3"
                    >
                        <div className="mt-5 ">
                            <h1 className="w-full border-b-2 border-[#b88b8b] pb-1 text-lg font-bold italic uppercase tracking-wide text-[#a85f60]">
                                Informações do Treino
                            </h1>
                        </div>

                        <div className="grid grid-cols-8 gap-2 mt-10">
                            <div className="flex text-xl text-[#a85f60] justify-center font-bold">
                                Semana {semana.numero}
                            </div>

                            {[
                                "Dom",
                                "Seg",
                                "Ter",
                                "Qua",
                                "Qui",
                                "Sex",
                                "Sab",
                            ].map((dia, diaIndex) => (
                                <div
                                    key={diaIndex}
                                    className="p-2"
                                >
                                    <div className="mb-2 text-center text-sm font-bold">
                                        {datasPeriodizacao[semanaIndex][diaIndex].texto}
                                    </div>

                                    <div className="flex flex-col border">
                                        {[0, 1, 2].map((slot) => (
                                            <select
                                                key={slot}
                                                className="border p-1 text-sm"
                                                value={
                                                    semana.dias[diaIndex].treinoIds[slot] || ""
                                                }
                                                onChange={(e) => { atualizarDia(semanaIndex, diaIndex, slot, e.target.value) }}

                                            >
                                                <option value="">
                                                    ---
                                                </option>

                                                {opcoesTreino.map((treino) => (
                                                    <option
                                                        key={treino.id}
                                                        value={treino.id}
                                                    >
                                                        {treino.nome}
                                                    </option>
                                                ))}
                                            </select>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="mt-10 p-3">
                        <div className="mt-5">
                            <h1 className="w-full border-b-2 border-[#b88b8b] pb-1 text-lg font-bold italic uppercase tracking-wide text-[#a85f60]">
                                Controle Semanal
                            </h1>
                            <div className="grid grid-cols-[2fr_2fr] gap-2 items-center justify-center text-center">
                                <div className="mt-3">
                                    <h1 className="text-sm font-semibold uppercase tracking-wide text-zinc-600">Volume</h1>
                                    <h2 className="text-xl font-semibold uppercase tracking-wide text-zinc-600">0</h2>
                                </div>
                                <div className="mt-3">
                                    <h1 className="text-sm font-semibold uppercase tracking-wide text-zinc-600">Volume</h1>
                                    <h2 className="text-xl font-semibold uppercase tracking-wide text-zinc-600">0</h2>
                                </div>
                                <div className="mt-15">
                                    <h1 className="text-sm font-semibold uppercase tracking-wide text-zinc-600">Quilagem</h1>
                                    <h2 className="text-xl font-semibold uppercase tracking-wide text-zinc-600">
                                        {calcularQuilagemSemana(semanaIndex)} kg
                                    </h2>
                                </div>
                                <div className="mt-15">
                                    <h1 className="text-sm font-semibold uppercase tracking-wide text-zinc-600">Volume</h1>
                                    <h2 className="text-xl font-semibold uppercase tracking-wide text-zinc-600">0</h2>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            ))}
            <div>{navTool()}</div>
        </main>
    )
}
