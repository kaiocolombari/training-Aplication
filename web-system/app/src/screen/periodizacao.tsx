import { useState, useEffect, useMemo } from "react";
import navTool from "../components/navTool";
import { useAvaliacao } from "../context/avaliacaoContext";
import {
    FaRegTrashAlt,
    FaCalendarAlt,
    FaDumbbell,
    FaChartLine,
} from "react-icons/fa";

export default function periodizacao() {
    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = "";
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener(
                "beforeunload",
                handleBeforeUnload
            );
        };
    }, []);

    const [dataInicio, setDataInicio] = useState(new Date());

    const { avaliacao, setAvaliacao } = useAvaliacao();

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
                    texto: `${data.toLocaleDateString(
                        "pt-BR"
                    )} (${nomesDias[data.getDay()]})`,
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

                return total + carga;
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

    const calcularVolumeTreino = (treinoId: string) => {
        const treino = avaliacao.treino.find(
            (t) => t.id === treinoId
        );

        if (!treino) return 0;

        return treino.exercicios.reduce(
            (total, exercicio) => {
                const carga =
                    Number(exercicio.carga) || 0;

                const series =
                    Number(exercicio.series) || 0;

                const repeticoes =
                    Number(exercicio.repeticoes) || 0;

                return (
                    total +
                    carga *
                    series *
                    repeticoes
                );
            },
            0
        );
    };

    const calcularVolumeSemana = (
        semanaIndex: number
    ) => {
        const semana =
            avaliacao.periodizacao.semanas[
            semanaIndex
            ];

        let total = 0;

        semana.dias.forEach((dia) => {
            dia.treinoIds.forEach((treinoId) => {
                total += calcularVolumeTreino(
                    treinoId
                );
            });
        });

        return total;
    };

    const limparSemana = (semanaIndex: number) => {
        setAvaliacao((prev) => {
            const semanas = [...prev.periodizacao.semanas];

            semanas[semanaIndex] = {
                ...semanas[semanaIndex],

                dias: semanas[semanaIndex].dias.map(
                    (dia) => ({
                        ...dia,
                        treinoIds:
                            dia.treinoIds.map(() => ""),
                    })
                ),
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

    const limparDia = (
        semanaIndex: number,
        diaIndex: number
    ) => {
        setAvaliacao((prev) => {
            const semanas = [...prev.periodizacao.semanas];

            semanas[semanaIndex] = {
                ...semanas[semanaIndex],

                dias: semanas[semanaIndex].dias.map(
                    (dia, index) =>
                        index === diaIndex
                            ? {
                                ...dia,
                                treinoIds:
                                    dia.treinoIds.map(
                                        () => ""
                                    ),
                            }
                            : dia
                ),
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

    return (
        <main className="min-h-full bg-[#ececec] p-3 md:p-5">

            {/* CABEÇALHO */}
            <header
                className="
                    mb-6
                    flex flex-col gap-4
                    rounded-3xl
                    border border-zinc-300
                    bg-[#f7f7f7]
                    p-6
                    shadow-sm
                    md:flex-row
                    md:items-center
                    md:justify-between
                "
            >
                <div>
                    <p
                        className="
                            mb-1
                            text-xs
                            font-bold
                            uppercase
                            tracking-[0.2em]
                            text-[#a85f60]
                        "
                    >
                        Planejamento
                    </p>

                    <h1
                        className="
                            text-2xl
                            font-black
                            tracking-tight
                            text-zinc-800
                            md:text-3xl
                        "
                    >
                        Periodização do Treino
                    </h1>

                    <p className="mt-1 text-sm text-zinc-500">
                        Organize os treinos ao longo das
                        12 semanas do planejamento.
                    </p>
                </div>

                <div
                    className="
                        flex items-center gap-3
                        rounded-2xl
                        border border-zinc-300
                        bg-[#eeeeee]
                        px-4 py-3
                    "
                >
                    <div
                        className="
                            flex h-10 w-10
                            items-center justify-center
                            rounded-xl
                            bg-[#8f4f51]
                            text-white
                        "
                    >
                        <FaCalendarAlt />
                    </div>

                    <div>
                        <p
                            className="
                                text-xs
                                font-semibold
                                uppercase
                                tracking-wide
                                text-zinc-400
                            "
                        >
                            Período
                        </p>

                        <p
                            className="
                                text-sm
                                font-black
                                text-zinc-700
                            "
                        >
                            12 semanas
                        </p>
                    </div>
                </div>
            </header>

            {/* INFORMAÇÕES GERAIS */}
            <section
                className="
                    mb-6
                    rounded-3xl
                    border border-zinc-300
                    bg-[#f7f7f7]
                    p-5
                    shadow-sm
                "
            >
                <div
                    className="
                        mb-5
                        flex items-center gap-3
                        border-b border-zinc-300
                        pb-4
                    "
                >
                    <div
                        className="
                            flex h-9 w-9
                            items-center justify-center
                            rounded-xl
                            bg-[#a85f60]/10
                            text-[#a85f60]
                        "
                    >
                        <FaCalendarAlt />
                    </div>

                    <div>
                        <h2
                            className="
                                text-lg
                                font-black
                                uppercase
                                tracking-wide
                                text-zinc-700
                            "
                        >
                            Informações da periodização
                        </h2>

                        <p className="text-xs text-zinc-500">
                            Defina o período e o objetivo
                            principal do planejamento.
                        </p>
                    </div>
                </div>

                <div
                    className="
                        grid gap-4
                        md:grid-cols-[180px_180px_1fr]
                    "
                >
                    {/* INÍCIO */}
                    <div>
                        <label
                            className="
                                mb-2
                                block
                                text-xs
                                font-bold
                                uppercase
                                tracking-wide
                                text-zinc-500
                            "
                        >
                            Início
                        </label>

                        <input
                            type="date"
                            value={formatDateInput(dataInicio)}
                            onChange={(e) => {
                                setDataInicio(
                                    new Date(
                                        `${e.target.value}T00:00:00`
                                    )
                                );
                            }}
                            className="
                                h-11
                                w-full
                                rounded-xl
                                border-2
                                border-zinc-400
                                bg-[#e2e2e2]
                                px-3
                                text-center
                                font-bold
                                text-zinc-700
                                outline-none
                                transition-all
                                hover:border-zinc-500
                                hover:bg-[#dddddd]
                                focus:border-[#8f4f51]
                                focus:bg-[#f3e5e5]
                                focus:ring-2
                                focus:ring-[#8f4f51]/20
                            "
                        />
                    </div>

                    {/* TÉRMINO */}
                    <div>
                        <label
                            className="
                                mb-2
                                block
                                text-xs
                                font-bold
                                uppercase
                                tracking-wide
                                text-zinc-500
                            "
                        >
                            Término
                        </label>

                        <input
                            type="date"
                            value={formatDateInput(dataFim)}
                            readOnly
                            className="
                                h-11
                                w-full
                                rounded-xl
                                border-2
                                border-zinc-300
                                bg-[#eeeeee]
                                px-3
                                text-center
                                font-bold
                                text-zinc-600
                                outline-none
                            "
                        />
                    </div>

                    {/* OBJETIVO */}
                    <div>
                        <label
                            className="
                                mb-2
                                block
                                text-xs
                                font-bold
                                uppercase
                                tracking-wide
                                text-zinc-500
                            "
                        >
                            Objetivo geral
                        </label>

                        <input
                            type="text"
                            placeholder="Ex.: Hipertrofia, força, resistência..."
                            className="
                                h-11
                                w-full
                                rounded-xl
                                border-2
                                border-zinc-400
                                bg-[#e2e2e2]
                                px-3
                                font-semibold
                                text-zinc-700
                                outline-none
                                transition-all
                                placeholder:text-zinc-400
                                hover:border-zinc-500
                                hover:bg-[#dddddd]
                                focus:border-[#8f4f51]
                                focus:bg-[#f3e5e5]
                                focus:ring-2
                                focus:ring-[#8f4f51]/20
                            "
                        />
                    </div>
                </div>
            </section>

            {/* SEMANAS */}
            <section className="grid gap-6">

                {avaliacao.periodizacao.semanas.map(
                    (semana, semanaIndex) => (
                        <article
                            key={semana.numero}
                            className="
                                overflow-hidden
                                rounded-3xl
                                border border-zinc-300
                                bg-[#f7f7f7]
                                shadow-sm
                            "
                        >
                            {/* CABEÇALHO DA SEMANA */}
                            <div
                                className="
                                    flex flex-col gap-4
                                    border-b border-zinc-300
                                    bg-[#eeeeee]
                                    p-5
                                    md:flex-row
                                    md:items-center
                                    md:justify-between
                                "
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        className="
                                            flex h-12 w-12
                                            shrink-0
                                            items-center justify-center
                                            rounded-2xl
                                            bg-[#8f4f51]
                                            text-lg
                                            font-black
                                            text-white
                                            shadow-sm
                                        "
                                    >
                                        {semana.numero}
                                    </div>

                                    <div>
                                        <p
                                            className="
                                                text-xs
                                                font-bold
                                                uppercase
                                                tracking-[0.15em]
                                                text-[#a85f60]
                                            "
                                        >
                                            Periodização
                                        </p>

                                        <h2
                                            className="
                                                text-xl
                                                font-black
                                                text-zinc-800
                                            "
                                        >
                                            Semana {semana.numero}
                                        </h2>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        limparSemana(
                                            semanaIndex
                                        )
                                    }
                                    title={`Limpar toda a semana ${semana.numero}`}
                                    className="
                                        flex
                                        h-10
                                        items-center
                                        justify-center
                                        gap-2
                                        rounded-xl
                                        border
                                        border-zinc-300
                                        bg-[#e2e2e2]
                                        px-4
                                        text-sm
                                        font-bold
                                        uppercase
                                        text-zinc-600
                                        transition-all
                                        hover:border-red-300
                                        hover:bg-red-50
                                        hover:text-red-600
                                    "
                                >
                                    <FaRegTrashAlt />

                                    <span>
                                        Limpar semana
                                    </span>
                                </button>
                            </div>

                            {/* CONTEÚDO */}
                            <div className="p-4 md:p-5">

                                {/* DIAS */}
                                <div
                                    className="
                                        grid gap-3
                                        sm:grid-cols-2
                                        lg:grid-cols-4
                                        xl:grid-cols-7
                                    "
                                >
                                    {[
                                        "Dom",
                                        "Seg",
                                        "Ter",
                                        "Qua",
                                        "Qui",
                                        "Sex",
                                        "Sab",
                                    ].map(
                                        (dia, diaIndex) => (
                                            <div
                                                key={diaIndex}
                                                className="
                                                    overflow-hidden
                                                    rounded-2xl
                                                    border
                                                    border-zinc-300
                                                    bg-[#eeeeee]
                                                "
                                            >
                                                {/* DIA */}
                                                <div
                                                    className="
                                                        flex
                                                        items-center
                                                        justify-between
                                                        border-b
                                                        border-zinc-300
                                                        bg-[#e2e2e2]
                                                        px-3
                                                        py-2
                                                    "
                                                >
                                                    <div>
                                                        <p
                                                            className="
                                                                text-xs
                                                                font-black
                                                                uppercase
                                                                text-[#8f4f51]
                                                            "
                                                        >
                                                            {dia}
                                                        </p>

                                                        <p
                                                            className="
                                                                text-[11px]
                                                                font-semibold
                                                                text-zinc-500
                                                            "
                                                        >
                                                            {datasPeriodizacao[
                                                                semanaIndex
                                                            ][
                                                                diaIndex
                                                            ]?.texto.split(
                                                                " "
                                                            )[0]}
                                                        </p>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            limparDia(
                                                                semanaIndex,
                                                                diaIndex
                                                            )
                                                        }
                                                        title={`Limpar ${dia}`}
                                                        className="
                                                            flex
                                                            h-8
                                                            w-8
                                                            items-center
                                                            justify-center
                                                            rounded-lg
                                                            text-zinc-400
                                                            transition-all
                                                            hover:bg-red-50
                                                            hover:text-red-600
                                                        "
                                                    >
                                                        <FaRegTrashAlt />
                                                    </button>
                                                </div>

                                                {/* TREINOS */}
                                                <div className="grid gap-2 p-3">
                                                    {[0, 1, 2].map(
                                                        (slot) => (
                                                            <div
                                                                key={slot}
                                                                className="relative"
                                                            >
                                                                <span
                                                                    className="
                                                                        absolute
                                                                        left-2
                                                                        top-1/2
                                                                        z-10
                                                                        flex
                                                                        h-5
                                                                        w-5
                                                                        -translate-y-1/2
                                                                        items-center
                                                                        justify-center
                                                                        rounded-md
                                                                        bg-[#8f4f51]
                                                                        text-[10px]
                                                                        font-black
                                                                        text-white
                                                                    "
                                                                >
                                                                    {slot + 1}
                                                                </span>

                                                                <select
                                                                    value={
                                                                        semana
                                                                            .dias[
                                                                            diaIndex
                                                                        ]
                                                                            .treinoIds[
                                                                        slot
                                                                        ] ||
                                                                        ""
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        atualizarDia(
                                                                            semanaIndex,
                                                                            diaIndex,
                                                                            slot,
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                    className="
                                                                        h-10
                                                                        w-full
                                                                        cursor-pointer
                                                                        appearance-none
                                                                        rounded-xl
                                                                        border
                                                                        border-zinc-400
                                                                        bg-[#f7f7f7]
                                                                        pl-9
                                                                        pr-2
                                                                        text-sm
                                                                        font-semibold
                                                                        text-zinc-700
                                                                        outline-none
                                                                        transition-all
                                                                        hover:border-zinc-500
                                                                        hover:bg-white
                                                                        focus:border-[#8f4f51]
                                                                        focus:bg-[#f5eeee]
                                                                        focus:ring-2
                                                                        focus:ring-[#8f4f51]/20
                                                                    "
                                                                >
                                                                    <option value="">
                                                                        Sem Treino
                                                                    </option>

                                                                    {opcoesTreino.map(
                                                                        (
                                                                            treino
                                                                        ) => (
                                                                            <option
                                                                                key={
                                                                                    treino.id
                                                                                }
                                                                                value={
                                                                                    treino.id
                                                                                }
                                                                            >
                                                                                {
                                                                                    treino.nome
                                                                                }
                                                                            </option>
                                                                        )
                                                                    )}
                                                                </select>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>

                                {/* CONTROLE SEMANAL */}
                                <div
                                    className="
                                        mt-5
                                        grid gap-3
                                        md:grid-cols-2
                                    "
                                >
                                    <div
                                        className="
                                            flex
                                            items-center
                                            gap-4
                                            rounded-2xl
                                            border
                                            border-zinc-300
                                            bg-[#eeeeee]
                                            p-4
                                        "
                                    >
                                        <div
                                            className="
                                                flex h-11 w-11
                                                shrink-0
                                                items-center
                                                justify-center
                                                rounded-xl
                                                bg-[#a85f60]/10
                                                text-[#a85f60]
                                            "
                                        >
                                            <FaDumbbell />
                                        </div>

                                        <div>
                                            <p
                                                className="
                                                    text-xs
                                                    font-bold
                                                    uppercase
                                                    tracking-wide
                                                    text-zinc-500
                                                "
                                            >
                                                Quilagem
                                            </p>

                                            <p
                                                className="
                                                    text-xl
                                                    font-black
                                                    text-zinc-800
                                                "
                                            >
                                                {calcularQuilagemSemana(
                                                    semanaIndex
                                                )}{" "}
                                                <span className="text-sm font-bold text-zinc-500">
                                                    kg
                                                </span>
                                            </p>
                                        </div>
                                    </div>

                                    <div
                                        className="
                                            flex
                                            items-center
                                            gap-4
                                            rounded-2xl
                                            border
                                            border-zinc-300
                                            bg-[#eeeeee]
                                            p-4
                                        "
                                    >
                                        <div
                                            className="
                                                flex h-11 w-11
                                                shrink-0
                                                items-center
                                                justify-center
                                                rounded-xl
                                                bg-[#a85f60]/10
                                                text-[#a85f60]
                                            "
                                        >
                                            <FaChartLine />
                                        </div>

                                        <div>
                                            <p
                                                className="
                                                    text-xs
                                                    font-bold
                                                    uppercase
                                                    tracking-wide
                                                    text-zinc-500
                                                "
                                            >
                                                Volume load
                                            </p>

                                            <p
                                                className="
                                                    text-xl
                                                    font-black
                                                    text-zinc-800
                                                "
                                            >
                                                {calcularVolumeSemana(
                                                    semanaIndex
                                                )}{" "}
                                                <span className="text-sm font-bold text-zinc-500">
                                                    kg
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </article>
                    )
                )}
            </section>

            {/* NAVEGAÇÃO */}
            <div className="mt-10">
                {navTool()}
            </div>
        </main>
    );
}