import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { BsActivity, BsArrowLeft, BsArrowRight, BsCheckCircle, BsPersonBadge, BsShieldCheck } from "react-icons/bs";
import { useAuth } from "../context/authContext";
import { ApiError } from "../service/api";
import { conviteService, type ConvitePublico } from "../service/conviteService";
import TurnstileWidget from "../components/TurnstileWidget";

const whatsappUrl = import.meta.env.VITE_WHATSAPP_CONTACT_URL?.trim();

export default function RegistroConvite() {
    const { token = "" } = useParams();
    const navigate = useNavigate();
    const { registerStudent } = useAuth();
    const [convite, setConvite] = useState<ConvitePublico | null>(null);
    const [carregandoConvite, setCarregandoConvite] = useState(true);
    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [telefone, setTelefone] = useState("");
    const [senha, setSenha] = useState("");
    const [confirmacao, setConfirmacao] = useState("");
    const [captchaToken, setCaptchaToken] = useState("");
    const [captchaInstance, setCaptchaInstance] = useState(0);
    const [website, setWebsite] = useState("");
    const [erro, setErro] = useState("");
    const [enviando, setEnviando] = useState(false);

    useEffect(() => {
        let ativo = true;
        setCarregandoConvite(true);
        void conviteService.validar(token).then(result => {
            if (ativo) setConvite(result);
        }).catch(() => {
            if (ativo) setConvite({ valido: false, personalNome: "", apelido: "" });
        }).finally(() => {
            if (ativo) setCarregandoConvite(false);
        });
        return () => { ativo = false; };
    }, [token]);

    async function cadastrar(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setErro("");
        if (senha.length < 8 || senha !== confirmacao) {
            setErro(senha.length < 8 ? "A senha precisa ter pelo menos 8 caracteres." : "As senhas não coincidem.");
            return;
        }
        if (!captchaToken) {
            setErro("Conclua a verificação de segurança antes de continuar.");
            return;
        }
        setEnviando(true);
        try {
            await registerStudent({
                nomeCompleto: nome.trim(), email: email.trim(), telefone: telefone.trim() || undefined,
                senha, tokenConvite: token, captchaToken, website,
            });
            navigate("/cadastro/formulario", { replace: true });
        } catch (cause) {
            setErro(cause instanceof ApiError ? cause.message : "Não foi possível concluir o cadastro. Tente novamente.");
            setCaptchaToken("");
            setCaptchaInstance(value => value + 1);
        } finally {
            setEnviando(false);
        }
    }

    return (
        <main className="relative isolate grid min-h-screen place-items-center overflow-hidden bg-[#111512] px-5 py-12 text-white">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_80%_0%,rgba(168,95,96,.24),transparent_45%),linear-gradient(135deg,#111512,#1b211d)]" />
            <section className="w-full max-w-[560px] overflow-hidden rounded-[30px] border border-white/10 bg-white/[.045] shadow-2xl shadow-black/30 backdrop-blur-xl">
                <header className="flex items-center justify-between border-b border-white/10 px-6 py-5 sm:px-8">
                    <Link to="/" className="flex items-center gap-2 text-[10px] font-black tracking-[.18em]"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#a85f60]"><BsActivity size={17}/></span>TREINO SYSTEM</Link>
                    <Link to="/register" className="flex items-center gap-1 text-[10px] font-semibold text-white/50 hover:text-white"><BsArrowLeft size={13}/> Entrar</Link>
                </header>
                {carregandoConvite ? (
                    <div className="px-8 py-16 text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-[#c8ef73]"/><p className="mt-5 text-xs text-white/55">Validando seu convite...</p></div>
                ) : !convite?.valido ? (
                    <div className="px-8 py-14 text-center"><BsShieldCheck size={34} className="mx-auto text-[#d18b8c]"/><h1 className="mt-5 text-2xl font-bold">Convite indisponível</h1><p className="mt-3 text-xs leading-6 text-white/55">Este link pode ter expirado ou sido revogado. Solicite um novo convite a um profissional da equipe.</p>{whatsappUrl ? <a href={whatsappUrl} target="_blank" rel="noreferrer" className="mt-7 inline-flex rounded-xl bg-[#c8ef73] px-5 py-3 text-xs font-extrabold text-[#17211b]">Falar com a equipe</a> : null}</div>
                ) : (
                    <div className="px-6 py-8 sm:px-9 sm:py-9">
                        <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#c8ef73]">Convite de acesso</p>
                        <h1 className="mt-3 text-3xl font-black tracking-[-.05em]">Vamos começar.</h1>
                        <p className="mt-3 text-xs leading-6 text-white/55">Seu acesso foi enviado por um profissional da equipe. Crie sua conta e preencha o formulário para análise.</p>
                        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.055] p-4">
                            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#c8ef73]/10 text-[#c8ef73]"><BsPersonBadge size={20}/></span>
                            <span className="min-w-0"><span className="block text-[9px] font-bold uppercase tracking-[.15em] text-white/45">Seu contato na equipe</span><strong className="mt-1 block truncate text-sm font-bold text-white">{convite.personalNome}</strong><span className="mt-1 block text-[9px] text-white/45">Você pode citar este profissional ao falar com a equipe.</span></span>
                        </div>
                        <div className="mt-5 flex items-center gap-2 rounded-xl border border-[#c8ef73]/15 bg-[#c8ef73]/5 px-4 py-3 text-[10px] text-[#d9f5a6]"><BsCheckCircle size={15}/> Convite válido · {convite.apelido}</div>
                        <form onSubmit={cadastrar} className="mt-7 space-y-4">
                            <label className="block"><span className="mb-2 block text-[9px] font-bold uppercase tracking-[.15em] text-white/55">Nome completo</span><input required minLength={2} maxLength={160} autoComplete="name" value={nome} onChange={e => setNome(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3.5 text-sm outline-none focus:border-[#c8ef73]/60" placeholder="Seu nome"/></label>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="block"><span className="mb-2 block text-[9px] font-bold uppercase tracking-[.15em] text-white/55">E-mail</span><input type="email" required maxLength={254} autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3.5 text-sm outline-none focus:border-[#c8ef73]/60" placeholder="voce@email.com"/></label>
                                <label className="block"><span className="mb-2 block text-[9px] font-bold uppercase tracking-[.15em] text-white/55">Telefone (opcional)</span><input type="tel" maxLength={30} autoComplete="tel" value={telefone} onChange={e => setTelefone(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3.5 text-sm outline-none focus:border-[#c8ef73]/60" placeholder="(00) 00000-0000"/></label>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="block"><span className="mb-2 block text-[9px] font-bold uppercase tracking-[.15em] text-white/55">Senha</span><input type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={senha} onChange={e => setSenha(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3.5 text-sm outline-none focus:border-[#c8ef73]/60" placeholder="Mínimo de 8 caracteres"/></label>
                                <label className="block"><span className="mb-2 block text-[9px] font-bold uppercase tracking-[.15em] text-white/55">Confirmar senha</span><input type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={confirmacao} onChange={e => setConfirmacao(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3.5 text-sm outline-none focus:border-[#c8ef73]/60" placeholder="Repita sua senha"/></label>
                            </div>
                            <label className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={website} onChange={e => setWebsite(e.target.value)}/></label>
                            <div className="rounded-xl border border-white/10 bg-black/15 p-3"><TurnstileWidget key={captchaInstance} action="student_register" onToken={setCaptchaToken}/></div>
                            {erro && <p role="alert" className="rounded-xl border border-rose-300/20 bg-rose-300/5 px-4 py-3 text-xs text-rose-200">{erro}</p>}
                            <button type="submit" disabled={enviando || !captchaToken} className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#c8ef73] px-5 py-4 text-xs font-black text-[#17211b] transition hover:bg-[#d8f69c] disabled:cursor-not-allowed disabled:opacity-50">{enviando ? "Criando acesso..." : "Criar minha conta"}<BsArrowRight size={16}/></button>
                            <p className="text-center text-[9px] leading-5 text-white/30">Após criar a conta, você preencherá o formulário de avaliação. O acesso aos treinos será liberado após análise da equipe.</p>
                        </form>
                    </div>
                )}
            </section>
        </main>
    );
}
