import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/authContext";
import { cadastroAlunoService } from "../service/cadastroAlunoService";
import { ApiError } from "../service/api";
import { perguntasCadastro } from "./cadastroPerguntas";

export default function FormularioCadastro() {
    const navigate = useNavigate();
    const { user, refreshUser, logout } = useAuth();
    const [respostas, setRespostas] = useState<Record<string, string>>({});
    const [erro, setErro] = useState("");
    const [enviando, setEnviando] = useState(false);

    async function enviar(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setErro("");
        setEnviando(true);
        try {
            await cadastroAlunoService.enviarRespostas(respostas);
            await refreshUser();
            navigate("/cadastro/aguardando", { replace: true });
        } catch (error) {
            setErro(
                error instanceof ApiError
                    ? error.message
                    : "Não foi possível enviar suas respostas.",
            );
        } finally {
            setEnviando(false);
        }
    }

    return (
        <main className="relative isolate grid min-h-screen place-items-center overflow-hidden bg-[#111312] px-5 py-12 text-white">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_80%_0%,rgba(168,95,96,.22),transparent_45%),linear-gradient(135deg,#111312,#1c211e)]"
            />
            <section className="w-full max-w-2xl">
                <header className="mb-9 flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-[.24em]">
                        TREINO <span className="text-[#c47c7d]">/ SYSTEM</span>
                    </span>
                    <button
                        onClick={() => void logout()}
                        className="text-xs text-white/55 transition hover:text-white"
                    >
                        Sair
                    </button>
                </header>
                <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#d18b8c]">
                    Etapa 02 · Conhecendo você
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                    Vamos entender seus objetivos.
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-white/60">
                    {user?.nome}, responda algumas perguntas para que nossa equipe possa avaliar seu
                    perfil e preparar o acompanhamento adequado.
                </p>
                <form onSubmit={enviar} className="mt-8 space-y-5">
                    {perguntasCadastro.map((pergunta, index) => (
                        <label
                            key={pergunta.id}
                            className="block rounded-2xl border border-white/10 bg-white/[.045] p-5 transition focus-within:border-[#c47c7d]/70"
                        >
                            <span className="mb-3 flex items-center gap-3 text-sm font-semibold">
                                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#a85f60]/20 text-[10px] text-[#e0a4a5]">
                                    {String(index + 1).padStart(2, "0")}
                                </span>
                                {pergunta.titulo}
                                {pergunta.obrigatoria && <span className="text-[#d18b8c]">*</span>}
                            </span>
                            {pergunta.descricao && (
                                <span className="mb-3 block text-xs text-white/45">
                                    {pergunta.descricao}
                                </span>
                            )}
                            {pergunta.tipo === "textarea" ? (
                                <textarea
                                    required={pergunta.obrigatoria}
                                    rows={4}
                                    value={respostas[pergunta.id] ?? ""}
                                    onChange={event =>
                                        setRespostas(current => ({
                                            ...current,
                                            [pergunta.id]: event.target.value,
                                        }))
                                    }
                                    className="w-full resize-y rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none transition placeholder:text-white/25 focus:border-[#c47c7d]"
                                    placeholder="Escreva sua resposta..."
                                />
                            ) : pergunta.tipo === "select" ? (
                                <select
                                    required={pergunta.obrigatoria}
                                    value={respostas[pergunta.id] ?? ""}
                                    onChange={event =>
                                        setRespostas(current => ({
                                            ...current,
                                            [pergunta.id]: event.target.value,
                                        }))
                                    }
                                    className="w-full rounded-xl border border-white/10 bg-[#202522] px-4 py-3 text-sm text-white outline-none focus:border-[#c47c7d]"
                                >
                                    <option value="">Selecione uma opção</option>
                                    {pergunta.opcoes?.map(opcao => (
                                        <option key={opcao} value={opcao}>
                                            {opcao}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    required={pergunta.obrigatoria}
                                    type={pergunta.tipo}
                                    value={respostas[pergunta.id] ?? ""}
                                    onChange={event =>
                                        setRespostas(current => ({
                                            ...current,
                                            [pergunta.id]: event.target.value,
                                        }))
                                    }
                                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-[#c47c7d]"
                                />
                            )}
                        </label>
                    ))}
                    {erro && (
                        <p
                            role="alert"
                            className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200"
                        >
                            {erro}
                        </p>
                    )}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                        <p className="max-w-xs text-[11px] leading-5 text-white/40">
                            Suas respostas serão usadas somente durante a avaliação e removidas após
                            a aprovação do cadastro.
                        </p>
                        <button
                            disabled={enviando}
                            aria-busy={enviando}
                            className="rounded-xl bg-[#a85f60] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#bd7374] disabled:opacity-50"
                        >
                            {enviando ? "Enviando..." : "Enviar para avaliação"}
                        </button>
                    </div>
                </form>
            </section>
        </main>
    );
}
