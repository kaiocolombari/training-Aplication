import { useAuth } from "../context/authContext";

export default function CadastroApp() {
    const { user, logout } = useAuth();
    return (
        <main className="grid min-h-screen place-items-center bg-[#111312] px-5 py-12 text-white">
            <section className="w-full max-w-xl text-center">
                <span className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-emerald-400/10 text-3xl text-emerald-300">✓</span>
                <p className="mt-8 text-[10px] font-bold uppercase tracking-[.24em] text-emerald-300">Perfil aprovado</p>
                <h1 className="mt-3 text-3xl font-semibold">Tudo pronto, {user?.nome}.</h1>
                <p className="mt-4 text-sm leading-7 text-white/60">Seu cadastro foi aprovado. Agora você pode acessar o aplicativo e acompanhar seus treinos.</p>
                {import.meta.env.VITE_MOBILE_APP_URL ? (
                    <a href={import.meta.env.VITE_MOBILE_APP_URL} target="_blank" rel="noreferrer" className="mt-8 inline-flex rounded-xl bg-[#a85f60] px-6 py-3 text-sm font-bold text-white">Abrir aplicativo mobile ↗</a>
                ) : (
                    <p className="mt-8 text-xs text-white/40">O link do aplicativo será disponibilizado em breve.</p>
                )}
                <button onClick={() => void logout()} className="mx-auto mt-5 block text-xs text-white/45 hover:text-white">Sair da conta</button>
            </section>
        </main>
    );
}
