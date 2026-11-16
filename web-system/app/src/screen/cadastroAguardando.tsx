import { useAuth } from "../context/authContext";
import { useNavigate } from "react-router";

export default function CadastroAguardando() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    return (
        <main className="relative isolate grid min-h-screen place-items-center overflow-hidden bg-[#111312] px-5 py-12 text-white">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_25%,rgba(168,95,96,.22),transparent_42%),linear-gradient(135deg,#111312,#1c211e)]"
            />
            <section className="w-full max-w-xl text-center">
                <span className="mx-auto grid h-20 w-20 place-items-center rounded-3xl border border-[#c47c7d]/30 bg-[#a85f60]/15 text-3xl text-[#e0a4a5]">
                    ✓
                </span>
                <p className="mt-8 text-[10px] font-bold uppercase tracking-[.24em] text-[#d18b8c]">
                    Cadastro recebido
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                    Seu perfil está sendo avaliado.
                </h1>
                <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-white/60">
                    Obrigado, {user?.nome}. Nossa equipe recebeu suas informações. Assim que a
                    avaliação for concluída, seu acesso será liberado.
                </p>
                <div className="mt-8 rounded-2xl border border-white/10 bg-white/[.045] p-5 text-left">
                    <div className="flex items-center gap-3">
                        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-amber-400" />
                        <span className="text-sm font-semibold">Em análise pela equipe</span>
                    </div>
                    <p className="mt-2 pl-[22px] text-xs leading-5 text-white/45">
                        Você já pode instalar o aplicativo mobile. O acesso aos treinos será
                        liberado após a aprovação.
                    </p>
                </div>
                <div className="mt-7 flex flex-wrap justify-center gap-3">
                    <a
                        href={import.meta.env.VITE_MOBILE_APP_URL || undefined}
                        target="_blank"
                        rel="noreferrer"
                        aria-disabled={!import.meta.env.VITE_MOBILE_APP_URL}
                        className="rounded-xl bg-[#a85f60] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#bd7374] aria-disabled:pointer-events-none aria-disabled:opacity-40"
                    >
                        Instalar aplicativo mobile ↗
                    </a>
                    <button
                        onClick={() => void logout().then(() => navigate("/register"))}
                        className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white/70 transition hover:bg-white/5"
                    >
                        Sair
                    </button>
                </div>
                {!import.meta.env.VITE_MOBILE_APP_URL && (
                    <p className="mt-3 text-[10px] text-white/35">
                        Configure VITE_MOBILE_APP_URL no ambiente web para ativar o link de
                        instalação.
                    </p>
                )}
            </section>
        </main>
    );
}
