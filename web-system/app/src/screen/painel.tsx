import { BsFillHouseDoorFill, BsSliders } from "react-icons/bs";
import navTool from "../components/navTool";
import warn from "../assets/preditiva1.gif"
import manutencao from "../assets/manutencao.gif"
import { useEffect, useState } from "react";

export default function painel() {
    const [porcento, setPorcento] = useState(0);

    useEffect(() => {
        var numero = Math.floor(Math.random() * 100) + 1;
        setPorcento(numero);
    }, []);

    return (
        <div className="flex h-screen bg-gray-100">
            <aside className="w-64 bg-slate-900 text-white flex flex-col">                <div className="p-5 text-xl font-bold border-b border-slate-800">
                MeuApp
            </div>
                <nav className="flex-1 p-4 space-y-2">
                    <a href="#" className=" flex items-center px-4 py-2 rounded gap-5 hover:bg-slate-800 transition">
                        <BsFillHouseDoorFill />
                        <text className="font-bold">Início</text>
                    </a>
                    <a href="#" className=" flex items-center px-4 py-2 rounded gap-5 hover:bg-slate-800 transition">
                        <BsSliders />
                        <text className="font-bold">Gestão Geral</text>
                    </a>
                    <a href="#" className=" flex items-center px-4 py-2 rounded gap-5 hover:bg-slate-800 transition">
                        <BsFillHouseDoorFill />
                        <text className="font-bold">Início</text>
                    </a>
                </nav>
                <div className="p-4 border-t border-slate-800 text-sm text-slate-400">
                    Sair
                </div>
            </aside>

            <main className="h-full w-full flex items-center justify-center p-8">
                <section className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-yellow-300/30 bg-gradient-to-br from-yellow-50 via-white to-orange-50 p-10 shadow-xl">

                    <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-yellow-300/20 blur-2xl" />
                    <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-orange-300/20 blur-2xl" />

                    <div className="absolute left-0 top-0 w-full overflow-hidden">
                        <div className="bg-yellow-400 py-2 text-center text-sm font-black tracking-[0.3em] text-yellow-950">
                            ⚠️ ÁREA EM MANUTENÇÃO ⚠️
                        </div>
                    </div>

                    <div className="relative flex flex-col items-center gap-8 pt-8">

                        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                            <img
                                src={warn}
                                alt="Aviso"
                                className="h-52 w-52 object-contain drop-shadow-lg transition-transform duration-300 hover:rotate-3 hover:scale-105"
                            />
                            <img
                                src={manutencao}
                                alt="Em manutenção"
                                className="h-52 w-52 object-contain drop-shadow-lg transition-transform duration-300 hover:-rotate-3 hover:scale-105"
                            />
                        </div>

                        <div className="max-w-2xl space-y-4">
                            <h1 className="text-4xl font-black text-gray-800 sm:text-5xl">
                                Opa! 👷‍♂️
                            </h1>

                            <h2 className="text-2xl font-bold text-yellow-600">
                                Essa parte está em manutenção!
                            </h2>

                            <p className="text-base leading-relaxed text-gray-600 sm:text-lg">
                                Não tive tempo nem paciência para terminar tudo isso, porém quando fizer minha tatuagem posso acabar rapidamente o site inteiro.
                            </p>

                            <p className="font-semibold text-gray-500">
                                Em breve estará tudo funcionando novamente (talvez). 🚧
                            </p>
                        </div>

                        <div className="flex flex-wrap justify-center gap-3">
                            <span className="rounded-full bg-yellow-100 px-4 py-2 text-sm font-bold text-yellow-700">
                                🔧 Ajustando algumas coisas
                            </span>

                            <span className="rounded-full bg-orange-100 px-4 py-2 text-sm font-bold text-orange-700">
                                ☕ Café sendo preparado
                            </span>

                            <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-bold text-green-700">
                                🚀 Voltaremos em breve
                            </span>
                        </div>

                        <div className="w-full max-w-md">
                            <div className="mb-2 flex justify-between text-xs font-bold text-gray-500">
                                <span>Consertando...</span>
                                <span>
                                    {porcento !== null ? porcento : 'Carregando...'}%</span>
                            </div>

                            <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                                <div className="h-full animate-pulse rounded-full bg-gradient-to-r from-yellow-400 to-orange-400" style={{ width: `${porcento}%` }} />
                            </div>
                        </div>

                        <div className="rounded-2xl bg-gray-900 px-6 py-4 text-center text-sm text-gray-200 shadow-lg">
                            <span className="font-mono">
                                &gt; Pagar o Kaio
                            </span>

                            <div className="mt-1 text-gray-400">
                                "Talvez Funcione Mais Rapido"
                            </div>
                        </div>

                    </div>
                </section>
            </main>
            {navTool()}
        </div>
    )
}
