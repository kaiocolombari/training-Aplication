import { initialState, useAvaliacao } from '../context/avaliacaoContext'
import navTool from '../components/navTool'
import type { ExercicioTreino } from '../interface/interfaceExercicio';
import { useEffect } from 'react';

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
                            on: "",
                            off: "",
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

    const adicionarExercicio = (treinoId: string, exercicioIndex: number, valor: string, campo: keyof ExercicioTreino) => {
        setAvaliacao((prev) => ({
            ...prev,
            treino: prev.treino.map((treino) => {
                if (treino.id !== treinoId) {
                    return treino;
                }

                return {
                    ...treino,
                    exercicios: treino.exercicios.map((exercicio, index) =>
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
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = "Tem certeza que deseja sair?";
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, []);

    console.log(avaliacao.treino);

    return (
        <main className="h-full bg-[#ececec] p-3 md:p-5">
            <hr className="mb-5 my-4 rounded-2xl border-[3px] border-zinc-400" />

            <div className="flex flex-col">
                <h1 className="mb-3 text-3xl font-bold italic text-zinc-600">
                    Planilha de Treinamento
                </h1>
            </div>

            <div className="mt-10 flex flex-col">
                <h1 className="mb-3 text-xl font-bold italic uppercase text-zinc-600">
                    Treino Mugen
                </h1>
            </div>

            {Array.from({ length: 12 }).map((_, treinoIndex) => {
                const treino = avaliacao.treino[treinoIndex];

                return (
                    <div
                        className="mt-10 overflow-x-auto"
                        key={treinoIndex}
                    >
                        <div className="mt-5 flex flex-col">
                            <h1 className="w-full border-b-2 border-[#b88b8b] pb-1 text-lg font-bold italic uppercase tracking-wide text-[#a85f60]">
                                Treino {treinoIndex + 1}
                            </h1>
                        </div>
                        <div className="flex min-w-[1100px] items-start gap-4">
                            <div className="w-[115px] shrink-0">
                                <div className="pb-1 py-1 text-center text-x font-bold italic uppercase text-zinc-600">
                                    Nome Treino
                                </div>

                                <input
                                    type="text"
                                    value={treino?.nome ?? ""}
                                    onChange={(e) =>
                                        atualizarNomeTreino(
                                            treinoIndex,
                                            e.target.value
                                        )
                                    }
                                    className="h-9 w-full border-2 border-zinc-700 bg-white px-2 text-center text-lg text-zinc-700 outline-none"
                                />
                            </div>

                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="font-bold italic uppercase text-zinc-600">
                                        <th className="w-[20%] px-2 py-1 text-center text-x">
                                            Exercício
                                        </th>
                                        <th className="w-[8%] px-2 py-1 text-center text-x">
                                            Séries
                                        </th>
                                        <th className="w-[8%] px-2 py-1 text-center text-x">
                                            Repetições
                                        </th>
                                        <th className="w-[10%] px-2 py-1 text-center text-x">
                                            Intervalo
                                        </th>
                                        <th className="w-[8%] px-2 py-1 text-center text-x">
                                            Carga
                                        </th>
                                        <th className="w-[5%] px-2 py-1 text-center text-x">
                                            ON
                                        </th>
                                        <th className="w-[5%] px-2 py-1 text-center text-x">
                                            OFF
                                        </th>
                                        <th className="w-[28%] px-2 py-1 text-center text-x">
                                            Observações
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {Array.from({ length: 12 }).map(
                                        (_, exercicioIndex) => {
                                            const exercicio =
                                                treino?.exercicios?.[
                                                exercicioIndex
                                                ];

                                            return (
                                                <tr key={exercicioIndex}>
                                                    <td className="border-2 border-zinc-700">
                                                        <input
                                                            type="text"
                                                            value={exercicio?.exercicio ?? ""}
                                                            onChange={(e) =>
                                                                adicionarExercicio(
                                                                    treino.id,
                                                                    exercicioIndex,
                                                                    e.target.value,
                                                                    "exercicio"
                                                                )
                                                            }
                                                            className="h-8 w-full bg-transparent px-2 text-xl text-black outline-none"
                                                        />
                                                    </td>

                                                    <td className="border-2 border-zinc-700">
                                                        <input
                                                            type="text"
                                                            value={exercicio?.series ?? ""}
                                                            onChange={(e) =>
                                                                adicionarExercicio(
                                                                    treino.id,
                                                                    exercicioIndex,
                                                                    e.target.value,
                                                                    "series"
                                                                )
                                                            }
                                                            className="h-8 w-full bg-transparent px-2 text-center text-xl text-black outline-none"
                                                        />
                                                    </td>

                                                    <td className="border-2 border-zinc-700">
                                                        <input
                                                            type="text"
                                                            value={exercicio?.repeticoes ?? ""}
                                                            onChange={(e) =>
                                                                adicionarExercicio(
                                                                    treino.id,
                                                                    exercicioIndex,
                                                                    e.target.value,
                                                                    "repeticoes"
                                                                )
                                                            }
                                                            className="h-8 w-full bg-transparent px-2 text-center text-xl text-black outline-none"
                                                        />
                                                    </td>

                                                    <td className="border-2 border-zinc-700">
                                                        <input
                                                            list={`intervalos-${exercicioIndex}`}
                                                            type="text"
                                                            value={exercicio?.intervalo ?? ""}
                                                            onChange={(e) =>
                                                                adicionarExercicio(
                                                                    treino.id,
                                                                    exercicioIndex,
                                                                    e.target.value,
                                                                    "intervalo"
                                                                )
                                                            }
                                                            className="h-8 w-full bg-transparent px-2 text-center text-xl text-black outline-none"
                                                        />

                                                        <datalist id={`intervalos-${exercicioIndex}`}>
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

                                                    <td className="border-2 border-zinc-700">
                                                        <input
                                                            type="text"
                                                            value={exercicio?.carga ?? ""}
                                                            onChange={(e) =>
                                                                adicionarExercicio(
                                                                    treino.id,
                                                                    exercicioIndex,
                                                                    e.target.value,
                                                                    "carga"
                                                                )
                                                            }
                                                            className="h-8 w-full bg-transparent px-2 text-center text-xl text-black outline-none"
                                                        />
                                                    </td>

                                                    <td className="border-2 border-zinc-700">
                                                        <input
                                                            type="text"
                                                            value={exercicio?.on ?? ""}
                                                            onChange={(e) =>
                                                                adicionarExercicio(
                                                                    treino.id,
                                                                    exercicioIndex,
                                                                    e.target.value,
                                                                    "on"
                                                                )
                                                            }
                                                            className="h-8 w-full bg-transparent px-2 text-center text-xl text-black outline-none"
                                                        />
                                                    </td>

                                                    <td className="border-2 border-zinc-700">
                                                        <input
                                                            type="text"
                                                            value={exercicio?.off ?? ""}
                                                            onChange={(e) =>
                                                                adicionarExercicio(
                                                                    treino.id,
                                                                    exercicioIndex,
                                                                    e.target.value,
                                                                    "off"
                                                                )
                                                            }
                                                            className="h-8 w-full bg-transparent px-2 text-center text-xl text-black outline-none"
                                                        />
                                                    </td>

                                                    <td className="border-2 border-zinc-700">
                                                        <input
                                                            type="text"
                                                            value={exercicio?.observacoes ?? ""}
                                                            onChange={(e) =>
                                                                adicionarExercicio(
                                                                    treino.id,
                                                                    exercicioIndex,
                                                                    e.target.value,
                                                                    "observacoes"
                                                                )
                                                            }
                                                            className="h-8 w-full bg-transparent px-2  text-xl text-black outline-none"
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        }
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })}
            <div>
                {navTool()}
            </div>
            <br />
            <br />
        </main>
    )
}