import { BsFillHouseDoorFill, BsSliders } from "react-icons/bs";

export default function painel() {
    return (
        <div className="flex h-screen bg-gray-100">
            {/* <!-- Sidebar --> */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col">
                {/* <!-- Logo / Topo da Sidebar --> */}
                <div className="p-5 text-xl font-bold border-b border-slate-800">
                    MeuApp
                </div>

                {/* <!-- Links de Navegação --> */}
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

                {/* <!-- Rodapé da Sidebar --> */}
                <div className="p-4 border-t border-slate-800 text-sm text-slate-400">
                    Sair
                </div>
            </aside>

            {/* <!-- Conteúdo Principal --> */}
            <main className="flex-1 p-8 overflow-y-auto">
                <h1 className="text-2xl font-semibold">Conteúdo Principal</h1>
                <p className="mt-4">O restante da página fica aqui.</p>
            </main>
        </div>
    )
}
