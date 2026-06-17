import navTool from "../components/navTool"

export default function calculos() {
    return (
        <main className="h-full bg-[#ececec] p-3 md:p-5">
            <hr className="mb-5 my-4 rounded-2xl border-[3px] border-zinc-400" />
            <div className="flex flex-col">
                <h1 className="mb-3 text-3xl font-bold italic text-zinc-600">
                    Volume - Intensidade
                </h1>
            </div>
            <div>
                {navTool()}
            </div>
        </main>
    )
}
