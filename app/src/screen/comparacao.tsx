import { useAvaliacao } from '../context/avaliacaoContext'
import { useState, useMemo } from 'react'
import React from 'react'



export default function comparacao() {
    return (
        <main className="min-h-screen bg-[#cfd2d7] p-3 md:p-5">
            <hr className="my-4 border-3 rounded-2xl mb-5 border-zinc-400" />
            <div className="flex flex-col">
                <h1 className="text-3xl font-bold italic text-">Evolução de atleta</h1>
            </div>
        </main>
    )
}
