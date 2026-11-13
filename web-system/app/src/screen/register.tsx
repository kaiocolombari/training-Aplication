import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { criarPersonal } from "../service/personalService";
import "../../app.css";

type Mode = "signup" | "login";
type Profile = "personal" | "student";

function BoltIcon() {
    return (
        <svg viewBox="0 0 32 32" className="w-[17px] fill-white">
            <path d="M18.7 2 7 18h8l-1.8 12L25 13h-8.1L18.7 2Z" />
        </svg>
    );
}

function ActivityIcon() {
    return (
        <svg
            viewBox="0 0 80 80"
            className="w-[76px] fill-none stroke-current stroke-[2] [stroke-linecap:round] [stroke-linejoin:round] drop-shadow-[0_7px_10px_rgba(168,95,96,0.18)]"
        >
            <path d="M7 43h13l7-18 12 34 9-24 7 8h18" />
            <circle cx="40" cy="40" r="34" />
        </svg>
    );
}

function EyeIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="w-[15px] fill-none stroke-current stroke-[1.5]"
        >
            <path d="M2.5 12s3.5-5 9.5-5 9.5 5 9.5 5-3.5 5-9.5 5-9.5-5-9.5-5Z" />
            <circle cx="12" cy="12" r="2.5" />
        </svg>
    );
}

export default function Register() {
    const navigate = useNavigate();

    const [mode, setMode] = useState<Mode>("login");
    const [profile, setProfile] = useState<Profile>("personal");

    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [telefone, setTelefone] = useState("");
    const [senha, setSenha] = useState("");
    const [confirmarSenha, setConfirmarSenha] = useState("");

    const [erro, setErro] = useState("");
    const [message, setMessage] = useState("");

    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [carregando, setCarregando] = useState(false);

    const isSignup = mode === "signup";

    function switchMode(nextMode: Mode) {
        setMode(nextMode);
        setErro("");
        setMessage("");
        setMostrarSenha(false);
    }

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();

        setErro("");
        setMessage("");

        if (isSignup) {
            if (!nome || !email || !telefone || !senha || !confirmarSenha) {
                setErro("Preencha todos os campos.");
                return;
            }

            if (senha !== confirmarSenha) {
                setErro("As senhas não coincidem.");
                return;
            }

            if (senha.length < 6) {
                setErro("A senha deve possuir pelo menos 6 caracteres.");
                return;
            }

            try {
                setCarregando(true);

                const personal = await criarPersonal({
                    email,
                    nomeCompleto: nome,
                    telefone,
                    senha,
                });

                console.log("Personal criado:", personal);

                navigate("/login");
            } catch (error) {
                if (error instanceof Error) {
                    setErro(error.message);
                } else {
                    setErro("Erro ao criar conta.");
                }
            } finally {
                setCarregando(false);
            }

            return;
        }

        // Integração do login pode ser adicionada aqui.
        setMessage("Formulário de login pronto para integração.");
    }

    return (
        <main className="relative isolate grid min-h-screen place-items-center overflow-hidden bg-[#ececec] px-6 py-[86px] pb-[62px]">

            {/* FUNDO DECORATIVO */}

            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
            >
                {/* Grade de fundo */}
                <div
                    className="absolute inset-0 opacity-70"
                    style={{
                        backgroundImage: `
                            linear-gradient(rgba(113,113,122,0.055) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(113,113,122,0.055) 1px, transparent 1px)
                        `,
                        backgroundSize: "46px 46px",
                        maskImage: "radial-gradient(circle at center, black 0%, transparent 78%)",
                    }}
                />

                {/* Textura */}
                <div className="absolute inset-0 opacity-[0.04] [background-image:radial-gradient(#71717a_0.6px,transparent_0.6px)] [background-size:4px_4px]" />

                {/* Orbes */}
                <div className="absolute -left-[12vw] -top-[17vw] aspect-square w-[42vw] rounded-full border border-[#a85f6022] bg-[radial-gradient(circle_at_66%_66%,rgba(168,95,96,0.11),transparent_61%)] blur-[2px]" />

                <div className="absolute -bottom-[17vw] -right-[10vw] aspect-square w-[47vw] rounded-full border border-zinc-300/40 bg-[radial-gradient(circle_at_31%_30%,rgba(255,255,255,0.65),transparent_63%)] blur-[2px]" />

                <div className="absolute right-[8%] top-[15%] h-[180px] w-[180px] rounded-full bg-[#a85f6017] blur-[70px]" />

                {/* Linhas decorativas */}
                <div className="absolute right-[4%] top-[18%] h-px w-[220px] rotate-[-42deg] bg-gradient-to-r from-transparent via-[#a85f6040] to-transparent" />

                <div className="absolute bottom-[17%] left-[1%] h-px w-[220px] rotate-[-42deg] bg-gradient-to-r from-transparent via-[#a85f6040] to-transparent" />
            </div>

            {/* MARCA */}

            <header className="absolute left-6 top-[25px] flex items-center gap-[9px] text-[15px] font-extrabold tracking-[0.14em] md:left-[5vw] md:top-[30px]">

                <span className="grid h-[31px] w-[31px] place-items-center rounded-[9px] bg-[#a85f60] shadow-[0_8px_18px_rgba(168,95,96,0.22)]">
                    <BoltIcon />
                </span>

                <span>TREINO</span>

                <small className="-ml-[5px] translate-y-[10px] text-[8px] font-bold tracking-[0.16em] text-[#a85f60]">
                    SYSTEM
                </small>
            </header>

            {/* CONTAINER PRINCIPAL */}

            <section
                className={`relative w-full max-w-[960px] rounded-[32px] border border-zinc-200 bg-white/80 shadow-[0_30px_80px_rgba(63,63,70,0.16)] backdrop-blur-2xl transition-all duration-700 ease-in-out max-[760px]:max-w-[460px] max-[760px]:rounded-none max-[760px]:border-0 max-[760px]:bg-transparent max-[760px]:shadow-none max-[760px]:backdrop-blur-none ${
                    isSignup ? "is-signup" : "is-login"
                }`}
                style={{ minHeight: "550px" }}
            >

                {/* PAINEL DE BOAS-VINDAS */}

                <div
                    className={`absolute bottom-0 left-0 top-0 grid w-1/2 place-items-center p-[58px] transition-transform duration-[760ms] [transition-timing-function:cubic-bezier(0.76,0,0.24,1)] max-[760px]:hidden ${
                        isSignup ? "translate-x-0" : "translate-x-full"
                    }`}
                >
                    <div
                        key={`welcome-${mode}`}
                        className="max-w-[350px] animate-[content-in_560ms_180ms_both]"
                    >
                        <div className="mb-[34px] grid h-[76px] w-[76px] place-items-center text-[#a85f60]">
                            <ActivityIcon />
                        </div>

                        <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#a85f60]">
                            {isSignup ? "Já faz parte do time?" : "Comece hoje"}
                        </p>

                        <h2 className="text-[clamp(29px,3.4vw,43px)] font-bold leading-[1.06] tracking-[-0.055em] text-zinc-700">
                            {isSignup ? (
                                <>
                                    Continue em
                                    <br />
                                    movimento.
                                </>
                            ) : (
                                <>
                                    Transforme treino
                                    <br />
                                    em evolução.
                                </>
                            )}
                        </h2>

                        <p className="mb-[27px] mt-[21px] max-w-[320px] text-xs leading-[1.7] text-zinc-500">
                            {isSignup
                                ? "Acesse seus alunos, fichas de treino e resultados em um só lugar."
                                : "Crie treinos, acompanhe resultados e construa uma rotina que realmente funciona."}
                        </p>

                        <button
                            type="button"
                            onClick={() => switchMode(isSignup ? "login" : "signup")}
                            className="flex min-w-[176px] items-center justify-center gap-4 rounded-xl border border-[#a85f6099] bg-[#a85f600a] px-[19px] py-[11px] text-[11px] font-extrabold tracking-wide text-[#a85f60] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#a85f60] hover:bg-[#a85f6017]"
                        >
                            {isSignup ? "Fazer login" : "Criar minha conta"}
                            <span className="text-base font-normal">→</span>
                        </button>

                        <div className="mt-[41px] flex gap-[30px] text-[8px] uppercase tracking-wide text-zinc-400">
                            {/* <span className="grid gap-[3px]">
                                <strong className="text-[15px] tracking-tight text-zinc-600">
                                    +12k
                                </strong>
                                treinos criados
                            </span>

                            <span className="grid gap-[3px]">
                                <strong className="text-[15px] tracking-tight text-zinc-600">
                                    98%
                                </strong>
                                alunos ativos
                            </span> */}
                        </div>
                    </div>
                </div>

                {/* PAINEL DO FORMULÁRIO */}

                <div
                    className={`relative z-[3] -top-[31px] -bottom-[31px] left-0 grid min-h-[612px] w-1/2 overflow-hidden rounded-[30px] border border-zinc-200 bg-white px-[54px] pb-[34px] pt-12 shadow-[0_24px_60px_rgba(63,63,70,0.16)] transition-transform duration-[760ms] [transition-timing-function:cubic-bezier(0.76,0,0.24,1)] max-[760px]:static max-[760px]:w-full max-[760px]:min-h-[min(650px,calc(100dvh-140px))] max-[760px]:rounded-[30px] max-[760px]:px-[31px] max-[760px]:pb-[30px] max-[760px]:pt-[46px] max-[390px]:px-[23px] ${
                        isSignup ? "translate-x-full max-[760px]:translate-x-0" : "translate-x-0"
                    }`}
                >

                    {/* EFEITOS INTERNOS */}
                    <div className="pointer-events-none absolute -right-[90px] -top-[120px] h-[260px] w-[260px] rounded-full bg-[#a85f6014] blur-[58px]" />

                    <div className="pointer-events-none absolute -bottom-[115px] -left-[80px] h-[240px] w-[240px] rounded-full bg-zinc-200/60 blur-[60px]" />

                    <form
                        key={mode}
                        onSubmit={handleSubmit}
                        className="relative z-[1] flex animate-[form-in_600ms_170ms_both] flex-col justify-center"
                    >

                        <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#a85f60]">
                            {isSignup ? "Seu próximo nível começa aqui" : "Área do atleta"}
                        </p>

                        <h1 className="text-[clamp(26px,3vw,34px)] font-bold tracking-[-0.045em] text-zinc-700">
                            {isSignup ? "Criar conta" : "Bem-vindo de volta"}
                        </h1>

                        <p className="mt-[9px] text-[13px] text-zinc-500">
                            {isSignup
                                ? "Escolha seu perfil e comece agora."
                                : "Entre para acessar seus treinos e resultados."}
                        </p>

                        {/* PERFIL */}

                        {isSignup && (
                            <fieldset className="mb-0 mt-6 border-0 p-0">
                                <legend className="mb-[9px] text-[10px] font-bold uppercase tracking-[0.09em] text-zinc-500">
                                    Como você quer usar a plataforma?
                                </legend>

                                <div className="grid grid-cols-2 gap-2">
                                    {(["personal", "student"] as Profile[]).map((item) => (
                                        <button
                                            key={item}
                                            type="button"
                                            aria-pressed={profile === item}
                                            onClick={() => setProfile(item)}
                                            className={`grid gap-[2px] rounded-[10px] border px-3 py-[9px] text-left text-[10px] transition-all ${
                                                profile === item
                                                    ? "border-[#a85f6099] bg-[#a85f600f] text-zinc-500"
                                                    : "border-zinc-200 bg-zinc-50 text-zinc-400"
                                            }`}
                                        >
                                            <span className={`text-[12px] font-bold ${
                                                profile === item ? "text-[#a85f60]" : "text-zinc-600"
                                            }`}>
                                                {item === "personal" ? "Personal" : "Aluno"}
                                            </span>

                                            {item === "personal" ? "Gerenciar alunos" : "Seguir meu treino"}
                                        </button>
                                    ))}
                                </div>
                            </fieldset>
                        )}

                        {/* CAMPOS */}

                        <div className={`grid ${
                            isSignup ? "mt-[17px] gap-[13px]" : "mt-[27px] gap-[18px]"
                        }`}>

                            {isSignup && (
                                <label className="grid gap-[6px]">
                                    <span className="text-[10px] font-bold uppercase tracking-[0.13em] text-zinc-600">
                                        Nome completo
                                    </span>

                                    <input
                                        value={nome}
                                        onChange={(e) => setNome(e.target.value)}
                                        autoComplete="name"
                                        placeholder="Como podemos te chamar?"
                                        required
className="w-full rounded-[10px] border-2 border-zinc-200 bg-zinc-50 px-4 py-[13px] text-[14px] text-zinc-700 outline-none transition placeholder:text-[13px] placeholder:text-zinc-400 focus:border-[#a85f60] focus:bg-white focus:shadow-[0_0_0_3px_rgba(168,95,96,0.08)]"                                    />
                                </label>
                            )}

                            {isSignup && (
                                <label className="grid gap-[6px]">
                                    <span className="text-[10px] font-bold uppercase tracking-[0.13em] text-zinc-600">
                                        Telefone
                                    </span>

                                    <input
                                        type="tel"
                                        value={telefone}
                                        onChange={(e) => setTelefone(e.target.value)}
                                        autoComplete="tel"
                                        placeholder="(16) 99999-9999"
                                        required
                                        className="w-full rounded-[10px] border-2 border-zinc-200 bg-zinc-50 px-4 py-[13px] text-[14px] text-zinc-700 outline-none transition placeholder:text-[13px] placeholder:text-zinc-400 focus:border-[#a85f60] focus:bg-white"
                                    />
                                </label>
                            )}

                            <label className="grid gap-[6px]">
                                <span className="text-[10px] font-bold uppercase tracking-[0.13em] text-zinc-600">
                                    E-mail
                                </span>

                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="email"
                                    placeholder="voce@exemplo.com"
                                    required
                                    className="w-full rounded-[10px] border-2 border-zinc-200 bg-zinc-50 px-4 py-[13px] text-[14px] text-zinc-700 outline-none transition placeholder:text-[13px] placeholder:text-zinc-400 focus:border-[#a85f60] focus:bg-white"
                                />
                            </label>

                            <label className="grid gap-[6px]">
                                <span className="text-[10px] font-bold uppercase tracking-[0.13em] text-zinc-600">
                                    Senha
                                </span>

                                <span className="relative block">
                                    <input
                                        type={mostrarSenha ? "text" : "password"}
                                        value={senha}
                                        onChange={(e) => setSenha(e.target.value)}
                                        autoComplete={isSignup ? "new-password" : "current-password"}
                                        placeholder="Mínimo de 6 caracteres"
                                        minLength={6}
                                        required
                                        className="w-full rounded-[10px] border-2 border-zinc-200 bg-zinc-50 px-4 py-[13px] text-[14px] text-zinc-700 outline-none transition placeholder:text-[13px] placeholder:text-zinc-400 focus:border-[#a85f60] focus:bg-white"
                                    />

                                    <button
                                        type="button"
                                        aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                                        onClick={() => setMostrarSenha(!mostrarSenha)}
                                        className="absolute bottom-[6px] right-[7px] grid h-[29px] w-[29px] cursor-pointer place-items-center text-[#a85f60]"
                                    >
                                        <EyeIcon />
                                    </button>
                                </span>
                            </label>

                            {isSignup && (
                                <label className="grid gap-[6px]">
                                    <span className="text-[10px] font-bold uppercase tracking-[0.13em] text-zinc-600">
                                        Confirmar senha
                                    </span>

                                    <input
                                        type={mostrarSenha ? "text" : "password"}
                                        value={confirmarSenha}
                                        onChange={(e) => setConfirmarSenha(e.target.value)}
                                        autoComplete="new-password"
                                        placeholder="Digite a senha novamente"
                                        required
className="w-full rounded-[10px] border-2 border-zinc-200 bg-zinc-50 px-4 py-[13px] text-[14px] text-zinc-700 outline-none transition placeholder:text-[13px] placeholder:text-zinc-400 focus:border-[#a85f60] focus:bg-white focus:shadow-[0_0_0_3px_rgba(168,95,96,0.08)]"                                    />
                                </label>
                            )}
                        </div>

                        {/* OPÇÕES */}

                        <div className="mt-[15px] flex min-h-[18px] items-center justify-between text-[8px] text-zinc-500">
                            {isSignup ? (
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        required
                                        className="h-[13px] w-[13px] accent-[#a85f60]"
                                    />

                                    <span className="text-[11px]">
                                        Aceito os{" "}
                                        <a href="#termos" className="text-[#a85f60] underline-offset-2 hover:underline">
                                            termos de uso
                                        </a>{" "}
                                        e a{" "}
                                        <a href="#privacidade" className="text-[#a85f60] underline-offset-2 hover:underline">
                                            política de privacidade
                                        </a>.
                                    </span>
                                </label>
                            ) : (
                                <>
                                    <label className="flex items-center gap-2 text-[12px]">
                                        <input
                                            type="checkbox"
                                            className="h-[13px] w-[13px] accent-[#a85f60]"
                                        />
                                        Lembrar de mim
                                    </label>

                                    <Link
                                        to="/recuperar-senha"
                                        className="text-[#a85f60] underline-offset-2 hover:underline text-[12px]"
                                    >
                                        Esqueci minha senha
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* ERRO / MENSAGEM */}

                        {erro && (
                            <p className="mt-3 text-center text-xs font-medium text-red-600">
                                {erro}
                            </p>
                        )}

                        {message && (
                            <p className="mt-3 text-center text-xs text-[#a85f60]">
                                {message}
                            </p>
                        )}

                        {/* BOTÃO PRINCIPAL */}

                        <button
                            type="submit"
                            disabled={carregando}
                            className="mt-[22px] flex w-full items-center justify-center gap-4 rounded-xl border border-[#a85f60] bg-[#a85f60] px-[21px] py-[11px] text-[11px] font-extrabold tracking-wide text-white shadow-[0_12px_28px_rgba(168,95,96,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#914f50] hover:shadow-[0_16px_34px_rgba(145,79,80,0.25)] disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 disabled:shadow-none"
                        >
                            {carregando
                                ? "Criando conta..."
                                : isSignup
                                    ? "Começar agora"
                                    : "Entrar na plataforma"}

                            <span className="text-base font-normal">→</span>
                        </button>

                        {/* ALTERNAR NO MOBILE */}

                        <p className="mt-5 hidden text-center text-[9px] text-zinc-500 max-[760px]:block">
                            {isSignup ? "Já tem uma conta?" : "Ainda não tem uma conta?"}{" "}

                            <button
                                type="button"
                                onClick={() => switchMode(isSignup ? "login" : "signup")}
                                className="cursor-pointer font-bold text-[#a85f60] underline underline-offset-[3px]"
                            >
                                {isSignup ? "Entrar" : "Cadastre-se"}
                            </button>
                        </p>
                    </form>
                </div>
            </section>

            {/* RODAPÉ */}

            <p className="absolute bottom-7 right-[5vw] text-[8px] font-bold uppercase tracking-[0.14em] text-zinc-400 max-[760px]:hidden">
                Treinos inteligentes. Resultados reais.
            </p>
        </main>
    );
}
