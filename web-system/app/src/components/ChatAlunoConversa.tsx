import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BsChatDots, BsSend, BsShieldCheck, BsPaperclip, BsPersonLinesFill, BsClockHistory, BsActivity } from "react-icons/bs";
import type { HubConnection } from "@microsoft/signalr";
import { comunicacaoService, type ContextoChatAluno, type MensagemEquipe } from "../service/comunicacaoService";
import { useAuth } from "../context/authContext";
import { createChatConnection, startChatConnection } from "../service/chatRealtimeService";

function horario(valor: string) {
    return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(valor));
}

function tamanhoArquivo(bytes: number) {
    return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function ContextoAluno({
    contexto,
    carregando,
    onAbrirFicha,
    onAbrirHistorico,
}: {
    contexto?: ContextoChatAluno;
    carregando: boolean;
    onAbrirFicha?: () => void;
    onAbrirHistorico?: () => void;
}) {
    const avaliacao = contexto?.avaliacoes[0];
    const execucao = contexto?.execucoesRecentes[0];
    const feedback = contexto?.feedbacks[0];
    const solicitacao = contexto?.solicitacoesAvaliacao[0];

    return (
        <aside className="space-y-3">
            <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent-text)]"><BsPersonLinesFill /></span>
                    <div>
                        <h4 className="text-[11px] font-semibold text-[var(--text-primary)]">Contexto do aluno</h4>
                        <p className="text-[9px] text-[var(--text-muted)]">Informações para orientar o atendimento</p>
                    </div>
                </div>
                {carregando ? <p className="mt-4 text-[10px] text-[var(--text-muted)]">Carregando ficha e histórico...</p> : !contexto ? (
                    <p className="mt-4 text-[10px] text-[var(--text-muted)]">Não foi possível carregar o contexto do aluno.</p>
                ) : (
                    <div className="mt-4 space-y-3">
                        <div className="rounded-xl bg-[var(--surface-secondary)] p-3">
                            <p className="text-[9px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Última avaliação</p>
                            {avaliacao ? <>
                                <p className="mt-1 text-[12px] font-semibold text-[var(--text-primary)]">#{avaliacao.numero} · {new Date(avaliacao.realizadaEm).toLocaleDateString("pt-BR")}</p>
                                <p className="mt-1 text-[10px] text-[var(--text-secondary)]">{avaliacao.peso != null ? `${avaliacao.peso} kg` : "Peso não informado"} · {avaliacao.percentualGordura != null ? `${avaliacao.percentualGordura}% gordura` : "Sem percentual"}</p>
                                <p className="mt-1 text-[9px] text-[var(--text-muted)]">Criada por {avaliacao.criadaPorNome ?? "não identificado"}</p>
                                {avaliacao.atualizadaEm ? <p className="mt-0.5 text-[9px] text-[var(--text-muted)]">Última alteração por {avaliacao.atualizadaPorNome ?? "não identificado"} · {horario(avaliacao.atualizadaEm)}</p> : null}
                            </> : <p className="mt-1 text-[10px] text-[var(--text-muted)]">Nenhuma avaliação ativa registrada.</p>}
                        </div>
                        <div>
                            <p className="text-[9px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Anamnese</p>
                            <p className="mt-1 text-[10px] leading-5 text-[var(--text-secondary)]">{contexto.ultimaAnamnese?.objetivo ?? "Objetivo ainda não informado."}</p>
                            {contexto.ultimaAnamnese?.observacoes ? <p className="mt-1 text-[9px] leading-4 text-[var(--text-muted)]">{contexto.ultimaAnamnese.observacoes}</p> : null}
                        </div>
                        {solicitacao ? <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                            <p className="text-[9px] font-semibold uppercase tracking-wide text-amber-700">Solicitação de avaliação {solicitacao.urgente ? "· urgente" : ""}</p>
                            <p className="mt-1 text-[10px] text-[var(--text-primary)]">{solicitacao.status} · {new Date(`${solicitacao.dataDesejada}T12:00:00`).toLocaleDateString("pt-BR")}</p>
                            {solicitacao.motivo ? <p className="mt-1 text-[9px] text-[var(--text-muted)]">{solicitacao.motivo}</p> : null}
                        </div> : null}
                        {execucao ? <div>
                            <p className="text-[9px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Último treino enviado</p>
                            <p className="mt-1 text-[10px] font-semibold text-[var(--text-primary)]">{execucao.treinoNome} · {new Date(`${execucao.data}T12:00:00`).toLocaleDateString("pt-BR")}</p>
                            {execucao.exercicios.filter(item => item.statusDor !== "none" || item.feedback).slice(0, 3).map((item, index) => (
                                <p key={index} className="mt-1 text-[9px] leading-4 text-[var(--text-muted)]">{item.nome}: {item.statusDor !== "none" ? `dor (${item.statusDor})` : item.feedback}</p>
                            ))}
                        </div> : null}
                        {feedback ? <div>
                            <p className="text-[9px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Último feedback do aluno</p>
                            <p className="mt-1 text-[10px] leading-4 text-[var(--text-secondary)]">Nota {feedback.nota}/5 · {feedback.categoria}</p>
                            <p className="mt-1 text-[9px] leading-4 text-[var(--text-muted)]">{feedback.comentario}</p>
                        </div> : null}
                        <div className="grid grid-cols-2 gap-2 border-t border-[var(--border)] pt-3">
                            <button type="button" onClick={onAbrirFicha} className="rounded-lg bg-[var(--accent)] px-2 py-2 text-[9px] font-semibold text-[var(--on-accent)]">Abrir ficha</button>
                            <button type="button" onClick={onAbrirHistorico} className="rounded-lg border border-[var(--border)] px-2 py-2 text-[9px] font-semibold text-[var(--text-secondary)]">Ver histórico</button>
                        </div>
                    </div>
                )}
            </section>
            {contexto?.historicoAvaliacoes.length ? <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <h4 className="text-[10px] font-semibold text-[var(--text-primary)]">Alterações na ficha</h4>
                <div className="mt-3 space-y-3">
                    {contexto.historicoAvaliacoes.slice(0, 5).map(item => (
                        <div key={item.id} className="border-l-2 border-[var(--accent)] pl-3">
                            <p className="text-[9px] font-semibold text-[var(--text-primary)]">Avaliação #{item.numeroAvaliacao} · {item.acao}</p>
                            <p className="mt-0.5 text-[9px] leading-4 text-[var(--text-muted)]">{item.resumo}</p>
                            <p className="mt-0.5 text-[8px] text-[var(--text-muted)]">{item.usuarioNome} · {horario(item.criadoEm)}</p>
                        </div>
                    ))}
                </div>
            </section> : null}
            {contexto?.atividades.length ? <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <h4 className="flex items-center gap-2 text-[10px] font-semibold text-[var(--text-primary)]"><BsClockHistory /> Atividades registradas</h4>
                <div className="mt-3 space-y-2">
                    {contexto.atividades.slice(0, 5).map((item, index) => <div key={index}>
                        <p className="text-[9px] text-[var(--text-secondary)]">{item.resumo || item.acao}</p>
                        <p className="text-[8px] text-[var(--text-muted)]">{item.usuarioNome} · {horario(item.criadoEm)}</p>
                    </div>)}
                </div>
            </section> : null}
        </aside>
    );
}

export default function ChatAlunoConversa({
    modo,
    alunoId,
    onAbrirFicha,
    onAbrirHistorico,
}: {
    modo: "personal" | "aluno";
    alunoId?: string;
    onAbrirFicha?: () => void;
    onAbrirHistorico?: () => void;
}) {
    const { user } = useAuth();
    const client = useQueryClient();
    const [contatoSelecionadoId, setContatoSelecionadoId] = useState("");
    const [conversaOverride, setConversaOverride] = useState("");
    const [texto, setTexto] = useState("");
    const [erro, setErro] = useState("");
    const [digitando, setDigitando] = useState(false);
    const [online, setOnline] = useState(false);
    const [connection, setConnection] = useState<HubConnection | null>(null);
    const fimRef = useRef<HTMLDivElement>(null);
    const arquivoRef = useRef<HTMLInputElement>(null);

    const contatosPersonal = useQuery({
        queryKey: ["comunicacao", "alunos"],
        queryFn: comunicacaoService.listarConversasAlunos,
        enabled: modo === "personal",
    });
    const contatosAluno = useQuery({
        queryKey: ["comunicacao", "personais-aluno"],
        queryFn: comunicacaoService.listarConversasPersonaisAluno,
        enabled: modo === "aluno",
    });
    const contatos = modo === "personal" ? contatosPersonal.data ?? [] : contatosAluno.data ?? [];

    useEffect(() => setConversaOverride(""), [contatoSelecionadoId, alunoId, modo]);

    const contato = useMemo(
        () => modo === "personal"
            ? contatos.find(item => item.alunoId === alunoId)
            : contatos.find(item => item.outroUsuarioId === contatoSelecionadoId),
        [modo, contatos, alunoId, contatoSelecionadoId],
    );
    const destinatarioId = contato?.outroUsuarioId;
    const conversaId = conversaOverride || contato?.conversaId || "";
    const preparandoConversa = Boolean(contato) && !conversaId && !erro;
    const mensagens = useQuery({
        queryKey: ["comunicacao", "mensagens", conversaId],
        queryFn: () => comunicacaoService.listarMensagens(conversaId),
        enabled: Boolean(conversaId),
    });
    const contexto = useQuery({
        queryKey: ["comunicacao", "contexto-chat", alunoId],
        queryFn: () => comunicacaoService.obterContextoChatAluno(alunoId!),
        enabled: modo === "personal" && Boolean(alunoId),
    });

    useEffect(() => {
        if (!destinatarioId) return;
        let active = true;
        void comunicacaoService.obterOuCriarConversa(destinatarioId)
            .then(result => { if (active) setConversaOverride(result.conversaId); })
            .catch(error => { if (active) setErro(error instanceof Error ? error.message : "Não foi possível iniciar a conversa."); });
        return () => { active = false; };
    }, [destinatarioId]);

    useEffect(() => {
        fimRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [mensagens.data]);

    useEffect(() => {
        const realtime = createChatConnection();
        let active = true;
        setConnection(realtime);
        realtime.on("NovaMensagem", (event: { mensagemId?: string }) => {
            if (event.mensagemId) void realtime.invoke("ConfirmarEntrega", event.mensagemId).catch(() => undefined);
            void client.invalidateQueries({ queryKey: ["comunicacao", modo === "personal" ? "alunos" : "personais-aluno"] });
            if (modo === "personal") void client.invalidateQueries({ queryKey: ["comunicacao", "alunos", "resumo"] });
        });
        realtime.on("MensagemRecebida", (message: MensagemEquipe & { conversaId: string }) => {
            if (!active || message.conversaId !== conversaId) return;
            client.setQueryData<MensagemEquipe[]>(["comunicacao", "mensagens", conversaId], current => {
                const next = current ?? [];
                return next.some(item => item.id === message.id)
                    ? next
                    : [...next, message].sort((a, b) => new Date(a.enviadaEm).getTime() - new Date(b.enviadaEm).getTime());
            });
            if (message.remetenteId !== user?.usuarioId) void realtime.invoke("MarcarLida", conversaId).catch(() => undefined);
        });
        realtime.on("StatusMensagemAtualizado", (status: { conversaId: string; mensagemIds: string[]; status: string; em: string }) => {
            if (!active || status.conversaId !== conversaId) return;
            client.setQueryData<MensagemEquipe[]>(["comunicacao", "mensagens", conversaId], current =>
                (current ?? []).map(item => !status.mensagemIds.includes(item.id) ? item : status.status === "LIDA"
                    ? { ...item, entregueEm: item.entregueEm ?? status.em, lidaEm: status.em }
                    : { ...item, entregueEm: status.em }),
            );
        });
        realtime.on("UsuarioDigitando", (event: { usuarioId: string; digitando: boolean }) => {
            if (event.usuarioId !== user?.usuarioId) setDigitando(event.digitando);
        });
        realtime.on("PresencaInicial", (event: { usuarioId: string; online: boolean }) => {
            if (event.usuarioId === contato?.outroUsuarioId) setOnline(event.online);
        });
        realtime.on("PresencaAtualizada", (usuarioId: string, isOnline: boolean) => {
            if (usuarioId === contato?.outroUsuarioId) setOnline(isOnline);
        });
        realtime.onreconnected(async () => {
            if (conversaId) {
                await realtime.invoke("EntrarConversa", conversaId);
                await client.invalidateQueries({ queryKey: ["comunicacao", "mensagens", conversaId] });
                await realtime.invoke("MarcarLida", conversaId);
            }
        });
        void startChatConnection(realtime)
            .then(async () => {
                if (active && conversaId) {
                    await realtime.invoke("EntrarConversa", conversaId);
                    await client.invalidateQueries({ queryKey: ["comunicacao", "mensagens", conversaId] });
                    await realtime.invoke("MarcarLida", conversaId);
                }
            })
            .catch(cause => {
                if (active) setErro(cause instanceof Error ? cause.message : "Chat em tempo real indisponível.");
            });
        return () => {
            active = false;
            setConnection(current => current === realtime ? null : current);
            if (conversaId) void realtime.invoke("SairConversa", conversaId).catch(() => undefined);
            void realtime.stop();
        };
    }, [client, modo, conversaId, contato?.outroUsuarioId, user?.usuarioId]);

    useEffect(() => {
        if (!connection || connection.state !== "Connected" || !conversaId) return;
        let stopTimer: number | undefined;
        if (!texto.trim()) {
            void connection.invoke("UsuarioDigitando", conversaId, false).catch(() => undefined);
            return;
        }
        const startTimer = window.setTimeout(() => {
            void connection.invoke("UsuarioDigitando", conversaId, true).catch(() => undefined);
            stopTimer = window.setTimeout(() => {
                void connection.invoke("UsuarioDigitando", conversaId, false).catch(() => undefined);
            }, 2500);
        }, 250);
        return () => {
            window.clearTimeout(startTimer);
            if (stopTimer) window.clearTimeout(stopTimer);
        };
    }, [connection, conversaId, texto]);

    const enviar = useMutation({
        mutationFn: async () => {
            if (!contato) throw new Error("Escolha um contato para iniciar a conversa.");
            let id = conversaId;
            if (!id) {
                id = (await comunicacaoService.obterOuCriarConversa(contato.outroUsuarioId)).conversaId;
                setConversaOverride(id);
                if (connection?.state === "Connected") await connection.invoke("EntrarConversa", id);
            }
            if (connection?.state === "Connected") {
                try {
                    await connection.invoke("EnviarMensagem", id, texto.trim());
                    return { conversaId: id };
                } catch (error) {
                    if (!(error instanceof Error) || !error.message.toLowerCase().includes("expir")) throw error;
                    return comunicacaoService.enviarMensagem(contato.outroUsuarioId, texto.trim());
                }
            }
            return comunicacaoService.enviarMensagem(contato.outroUsuarioId, texto.trim());
        },
        onSuccess: async result => {
            setTexto("");
            setErro("");
            setConversaOverride(result.conversaId);
            await Promise.all([
                client.invalidateQueries({ queryKey: ["comunicacao", "alunos"] }),
                client.invalidateQueries({ queryKey: ["comunicacao", "personais-aluno"] }),
                client.invalidateQueries({ queryKey: ["comunicacao", "alunos", "resumo"] }),
                client.invalidateQueries({ queryKey: ["comunicacao", "mensagens", result.conversaId] }),
            ]);
        },
        onError: (error: Error) => setErro(error.message || "Não foi possível enviar a mensagem."),
    });

    async function enviarArquivo(event: ChangeEvent<HTMLInputElement>) {
        const arquivo = event.target.files?.[0];
        event.target.value = "";
        if (!arquivo || !contato) return;
        if (arquivo.size > 20 * 1024 * 1024) {
            setErro("Cada anexo pode ter no máximo 20 MB.");
            return;
        }
        try {
            setErro("");
            const id = (await comunicacaoService.obterOuCriarConversa(contato.outroUsuarioId)).conversaId;
            if (id !== conversaId) setConversaOverride(id);
            if (connection?.state === "Connected") await connection.invoke("EntrarConversa", id);
            await comunicacaoService.enviarAnexo(id, arquivo);
            await client.invalidateQueries({ queryKey: ["comunicacao", "mensagens", id] });
            await Promise.all([
                client.invalidateQueries({ queryKey: ["comunicacao", "alunos"] }),
                client.invalidateQueries({ queryKey: ["comunicacao", "personais-aluno"] }),
            ]);
        } catch (cause) {
            setErro(cause instanceof Error ? cause.message : "O arquivo foi rejeitado ou a verificação está indisponível.");
        }
    }

    function enviarFormulario(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!contato || !texto.trim() || enviar.isPending) return;
        setErro("");
        enviar.mutate();
    }

    const nomeContato = contato?.outroUsuarioNome ?? (modo === "personal" ? "Aluno" : "Personal");
    const carregando = modo === "personal" ? contatosPersonal.isLoading : contatosAluno.isLoading;

    return (
        <div className={modo === "personal" ? "grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_310px]" : ""}>
            <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                {modo === "aluno" && contatos.length > 0 && (
                    <div className="border-b border-[var(--border)] p-3">
                        <label className="grid gap-1.5 text-[9px] font-semibold text-[var(--text-muted)]">
                            Escolha com qual personal deseja conversar
                            <select
                                value={contatoSelecionadoId}
                                onChange={event => setContatoSelecionadoId(event.target.value)}
                                className="h-10 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-[11px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                            >
                                <option value="">Selecione um profissional...</option>
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
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-text)]"><BsChatDots /></span>
                        <div className="min-w-0">
                            <h3 className="truncate text-[11px] font-semibold text-[var(--text-primary)]">{modo === "personal" ? `Conversa com ${nomeContato}` : `Chat temporário · ${nomeContato}`}</h3>
                            <p className="text-[9px] text-[var(--text-muted)]">{online ? "Online agora" : "Offline"} · Expira após 48h sem mensagens {digitando ? "· digitando..." : ""}</p>
                        </div>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--success-soft)] px-2 py-1 text-[8px] font-semibold text-[var(--success)]"><BsShieldCheck /> Privado</span>
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
                    {modo === "aluno" && contatos.length > 0 && !contato && <p className="m-auto py-8 text-center text-[10px] text-[var(--text-muted)]">Selecione um personal para visualizar ou iniciar a conversa.</p>}
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
                                    {item.conteudo ? <p className="whitespace-pre-wrap break-words text-[10px] leading-5">{item.conteudo}</p> : null}
                                    {item.anexos?.map(anexo => (
                                        <button key={anexo.id} type="button" onClick={() => void comunicacaoService.baixarAnexo(anexo.id, anexo.nomeOriginal).catch(error => setErro(error instanceof Error ? error.message : "Não foi possível baixar o anexo."))} className="mt-2 block max-w-full rounded-lg bg-black/5 px-3 py-2 text-left">
                                            <span className="block break-all text-[9px] font-semibold">{anexo.nomeOriginal}</span>
                                            <span className="mt-0.5 block text-[8px] opacity-70">Anexo verificado · {tamanhoArquivo(anexo.tamanhoBytes)} · baixar</span>
                                        </button>
                                    ))}
                                    <p className={`mt-1.5 text-right text-[8px] ${propria ? "opacity-70" : "text-[var(--text-muted)]"}`}>
                                        {horario(item.enviadaEm)}{propria ? item.lidaEm ? " · Lida" : item.entregueEm ? " · Entregue" : " · Enviada" : ""}
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
                            <input ref={arquivoRef} type="file" accept=".jpg,.jpeg,.png,.webp,.mp4,.mov,.pdf,.txt,.docx,image/jpeg,image/png,image/webp,video/mp4,video/quicktime,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={event => void enviarArquivo(event)} />
                    <button type="button" onClick={() => arquivoRef.current?.click()} disabled={preparandoConversa} aria-label="Anexar arquivo" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[var(--border)] text-[var(--text-secondary)] disabled:opacity-40"><BsPaperclip /></button>
                            <textarea
                                value={texto}
                                onChange={event => setTexto(event.target.value)}
                                maxLength={4000}
                                rows={2}
                                disabled={preparandoConversa}
                                placeholder="Escreva uma mensagem..."
                                className="min-h-10 flex-1 resize-y rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2.5 text-[10px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                            />
                            <button type="submit" disabled={!texto.trim() || enviar.isPending || preparandoConversa} aria-label="Enviar mensagem" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--accent)] text-[var(--on-accent)] transition hover:bg-[var(--accent-hover)] disabled:opacity-40"><BsSend /></button>
                        </div>
                        <p className="mt-2 text-[8px] text-[var(--text-muted)]">Anexos até 20 MB passam por verificação de conteúdo e antivírus antes de serem disponibilizados.</p>
                    </form>
                )}
            </section>
            {modo === "personal" ? <ContextoAluno contexto={contexto.data} carregando={contexto.isLoading} onAbrirFicha={onAbrirFicha} onAbrirHistorico={onAbrirHistorico} /> : null}
        </div>
    );
}
