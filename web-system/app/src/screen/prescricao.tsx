import { initialState, useAvaliacao } from '../context/avaliacaoContext'
import navTool from '../components/navTool'
import type { ExercicioTreino } from '../interface/interfaceExercicio';
import React, { useEffect, useState } from "react";
import {
    FaDumbbell,
    FaClock,
    FaWeightHanging,
    FaRedo,
    FaLayerGroup,
    FaNotesMedical,
    FaRunning,
    FaPlus,
    FaTrash,
    FaChevronRight
} from "react-icons/fa";

type VariacaoRowProps = {
    variacao: ExercicioTreino;
    variacaoIndex: number;
    exercicioPrincipal: string;
    treinoId: string;
    exercicioId: string;

    atualizarVariacao: (
        treinoId: string,
        exercicioId: string,
        variacaoId: string,
        valor: string,
        campo: keyof ExercicioTreino
    ) => void;

    removerVariacao: (
        treinoId: string,
        exercicioId: string,
        variacaoId: string
    ) => void;
};

function VariacaoRow({
    variacao,
    variacaoIndex,
    exercicioPrincipal,
    treinoId,
    exercicioId,
    atualizarVariacao,
    removerVariacao,
}: VariacaoRowProps) {

    if (!variacao) {
        return null;
    }

    const inputClass = `
        h-10 w-full rounded-lg border border-zinc-300
        bg-white px-2 text-center text-sm font-semibold
        text-zinc-700 outline-none transition-all duration-150
        hover:border-zinc-400 focus:border-[#8f4f51]
        focus:bg-[#f5eeee] focus:ring-2 focus:ring-[#8f4f51]/20
    `;

    const campo = (
        nome: keyof ExercicioTreino,
        valor: string
    ) =>
        atualizarVariacao(
            treinoId,
            exercicioId,
            variacao.id ?? "",
            valor,
            nome
        );

    return (
        <tr className="
            border-t
            border-dashed
            border-[#d8c3c4]
            bg-[#fbf7f7]
            animate-in
            fade-in
            slide-in-from-top-2
            duration-200
        ">

            <td className="px-3 py-2">
                <div className="flex items-center gap-2 pl-8">

                    <div className="
                        flex
                        h-7
                        min-w-7
                        items-center
                        justify-center
                        rounded-lg
                        bg-[#f0e4e4]
                        px-2
                        text-[10px]
                        font-black
                        text-[#8f4f51]
                    ">
                        V{variacaoIndex + 1}
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            removerVariacao(
                                treinoId,
                                exercicioId,
                                variacao.id ?? ""
                            )
                        }
                        title="Excluir variação"
                        className="
                            flex
                            h-7
                            w-7
                            shrink-0
                            items-center
                            justify-center
                            rounded-lg
                            text-zinc-400
                            transition-colors
                            hover:bg-red-50
                            hover:text-red-500
                        "
                    >
                        <FaTrash className="text-[10px]" />
                    </button>

                    <div className="min-w-0 flex-1">

                        <p className="
                            mb-1
                            text-[9px]
                            font-bold
                            uppercase
                            tracking-wide
                            text-[#a87576]
                        ">
                            Variação de:{" "}
                            {exercicioPrincipal ||
                                "Exercício principal"}
                        </p>

                        <input
                            type="text"
                            value={variacao.exercicio ?? ""}
                            onChange={(e) =>
                                campo(
                                    "exercicio",
                                    e.target.value
                                )
                            }
                            placeholder="Nome da variação"
                            className="
                                h-9
                                w-full
                                rounded-lg
                                border
                                border-zinc-300
                                bg-white
                                px-3
                                text-sm
                                font-semibold
                                text-zinc-700
                                outline-none
                                transition-all
                                hover:border-zinc-400
                                focus:border-[#8f4f51]
                                focus:bg-[#f5eeee]
                                focus:ring-2
                                focus:ring-[#8f4f51]/20
                            "
                        />

                    </div>
                </div>
            </td>

            <td className="px-2 py-2">
                <input
                    type="text"
                    value={variacao.series ?? ""}
                    onChange={(e) =>
                        campo("series", e.target.value)
                    }
                    className={inputClass}
                />
            </td>

            <td className="px-2 py-2">
                <input
                    type="text"
                    value={variacao.repeticoes ?? ""}
                    onChange={(e) =>
                        campo(
                            "repeticoes",
                            e.target.value
                        )
                    }
                    className={inputClass}
                />
            </td>

            <td className="px-2 py-2">
                <input
                    type="text"
                    value={variacao.intervalo ?? ""}
                    onChange={(e) =>
                        campo(
                            "intervalo",
                            e.target.value
                        )
                    }
                    className={inputClass}
                />
            </td>

            <td className="px-2 py-2">
                <input
                    type="text"
                    value={variacao.carga ?? ""}
                    onChange={(e) =>
                        campo("carga", e.target.value)
                    }
                    className={inputClass}
                />
            </td>

            <td className="px-2 py-2">
                <input
                    type="text"
                    value={variacao.rirMax ?? ""}
                    onChange={(e) =>
                        campo(
                            "rirMax",
                            e.target.value
                        )
                    }
                    className="
                        h-10
                        w-full
                        rounded-lg
                        border
                        border-[#c59b9c]
                        bg-[#f0e4e4]
                        text-center
                        text-sm
                        font-black
                        text-[#7d4547]
                        outline-none
                        transition-all
                        focus:border-[#713b3d]
                        focus:ring-2
                        focus:ring-[#8f4f51]/20
                    "
                />
            </td>

            <td className="px-3 py-2">
                <input
                    type="text"
                    value={variacao.observacoes ?? ""}
                    onChange={(e) =>
                        campo(
                            "observacoes",
                            e.target.value
                        )
                    }
                    placeholder="Observações..."
                    className="
                        h-10
                        w-full
                        rounded-lg
                        border
                        border-zinc-300
                        bg-white
                        px-3
                        text-sm
                        text-zinc-600
                        outline-none
                        transition-all
                        hover:border-zinc-400
                        focus:border-[#8f4f51]
                        focus:bg-[#f5eeee]
                        focus:ring-2
                        focus:ring-[#8f4f51]/20
                    "
                />
            </td>

        </tr>
    );
}

export default function Prescricao() {

    const { avaliacao, setAvaliacao } = useAvaliacao();

    const [expandedVariacoes, setExpandedVariacoes] = useState<Set<string>>(
        new Set()
    );

    const alternarVariacoes = (treinoId: string, exercicioId: string) => {
        const chave = `${treinoId}-${exercicioId}`;

        setExpandedVariacoes((prev) => {
            const novo = new Set(prev);

            if (novo.has(chave)) {
                novo.delete(chave);
            } else {
                novo.add(chave);
            }

            return novo;
        });
    };

    const atualizarNomeTreino = (
        treinoId: string,
        nome: string
    ) => {
        setAvaliacao((prev) => ({
            ...prev,

            treino: prev.treino.map((treino) =>
                treino.id === treinoId
                    ? {
                        ...treino,
                        nome,
                    }
                    : treino
            ),
        }));
    };

    const adicionarExercicio = (
        treinoId: string,
        exercicioIndex: number,
        valor: string,
        campo: keyof ExercicioTreino
    ) => {

        setAvaliacao((prev) => ({
            ...prev,

            treino: prev.treino.map((treino) => {

                if (treino.id !== treinoId) {
                    return treino;
                }

                return {
                    ...treino,

                    exercicios: treino.exercicios.map(
                        (exercicio, index) =>
                            index === exercicioIndex
                                ? {
                                    ...exercicio,
                                    [campo]: valor
                                }
                                : exercicio
                    ),
                }

            }),
        }));
    };

    const adicionarVariacao = (
        treinoId: string,
        exercicioId: string
    ) => {
        setAvaliacao((prev) => {
            const treinoEncontrado = prev.treino.find(
                (treino) => treino.id === treinoId
            );

            if (!treinoEncontrado) {
                console.error("Treino não encontrado:", treinoId);
                return prev;
            }

            const exercicioEncontrado =
                treinoEncontrado.exercicios.find(
                    (exercicio) => exercicio.id === exercicioId
                );

            if (!exercicioEncontrado) {
                console.error(
                    "Exercício não encontrado:",
                    exercicioId
                );

                console.log(
                    "Exercícios disponíveis:",
                    treinoEncontrado.exercicios.map((e) => ({
                        id: e.id,
                        nome: e.exercicio,
                    }))
                );

                return prev;
            }

            const novaVariacao: ExercicioTreino = {
                id: crypto.randomUUID(),
                exercicio: "",
                series: "",
                repeticoes: "",
                intervalo: "",
                carga: "",
                rirMax: "",
                observacoes: "",
                variacoes: [],
            };

            return {
                ...prev,

                treino: prev.treino.map((treino) => {
                    if (treino.id !== treinoId) {
                        return treino;
                    }

                    return {
                        ...treino,

                        exercicios: treino.exercicios.map(
                            (exercicio) => {
                                if (exercicio.id !== exercicioId) {
                                    return exercicio;
                                }

                                return {
                                    ...exercicio,

                                    variacoes: [
                                        ...(exercicio.variacoes ?? []),
                                        novaVariacao,
                                    ],
                                };
                            }
                        ),
                    };
                }),
            };
        });
    };

    const removerVariacao = (
        treinoId: string,
        exercicioId: string,
        variacaoId: string
    ) => {
        setAvaliacao((prev) => ({
            ...prev,

            treino: prev.treino.map((treino) => {
                if (treino.id !== treinoId) {
                    return treino;
                }

                return {
                    ...treino,

                    exercicios: treino.exercicios.map((exercicio) => {
                        if (exercicio.id !== exercicioId) {
                            return exercicio;
                        }

                        return {
                            ...exercicio,

                            variacoes: (exercicio.variacoes ?? []).filter(
                                (variacao) =>
                                    variacao.id !== variacaoId
                            ),
                        };
                    }),
                };
            }),
        }));
    };

    const atualizarVariacao = (
        treinoId: string,
        exercicioId: string,
        variacaoId: string,
        valor: string,
        campo: keyof ExercicioTreino
    ) => {
        setAvaliacao((prev) => ({
            ...prev,

            treino: prev.treino.map((treino) => {
                if (treino.id !== treinoId) {
                    return treino;
                }

                return {
                    ...treino,

                    exercicios: treino.exercicios.map((exercicio) => {
                        if (exercicio.id !== exercicioId) {
                            return exercicio;
                        }

                        return {
                            ...exercicio,

                            variacoes: (exercicio.variacoes ?? []).map(
                                (variacao) =>
                                    variacao.id === variacaoId
                                        ? {
                                            ...variacao,
                                            [campo]: valor,
                                        }
                                        : variacao
                            ),
                        };
                    }),
                };
            }),
        }));
    };

    useEffect(() => {
        setAvaliacao((prev) => {
            const treinos = [...(prev.treino ?? [])];

            while (treinos.length < 12) {
                const treinoIndex = treinos.length;

                treinos.push({
                    id: crypto.randomUUID(),
                    nome: `Treino ${treinoIndex + 1}`,
                    exercicios: Array.from({ length: 12 }, () => ({
                        id: crypto.randomUUID(),
                        exercicio: "",
                        series: "",
                        repeticoes: "",
                        intervalo: "",
                        carga: "",
                        rirMax: "",
                        observacoes: "",
                        variacoes: [],
                    })),
                });
            }

            return {
                ...prev,
                treino: treinos.slice(0, 12),
            };
        });
    }, [setAvaliacao]);

    useEffect(() => {

        const handleBeforeUnload = (
            event: BeforeUnloadEvent
        ) => {

            event.preventDefault();
            event.returnValue = "Tem certeza que deseja sair?";

        };

        window.addEventListener(
            "beforeunload",
            handleBeforeUnload
        );

        return () => {

            window.removeEventListener(
                "beforeunload",
                handleBeforeUnload
            );

        };

    }, []);


    return (

        <main className="min-h-full bg-[#ececec] p-4 md:p-6 lg:p-8">


            <div className="mx-auto max-w-[1500px]">

                <div className="
                    mb-8
                    flex flex-col gap-4
                    rounded-3xl
                    border border-zinc-200
                    bg-white
                    p-6
                    shadow-sm
                    md:flex-row
                    md:items-center
                    md:justify-between
                ">

                    <div className="flex items-center gap-4">

                        {/* <div className="
                            flex h-14 w-14 shrink-0
                            items-center justify-center
                            rounded-2xl
                            bg-[#a85f60]
                            text-white
                            shadow-md
                            font-bold
                            text-2xl

                        ">
                            G
                        </div> */}

                        <div>

                            <p className="
                                mb-1
                                text-xs
                                font-bold
                                uppercase
                                tracking-[0.2em]
                                text-[#a85f60]
                            ">
                                Prescrição
                            </p>

                            <h1 className="
                                text-2xl
                                font-black
                                tracking-tight
                                text-zinc-800
                                md:text-3xl
                            ">
                                Planilha de Treinamento
                            </h1>

                            <p className="
                                mt-1
                                text-sm
                                text-zinc-500
                            ">
                                Configure os exercícios e parâmetros de cada treino.
                            </p>

                        </div>

                    </div>

                    <div className="
                        flex items-center gap-3
                        rounded-2xl
                        bg-zinc-50
                        px-4 py-3
                        ring-1 ring-zinc-200
                    ">

                        <div className="
                            flex h-9 w-9
                            items-center justify-center
                            rounded-xl
                            bg-[#8f4f51]
                            text-white
                        ">
                            <FaRunning />
                        </div>

                        <div>

                            <p className="
                                text-xs
                                font-semibold
                                uppercase
                                tracking-wide
                                text-zinc-400
                            ">
                                Treinos
                            </p>

                            <p className="
                                text-sm
                                font-black
                                text-zinc-700
                            ">
                                12 disponíveis
                            </p>

                        </div>

                    </div>

                </div>

                <div className="space-y-8">

                    {avaliacao.treino.slice(0, 12).map((treino, treinoIndex) => {
                        const exerciciosPreenchidos =
                            treino.exercicios?.filter(
                                (exercicio) =>
                                    exercicio?.exercicio?.trim()
                            ).length ?? 0;

                        const totalVariacoes = treino.exercicios.reduce(
                            (total, exercicio) =>
                                total + (exercicio.variacoes?.length ?? 0),
                            0
                        );

                        return (
                            <section
                                key={treino.id}
                                className="
                overflow-hidden
                rounded-3xl
                border border-zinc-300
                bg-[#f7f7f7]
                shadow-[0_4px_18px_rgba(0,0,0,0.06)]
                transition-shadow
                duration-200
                hover:shadow-[0_6px_24px_rgba(0,0,0,0.09)]
            "
                            >
                                {/* HEADER DO TREINO */}

                                <div
                                    className="
                    flex flex-col
                    gap-4
                    border-b
                    border-zinc-300
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
                            flex h-12 w-12 shrink-0
                            items-center justify-center
                            rounded-2xl
                            bg-[#8f4f51]
                            text-lg font-black text-white
                        "
                                        >
                                            {String(treinoIndex + 1).padStart(2, "0")}
                                        </div>

                                        <div>
                                            <p
                                                className="
                                text-[10px]
                                font-black
                                uppercase
                                tracking-[0.2em]
                                text-zinc-400
                            "
                                            >
                                                Treino
                                            </p>

                                            <div className="mt-1 flex items-center gap-2">

                                                <FaDumbbell
                                                    className="text-sm text-[#a85f60]"
                                                />

                                                <span
                                                    className="
                                    text-lg
                                    font-black
                                    text-zinc-800
                                "
                                                >
                                                    {treino.nome ||
                                                        `Treino ${treinoIndex + 1}`}
                                                </span>

                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        className="
                        flex flex-col gap-3
                        sm:flex-row
                        sm:items-center
                    "
                                    >
                                        <div
                                            className="
                            flex items-center gap-2
                            rounded-xl
                            border border-zinc-200
                            bg-white
                            px-3 py-2
                        "
                                        >
                                            <span
                                                className="
                                text-[10px]
                                font-bold
                                uppercase
                                tracking-wide
                                text-zinc-400
                            "
                                            >
                                                Nome
                                            </span>

                                            <input
                                                type="text"
                                                value={treino.nome ?? ""}
                                                onChange={(e) =>
                                                    atualizarNomeTreino(
                                                        treino.id,
                                                        e.target.value
                                                    )
                                                }
                                                placeholder={`Treino ${treinoIndex + 1}`}
                                                className="
                                w-36
                                border-none
                                bg-transparent
                                text-sm
                                font-bold
                                text-zinc-700
                                outline-none
                            "
                                            />
                                        </div>

                                        <div
                                            className="
                            flex items-center gap-2
                            rounded-xl
                            bg-zinc-100
                            px-3 py-2
                            text-xs
                            font-bold
                            text-zinc-500
                        "
                                        >
                                            <FaLayerGroup
                                                className="text-[#a85f60]"
                                            />

                                            {exerciciosPreenchidos}/12 exercícios
                                        </div>
                                        <div className="flex items-center gap-1.5 rounded-xl bg-zinc-100 px-3 py-2 text-xs font-bold text-zinc-500">
                                            <FaLayerGroup className="text-[10px] text-[#a85f60]" />

                                            <span>
                                                {totalVariacoes}{" "}
                                                {totalVariacoes === 1
                                                    ? "variação"
                                                    : "variações"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* TABELA */}

                                <div className="overflow-x-auto">

                                    <table className="w-full min-w-[1200px] border-collapse">

                                        <thead>
                                            <tr
                                                className="
                                bg-zinc-50
                                text-[10px]
                                font-black
                                uppercase
                                tracking-wider
                                text-zinc-500
                            "
                                            >
                                                <th className="w-[25%] px-4 py-3 text-left">
                                                    <div className="flex items-center gap-2">
                                                        <FaDumbbell />
                                                        Exercício
                                                    </div>
                                                </th>

                                                <th className="w-[8%] px-3 py-3">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <FaLayerGroup />
                                                        Séries
                                                    </div>
                                                </th>

                                                <th className="w-[9%] px-3 py-3">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <FaRedo />
                                                        Reps
                                                    </div>
                                                </th>

                                                <th className="w-[12%] px-3 py-3">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <FaClock />
                                                        Intervalo
                                                    </div>
                                                </th>

                                                <th className="w-[9%] px-3 py-3">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <FaWeightHanging />
                                                        Carga
                                                    </div>
                                                </th>

                                                <th className="w-[8%] px-3 py-3">
                                                    RIR
                                                </th>

                                                <th className="w-[30%] px-4 py-3 text-left">
                                                    <div className="flex items-center gap-2">
                                                        <FaNotesMedical />
                                                        Observações
                                                    </div>
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {treino.exercicios
                                                .slice(0, 12)
                                                .map((exercicio, exercicioIndex) => {

                                                    if (!exercicio) {
                                                        return null;
                                                    }

                                                    const chave = `${treino.id}-${exercicio.id}`;

                                                    return (
                                                        <React.Fragment
                                                            key={exercicio.id}
                                                        >

                                                            {/* EXERCÍCIO */}

                                                            <tr
                                                                className="
                                                border-t
                                                border-zinc-100
                                                transition-colors
                                                hover:bg-[#a85f60]/[0.025]
                                            "
                                                            >
                                                                <td className="px-3 py-1.5">
                                                                    <div className="flex items-center gap-2">

                                                                        <span
                                                                            className="
                                                            flex h-7 w-7
                                                            shrink-0
                                                            items-center
                                                            justify-center
                                                            rounded-lg
                                                            bg-zinc-100
                                                            text-[10px]
                                                            font-black
                                                            text-zinc-400
                                                        "
                                                                        >
                                                                            {String(
                                                                                exercicioIndex + 1
                                                                            ).padStart(2, "0")}
                                                                        </span>

                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                alternarVariacoes(
                                                                                    treino.id,
                                                                                    exercicio.id ? exercicio.id : ""
                                                                                )
                                                                            }
                                                                            title="Mostrar variações"
                                                                            className={`
                                                            flex h-8 w-8
                                                            shrink-0
                                                            items-center
                                                            justify-center
                                                            rounded-lg
                                                            border
                                                            transition-all
                                                            hover:cursor-pointer

                                                            ${(exercicio.variacoes?.length ?? 0) > 0
                                                                                    ? "border-[#c59b9c] bg-[#f0e4e4] text-[#8f4f51]"
                                                                                    : "border-zinc-300 bg-white text-zinc-400"
                                                                                }
                                                        `}
                                                                        >
                                                                            <FaChevronRight
                                                                                className={`
                                                                text-[10px]
                                                                transition-transform
                                                                duration-200

                                                                ${expandedVariacoes.has(chave)
                                                                                        ? "rotate-90"
                                                                                        : ""
                                                                                    }
                                                            `}
                                                                            />
                                                                        </button>

                                                                        <div className="min-w-0 flex-1">
                                                                            <input
                                                                                type="text"
                                                                                value={
                                                                                    exercicio.exercicio ?? ""
                                                                                }
                                                                                onChange={(e) =>
                                                                                    adicionarExercicio(
                                                                                        treino.id,
                                                                                        exercicioIndex,
                                                                                        e.target.value,
                                                                                        "exercicio"
                                                                                    )
                                                                                }
                                                                                placeholder="Nome do exercício"
                                                                                className="
                                                                h-10
                                                                w-full
                                                                rounded-lg
                                                                border
                                                                border-zinc-400
                                                                bg-[#eeeeee]
                                                                px-3
                                                                text-sm
                                                                font-semibold
                                                                text-zinc-700
                                                                outline-none
                                                            "
                                                                            />
                                                                        </div>

                                                                        {(exercicio.variacoes?.length ?? 0) > 0 && (
                                                                            <span
                                                                                className="
                                                                shrink-0
                                                                rounded-full
                                                                bg-[#f0e4e4]
                                                                px-2 py-1
                                                                text-[9px]
                                                                font-black
                                                                text-[#8f4f51]
                                                            "
                                                                            >
                                                                                {exercicio.variacoes?.length ?? 0} var.
                                                                            </span>
                                                                        )}

                                                                    </div>
                                                                </td>

                                                                {/* SÉRIES */}

                                                                <td className="px-2 py-1.5">
                                                                    <input
                                                                        type="text"
                                                                        value={exercicio.series ?? ""}
                                                                        onChange={(e) =>
                                                                            adicionarExercicio(
                                                                                treino.id,
                                                                                exercicioIndex,
                                                                                e.target.value,
                                                                                "series"
                                                                            )
                                                                        }
                                                                        className="
                                                        h-10
                                                        w-full
                                                        rounded-lg
                                                        border
                                                        border-zinc-400
                                                        bg-[#eeeeee]
                                                        text-center
                                                        text-sm
                                                        font-bold
                                                        text-zinc-700
                                                        outline-none
                                                    "
                                                                    />
                                                                </td>

                                                                {/* REPETIÇÕES */}

                                                                <td className="px-2 py-1.5">
                                                                    <input
                                                                        type="text"
                                                                        value={exercicio.repeticoes ?? ""}
                                                                        onChange={(e) =>
                                                                            adicionarExercicio(
                                                                                treino.id,
                                                                                exercicioIndex,
                                                                                e.target.value,
                                                                                "repeticoes"
                                                                            )
                                                                        }
                                                                        className="
                                                        h-10
                                                        w-full
                                                        rounded-lg
                                                        border
                                                        border-zinc-400
                                                        bg-[#eeeeee]
                                                        text-center
                                                        text-sm
                                                        font-bold
                                                        text-zinc-700
                                                        outline-none
                                                    "
                                                                    />
                                                                </td>

                                                                {/* INTERVALO */}

                                                                <td className="px-2 py-1.5">
                                                                    <input
                                                                        list={`intervalos-${treinoIndex}-${exercicioIndex}`}
                                                                        type="text"
                                                                        value={exercicio.intervalo ?? ""}
                                                                        onChange={(e) =>
                                                                            adicionarExercicio(
                                                                                treino.id,
                                                                                exercicioIndex,
                                                                                e.target.value,
                                                                                "intervalo"
                                                                            )
                                                                        }
                                                                        className="
                                                        h-10
                                                        w-full
                                                        rounded-lg
                                                        border
                                                        border-zinc-400
                                                        bg-[#eeeeee]
                                                        px-2
                                                        text-center
                                                        text-sm
                                                        font-semibold
                                                        text-zinc-700
                                                        outline-none
                                                    "
                                                                    />

                                                                    <datalist
                                                                        id={`intervalos-${treinoIndex}-${exercicioIndex}`}
                                                                    >
                                                                        <option value="10 segundos" />
                                                                        <option value="15 segundos" />
                                                                        <option value="20 segundos" />
                                                                        <option value="30 segundos" />
                                                                        <option value="40 segundos" />
                                                                        <option value="1 min" />
                                                                        <option value="1 min e 30 seg" />
                                                                        <option value="2 mins" />
                                                                        <option value="2 mins e 30 seg" />
                                                                        <option value="3 mins" />
                                                                        <option value="3 mins e 30 seg" />
                                                                        <option value="4 mins" />
                                                                    </datalist>
                                                                </td>

                                                                {/* CARGA */}

                                                                <td className="px-2 py-1.5">
                                                                    <input
                                                                        type="text"
                                                                        value={exercicio.carga ?? ""}
                                                                        onChange={(e) =>
                                                                            adicionarExercicio(
                                                                                treino.id,
                                                                                exercicioIndex,
                                                                                e.target.value,
                                                                                "carga"
                                                                            )
                                                                        }
                                                                        className="
                                                        h-10
                                                        w-full
                                                        rounded-lg
                                                        border
                                                        border-zinc-400
                                                        bg-[#eeeeee]
                                                        text-center
                                                        text-sm
                                                        font-bold
                                                        text-zinc-700
                                                        outline-none
                                                    "
                                                                    />
                                                                </td>

                                                                {/* RIR */}

                                                                <td className="px-2 py-1.5">
                                                                    <input
                                                                        type="text"
                                                                        value={exercicio.rirMax ?? ""}
                                                                        onChange={(e) =>
                                                                            adicionarExercicio(
                                                                                treino.id,
                                                                                exercicioIndex,
                                                                                e.target.value,
                                                                                "rirMax"
                                                                            )
                                                                        }
                                                                        className="
                                                        h-10
                                                        w-full
                                                        rounded-lg
                                                        border
                                                        border-[#a87576]
                                                        bg-[#f0e4e4]
                                                        text-center
                                                        text-sm
                                                        font-black
                                                        text-[#7d4547]
                                                        outline-none
                                                    "
                                                                    />
                                                                </td>

                                                                {/* OBSERVAÇÕES */}

                                                                <td className="px-3 py-1.5">
                                                                    <input
                                                                        type="text"
                                                                        value={exercicio.observacoes ?? ""}
                                                                        onChange={(e) =>
                                                                            adicionarExercicio(
                                                                                treino.id,
                                                                                exercicioIndex,
                                                                                e.target.value,
                                                                                "observacoes"
                                                                            )
                                                                        }
                                                                        placeholder="Observações..."
                                                                        className="
                                                        h-10
                                                        w-full
                                                        rounded-lg
                                                        border
                                                        border-zinc-400
                                                        bg-[#eeeeee]
                                                        px-3
                                                        text-sm
                                                        text-zinc-600
                                                        outline-none
                                                    "
                                                                    />
                                                                </td>

                                                            </tr>

                                                            {/* VARIAÇÕES */}

                                                            {expandedVariacoes.has(chave) && (
                                                                <>
                                                                    {exercicio.variacoes?.map(
                                                                        (variacao, variacaoIndex) => (
                                                                            <VariacaoRow
                                                                                key={variacao.id}
                                                                                variacao={variacao}
                                                                                variacaoIndex={variacaoIndex}
                                                                                exercicioPrincipal={exercicio.exercicio}
                                                                                treinoId={treino.id}
                                                                                exercicioId={exercicio.id ? exercicio.id : ""}
                                                                                atualizarVariacao={atualizarVariacao}
                                                                                removerVariacao={removerVariacao}
                                                                            />
                                                                        )
                                                                    )}

                                                                    <tr
                                                                        className="
                                                        border-t
                                                        border-dashed
                                                        border-[#d8c3c4]
                                                        bg-[#fbf7f7]
                                                    "
                                                                    >
                                                                        <td
                                                                            colSpan={7}
                                                                            className="px-4 py-2"
                                                                        >
                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    adicionarVariacao(
                                                                                        treino.id,
                                                                                        exercicio.id ? exercicio.id : ""
                                                                                    )
                                                                                }
                                                                                className="
                                                                ml-8
                                                                flex
                                                                items-center
                                                                gap-2
                                                                rounded-lg
                                                                border
                                                                border-dashed
                                                                border-[#a87576]
                                                                px-3 py-2
                                                                text-[10px]
                                                                font-black
                                                                uppercase
                                                                tracking-wide
                                                                text-[#8f4f51]
                                                                hover:bg-[#f0e4e4]
                                                            "
                                                                            >
                                                                                <FaPlus />
                                                                                Adicionar variação
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                </>
                                                            )}
                                                        </React.Fragment>
                                                    );
                                                })}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        );
                    })}
                </div>
            </div>
            <div>
                {navTool()}
            </div>
            <div className="h-24" />
        </main>
    );
}