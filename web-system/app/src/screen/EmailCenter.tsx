import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
    BsArrowRepeat,
    BsCheckCircle,
    BsEnvelope,
    BsExclamationTriangle,
    BsEye,
    BsPeople,
    BsPerson,
    BsSave,
    BsSearch,
    BsSend,
    BsShieldCheck,
    BsX,
} from "react-icons/bs";
import { ApiError } from "../service/api";
import {
    emailService,
    type EmailEnvioResultado,
    type TipoDestinatarioEmail,
} from "../service/emailService";
import { Skeleton } from "../components/Skeleton";

type ModeloEmail = {
    id: string;
    nome: string;
    assunto: string;
    mensagem: string;
};

const MODELOS: ModeloEmail[] = [
    { id: "personalizado", nome: "Mensagem personalizada", assunto: "", mensagem: "" },
    {
        id: "comunicado",
        nome: "Comunicado institucional",
        assunto: "Comunicado importante | GGP",
        mensagem:
            "Olá, {{primeiro_nome}},\n\nTemos uma informação importante para compartilhar com você.\n\n[Escreva aqui o comunicado.]\n\nAgradecemos pela atenção.\n\nEquipe GGP",
    },
    {
        id: "boas-vindas",
        nome: "Boas-vindas",
        assunto: "Boas-vindas ao GGP!",
        mensagem:
            "Olá, {{primeiro_nome}},\n\nÉ um prazer ter você com a gente.\n\nA partir de agora, você poderá acompanhar sua jornada e manter contato com nossa equipe por meio da plataforma.\n\nConte conosco.\n\nEquipe GGP",
    },
    {
        id: "atualizacao",
        nome: "Atualização da plataforma",
        assunto: "Novidades e atualizações | GGP",
        mensagem:
            "Olá, {{primeiro_nome}},\n\nEstamos trabalhando continuamente para melhorar sua experiência com o GGP.\n\n[Descreva aqui a atualização e o que muda para o destinatário.]\n\nObrigado por fazer parte dessa evolução.\n\nEquipe GGP",
    },
    {
        id: "lembrete",
        nome: "Lembrete",
        assunto: "Um lembrete para você | GGP",
        mensagem:
            "Olá, {{primeiro_nome}},\n\nPassando para lembrar sobre:\n\n[Descreva aqui o lembrete.]\n\nSe precisar de ajuda, nossa equipe está à disposição.\n\nEquipe GGP",
    },
];

type RascunhoEmail = {
    tipo: TipoDestinatarioEmail;
    assunto: string;
    mensagem: string;
    modelo: string;
    destinatariosIds: string[];
};

function textoPersonalizado(texto: string) {
    return texto.replaceAll("{{nome}}", "Ana Silva").replaceAll("{{primeiro_nome}}", "Ana");
}

export default function EmailCenter({ tipoUsuario }: { tipoUsuario: "ADMIN" | "PERSONAL" }) {
    const [tipo, setTipo] = useState<TipoDestinatarioEmail>("ALUNO");
    const [busca, setBusca] = useState("");
    const [selecionados, setSelecionados] = useState<string[]>([]);
    const [modelo, setModelo] = useState("personalizado");
    const [assunto, setAssunto] = useState("");
    const [mensagem, setMensagem] = useState("");
    const [confirmacao, setConfirmacao] = useState(false);
    const [feedbackRascunho, setFeedbackRascunho] = useState("");
    const [resultado, setResultado] = useState<EmailEnvioResultado | null>(null);
    const [rascunhoDisponivel, setRascunhoDisponivel] = useState(
        () => typeof window !== "undefined" && Boolean(localStorage.getItem("ggp_email_rascunho")),
    );

    const tipoEfetivo: TipoDestinatarioEmail = tipoUsuario === "ADMIN" ? tipo : "ALUNO";
    const statusQuery = useQuery({
        queryKey: ["email-status"],
        queryFn: emailService.obterStatus,
        staleTime: 60000,
    });
    const destinatariosQuery = useQuery({
        queryKey: ["email-destinatarios", tipoEfetivo],
        queryFn: () => emailService.listarDestinatarios(tipoEfetivo),
        staleTime: 30000,
    });

    const destinatariosFiltrados = useMemo(() => {
        const termo = busca.trim().toLocaleLowerCase("pt-BR");
        const lista = destinatariosQuery.data ?? [];
        if (!termo) return lista;
        return lista.filter(
            item =>
                item.nome.toLocaleLowerCase("pt-BR").includes(termo) ||
                item.email.toLocaleLowerCase("pt-BR").includes(termo),
        );
    }, [destinatariosQuery.data, busca]);

    const todosVisiveisSelecionados =
        destinatariosFiltrados.length > 0 &&
        destinatariosFiltrados.every(item => selecionados.includes(item.usuarioId));
    const status = statusQuery.data;
    const corPrincipal = status?.corPrincipal || "#5558D9";
    const assuntoPreview = textoPersonalizado(assunto || "Assunto do seu comunicado");
    const mensagemPreview = textoPersonalizado(
        mensagem ||
            "O conteúdo do seu e-mail aparecerá aqui. Escreva sua mensagem para visualizar o resultado final.",
    );

    const envioMutation = useMutation({
        mutationFn: emailService.enviar,
        onSuccess: data => {
            setResultado(data);
            setConfirmacao(false);
            if (data.falhas === 0) {
                localStorage.removeItem("ggp_email_rascunho");
                setRascunhoDisponivel(false);
                setSelecionados([]);
            } else {
                setSelecionados(
                    data.resultados.filter(item => !item.sucesso).map(item => item.usuarioId),
                );
            }
        },
    });

    useEffect(() => {
        setResultado(null);
        setConfirmacao(false);
    }, [tipoEfetivo]);

    function selecionarModelo(id: string) {
        setModelo(id);
        const item = MODELOS.find(modeloItem => modeloItem.id === id);
        if (!item || id === "personalizado") return;
        setAssunto(item.assunto);
        setMensagem(item.mensagem);
        setResultado(null);
    }

    function alternarDestinatario(id: string) {
        setSelecionados(current =>
            current.includes(id)
                ? current.filter(item => item !== id)
                : current.length >= 100
                  ? current
                  : [...current, id],
        );
        setResultado(null);
    }

    function selecionarTodos() {
        if (todosVisiveisSelecionados) {
            const idsVisiveis = new Set(destinatariosFiltrados.map(item => item.usuarioId));
            setSelecionados(current => current.filter(id => !idsVisiveis.has(id)));
            return;
        }
        setSelecionados(current => {
            const novos = destinatariosFiltrados
                .map(item => item.usuarioId)
                .filter(id => !current.includes(id));
            return [...current, ...novos].slice(0, 100);
        });
    }

    function salvarRascunho() {
        const rascunho: RascunhoEmail = {
            tipo: tipoEfetivo,
            assunto,
            mensagem,
            modelo,
            destinatariosIds: selecionados,
        };
        localStorage.setItem("ggp_email_rascunho", JSON.stringify(rascunho));
        setRascunhoDisponivel(true);
        setFeedbackRascunho("Rascunho salvo neste navegador.");
        window.setTimeout(() => setFeedbackRascunho(""), 3500);
    }

    function carregarRascunho() {
        try {
            const salvo = localStorage.getItem("ggp_email_rascunho");
            if (!salvo) return;
            const rascunho = JSON.parse(salvo) as RascunhoEmail;
            const tipoRascunho = tipoUsuario === "ADMIN" ? rascunho.tipo : "ALUNO";
            setTipo(tipoRascunho);
            setAssunto(rascunho.assunto || "");
            setMensagem(rascunho.mensagem || "");
            setModelo(rascunho.modelo || "personalizado");
            setSelecionados(
                tipoRascunho === rascunho.tipo
                    ? (rascunho.destinatariosIds || []).slice(0, 100)
                    : [],
            );
            setFeedbackRascunho("Rascunho carregado.");
            window.setTimeout(() => setFeedbackRascunho(""), 3500);
        } catch {
            setFeedbackRascunho("Não foi possível abrir o rascunho salvo.");
        }
    }

    function iniciarEnvio() {
        setResultado(null);
        setConfirmacao(true);
    }

    function confirmarEnvio() {
        envioMutation.mutate({
            destinatariosIds: selecionados,
            assunto: assunto.trim(),
            mensagem: mensagem.trim(),
        });
    }

    return (
        <section className="mx-auto w-full max-w-[1500px] space-y-5">
            <header className="flex flex-col justify-between gap-4 border-b border-[var(--border)] pb-6 xl:flex-row xl:items-end">
                <div>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-[var(--accent-text)]">
                        Comunicação / E-mail Center
                    </p>
                    <h1 className="text-[28px] font-semibold tracking-[-.045em] text-[var(--text-primary)]">
                        Central de e-mails
                    </h1>
                    <p className="mt-1.5 max-w-2xl text-[12px] leading-5 text-[var(--text-secondary)]">
                        Comunique-se com alunos e profissionais por mensagens institucionais, com
                        destinatários individuais e conteúdo personalizado.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <span
                        className={
                            status?.configurado
                                ? "inline-flex items-center gap-2 rounded-full bg-[var(--success-soft)] px-3 py-2 text-[9px] font-semibold text-[var(--success)]"
                                : "inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-2 text-[9px] font-semibold text-amber-700"
                        }
                    >
                        {statusQuery.isLoading ? (
                            <span className="ui-spinner" aria-hidden="true" />
                        ) : status?.configurado ? (
                            <BsCheckCircle />
                        ) : (
                            <BsExclamationTriangle />
                        )}
                        {statusQuery.isLoading
                            ? "Verificando SMTP..."
                            : status?.configurado
                              ? "Remetente configurado"
                              : "SMTP aguardando configuração"}
                    </span>
                </div>
            </header>

            {!statusQuery.isLoading && !status?.configurado && (
                <div className="flex flex-col gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 sm:flex-row sm:items-start">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-500/10 text-amber-600">
                        <BsExclamationTriangle />
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold text-[var(--text-primary)]">
                            O envio real ainda não está habilitado
                        </p>
                        <p className="mt-1 text-[10px] leading-5 text-[var(--text-secondary)]">
                            {status?.mensagem ||
                                "Não foi possível verificar a configuração do servidor de e-mail."}{" "}
                            Você já pode preparar a mensagem, visualizar o modelo e salvar um
                            rascunho.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => statusQuery.refetch()}
                        className="inline-flex h-8 shrink-0 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-[9px] font-semibold text-[var(--text-secondary)]"
                    >
                        <BsArrowRepeat /> Verificar novamente
                    </button>
                </div>
            )}

            {statusQuery.isError && (
                <p
                    role="alert"
                    className="rounded-xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-3 text-[10px] text-[var(--danger)]"
                >
                    Não foi possível consultar a configuração de e-mail. Verifique se a API está em
                    execução.
                </p>
            )}

            <div className="grid items-start gap-5 2xl:grid-cols-[minmax(0,1.15fr)_minmax(380px,.85fr)]">
                <div className="space-y-5">
                    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <p className="text-[9px] font-bold uppercase tracking-[.16em] text-[var(--accent-text)]">
                                    Etapa 01
                                </p>
                                <h2 className="mt-1 text-[14px] font-semibold text-[var(--text-primary)]">
                                    Destinatários
                                </h2>
                                <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                                    Escolha quem receberá a comunicação.
                                </p>
                            </div>
                            <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1.5 text-[9px] font-semibold text-[var(--accent-text)]">
                                {selecionados.length}/100 selecionados
                            </span>
                        </div>

                        {tipoUsuario === "ADMIN" && (
                            <div className="mt-4 inline-flex rounded-xl bg-[var(--surface-secondary)] p-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setTipo("ALUNO");
                                        setSelecionados([]);
                                        setBusca("");
                                    }}
                                    className={
                                        tipoEfetivo === "ALUNO"
                                            ? "inline-flex h-9 items-center gap-2 rounded-lg bg-[var(--surface)] px-3 text-[10px] font-semibold text-[var(--text-primary)] shadow-sm"
                                            : "inline-flex h-9 items-center gap-2 rounded-lg px-3 text-[10px] font-medium text-[var(--text-muted)]"
                                    }
                                >
                                    <BsPeople /> Alunos
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setTipo("PERSONAL");
                                        setSelecionados([]);
                                        setBusca("");
                                    }}
                                    className={
                                        tipoEfetivo === "PERSONAL"
                                            ? "inline-flex h-9 items-center gap-2 rounded-lg bg-[var(--surface)] px-3 text-[10px] font-semibold text-[var(--text-primary)] shadow-sm"
                                            : "inline-flex h-9 items-center gap-2 rounded-lg px-3 text-[10px] font-medium text-[var(--text-muted)]"
                                    }
                                >
                                    <BsPerson /> Personais
                                </button>
                            </div>
                        )}

                        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                            <label className="relative min-w-0 flex-1">
                                <BsSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                                <input
                                    value={busca}
                                    onChange={event => setBusca(event.target.value)}
                                    placeholder="Buscar por nome ou e-mail..."
                                    className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] pl-9 pr-3 text-[11px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                                />
                            </label>
                            <button
                                type="button"
                                onClick={selecionarTodos}
                                disabled={!destinatariosFiltrados.length}
                                className="h-10 shrink-0 rounded-lg border border-[var(--border)] px-3 text-[10px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--row-hover)] disabled:opacity-40"
                            >
                                {todosVisiveisSelecionados
                                    ? "Desmarcar visíveis"
                                    : "Selecionar visíveis"}
                            </button>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-2 text-[9px] text-[var(--text-muted)]">
                            <span>
                                {destinatariosFiltrados.length} destinatário(s) disponível(is)
                            </span>
                            <span>Máximo de 100 por envio</span>
                        </div>
                        <div className="ui-stagger mt-2 max-h-[340px] overflow-y-auto rounded-xl border border-[var(--border)]">
                            {destinatariosQuery.isLoading && (
                                <div
                                    aria-label="Carregando destinatários"
                                    aria-busy="true"
                                    className="space-y-3 p-4"
                                >
                                    {Array.from({ length: 5 }, (_, index) => (
                                        <div key={index} className="flex items-center gap-3 py-1">
                                            <Skeleton className="h-4 w-4 rounded" />
                                            <Skeleton className="h-8 w-8 rounded-full" />
                                            <div className="flex-1 space-y-2">
                                                <Skeleton className="h-2.5 w-2/5 rounded" />
                                                <Skeleton className="h-2 w-3/5 rounded" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {destinatariosQuery.isError && (
                                <p
                                    role="alert"
                                    className="p-5 text-center text-[10px] text-[var(--danger)]"
                                >
                                    Não foi possível carregar os destinatários. Verifique sua
                                    autorização e tente novamente.
                                </p>
                            )}
                            {!destinatariosQuery.isLoading &&
                                !destinatariosQuery.isError &&
                                destinatariosFiltrados.length === 0 && (
                                    <div className="p-7 text-center">
                                        <BsPeople className="mx-auto text-xl text-[var(--text-muted)]" />
                                        <p className="mt-2 text-[10px] font-semibold text-[var(--text-primary)]">
                                            Nenhum destinatário encontrado
                                        </p>
                                        <p className="mt-1 text-[9px] text-[var(--text-muted)]">
                                            Tente alterar a busca ou o perfil selecionado.
                                        </p>
                                    </div>
                                )}
                            {destinatariosFiltrados.map(item => {
                                const checked = selecionados.includes(item.usuarioId);
                                const limiteAtingido = selecionados.length >= 100 && !checked;
                                return (
                                    <label
                                        key={item.usuarioId}
                                        className="flex cursor-pointer items-center gap-3 border-b border-[var(--border)] px-3 py-3 last:border-0 hover:bg-[var(--row-hover)]"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            disabled={limiteAtingido}
                                            onChange={() => alternarDestinatario(item.usuarioId)}
                                            className="h-4 w-4 shrink-0 accent-[var(--accent)]"
                                        />
                                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-[10px] font-semibold text-[var(--accent-text)]">
                                            {item.nome.slice(0, 1).toUpperCase()}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-[10px] font-semibold text-[var(--text-primary)]">
                                                {item.nome}
                                            </span>
                                            <span className="mt-0.5 block truncate text-[9px] text-[var(--text-muted)]">
                                                {item.email}
                                            </span>
                                        </span>
                                        <span className="rounded-md bg-[var(--surface-tertiary)] px-2 py-1 text-[8px] font-semibold text-[var(--text-muted)]">
                                            {item.tipo === "ALUNO" ? "ALUNO" : "PERSONAL"}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                        {tipoUsuario === "PERSONAL" && (
                            <p className="mt-3 flex items-start gap-2 text-[9px] leading-4 text-[var(--text-muted)]">
                                <BsShieldCheck className="mt-0.5 shrink-0 text-[var(--success)]" />A
                                lista é limitada aos alunos aprovados que estão vinculados ao seu
                                perfil.
                            </p>
                        )}
                    </section>

                    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
                        <div>
                            <p className="text-[9px] font-bold uppercase tracking-[.16em] text-[var(--accent-text)]">
                                Etapa 02
                            </p>
                            <h2 className="mt-1 text-[14px] font-semibold text-[var(--text-primary)]">
                                Conteúdo da mensagem
                            </h2>
                            <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                                Use um modelo profissional ou escreva do zero.
                            </p>
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <label className="grid gap-1.5 sm:col-span-2">
                                <span className="text-[9px] font-semibold text-[var(--text-secondary)]">
                                    Modelo de e-mail
                                </span>
                                <select
                                    value={modelo}
                                    onChange={event => selecionarModelo(event.target.value)}
                                    className="h-10 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-[10px] text-[var(--text-primary)] outline-none"
                                >
                                    {MODELOS.map(item => (
                                        <option key={item.id} value={item.id}>
                                            {item.nome}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="grid gap-1.5 sm:col-span-2">
                                <span className="text-[9px] font-semibold text-[var(--text-secondary)]">
                                    Assunto{" "}
                                    <span className="font-normal text-[var(--text-muted)]">
                                        ({assunto.length}/150)
                                    </span>
                                </span>
                                <input
                                    value={assunto}
                                    maxLength={150}
                                    onChange={event => {
                                        setAssunto(event.target.value);
                                        setResultado(null);
                                    }}
                                    placeholder="Ex.: Atualizações importantes sobre o GGP"
                                    className="h-10 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 text-[11px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                                />
                            </label>
                            <label className="grid gap-1.5 sm:col-span-2">
                                <span className="text-[9px] font-semibold text-[var(--text-secondary)]">
                                    Mensagem{" "}
                                    <span className="font-normal text-[var(--text-muted)]">
                                        ({mensagem.length}/12.000)
                                    </span>
                                </span>
                                <textarea
                                    value={mensagem}
                                    maxLength={12000}
                                    rows={9}
                                    onChange={event => {
                                        setMensagem(event.target.value);
                                        setResultado(null);
                                    }}
                                    placeholder={
                                        "Olá, {{primeiro_nome}},\n\nEscreva sua mensagem aqui..."
                                    }
                                    className="w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--input-bg)] p-3 text-[11px] leading-6 text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                                />
                            </label>
                        </div>
                        <div className="mt-3 rounded-xl bg-[var(--surface-secondary)] p-3">
                            <p className="text-[9px] font-semibold text-[var(--text-primary)]">
                                Personalização automática
                            </p>
                            <p className="mt-1 text-[9px] leading-5 text-[var(--text-muted)]">
                                Use{" "}
                                <code className="rounded bg-[var(--surface-tertiary)] px-1 py-0.5">
                                    {"{{nome}}"}
                                </code>{" "}
                                para o nome completo ou{" "}
                                <code className="rounded bg-[var(--surface-tertiary)] px-1 py-0.5">
                                    {"{{primeiro_nome}}"}
                                </code>{" "}
                                para o primeiro nome. O sistema substitui esses campos
                                individualmente para cada destinatário.
                            </p>
                        </div>
                    </section>
                </div>

                <aside className="space-y-5 2xl:sticky 2xl:top-5">
                    <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-4">
                            <div>
                                <p className="text-[9px] font-bold uppercase tracking-[.16em] text-[var(--accent-text)]">
                                    Etapa 03
                                </p>
                                <h2 className="mt-1 text-[13px] font-semibold text-[var(--text-primary)]">
                                    Prévia do e-mail
                                </h2>
                            </div>
                            <span className="inline-flex items-center gap-1.5 text-[9px] text-[var(--text-muted)]">
                                <BsEye /> Visualização
                            </span>
                        </div>
                        <div className="bg-[#F4F5F8] p-3 sm:p-5">
                            <div className="mx-auto max-w-[560px] overflow-hidden rounded-xl border border-[#E7E9EF] bg-white shadow-sm">
                                <div className="h-1.5" style={{ backgroundColor: corPrincipal }} />
                                <div className="flex items-center justify-between gap-3 px-5 py-5">
                                    <span
                                        className="text-[14px] font-bold tracking-[.12em]"
                                        style={{ color: corPrincipal }}
                                    >
                                        {status?.marca || "GGP"}
                                    </span>
                                    <span className="text-[8px] font-semibold tracking-[.14em] text-[#9297A4]">
                                        COMUNICAÇÃO OFICIAL
                                    </span>
                                </div>
                                <div className="px-5 pb-6">
                                    <p
                                        className="text-[9px] font-bold uppercase tracking-[.15em]"
                                        style={{ color: corPrincipal }}
                                    >
                                        Mensagem da equipe
                                    </p>
                                    <h3 className="mt-2 break-words text-[19px] font-bold leading-7 tracking-tight text-[#20232B]">
                                        {assuntoPreview}
                                    </h3>
                                    <p className="mt-4 whitespace-pre-wrap break-words text-[11px] leading-6 text-[#505664]">
                                        {mensagemPreview}
                                    </p>
                                    <div className="my-6 h-px bg-[#ECEEF2]" />
                                    <p className="text-[9px] leading-5 text-[#777E8C]">
                                        Esta mensagem foi enviada pela equipe{" "}
                                        <strong className="text-[#333946]">
                                            {status?.marca || "GGP"}
                                        </strong>{" "}
                                        para o endereço de e-mail cadastrado na plataforma.
                                    </p>
                                </div>
                                <div className="border-t border-[#ECEEF2] bg-[#F8F9FB] px-5 py-4">
                                    <p className="text-[9px] text-[#858B98]">
                                        © {new Date().getFullYear()} {status?.marca || "GGP"}.
                                        Todos os direitos reservados.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2 p-4">
                            <div className="flex items-center justify-between gap-3 text-[9px]">
                                <span className="text-[var(--text-muted)]">Remetente</span>
                                <span className="text-right font-semibold text-[var(--text-secondary)]">
                                    {status?.remetenteNome || "GGP"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-3 text-[9px]">
                                <span className="text-[var(--text-muted)]">Endereço</span>
                                <span className="max-w-[65%] truncate text-right font-semibold text-[var(--text-secondary)]">
                                    {status?.remetenteEmail || "Aguardando configuração"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-3 text-[9px]">
                                <span className="text-[var(--text-muted)]">Formato</span>
                                <span className="font-semibold text-[var(--text-secondary)]">
                                    HTML + texto simples
                                </span>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                        <h3 className="text-[11px] font-semibold text-[var(--text-primary)]">
                            Revisão do envio
                        </h3>
                        <div className="mt-3 space-y-2">
                            <div className="flex justify-between text-[10px]">
                                <span className="text-[var(--text-muted)]">Destinatários</span>
                                <strong className="text-[var(--text-primary)]">
                                    {selecionados.length}
                                </strong>
                            </div>
                            <div className="flex justify-between text-[10px]">
                                <span className="text-[var(--text-muted)]">Assunto</span>
                                <strong className="max-w-[65%] truncate text-right text-[var(--text-primary)]">
                                    {assunto.trim() || "Não definido"}
                                </strong>
                            </div>
                            <div className="flex justify-between text-[10px]">
                                <span className="text-[var(--text-muted)]">Perfil</span>
                                <strong className="text-[var(--text-primary)]">
                                    {tipoEfetivo === "ALUNO" ? "Alunos" : "Personais"}
                                </strong>
                            </div>
                        </div>
                        <div className="mt-4 grid gap-2 sm:grid-cols-2 2xl:grid-cols-1">
                            <button
                                type="button"
                                onClick={salvarRascunho}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--border)] text-[10px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--row-hover)]"
                            >
                                <BsSave /> Salvar rascunho
                            </button>
                            <button
                                type="button"
                                onClick={carregarRascunho}
                                disabled={!rascunhoDisponivel}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--border)] text-[10px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--row-hover)] disabled:opacity-40"
                            >
                                <BsArrowRepeat /> Carregar rascunho
                            </button>
                        </div>
                        {feedbackRascunho && (
                            <p role="status" className="mt-2 text-[9px] text-[var(--success)]">
                                {feedbackRascunho}
                            </p>
                        )}
                        <button
                            type="button"
                            disabled={
                                !status?.configurado ||
                                selecionados.length === 0 ||
                                assunto.trim().length < 3 ||
                                mensagem.trim().length < 3 ||
                                envioMutation.isPending
                            }
                            aria-busy={envioMutation.isPending}
                            onClick={iniciarEnvio}
                            className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-[10px] font-semibold text-white transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <BsSend /> Revisar e enviar
                        </button>
                        {!status?.configurado && (
                            <p className="mt-2 text-center text-[9px] leading-4 text-[var(--text-muted)]">
                                O botão de envio será liberado após a configuração SMTP no servidor.
                            </p>
                        )}
                    </section>
                </aside>
            </div>

            {confirmacao && (
                <div className="ui-modal-backdrop fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4">
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="email-confirm-title"
                        className="w-full max-w-[440px] rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-[9px] font-bold uppercase tracking-[.16em] text-[var(--accent-text)]">
                                    Confirmação
                                </p>
                                <h2
                                    id="email-confirm-title"
                                    className="mt-1 text-[16px] font-semibold text-[var(--text-primary)]"
                                >
                                    Enviar esta comunicação?
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setConfirmacao(false)}
                                aria-label="Fechar"
                                className="grid h-8 w-8 place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--row-hover)]"
                            >
                                <BsX />
                            </button>
                        </div>
                        <p className="mt-3 text-[11px] leading-5 text-[var(--text-secondary)]">
                            Você está prestes a enviar <strong>{assunto}</strong> para{" "}
                            <strong>{selecionados.length} destinatário(s)</strong>. Cada pessoa
                            receberá uma mensagem individual; os endereços dos demais destinatários
                            não serão expostos.
                        </p>
                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setConfirmacao(false)}
                                className="h-9 rounded-lg border border-[var(--border)] px-3 text-[10px] font-semibold text-[var(--text-secondary)]"
                            >
                                Voltar e revisar
                            </button>
                            <button
                                type="button"
                                onClick={confirmarEnvio}
                                disabled={envioMutation.isPending}
                                aria-busy={envioMutation.isPending}
                                className="inline-flex h-9 items-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-[10px] font-semibold text-white disabled:opacity-50"
                            >
                                <BsSend />{" "}
                                {envioMutation.isPending ? "Enviando..." : "Confirmar envio"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {envioMutation.isError && (
                <p
                    role="alert"
                    className="rounded-xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-3 text-[10px] text-[var(--danger)]"
                >
                    {envioMutation.error instanceof ApiError
                        ? envioMutation.error.message
                        : "Ocorreu uma falha ao enviar os e-mails."}
                </p>
            )}

            {resultado && (
                <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-[9px] font-bold uppercase tracking-[.16em] text-[var(--accent-text)]">
                                Resultado do envio
                            </p>
                            <h2 className="mt-1 text-[14px] font-semibold text-[var(--text-primary)]">
                                Processamento concluído
                            </h2>
                        </div>
                        <span
                            className={
                                resultado.falhas === 0
                                    ? "rounded-full bg-[var(--success-soft)] px-3 py-1.5 text-[9px] font-semibold text-[var(--success)]"
                                    : "rounded-full bg-amber-500/10 px-3 py-1.5 text-[9px] font-semibold text-amber-700"
                            }
                        >
                            {resultado.enviados} enviado(s) · {resultado.falhas} falha(s)
                        </span>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl bg-[var(--surface-secondary)] p-3">
                            <p className="text-[9px] text-[var(--text-muted)]">Processados</p>
                            <p className="mt-1 text-[18px] font-semibold text-[var(--text-primary)]">
                                {resultado.totalDestinatarios}
                            </p>
                        </div>
                        <div className="rounded-xl bg-[var(--success-soft)] p-3">
                            <p className="text-[9px] text-[var(--success)]">Enviados</p>
                            <p className="mt-1 text-[18px] font-semibold text-[var(--success)]">
                                {resultado.enviados}
                            </p>
                        </div>
                        <div className="rounded-xl bg-[var(--surface-secondary)] p-3">
                            <p className="text-[9px] text-[var(--text-muted)]">Falhas</p>
                            <p className="mt-1 text-[18px] font-semibold text-[var(--text-primary)]">
                                {resultado.falhas}
                            </p>
                        </div>
                    </div>
                    <div className="mt-4 divide-y divide-[var(--border)]">
                        {resultado.resultados.map(item => (
                            <div
                                key={item.usuarioId}
                                className="flex items-center justify-between gap-3 py-2"
                            >
                                <span className="truncate text-[10px] text-[var(--text-secondary)]">
                                    {item.nome}
                                </span>
                                <span
                                    className={
                                        item.sucesso
                                            ? "shrink-0 text-[9px] font-semibold text-[var(--success)]"
                                            : "shrink-0 text-[9px] font-semibold text-[var(--danger)]"
                                    }
                                >
                                    {item.sucesso ? "Enviado" : item.mensagem}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </section>
    );
}
