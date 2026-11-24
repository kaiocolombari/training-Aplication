import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    BsBell,
    BsChatDots,
    BsMegaphone,
    BsSend,
    BsCheck2All,
    BsPersonPlus,
    BsArrowLeft,
    BsPinAngleFill,
    BsFolder2Open,
    BsPaperclip,
} from "react-icons/bs";
import type { HubConnection } from "@microsoft/signalr";
import { useAuth } from "../context/authContext";
import { comunicacaoService, type Notificacao } from "../service/comunicacaoService";
import { ApiError } from "../service/api";
import { Skeleton } from "../components/Skeleton";
import { createChatConnection, startChatConnection } from "../service/chatRealtimeService";
import type { MensagemEquipe } from "../service/comunicacaoService";

type Aba = "mensagens" | "mural" | "alertas";

function dataHora(valor: string) {
    return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(valor));
}

function erroDa(error: unknown, fallback: string) {
    return error instanceof ApiError ? error.message : fallback;
}

export default function CentralComunicacao() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [aba, setAba] = useState<Aba>("mensagens");
    const [usuarioSelecionadoId, setUsuarioSelecionadoId] = useState("");
    const [conversaSelecionadaId, setConversaSelecionadaId] = useState("");
    const [mensagem, setMensagem] = useState("");
    const [tituloAviso, setTituloAviso] = useState("");
    const [conteudoAviso, setConteudoAviso] = useState("");
    const [tituloAlerta, setTituloAlerta] = useState("");
    const [conteudoAlerta, setConteudoAlerta] = useState("");
    const [destinoAlerta, setDestinoAlerta] = useState("todos");
    const [erroAcao, setErroAcao] = useState("");
    const [sucessoAcao, setSucessoAcao] = useState("");
    const [connection, setConnection] = useState<HubConnection | null>(null);
    const [digitando, setDigitando] = useState(false);
    const [online, setOnline] = useState(false);
    const fimMensagensRef = useRef<HTMLDivElement>(null);
    const arquivoRef = useRef<HTMLInputElement>(null);
    const isAdmin = user?.tipo === "ADMIN";

    const equipe = useQuery({
        queryKey: ["comunicacao", "equipe"],
        queryFn: comunicacaoService.listarEquipe,
        enabled: aba === "mensagens" || aba === "alertas",
    });
    const conversas = useQuery({
        queryKey: ["comunicacao", "conversas"],
        queryFn: comunicacaoService.listarConversas,
    });
    const avisos = useQuery({
        queryKey: ["comunicacao", "avisos"],
        queryFn: comunicacaoService.listarAvisos,
        refetchInterval: aba === "mural" ? 30000 : false,
    });
    const notificacoes = useQuery({
        queryKey: ["comunicacao", "notificacoes"],
        queryFn: comunicacaoService.listarNotificacoes,
        refetchInterval: 10000,
    });
    const mensagens = useQuery({
        queryKey: ["comunicacao", "mensagens", conversaSelecionadaId],
        queryFn: () => comunicacaoService.listarMensagens(conversaSelecionadaId),
        enabled: aba === "mensagens" && Boolean(conversaSelecionadaId),
    });

    const conversasPorUsuario = useMemo(
        () => new Map((conversas.data ?? []).map(conversa => [conversa.outroUsuarioId, conversa])),
        [conversas.data],
    );
    const naoLidas = (notificacoes.data ?? []).filter(item => !item.lidaEm).length;
    const naoLidasChat = (conversas.data ?? []).reduce((total, item) => total + item.naoLidas, 0);

    useEffect(() => {
        if (!usuarioSelecionadoId && conversas.data?.length) {
            const primeira = conversas.data[0];
            setUsuarioSelecionadoId(primeira.outroUsuarioId);
            setConversaSelecionadaId(primeira.id);
        }
    }, [conversas.data, usuarioSelecionadoId]);

    useEffect(() => {
        fimMensagensRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [mensagens.data]);

    useEffect(() => {
        const realtime = createChatConnection();
        let active = true;
        setConnection(realtime);
        realtime.on("NovaMensagem", (event: { mensagemId?: string }) => {
            if (event.mensagemId) void realtime.invoke("ConfirmarEntrega", event.mensagemId).catch(() => undefined);
            void queryClient.invalidateQueries({ queryKey: ["comunicacao", "conversas"] });
            void queryClient.invalidateQueries({ queryKey: ["comunicacao", "notificacoes"] });
        });
        realtime.on("MensagemRecebida", (message: MensagemEquipe & { conversaId: string }) => {
            if (!active || message.conversaId !== conversaSelecionadaId) return;
            queryClient.setQueryData<MensagemEquipe[]>(["comunicacao", "mensagens", conversaSelecionadaId], current => {
                const next = current ?? [];
                return next.some(item => item.id === message.id)
                    ? next
                    : [...next, message].sort((a, b) => new Date(a.enviadaEm).getTime() - new Date(b.enviadaEm).getTime());
            });
            if (message.remetenteId !== user?.usuarioId)
                void realtime.invoke("MarcarLida", conversaSelecionadaId).catch(() => undefined);
        });
        realtime.on("StatusMensagemAtualizado", (status: { conversaId: string; mensagemIds: string[]; status: string; em: string }) => {
            if (!active || status.conversaId !== conversaSelecionadaId) return;
            queryClient.setQueryData<MensagemEquipe[]>(["comunicacao", "mensagens", conversaSelecionadaId], current =>
                (current ?? []).map(item => !status.mensagemIds.includes(item.id) ? item : status.status === "LIDA"
                    ? { ...item, entregueEm: item.entregueEm ?? status.em, lidaEm: status.em }
                    : { ...item, entregueEm: status.em }),
            );
        });
        realtime.on("UsuarioDigitando", (event: { usuarioId: string; digitando: boolean }) => {
            if (event.usuarioId !== user?.usuarioId) setDigitando(event.digitando);
        });
        realtime.on("PresencaInicial", (event: { usuarioId: string; online: boolean }) => {
            if (event.usuarioId === usuarioSelecionadoId) setOnline(event.online);
        });
        realtime.on("PresencaAtualizada", (usuarioId: string, isOnline: boolean) => {
            if (usuarioId === usuarioSelecionadoId) setOnline(isOnline);
        });
        realtime.onreconnected(async () => {
            if (conversaSelecionadaId) {
                await realtime.invoke("EntrarConversa", conversaSelecionadaId);
                await queryClient.invalidateQueries({ queryKey: ["comunicacao", "mensagens", conversaSelecionadaId] });
                await realtime.invoke("MarcarLida", conversaSelecionadaId);
            }
        });
        void startChatConnection(realtime).then(async () => {
            if (active && conversaSelecionadaId) {
                await realtime.invoke("EntrarConversa", conversaSelecionadaId);
                await queryClient.invalidateQueries({ queryKey: ["comunicacao", "mensagens", conversaSelecionadaId] });
                await realtime.invoke("MarcarLida", conversaSelecionadaId);
            }
        }).catch(error => {
            if (active) setErroAcao(error instanceof Error ? error.message : "Chat em tempo real indisponível.");
        });
        return () => {
            active = false;
            setConnection(current => current === realtime ? null : current);
            if (conversaSelecionadaId) void realtime.invoke("SairConversa", conversaSelecionadaId).catch(() => undefined);
            void realtime.stop();
        };
    }, [queryClient, conversaSelecionadaId, usuarioSelecionadoId, user?.usuarioId]);

    useEffect(() => {
        if (!connection || connection.state !== "Connected" || !conversaSelecionadaId) return;
        let stopTimer: number | undefined;
        if (!mensagem.trim()) {
            void connection.invoke("UsuarioDigitando", conversaSelecionadaId, false).catch(() => undefined);
            return;
        }
        const startTimer = window.setTimeout(() => {
            void connection.invoke("UsuarioDigitando", conversaSelecionadaId, true).catch(() => undefined);
            stopTimer = window.setTimeout(() => {
                void connection.invoke("UsuarioDigitando", conversaSelecionadaId, false).catch(() => undefined);
            }, 2500);
        }, 250);
        return () => {
            window.clearTimeout(startTimer);
            if (stopTimer) window.clearTimeout(stopTimer);
        };
    }, [connection, conversaSelecionadaId, mensagem]);

    const enviarMensagem = useMutation({
        mutationFn: async () => {
            if (conversaSelecionadaId && connection?.state === "Connected") {
                await connection.invoke("EnviarMensagem", conversaSelecionadaId, mensagem.trim());
                return { conversaId: conversaSelecionadaId };
            }
            return comunicacaoService.enviarMensagem(usuarioSelecionadoId, mensagem.trim());
        },
        onSuccess: async result => {
            setMensagem("");
            setConversaSelecionadaId(result.conversaId);
            setErroAcao("");
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["comunicacao", "conversas"] }),
                queryClient.invalidateQueries({
                    queryKey: ["comunicacao", "mensagens", result.conversaId],
                }),
            ]);
        },
        onError: error => setErroAcao(erroDa(error, "Não foi possível enviar a mensagem.")),
    });

    const publicarAviso = useMutation({
        mutationFn: () =>
            comunicacaoService.publicarAviso(tituloAviso.trim(), conteudoAviso.trim()),
        onSuccess: async () => {
            setTituloAviso("");
            setConteudoAviso("");
            setSucessoAcao("Aviso publicado para toda a equipe.");
            setErroAcao("");
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["comunicacao", "avisos"] }),
                queryClient.invalidateQueries({ queryKey: ["comunicacao", "notificacoes"] }),
            ]);
        },
        onError: error => setErroAcao(erroDa(error, "Não foi possível publicar o aviso.")),
    });

    const criarAlerta = useMutation({
        mutationFn: () =>
            comunicacaoService.criarAlerta(
                tituloAlerta.trim(),
                conteudoAlerta.trim(),
                destinoAlerta === "todos" ? undefined : destinoAlerta,
            ),
        onSuccess: async () => {
            setTituloAlerta("");
            setConteudoAlerta("");
            setSucessoAcao("Alerta enviado.");
            setErroAcao("");
            await queryClient.invalidateQueries({ queryKey: ["comunicacao", "notificacoes"] });
        },
        onError: error => setErroAcao(erroDa(error, "Não foi possível enviar o alerta.")),
    });

    const marcarLida = useMutation({
        mutationFn: comunicacaoService.marcarNotificacaoLida,
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: ["comunicacao", "notificacoes"] }),
    });

    const marcarTodasLidas = useMutation({
        mutationFn: comunicacaoService.marcarTodasLidas,
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: ["comunicacao", "notificacoes"] }),
    });

    const marcarAvisosLidos = useMutation({
        mutationFn: comunicacaoService.marcarAvisosLidos,
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: ["comunicacao", "notificacoes"] }),
    });

    useEffect(() => {
        if (aba === "mural") marcarAvisosLidos.mutate();
    }, [aba]);

    function abrirNotificacao(item: Notificacao) {
        if (!item.lidaEm) marcarLida.mutate(item.id);
        if (item.tipo === "CHAT" && item.referenciaId) {
            const conversa = (conversas.data ?? []).find(c => c.id === item.referenciaId);
            if (conversa) {
                setUsuarioSelecionadoId(conversa.outroUsuarioId);
                setConversaSelecionadaId(conversa.id);
            }
            setAba("mensagens");
        } else if (item.tipo === "MURAL") {
            setAba("mural");
        } else {
            setAba("alertas");
        }
    }

    function selecionarMembro(usuarioId: string) {
        setUsuarioSelecionadoId(usuarioId);
        setConversaSelecionadaId(conversasPorUsuario.get(usuarioId)?.id ?? "");
        setErroAcao("");
        setSucessoAcao("");
    }

    function submitMensagem(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!usuarioSelecionadoId || !mensagem.trim() || enviarMensagem.isPending) return;
        enviarMensagem.mutate();
    }

    async function enviarArquivo(event: ChangeEvent<HTMLInputElement>) {
        const arquivo = event.target.files?.[0];
        event.target.value = "";
        if (!arquivo || !usuarioSelecionadoId) return;
        if (arquivo.size > 20 * 1024 * 1024) {
            setErroAcao("Cada anexo pode ter no máximo 20 MB.");
            return;
        }
        try {
            setErroAcao("");
            const id = (await comunicacaoService.obterOuCriarConversa(usuarioSelecionadoId)).conversaId;
            setConversaSelecionadaId(id);
            if (connection?.state === "Connected") await connection.invoke("EntrarConversa", id);
            await comunicacaoService.enviarAnexo(id, arquivo);
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["comunicacao", "conversas"] }),
                queryClient.invalidateQueries({ queryKey: ["comunicacao", "mensagens", id] }),
            ]);
        } catch (error) {
            setErroAcao(erroDa(error, "O arquivo foi rejeitado ou a verificação está indisponível."));
        }
    }

    function submitAviso(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!tituloAviso.trim() || !conteudoAviso.trim()) return;
        setErroAcao("");
        setSucessoAcao("");
        publicarAviso.mutate();
    }

    function submitAlerta(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!tituloAlerta.trim() || !conteudoAlerta.trim()) return;
        setErroAcao("");
        setSucessoAcao("");
        criarAlerta.mutate();
    }

    const membroSelecionado = equipe.data?.find(
        membro => membro.usuarioId === usuarioSelecionadoId,
    );
    const conversaAtual = conversasPorUsuario.get(usuarioSelecionadoId);
    const mensagensAtuais = mensagens.data ?? [];

    return (
        <section className="mx-auto w-full max-w-[1440px] space-y-6">
            <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--border)] pb-6">
                <div>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-[var(--accent-text)]">
                        Workspace / Comunicação
                    </p>
                    <h1 className="text-[28px] font-semibold tracking-[-.045em] text-[var(--text-primary)]">
                        Central da equipe
                    </h1>
                    <p className="mt-1.5 max-w-2xl text-[12px] leading-5 text-[var(--text-secondary)]">
                        Mensagens internas, comunicados oficiais e alertas importantes em um só
                        lugar.
                    </p>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
                    <BsBell className="text-[var(--accent)]" />
                    <span className="text-[11px] font-semibold text-[var(--text-primary)]">
                        {naoLidas} não lido(s)
                    </span>
                </div>
            </header>

            <nav className="flex flex-wrap gap-2" aria-label="Áreas de comunicação">
                <button
                    onClick={() => setAba("mensagens")}
                    className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition ${aba === "mensagens" ? "bg-[var(--accent)] text-white" : "border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--row-hover)]"}`}
                >
                    <BsChatDots /> Mensagens
                    {naoLidasChat > 0 && (
                        <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[9px]">
                            {naoLidasChat}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setAba("mural")}
                    className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition ${aba === "mural" ? "bg-[var(--accent)] text-white" : "border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--row-hover)]"}`}
                >
                    <BsMegaphone /> Mural global
                </button>
                <button
                    onClick={() => setAba("alertas")}
                    className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition ${aba === "alertas" ? "bg-[var(--accent)] text-white" : "border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--row-hover)]"}`}
                >
                    <BsBell /> Alertas
                    {naoLidas > 0 && (
                        <span className="rounded-full bg-[var(--accent-soft)] px-1.5 py-0.5 text-[9px] text-[var(--accent-text)]">
                            {naoLidas}
                        </span>
                    )}
                </button>
            </nav>

            {erroAcao && (
                <p
                    role="alert"
                    className="rounded-lg border border-[var(--danger)]/20 bg-[var(--danger-soft)] px-4 py-3 text-xs text-[var(--danger)]"
                >
                    {erroAcao}
                </p>
            )}
            {sucessoAcao && (
                <p
                    role="status"
                    className="rounded-lg border border-[var(--success)]/20 bg-[var(--success-soft)] px-4 py-3 text-xs text-[var(--success)]"
                >
                    {sucessoAcao}
                </p>
            )}

            {aba === "mensagens" && (
                <div className="grid min-h-[620px] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] lg:grid-cols-[300px_minmax(0,1fr)]">
                    <aside className="border-b border-[var(--border)] lg:border-b-0 lg:border-r">
                        <div className="border-b border-[var(--border)] px-4 py-4">
                            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                                Equipe
                            </h2>
                            <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                                Converse com administradores e personais.
                            </p>
                        </div>
                        <div className="max-h-[250px] overflow-y-auto p-2 lg:max-h-[560px]">
                            {equipe.isLoading && (
                                <div
                                    aria-label="Carregando equipe"
                                    aria-busy="true"
                                    className="space-y-4 p-3"
                                >
                                    {Array.from({ length: 4 }, (_, index) => (
                                        <div key={index} className="flex items-center gap-3">
                                            <Skeleton className="h-9 w-9 rounded-full" />
                                            <div className="flex-1 space-y-2">
                                                <Skeleton className="h-2.5 w-3/5 rounded" />
                                                <Skeleton className="h-2 w-2/5 rounded" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {(equipe.data ?? []).map(membro => {
                                const conversa = conversasPorUsuario.get(membro.usuarioId);
                                const ativo = usuarioSelecionadoId === membro.usuarioId;
                                return (
                                    <button
                                        key={membro.usuarioId}
                                        onClick={() => selecionarMembro(membro.usuarioId)}
                                        className={`mb-1 flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${ativo ? "bg-[var(--accent-soft)]" : "hover:bg-[var(--row-hover)]"}`}
                                    >
                                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--surface-tertiary)] text-xs font-bold text-[var(--text-primary)]">
                                            {membro.nome.slice(0, 1).toUpperCase()}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-xs font-semibold text-[var(--text-primary)]">
                                                {membro.nome}
                                            </span>
                                            <span className="mt-0.5 block text-[9px] text-[var(--text-muted)]">
                                                {membro.tipo === "ADMIN"
                                                    ? "Administrador"
                                                    : "Personal"}
                                            </span>
                                            {conversa?.ultimaMensagem && (
                                                <span className="mt-1 block truncate text-[10px] text-[var(--text-secondary)]">
                                                    {conversa.ultimaMensagem}
                                                </span>
                                            )}
                                        </span>
                                        {conversa?.naoLidas ? (
                                            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[var(--accent)] px-1 text-[9px] font-bold text-white">
                                                {conversa.naoLidas}
                                            </span>
                                        ) : null}
                                    </button>
                                );
                            })}
                            {!equipe.isLoading && equipe.data?.length === 0 && (
                                <p className="p-3 text-xs text-[var(--text-muted)]">
                                    Nenhum outro membro cadastrado.
                                </p>
                            )}
                        </div>
                    </aside>

                    <div className="flex min-h-[540px] min-w-0 flex-col">
                        {usuarioSelecionadoId ? (
                            <>
                                <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-4">
                                    <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--accent-soft)] text-xs font-bold text-[var(--accent-text)]">
                                        {(
                                            membroSelecionado?.nome ??
                                            conversaAtual?.outroUsuarioNome ??
                                            "?"
                                        )
                                            .slice(0, 1)
                                            .toUpperCase()}
                                    </span>
                                    <div className="min-w-0">
                                        <h2 className="truncate text-sm font-semibold text-[var(--text-primary)]">
                                            {membroSelecionado?.nome ??
                                                conversaAtual?.outroUsuarioNome ??
                                                "Conversa"}
                                        </h2>
                                        <p className="text-[10px] text-[var(--text-muted)]">
                                            {membroSelecionado?.tipo === "ADMIN" ||
                                            conversaAtual?.outroUsuarioTipo === "ADMIN"
                                                ? "Administrador"
                                                : "Personal da equipe"} · {online ? "Online agora" : "Offline"}{digitando ? " · digitando..." : ""}
                                        </p>
                                    </div>
                                </div>
                                <div className="ui-stagger flex-1 space-y-3 overflow-y-auto bg-[var(--surface-secondary)]/60 p-4 sm:p-6">
                                    {mensagens.isLoading && conversaSelecionadaId && (
                                        <div
                                            aria-label="Carregando mensagens"
                                            aria-busy="true"
                                            className="space-y-4 py-3"
                                        >
                                            {["w-3/5", "w-2/5", "w-1/2"].map((width, index) => (
                                                <div
                                                    key={index}
                                                    className={`flex ${index === 1 ? "justify-end" : "justify-start"}`}
                                                >
                                                    <Skeleton
                                                        className={`h-16 ${width} max-w-[78%] rounded-2xl`}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {!conversaSelecionadaId && (
                                        <div className="grid h-full min-h-[260px] place-items-center text-center">
                                            <div>
                                                <BsChatDots className="mx-auto text-3xl text-[var(--text-muted)]" />
                                                <p className="mt-3 text-xs font-semibold text-[var(--text-primary)]">
                                                    Comece uma conversa
                                                </p>
                                                <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                                                    Envie a primeira mensagem para{" "}
                                                    {membroSelecionado?.nome}.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    {mensagensAtuais.map(item => {
                                        const propria = item.remetenteId === user?.usuarioId;
                                        return (
                                            <div
                                                key={item.id}
                                                className={`flex ${propria ? "justify-end" : "justify-start"}`}
                                            >
                                                <article
                                                    className={`max-w-[min(78%,560px)] rounded-2xl px-4 py-3 shadow-sm ${propria ? "rounded-br-md bg-[var(--accent)] text-white" : "rounded-bl-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)]"}`}
                                                >
                                                    {item.conteudo ? <p className="whitespace-pre-wrap break-words text-xs leading-5">{item.conteudo}</p> : null}
                                                    {item.anexos?.map(anexo => (
                                                        <button key={anexo.id} type="button" onClick={() => void comunicacaoService.baixarAnexo(anexo.id, anexo.nomeOriginal).catch(error => setErroAcao(erroDa(error, "Não foi possível baixar o anexo.")))} className="mt-2 block max-w-full rounded-lg bg-black/5 px-3 py-2 text-left">
                                                            <span className="block break-all text-[10px] font-semibold">{anexo.nomeOriginal}</span>
                                                            <span className="mt-0.5 block text-[8px] opacity-70">Anexo verificado · {anexo.tamanhoBytes >= 1024 * 1024 ? `${(anexo.tamanhoBytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(anexo.tamanhoBytes / 1024))} KB`} · baixar</span>
                                                        </button>
                                                    ))}
                                                    <p
                                                        className={`mt-2 text-right text-[9px] ${propria ? "text-white/65" : "text-[var(--text-muted)]"}`}
                                                    >
                                                        {dataHora(item.enviadaEm)}
                                                        {propria ? item.lidaEm ? " · Lida" : item.entregueEm ? " · Entregue" : " · Enviada" : ""}
                                                    </p>
                                                </article>
                                            </div>
                                        );
                                    })}
                                    <div ref={fimMensagensRef} />
                                </div>
                                <form
                                    onSubmit={submitMensagem}
                                    className="flex items-end gap-2 border-t border-[var(--border)] p-3 sm:p-4"
                                >
                                    <input ref={arquivoRef} type="file" accept=".jpg,.jpeg,.png,.webp,.mp4,.mov,.pdf,.txt,.docx,image/jpeg,image/png,image/webp,video/mp4,video/quicktime,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={event => void enviarArquivo(event)} />
                                    <button type="button" onClick={() => arquivoRef.current?.click()} aria-label="Anexar arquivo" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[var(--border)] text-[var(--text-secondary)]"><BsPaperclip /></button>
                                    <textarea
                                        value={mensagem}
                                        onChange={event => setMensagem(event.target.value)}
                                        maxLength={4000}
                                        rows={2}
                                        placeholder="Escreva uma mensagem..."
                                        className="max-h-32 min-h-11 flex-1 resize-y rounded-xl border border-[var(--border-strong)] bg-[var(--input-bg)] px-3 py-2.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!mensagem.trim() || enviarMensagem.isPending}
                                        aria-busy={enviarMensagem.isPending}
                                        aria-label="Enviar mensagem"
                                        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--accent)] text-white transition hover:brightness-110 disabled:opacity-40"
                                    >
                                        <BsSend />
                                    </button>
                                </form>
                                <p className="border-t border-[var(--border)] px-4 py-2 text-[8px] text-[var(--text-muted)]">Anexos de até 20 MB passam por verificação de conteúdo e antivírus antes de serem disponibilizados.</p>
                            </>
                        ) : (
                            <div className="grid flex-1 place-items-center p-8 text-center">
                                <div>
                                    <BsPersonPlus className="mx-auto text-4xl text-[var(--text-muted)]" />
                                    <h2 className="mt-4 text-sm font-semibold text-[var(--text-primary)]">
                                        Selecione alguém da equipe
                                    </h2>
                                    <p className="mt-1 max-w-xs text-xs leading-5 text-[var(--text-muted)]">
                                        As conversas são privadas entre os dois membros.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {aba === "mural" && (
                <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                    <section className="space-y-3">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                                    Comunicados oficiais
                                </h2>
                                <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                                    Avisos publicados para todos os membros da equipe.
                                </p>
                            </div>
                            <span className="rounded-full border border-[var(--border)] px-3 py-1 text-[10px] text-[var(--text-muted)]">
                                {avisos.data?.length ?? 0} recentes
                            </span>
                        </div>
                        {avisos.isLoading && (
                            <div
                                aria-label="Carregando comunicados"
                                aria-busy="true"
                                className="space-y-3"
                            >
                                {Array.from({ length: 2 }, (_, index) => (
                                    <div
                                        key={index}
                                        className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"
                                    >
                                        <Skeleton className="h-2.5 w-2/5 rounded" />
                                        <Skeleton className="mt-4 h-4 w-3/4 rounded" />
                                        <Skeleton className="mt-4 h-2.5 w-full rounded" />
                                        <Skeleton className="mt-2 h-2.5 w-5/6 rounded" />
                                    </div>
                                ))}
                            </div>
                        )}
                        {(avisos.data ?? []).map(aviso => (
                            <article
                                key={aviso.id}
                                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-bold uppercase tracking-[.16em] text-[var(--accent-text)]">
                                            Comunicado da administração
                                        </p>
                                        <h3 className="mt-2 text-base font-semibold text-[var(--text-primary)]">
                                            {aviso.titulo}
                                        </h3>
                                    </div>
                                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                                        <BsPinAngleFill />
                                    </span>
                                </div>
                                <p className="mt-4 whitespace-pre-wrap text-xs leading-6 text-[var(--text-secondary)]">
                                    {aviso.conteudo}
                                </p>
                                <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] pt-3 text-[9px] text-[var(--text-muted)]">
                                    <span>Por {aviso.autorNome}</span>
                                    <time>{dataHora(aviso.publicadoEm)}</time>
                                </div>
                            </article>
                        ))}
                        {!avisos.isLoading && avisos.data?.length === 0 && (
                            <div className="rounded-2xl border border-dashed border-[var(--border-strong)] p-12 text-center">
                                <BsMegaphone className="mx-auto text-3xl text-[var(--text-muted)]" />
                                <p className="mt-3 text-xs font-semibold text-[var(--text-primary)]">
                                    O mural ainda está vazio
                                </p>
                                <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                                    Quando a administração publicar um comunicado, ele aparecerá
                                    aqui.
                                </p>
                            </div>
                        )}
                    </section>

                    {isAdmin && (
                        <form
                            onSubmit={submitAviso}
                            className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 xl:sticky xl:top-24"
                        >
                            <div>
                                <p className="text-[9px] font-bold uppercase tracking-[.16em] text-[var(--accent-text)]">
                                    Somente administrador
                                </p>
                                <h2 className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                                    Publicar no mural
                                </h2>
                                <p className="mt-1 text-[10px] leading-5 text-[var(--text-muted)]">
                                    O comunicado ficará visível para toda a equipe e gerará um
                                    alerta para os membros.
                                </p>
                            </div>
                            <label className="block">
                                <span className="mb-1.5 block text-[10px] font-semibold text-[var(--text-secondary)]">
                                    Título
                                </span>
                                <input
                                    required
                                    maxLength={120}
                                    value={tituloAviso}
                                    onChange={event => setTituloAviso(event.target.value)}
                                    className="h-10 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--input-bg)] px-3 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                                    placeholder="Ex.: Atualização de procedimentos"
                                />
                            </label>
                            <label className="block">
                                <span className="mb-1.5 block text-[10px] font-semibold text-[var(--text-secondary)]">
                                    Comunicado
                                </span>
                                <textarea
                                    required
                                    maxLength={4000}
                                    rows={7}
                                    value={conteudoAviso}
                                    onChange={event => setConteudoAviso(event.target.value)}
                                    className="w-full resize-y rounded-lg border border-[var(--border-strong)] bg-[var(--input-bg)] px-3 py-2.5 text-xs leading-5 text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                                    placeholder="Escreva o aviso para a equipe..."
                                />
                            </label>
                            <button
                                disabled={
                                    publicarAviso.isPending ||
                                    !tituloAviso.trim() ||
                                    !conteudoAviso.trim()
                                }
                                aria-busy={publicarAviso.isPending}
                                className="w-full rounded-lg bg-[var(--accent)] px-4 py-3 text-xs font-bold text-white transition hover:brightness-110 disabled:opacity-40"
                            >
                                {publicarAviso.isPending ? "Publicando..." : "Publicar comunicado"}
                            </button>
                        </form>
                    )}
                </div>
            )}

            {aba === "alertas" && (
                <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
                            <div>
                                <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                                    Caixa de alertas
                                </h2>
                                <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                                    Mensagens novas, comunicados e avisos direcionados a você.
                                </p>
                            </div>
                            <button
                                onClick={() => marcarTodasLidas.mutate()}
                                disabled={naoLidas === 0 || marcarTodasLidas.isPending}
                                aria-busy={marcarTodasLidas.isPending}
                                className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-[10px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--row-hover)] disabled:opacity-40"
                            >
                                <BsCheck2All /> Marcar todas como lidas
                            </button>
                        </div>
                        <div className="ui-stagger divide-y divide-[var(--border)]">
                            {(notificacoes.data ?? []).map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => abrirNotificacao(item)}
                                    className={`flex w-full items-start gap-3 px-5 py-4 text-left transition hover:bg-[var(--row-hover)] ${item.lidaEm ? "opacity-65" : "bg-[var(--accent-soft)]/35"}`}
                                >
                                    <span
                                        className={`mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${item.tipo === "CHAT" ? "bg-sky-500/10 text-sky-600" : item.tipo === "MURAL" ? "bg-[var(--accent-soft)] text-[var(--accent)]" : item.tipo === "ARQUIVO_EQUIPE" ? "bg-violet-500/10 text-violet-600" : "bg-amber-500/10 text-amber-600"}`}
                                    >
                                        {item.tipo === "CHAT" ? (
                                            <BsChatDots />
                                        ) : item.tipo === "MURAL" ? (
                                            <BsMegaphone />
                                        ) : item.tipo === "ARQUIVO_EQUIPE" ? (
                                            <BsFolder2Open />
                                        ) : (
                                            <BsBell />
                                        )}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="flex flex-wrap items-center gap-2">
                                            <strong className="text-xs font-semibold text-[var(--text-primary)]">
                                                {item.titulo}
                                            </strong>
                                            {!item.lidaEm && (
                                                <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                                            )}
                                        </span>
                                        <span className="mt-1 block whitespace-pre-wrap text-[11px] leading-5 text-[var(--text-secondary)]">
                                            {item.mensagem}
                                        </span>
                                        <time className="mt-1.5 block text-[9px] text-[var(--text-muted)]">
                                            {dataHora(item.criadaEm)}
                                        </time>
                                    </span>
                                    {!item.lidaEm && (
                                        <span className="mt-2 text-[9px] font-semibold text-[var(--accent-text)]">
                                            Novo
                                        </span>
                                    )}
                                </button>
                            ))}
                            {notificacoes.data?.length === 0 && (
                                <div className="p-12 text-center">
                                    <BsBell className="mx-auto text-3xl text-[var(--text-muted)]" />
                                    <p className="mt-3 text-xs font-semibold text-[var(--text-primary)]">
                                        Tudo em dia
                                    </p>
                                    <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                                        Quando houver algo importante, você verá aqui.
                                    </p>
                                </div>
                            )}
                        </div>
                    </section>

                    {isAdmin && (
                        <form
                            onSubmit={submitAlerta}
                            className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 xl:sticky xl:top-24"
                        >
                            <div>
                                <p className="text-[9px] font-bold uppercase tracking-[.16em] text-[var(--accent-text)]">
                                    Ferramenta administrativa
                                </p>
                                <h2 className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                                    Enviar alerta
                                </h2>
                                <p className="mt-1 text-[10px] leading-5 text-[var(--text-muted)]">
                                    Envie uma notificação para todos ou para um membro específico.
                                </p>
                            </div>
                            <label className="block">
                                <span className="mb-1.5 block text-[10px] font-semibold text-[var(--text-secondary)]">
                                    Destinatário
                                </span>
                                <select
                                    value={destinoAlerta}
                                    onChange={event => setDestinoAlerta(event.target.value)}
                                    className="h-10 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--input-bg)] px-3 text-xs text-[var(--text-primary)] outline-none"
                                >
                                    <option value="todos">Toda a equipe</option>
                                    {(equipe.data ?? []).map(membro => (
                                        <option key={membro.usuarioId} value={membro.usuarioId}>
                                            {membro.nome} · {membro.tipo}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="block">
                                <span className="mb-1.5 block text-[10px] font-semibold text-[var(--text-secondary)]">
                                    Título
                                </span>
                                <input
                                    required
                                    maxLength={120}
                                    value={tituloAlerta}
                                    onChange={event => setTituloAlerta(event.target.value)}
                                    className="h-10 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--input-bg)] px-3 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                                    placeholder="Ex.: Manutenção programada"
                                />
                            </label>
                            <label className="block">
                                <span className="mb-1.5 block text-[10px] font-semibold text-[var(--text-secondary)]">
                                    Mensagem
                                </span>
                                <textarea
                                    required
                                    maxLength={1000}
                                    rows={5}
                                    value={conteudoAlerta}
                                    onChange={event => setConteudoAlerta(event.target.value)}
                                    className="w-full resize-y rounded-lg border border-[var(--border-strong)] bg-[var(--input-bg)] px-3 py-2.5 text-xs leading-5 text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                                    placeholder="Descreva o que precisa ser alertado..."
                                />
                            </label>
                            <button
                                disabled={
                                    criarAlerta.isPending ||
                                    !tituloAlerta.trim() ||
                                    !conteudoAlerta.trim()
                                }
                                aria-busy={criarAlerta.isPending}
                                className="w-full rounded-lg bg-[var(--accent)] px-4 py-3 text-xs font-bold text-white transition hover:brightness-110 disabled:opacity-40"
                            >
                                {criarAlerta.isPending ? "Enviando..." : "Enviar alerta"}
                            </button>
                        </form>
                    )}
                </div>
            )}
        </section>
    );
}
