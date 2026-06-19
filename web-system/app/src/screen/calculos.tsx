import navTool from "../components/navTool"
import { useState, useMemo } from "react"
import { useAvaliacao } from "../context/avaliacaoContext"

export default function calculos() {
    const { avaliacao, setAvaliacao } = useAvaliacao()

    const atualizarVolume = (
        semanaIndex: number,
        grupoIndex: number,
        valor: number
    ) => {

        setAvaliacao(prev => {

            const volume = [...prev.volume];

            volume[semanaIndex].grupos[grupoIndex] = {
                ...volume[semanaIndex].grupos[grupoIndex],
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

            <div className="grid grid-cols-[1fr_0.3fr]">
                {avaliacao.volume.map((semana, semanaIndex) => (

                    <div key={semana.semana}>

                        <h2>Semana {semana.semana}</h2>

                        {semana.grupos.map((grupo, grupoIndex) => (

                            <div key={grupo.id}>

                                <label>{grupo.grupo}</label>

                                <input
                                    type="number"
                                    value={grupo.volume}
                                    onChange={(e) =>
                                        atualizarVolume(
                                            semanaIndex,
                                            grupoIndex,
                                            Number(e.target.value)
                                        )
                                    }
                                />
                            </div>
                        ))}
                    </div>
                ))}
            </div>
            <div>
                {navTool()}
            </div>
        </main>
    )
}
