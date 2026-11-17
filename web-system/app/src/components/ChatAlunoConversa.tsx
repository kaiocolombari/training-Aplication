import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BsChatDots, BsSend, BsShieldCheck } from "react-icons/bs";
import { comunicacaoService } from "../service/comunicacaoService";
import { useAuth } from "../context/authContext";

function horario(valor: string) {
    return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(valor));
}

export default function ChatAlunoConversa({
    modo,
    alunoId,
}: {
    modo: "personal" | "aluno";
    alunoId?: string;
}) {
    const { user } = useAuth();
    const client = useQueryClient();
    const [contatoSelecionadoId, setContatoSelecionadoId] = useState("");
    const [texto, setTexto] = useState("");
    const [erro, setErro] = useState("");
    const fimRef = useRef<HTMLDivElement>(null);

    const contatosPersonal = useQuery({
        queryKey: ["comunicacao", "alunos"],
        queryFn: comunicacaoService.listarConversasAlunos,
        enabled: modo === "personal",
        refetchInterval: 10000,
    });
    const contatosAluno = useQuery({
        queryKey: ["comunicacao", "personais-aluno"],
        queryFn: comunicacaoService.listarConversasPersonaisAluno,
        enabled: modo === "aluno",
        refetchInterval: 10000,
    });
    const contatos = modo === "personal" ? contatosPersonal.data ?? [] : contatosAluno.data ?? [];

    useEffect(() => {
        if (modo === "aluno" && !contatoSelecionadoId && contatos.length) {
            setContatoSelecionadoId(contatos[0].outroUsuarioId);
        }
    }, [modo, contatoSelecionadoId, contatos]);

    const contato = useMemo(
        () => modo === "personal"
            ? contatos.find(item => item.alunoId === alunoId)
            : contatos.find(item => item.outroUsuarioId === contatoSelecionadoId),
        [modo, contatos, alunoId, contatoSelecionadoId],
    );
    const conversaId = contato?.conversaId ?? "";
    const mensagens = useQuery({
        queryKey: ["comunicacao", "mensagens", conversaId],
        queryFn: () => comunicacaoService.listarMensagens(conversaId),
        enabled: Boolean(conversaId),
        refetchInterval: 4000,
    });
    const assinaturaLeitura = (mensagens.data ?? [])
        .map(item => `${item.id}:${item.lidaEm ?? ""}`)
        .join("|");

    useEffect(() => {
        fimRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [mensagens.data]);

    useEffect(() => {
        if (!conversaId || !assinaturaLeitura) return;
        void client.invalidateQueries({
            queryKey: ["comunicacao", modo === "personal" ? "alunos" : "personais-aluno"],
        });
        if (modo === "personal") {
            void client.invalidateQueries({ queryKey: ["comunicacao", "alunos", "resumo"] });
        }
    }, [client, conversaId, assinaturaLeitura, modo]);

    const enviar = useMutation({
        mutationFn: () => comunicacaoService.enviarMensagem(contato!.outroUsuarioId, texto.trim()),
        onSuccess: async () => {
            setTexto("");
            setErro("");
            await Promise.all([
                client.invalidateQueries({ queryKey: ["comunicacao", "alunos"] }),
                client.invalidateQueries({ queryKey: ["comunicacao", "personais-aluno"] }),
                client.invalidateQueries({ queryKey: ["comunicacao", "alunos", "resumo"] }),
            ]);
        },
        onError: (error: Error) => setErro(error.message || "Não foi possível enviar a mensagem."),
    });

    function enviarFormulario(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!contato || !texto.trim() || enviar.isPending) return;
        setErro("");
        enviar.mutate();
    }

    const nomeContato = contato?.outroUsuarioNome ?? (modo === "personal" ? "Aluno" : "Personal");
    const carregando = modo === "personal" ? contatosPersonal.isLoading : contatosAluno.isLoading;

    return (
        <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
            {modo === "aluno" && contatos.length > 1 && (
                <div className="border-b border-[var(--border)] p-3">
                    <label className="grid gap-1.5 text-[9px] font-semibold text-[var(--text-muted)]">
                        Conversar com
                        <select
                            value={contatoSelecionadoId}
                            onChange={event => setContatoSelecionadoId(event.target.value)}
                            className="h-10 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-[11px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                        >
                            {contatos.map(item => (
                                <option key={item.outroUsuarioId} value={item.outroUsuarioId}>
                                    {item.outroUsuarioNome}{item.naoLidas > 0 ? ` · ${item.naoLidas} não lida(s)` : ""}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
            )}
            <header className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
                <div className="flex min-w-0 items-center gap-2.5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-text)]">
                        <BsChatDots />
                    </span>
                    <div className="min-w-0">
                        <h3 className="truncate text-[11px] font-semibold text-[var(--text-primary)]">{modo === "personal" ? `Conversa com ${nomeContato}` : `Equipe · ${nomeContato}`}</h3>
                        <p className="text-[9px] text-[var(--text-muted)]">Mensagens privadas entre você e {modo === "personal" ? "o aluno" : "seu personal"}.</p>
                    </div>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--success-soft)] px-2 py-1 text-[8px] font-semibold text-[var(--success)]">
                    <BsShieldCheck /> Privado
                </span>
            </header>

            <div className="flex min-h-[280px] max-h-[440px] flex-col gap-3 overflow-y-auto bg-[var(--surface-secondary)]/55 p-4">
                {carregando && <p className="py-10 text-center text-[10px] text-[var(--text-muted)]">Carregando conversas...</p>}
                {!carregando && contatos.length === 0 && (
                    <div className="m-auto max-w-xs py-8 text-center">
                        <BsChatDots className="mx-auto text-2xl text-[var(--text-muted)]" />
                        <p className="mt-3 text-[11px] font-semibold text-[var(--text-primary)]">Nenhum contato disponível</p>
                        <p className="mt-1 text-[9px] leading-5 text-[var(--text-muted)]">{modo === "personal" ? "Este aluno precisa ter um vínculo ativo com você para iniciar uma conversa." : "Quando um personal estiver vinculado à sua conta, você poderá conversar por aqui."}</p>
                    </div>
                )}
                {contato && !conversaId && (
                    <div className="m-auto max-w-xs py-8 text-center">
                        <BsChatDots className="mx-auto text-2xl text-[var(--text-muted)]" />
                        <p className="mt-3 text-[11px] font-semibold text-[var(--text-primary)]">Comece a conversa</p>
                        <p className="mt-1 text-[9px] text-[var(--text-muted)]">Envie a primeira mensagem para {nomeContato}.</p>
                    </div>
                )}
                {mensagens.isLoading && conversaId && <p className="py-8 text-center text-[10px] text-[var(--text-muted)]">Carregando mensagens...</p>}
                {mensagens.isError && <p role="alert" className="rounded-lg bg-[var(--danger-soft)] p-3 text-[10px] text-[var(--danger)]">Não foi possível carregar as mensagens. Tente novamente.</p>}
                {(mensagens.data ?? []).map(item => {
                    const propria = item.remetenteId === user?.usuarioId;
                    return (
                        <div key={item.id} className={`flex ${propria ? "justify-end" : "justify-start"}`}>
                            <article className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${propria ? "rounded-br-md bg-[var(--accent)] text-[var(--on-accent)]" : "rounded-bl-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)]"}`}>
                                <p className="whitespace-pre-wrap break-words text-[10px] leading-5">{item.conteudo}</p>
                                <p className={`mt-1.5 text-right text-[8px] ${propria ? "opacity-70" : "text-[var(--text-muted)]"}`}>
                                    {horario(item.enviadaEm)}{propria ? item.lidaEm ? " · Lida" : " · Enviada" : ""}
                                </p>
                            </article>
                        </div>
                    );
                })}
                <div ref={fimRef} />
            </div>

            {contato && (
                <form onSubmit={enviarFormulario} className="border-t border-[var(--border)] p-3">
                    {erro && <p role="alert" className="mb-2 text-[9px] text-[var(--danger)]">{erro}</p>}
                    <div className="flex items-end gap-2">
                        <textarea
                            value={texto}
                            onChange={event => setTexto(event.target.value)}
                            maxLength={4000}
                            rows={2}
                            placeholder="Escreva uma mensagem..."
                            className="min-h-10 flex-1 resize-y rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2.5 text-[10px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                        />
                        <button
                            type="submit"
                            disabled={!texto.trim() || enviar.isPending}
                            aria-label="Enviar mensagem"
                            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--accent)] text-[var(--on-accent)] transition hover:bg-[var(--accent-hover)] disabled:opacity-40"
                        >
                            <BsSend />
                        </button>
                    </div>
                </form>
            )}
        </section>
    );
}
