import navTool from "../components/navTool"
import { useState, useMemo } from "react"
import { useAvaliacao } from "../context/avaliacaoContext"

export default function calculos() {
    const { avaliacao, setAvaliacao } = useAvaliacao()

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
                <div
                    className="mt-10 p-3"
                >
                    <div className="mt-5 ">
                        <h1 className="w-full border-b-2 border-[#b88b8b] pb-1 text-lg font-bold italic uppercase tracking-wide text-[#a85f60]"></h1>
                    </div>

                    <div className="grid grid-cols-8 gap-2 mt-10">
                        <div className="flex text-xl text-[#a85f60] justify-center font-bold">
                            Semana 1
                        </div>

                        <div className="p-2">
                            <div className="mb-2 text-center text-sm font-bold">
                                Antebraço
                            </div>

                            <div className="flex flex-col border">
                                <input />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                {navTool()}
            </div>
        </main>
    )
}
