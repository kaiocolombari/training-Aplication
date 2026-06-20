import { useState, useMemo } from "react";
import { useAvaliacao } from "../context/avaliacaoContext";
import navTool from "../components/navTool";


export default function intensidade() {
    const { avaliacao, setAvaliacao } = useAvaliacao();

    return (
        <main className="h-full bg-[#ececec] p-3 md:p-5">
            <h1 className="w-full border-b-2 border-[#b88b8b] pb-1 text-2xl font-bold italic uppercase tracking-wide text-[#a85f60]">
                Intensidade
            </h1>
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
                                            RIR Max
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
                                                            className="h-8 w-full bg-transparent px-2 text-xl text-black outline-none"
                                                        />
                                                    </td>

                                                    <td className="border-2 border-zinc-700">
                                                        <input
                                                            type="text"
                                                            value={exercicio?.series ?? ""}
                                                            className="h-8 w-full bg-transparent px-2 text-center text-xl text-black outline-none"
                                                        />
                                                    </td>

                                                    <td className="border-2 border-zinc-700">
                                                        <input
                                                            type="text"
                                                            value={exercicio?.repeticoes ?? ""}
                                                            className="h-8 w-full bg-transparent px-2 text-center text-xl text-black outline-none"
                                                        />
                                                    </td>

                                                    <td className="border-2 border-zinc-700">
                                                        <input
                                                            list={`intervalos-${exercicioIndex}`}
                                                            type="text"
                                                            value={exercicio?.intervalo ?? ""}
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
                                                            className="h-8 w-full bg-transparent px-2 text-center text-xl text-black outline-none"
                                                        />
                                                    </td>

                                                    <td className="border-2 border-zinc-700">
                                                        <input
                                                            type="text"
                                                            value={exercicio?.rirMax ?? ""}
                                                            className="h-8 w-full bg-transparent px-2 text-center text-xl text-black outline-none"
                                                        />
                                                    </td>

                                                    <td className="border-2 border-zinc-700">
                                                        <input
                                                            type="text"
                                                            value={exercicio?.observacoes ?? ""}
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
            })
            }
            <div>
                {navTool()}
            </div>
        </main>
    )
}
