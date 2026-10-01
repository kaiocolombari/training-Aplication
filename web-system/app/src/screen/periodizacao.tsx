import { initialState, useAvaliacao } from '../context/avaliacaoContext'
import navTool from '../components/navTool'
import type { ExercicioTreino } from '../interface/interfaceExercicio';
import { useEffect } from 'react';

import {
    FaDumbbell,
    FaClock,
    FaWeightHanging,
    FaRedo,
    FaLayerGroup,
    FaNotesMedical,
    FaRunning
} from "react-icons/fa";

export default function Prescricao() {

    const { avaliacao, setAvaliacao } = useAvaliacao();

    const atualizarNomeTreino = (
        treinoIndex: number,
        nome: string
    ) => {

        setAvaliacao((prev) => {

            const treinos = [...prev.treino];

            if (!treinos[treinoIndex]) {

                treinos[treinoIndex] = {
                    id: crypto.randomUUID(),
                    nome,
                    exercicios: Array.from(
                        { length: 12 },
                        () => ({
                            exercicio: "",
                            series: "",
                            repeticoes: "",
                            intervalo: "",
                            carga: "",
                            rirMax: "",
                            observacoes: "",
                        })
                    ),
                };

            } else {

                treinos[treinoIndex] = {
                    ...treinos[treinoIndex],
                    nome,
                };

            }

            return {
                ...prev,
                treino: treinos,
            };
        });
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

                    {Array.from({ length: 12 }).map(
                        (_, treinoIndex) => {

                            const treino =
                                avaliacao.treino[treinoIndex];

                            const exerciciosPreenchidos =
                                treino?.exercicios?.filter(
                                    (exercicio) =>
                                        exercicio?.exercicio?.trim()
                                ).length ?? 0;

                            return (

                                <section
                                    key={treinoIndex}
                                    className="
                                        overflow-hidden
                                        rounded-3xl
                                        border
                                        border-zinc-300
                                        bg-[#f7f7f7]
                                        shadow-[0_4px_18px_rgba(0,0,0,0.06)]
                                        transition-shadow
                                        duration-200
                                        hover:shadow-[0_6px_24px_rgba(0,0,0,0.09)]"
                                >

                                    <div className="
                                        flex flex-col
                                        gap-4
                                        border-b
                                        border-zinc-300
                                        bg-[#eeeeee]
                                        p-5
                                        md:flex-row
                                        md:items-center
                                        md:justify-between
                                    ">

                                        <div className="flex items-center gap-4">

                                            <div className="
                                                flex h-12 w-12
                                                shrink-0
                                                items-center justify-center
                                                rounded-2xl
                                                bg-[#8f4f51]
                                                text-lg
                                                font-black
                                                text-white
                                                shadow-[0_3px_8px_rgba(143,79,81,0.25)]
                                            ">
                                                {String(
                                                    treinoIndex + 1
                                                ).padStart(2, "0")}
                                            </div>

                                            <div>

                                                <p className="
                                                    text-[10px]
                                                    font-black
                                                    uppercase
                                                    tracking-[0.2em]
                                                    text-zinc-400
                                                ">
                                                    Treino
                                                </p>

                                                <div className="
                                                    mt-1
                                                    flex
                                                    items-center
                                                    gap-2
                                                ">

                                                    <FaDumbbell
                                                        className="
                                                            text-sm
                                                            text-[#a85f60]
                                                        "
                                                    />

                                                    <span className="
                                                        text-lg
                                                        font-black
                                                        text-zinc-800
                                                    ">
                                                        {treino?.nome ||
                                                            `Treino ${treinoIndex + 1}`}
                                                    </span>

                                                </div>

                                            </div>

                                        </div>

                                        <div className="
                                            flex
                                            flex-col
                                            gap-3
                                            sm:flex-row
                                            sm:items-center
                                        ">

                                            <div className="
                                                flex items-center gap-2
                                                rounded-xl
                                                border
                                                border-zinc-200
                                                bg-white
                                                px-3 py-2
                                            ">

                                                <span className="
                                                    text-[10px]
                                                    font-bold
                                                    uppercase
                                                    tracking-wide
                                                    text-zinc-400
                                                ">
                                                    Nome
                                                </span>

                                                <input
                                                    type="text"
                                                    value={
                                                        treino?.nome ?? ""
                                                    }
                                                    onChange={(e) =>
                                                        atualizarNomeTreino(
                                                            treinoIndex,
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
                                                        placeholder:text-zinc-300
                                                    "
                                                />

                                            </div>

                                            <div className="
                                                flex items-center gap-2
                                                rounded-xl
                                                bg-zinc-100
                                                px-3 py-2
                                                text-xs
                                                font-bold
                                                text-zinc-500
                                            ">

                                                <FaLayerGroup
                                                    className="text-[#a85f60]"
                                                />

                                                {exerciciosPreenchidos}/12
                                                exercícios

                                            </div>

                                        </div>

                                    </div>


                                    <div className="overflow-x-auto">

                                        <table className="
                                            w-full
                                            min-w-[1100px]
                                            border-collapse
                                        ">

                                            <thead>

                                                <tr className="
                                                    bg-zinc-50
                                                    text-[10px]
                                                    font-black
                                                    uppercase
                                                    tracking-wider
                                                    text-zinc-500
                                                ">

                                                    <th className="
                                                        w-[24%]
                                                        px-4 py-3
                                                        text-left
                                                    ">
                                                        <div className="flex items-center gap-2">
                                                            <FaDumbbell />
                                                            Exercício
                                                        </div>
                                                    </th>

                                                    <th className="
                                                        w-[8%]
                                                        px-3 py-3
                                                    ">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <FaLayerGroup />
                                                            Séries
                                                        </div>
                                                    </th>

                                                    <th className="
                                                        w-[9%]
                                                        px-3 py-3
                                                    ">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <FaRedo />
                                                            Reps
                                                        </div>
                                                    </th>

                                                    <th className="
                                                        w-[12%]
                                                        px-3 py-3
                                                    ">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <FaClock />
                                                            Intervalo
                                                        </div>
                                                    </th>

                                                    <th className="
                                                        w-[9%]
                                                        px-3 py-3
                                                    ">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <FaWeightHanging />
                                                            Carga
                                                        </div>
                                                    </th>

                                                    <th className="
                                                        w-[8%]
                                                        px-3 py-3
                                                    ">
                                                        RIR
                                                    </th>

                                                    <th className="
                                                        w-[30%]
                                                        px-4 py-3
                                                        text-left
                                                    ">
                                                        <div className="flex items-center gap-2">
                                                            <FaNotesMedical />
                                                            Observações
                                                        </div>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Array.from({
                                                    length: 12
                                                }).map(
                                                    (_, exercicioIndex) => {

                                                        const exercicio =
                                                            treino?.exercicios?.[
                                                            exercicioIndex
                                                            ];

                                                        return (

                                                            <tr
                                                                key={exercicioIndex}
                                                                className="
                                                                    border-t
                                                                    border-zinc-100
                                                                    transition-colors
                                                                    hover:bg-[#a85f60]/[0.025]
                                                                "
                                                            >

                                                                <td className="px-3 py-1.5">

                                                                    <div className="flex items-center gap-2">

                                                                        <span className="
                                                                            flex h-7 w-7
                                                                            shrink-0
                                                                            items-center
                                                                            justify-center
                                                                            rounded-lg
                                                                            bg-zinc-100
                                                                            text-[10px]
                                                                            font-black
                                                                            text-zinc-400
                                                                        ">
                                                                            {String(
                                                                                exercicioIndex + 1
                                                                            ).padStart(2, "0")}
                                                                        </span>

                                                                        <input
                                                                            type="text"
                                                                            value={
                                                                                exercicio?.exercicio ?? ""
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
                                                                            transition-all
                                                                            duration-150
                                                                            placeholder:text-zinc-400
                                                                            hover:border-zinc-500
                                                                            hover:bg-[#e8e8e8]
                                                                            focus:border-[#8f4f51]
                                                                            focus:bg-[#f5eeee]
                                                                            focus:ring-2
                                                                            focus:ring-[#8f4f51]/20
                                                                            "
                                                                        />

                                                                    </div>

                                                                </td>

                                                                <td className="px-2 py-1.5">

                                                                    <input
                                                                        type="text"
                                                                        value={
                                                                            exercicio?.series ?? ""
                                                                        }
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
                                                                        transition-all
                                                                        duration-150
                                                                        hover:border-zinc-500
                                                                        hover:bg-[#e8e8e8]
                                                                        focus:border-[#8f4f51]
                                                                        focus:bg-[#f5eeee]
                                                                        focus:ring-2
                                                                        focus:ring-[#8f4f51]/20
                                                                    "
                                                                    />

                                                                </td>

                                                                <td className="px-2 py-1.5">

                                                                    <input
                                                                        type="text"
                                                                        value={
                                                                            exercicio?.repeticoes ?? ""
                                                                        }
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
                                                                            transition-all
                                                                            duration-150
                                                                            hover:border-zinc-500
                                                                            hover:bg-[#e8e8e8]
                                                                            focus:border-[#8f4f51]
                                                                            focus:bg-[#f5eeee]
                                                                            focus:ring-2
                                                                            focus:ring-[#8f4f51]/20
                                                                        "
                                                                    />

                                                                </td>

                                                                <td className="px-2 py-1.5">

                                                                    <input
                                                                        list={`intervalos-${treinoIndex}-${exercicioIndex}`}
                                                                        type="text"
                                                                        value={
                                                                            exercicio?.intervalo ?? ""
                                                                        }
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
                                                                            transition-all
                                                                            duration-150
                                                                            hover:border-zinc-500
                                                                            hover:bg-[#e8e8e8]
                                                                            focus:border-[#8f4f51]
                                                                            focus:bg-[#f5eeee]
                                                                            focus:ring-2
                                                                            focus:ring-[#8f4f51]/20
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

                                                                <td className="px-2 py-1.5">
                                                                    <input
                                                                        type="text"
                                                                        value={
                                                                            exercicio?.carga ?? ""
                                                                        }
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
                                                                            transition-all
                                                                            duration-150
                                                                            hover:border-zinc-500
                                                                            hover:bg-[#e8e8e8]
                                                                            focus:border-[#8f4f51]
                                                                            focus:bg-[#f5eeee]
                                                                            focus:ring-2
                                                                            focus:ring-[#8f4f51]/20
                                                                        "
                                                                    />

                                                                </td>
                                                                <td className="px-2 py-1.5">

                                                                    <input
                                                                        type="text"
                                                                        value={
                                                                            exercicio?.rirMax ?? ""
                                                                        }
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
                                                                            transition-all
                                                                            duration-150
                                                                            hover:border-[#8f4f51]
                                                                            hover:bg-[#eadada]
                                                                            focus:border-[#713b3d]
                                                                            focus:bg-[#eadada]
                                                                            focus:ring-2
                                                                            focus:ring-[#8f4f51]/20
                                                                        "
                                                                    />
                                                                </td>
                                                                <td className="px-3 py-1.5">

                                                                    <input
                                                                        type="text"
                                                                        value={
                                                                            exercicio?.observacoes ?? ""
                                                                        }
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
                                                                            transition-all
                                                                            duration-150
                                                                            placeholder:text-zinc-400
                                                                            hover:border-zinc-500
                                                                            hover:bg-[#e8e8e8]
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
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>
                            );
                        }
                    )}
                </div>
            </div>
            <div>
                {navTool()}
            </div>
            <div className="h-24" />
        </main>
    );
}