import { Link, useLocation } from "react-router";
import { BsShieldLock } from "react-icons/bs";

export default function AcessoNegado() {
    const location = useLocation();
    const state = location.state as { from?: string; endpoint?: string } | null;

    return (
        <main className="grid min-h-screen place-items-center bg-[#f5f5f4] px-6 py-12">
            <section className="w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-[0_24px_70px_rgba(24,24,27,0.08)] sm:p-10">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-700">
                    <BsShieldLock size={25} />
                </span>
                <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700">Acesso restrito</p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">Você não tem permissão para esta área</h1>
                <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-zinc-500">Seu perfil não possui autorização para realizar essa operação. A sessão continua ativa; nenhuma alteração foi autorizada pela API.</p>
                {state?.endpoint && <p className="mt-4 break-all rounded-lg bg-zinc-50 px-3 py-2 font-mono text-[10px] text-zinc-500">Recurso: {state.endpoint}</p>}
                <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
                    <Link to="/" className="rounded-xl bg-zinc-900 px-5 py-3 text-xs font-semibold text-white transition hover:bg-zinc-700">Voltar ao painel</Link>
                    {state?.from && state.from !== "/acesso-negado" && <Link to={state.from} className="rounded-xl border border-zinc-200 px-5 py-3 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50">Voltar à página anterior</Link>}
                </div>
            </section>
        </main>
    );
}
