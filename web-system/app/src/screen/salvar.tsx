import { useState, useMemo, useEffect } from 'react'
import navTool from '../components/navTool'
import Connection from '../service/api'

export default function Salvar() {
    return (
        <main className="min-h-full bg-[#ececec] p-3 md:p-5">
            <div>
                <hr className="mb-5 my-4 rounded-2xl border-[3px] border-zinc-400" />

                <header className="flex flex-col gap-2 border-b-2 border-[#b88b8b] pb-3">
                    <h1 className="text-3xl font-bold italic text-zinc-600">
                        Salvar Dados Avaliação
                    </h1>
                    <p className="text-sm font-bold uppercase tracking-wide text-[#a85f60]">
                        {`Status API: ${Connection() ? 'Online' : 'Offline'}`}
                    </p>
                    <p>2</p>
                </header>
            </div>

            <div className="mt-10">{navTool()}</div>
        </main>
    )
}
