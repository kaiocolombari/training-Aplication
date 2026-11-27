import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { BsActivity, BsArrowRight, BsChatDots, BsEye, BsEyeSlash } from "react-icons/bs";
import { useAuth } from "../context/authContext";
import { ApiError } from "../service/api";

const whatsappUrl = import.meta.env.VITE_WHATSAPP_CONTACT_URL?.trim();

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [erro, setErro] = useState("");
    const [enviando, setEnviando] = useState(false);

    async function entrar(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setErro("");
        setEnviando(true);
        try {
            await login({ email: email.trim(), senha });
            const from = (location.state as { from?: string } | null)?.from;
            navigate(from?.startsWith("/") ? from : "/", { replace: true });
        } catch (error) {
            setErro(error instanceof ApiError ? error.message : "Não foi possível entrar. Tente novamente.");
        } finally {
            setEnviando(false);
        }
    }

    return (
        <main className="relative isolate grid min-h-screen place-items-center overflow-hidden bg-[#ececec] px-5 py-12">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_10%,rgba(168,95,96,.14),transparent_34%),radial-gradient(circle_at_90%_85%,rgba(168,95,96,.10),transparent_35%)]" />
            <section className="grid w-full max-w-[980px] overflow-hidden rounded-[30px] border border-zinc-200 bg-white/85 shadow-[0_30px_90px_rgba(40,40,40,.14)] backdrop-blur-xl md:grid-cols-[1fr_.85fr]">
                <div className="relative hidden min-h-[560px] flex-col justify-between overflow-hidden bg-[#151a17] p-10 text-white md:flex">
                    <div aria-hidden="true" className="absolute -right-28 -top-24 h-80 w-80 rounded-full border-[48px] border-white/[.035]" />
                    <Link to="/" className="relative flex items-center gap-3 text-xs font-black tracking-[.2em]"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#a85f60]"><BsActivity size={19}/></span>TREINO <span className="text-[#c8ef73]">SYSTEM</span></Link>
                    <div className="relative max-w-md">
                        <p className="text-[10px] font-extrabold uppercase tracking-[.22em] text-[#c8ef73]">Equipe integrada</p>
                        <h1 className="mt-4 text-5xl font-black leading-[1.02] tracking-[-.06em]">Treino com direção. Evolução com acompanhamento.</h1>
                        <p className="mt-5 text-sm leading-7 text-white/50">Acesse seus treinos, acompanhe resultados e mantenha sua equipe informada sobre cada sessão.</p>
                    </div>
                    <p className="relative text-[9px] font-semibold uppercase tracking-[.16em] text-white/30">Acesso seguro para alunos e profissionais</p>
                </div>
                <div className="flex min-h-[560px] flex-col justify-center px-7 py-12 sm:px-12">
                    <Link to="/" className="mb-10 flex items-center gap-3 text-[11px] font-black tracking-[.18em] text-zinc-700 md:hidden"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#a85f60] text-white"><BsActivity size={17}/></span>TREINO SYSTEM</Link>
                    <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#a85f60]">Área de acesso</p>
                    <h2 className="mt-3 text-3xl font-bold tracking-[-.05em] text-zinc-800">Bem-vindo de volta.</h2>
                    <p className="mt-2 text-sm leading-6 text-zinc-500">Entre com os dados da conta criada através do convite da equipe.</p>
                    <form onSubmit={entrar} className="mt-9 space-y-5">
                        <label className="block"><span className="mb-2 block text-[10px] font-bold uppercase tracking-[.14em] text-zinc-600">E-mail</span><input type="email" required autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="voce@exemplo.com" className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-sm text-zinc-800 outline-none transition focus:border-[#a85f60] focus:bg-white" /></label>
                        <label className="block"><span className="mb-2 block text-[10px] font-bold uppercase tracking-[.14em] text-zinc-600">Senha</span><span className="relative block"><input type={mostrarSenha ? "text" : "password"} required autoComplete="current-password" value={senha} onChange={event => setSenha(event.target.value)} placeholder="Sua senha" className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 pr-12 text-sm text-zinc-800 outline-none transition focus:border-[#a85f60] focus:bg-white"/><button type="button" aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"} onClick={() => setMostrarSenha(value => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">{mostrarSenha ? <BsEyeSlash size={17}/> : <BsEye size={17}/>}</button></span></label>
                        {erro && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{erro}</p>}
                        <button type="submit" disabled={enviando} className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#a85f60] px-5 py-4 text-xs font-extrabold text-white transition hover:bg-[#914f50] disabled:opacity-50">{enviando ? "Entrando..." : "Entrar na plataforma"}<BsArrowRight size={16}/></button>
                    </form>
                    <div className="mt-8 border-t border-zinc-200 pt-6 text-center">
                        <p className="text-xs text-zinc-500">Ainda não recebeu um convite?</p>
                        {whatsappUrl ? <a href={whatsappUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-[#a85f60] hover:underline"><BsChatDots size={15}/> Conversar com a equipe</a> : <p className="mt-2 text-[10px] text-zinc-400">Solicite um link de convite diretamente a um profissional da equipe.</p>}
                    </div>
                </div>
            </section>
        </main>
    );
}
