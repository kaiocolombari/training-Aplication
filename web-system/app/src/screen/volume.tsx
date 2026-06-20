import navTool from "../components/navTool"
import { useState, useMemo } from "react"
import { useAvaliacao } from "../context/avaliacaoContext"
import { FaSearch } from "react-icons/fa"

export default function calculos() {
    const { avaliacao, setAvaliacao } = useAvaliacao()
    const [semanaAtual, setSemanaAtual] = useState(0);
    const [modalAberto, setModalAberto] = useState(false);
    const [grupoSelecionado, setGrupoSelecionado] = useState(
        avaliacao.volume[0].grupos[0].id
    );

    const [valorModal, setValorModal] = useState("");

    const [semanaModal, setSemanaModal] = useState(semanaAtual + 1);


    const semana = avaliacao.volume[semanaAtual];

    const aplicarValor = () => {
        const indiceGrupo = avaliacao.volume[0].grupos.findIndex(
            g => g.id === grupoSelecionado
        );

        if (indiceGrupo === -1) return;

        setAvaliacao(prev => {
            const volume = [...prev.volume];

            volume[semanaModal - 1].grupos[indiceGrupo] = {
                ...volume[semanaModal - 1].grupos[indiceGrupo],
                volume: Number(valorModal)
            };

            return {
                ...prev,
                volume
            };
        });

        setModalAberto(false);
        setValorModal("");
    };

    const atualizarVolume = (
        grupoIndex: number,
        valor: number
    ) => {
        setAvaliacao(prev => {
            const volume = [...prev.volume];

            volume[semanaAtual].grupos[grupoIndex] = {
                ...volume[semanaAtual].grupos[grupoIndex],
                volume: valor,
            };

            return {
                ...prev,
                volume,
            };
        });
    };

    return (
        <main className="h-full bg-[#ececec] p-3 md:p-5">
            <hr className="mb-5 my-4 rounded-2xl border-[3px] border-zinc-400" />
            <div className="flex flex-col">
                <h1 className="mb-3 text-3xl font-bold italic text-zinc-600">
                    Volume - Intensidade
                </h1>
            </div>
            <div className="mt-10 flex flex-col">
                <h1 className="w-full border-b-2 border-[#b88b8b] pb-1 text-lg font-bold italic uppercase tracking-wide text-[#a85f60]">
                    Volume
                </h1>
            </div>

            <div className="grid grid-cols-[1fr]">
                <div
                    className="mt-10 p-3"
                >

                    <div className="flex items-center justify-between mb-2">

                        <button
                            onClick={() =>
                                setSemanaAtual(s => Math.max(0, s - 1))
                            }
                            disabled={semanaAtual === 0}
                            className="rounded-lg bg-zinc-700 px-5 py-2 text-white hover:cursor-pointer hover:bg-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            ← Semana anterior
                        </button>

                        <div className="text-2xl font-bold text-[#a85f60]">
                            Semana {semanaAtual + 1} / 12
                        </div>

                        <button
                            onClick={() =>
                                setSemanaAtual(s => Math.min(11, s + 1))
                            }
                            disabled={semanaAtual === 11}
                            className="rounded-lg bg-zinc-700 px-5 py-2 text-white hover:cursor-pointer hover:bg-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Próxima semana →
                        </button>

                    </div>
                    <button
                        onClick={() => setModalAberto(true)}
                        className="flex items-center justify-center gap-2 rounded bg-zinc-700 px-4 py-2 text-white mb-8 hover:cursor-pointer hover:bg-zinc-600"
                    >
                        <text>Setar Valores</text>
                        <FaSearch size={15} />
                    </button>


                    <div className="grid grid-cols-2 gap-4">
                        {semana.grupos.map((grupo, grupoIndex) => (
                            <div key={grupo.id} className="flex flex-col">
                                <label className="mb-2 text-center text-sm font-bold italic uppercase tracking-wide text-zinc-600">
                                    {grupo.grupo}
                                </label>

                                <input
                                    type="text"
                                    className="w-full rounded-md border border-[#b88b8b] p-2 text-center text-lg font-bold italic uppercase tracking-wide text-[#a85f60] bg-[#e6e6e6]"
                                    value={grupo.volume}
                                    onChange={(e) =>
                                        atualizarVolume(
                                            grupoIndex,
                                            Number(e.target.value)
                                        )
                                    }
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {modalAberto && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/50">
                    <div className="w-96 rounded-lg bg-white p-6 shadow-xl">
                        <h2 className="mb-4 text-2xl font-bold">
                            Difinir valor especifico
                        </h2>

                        <select
                            className="mb-4 w-full rounded-md border p-2"
                            value={grupoSelecionado}
                            onChange={(e) => setGrupoSelecionado(e.target.value)}
                        >
                            {avaliacao.volume[0].grupos.map((grupo) => (
                                <option key={grupo.id} value={grupo.id}>
                                    {grupo.grupo}
                                </option>
                            ))}
                        </select>

                        <select
                            className="mb-4 w-full rounded-md border p-2"
                            value={semanaModal}
                            onChange={(e) => setSemanaModal(Number(e.target.value))}
                        >
                            {avaliacao.volume.map((_, index) => (
                                <option key={index} value={index + 1}>
                                    Semana {index + 1}
                                </option>
                            ))}
                        </select>

                        <input
                            type="number"
                            value={valorModal}
                            onChange={(e) => setValorModal(e.target.value)}
                            className="mb-4 w-full rounded-md border p-2"
                            placeholder="Valor"
                        />

                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                onClick={() => setModalAberto(false)}
                                className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-400 hover:cursor-pointer"
                            >
                                Cancelar
                            </button>

                            <button
                                onClick={aplicarValor}
                                className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-500 hover:cursor-pointer"
                            >
                                Aplicar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div>
                {navTool()}
            </div>
            <br />
            <div className="mt-20 flex flex-col">
                <h1 className="w-full border-b-2 border-[#b88b8b] pb-1 text-lg font-bold italic uppercase tracking-wide text-[#a85f60]">
                    Intensidade
                </h1>
            </div>
        </main>
    )
}
