import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    BsCheckCircle,
    BsExclamationTriangle,
    BsHeartPulse,
    BsPlusLg,
    BsWrenchAdjustable,
} from "react-icons/bs";
import { useAuth } from "../context/authContext";
import { adminExtrasService } from "../service/adminExtrasService";
import { LoadingState } from "../components/LoadingState";

const statusNome: Record<string, string> = {
    ABERTO: "Aberto",
    EM_ANALISE: "Em análise",
    EM_ANDAMENTO: "Em andamento",
    RESOLVIDO: "Resolvido",
    CANCELADO: "Cancelado",
};
const corStatus: Record<string, string> = {
    OK: "text-[var(--success)]",
    AVISO: "text-amber-600",
    ERRO: "text-[var(--danger)]",
};

export default function ManutencaoSistema() {
    const { user } = useAuth();
    const isAdmin = user?.tipo === "ADMIN";
    const client = useQueryClient();
    const [titulo, setTitulo] = useState("");
    const [descricao, setDescricao] = useState("");
    const [categoria, setCategoria] = useState("BUG");
    const [prioridade, setPrioridade] = useState("NORMAL");
    const [erro, setErro] = useState("");
    const [edicoes, setEdicoes] = useState<
        Record<
            string,
            { responsavelUsuarioId: string; status: string; prioridade: string; resolucao: string }
        >
    >({});
    const saude = useQuery({
        queryKey: ["extras", "saude-sistema"],
        queryFn: adminExtrasService.saudeSistema,
        enabled: isAdmin,
        refetchInterval: 60000,
    });
    const registros = useQuery({
        queryKey: ["extras", "manutencao"],
        queryFn: adminExtrasService.listarManutencao,
    });
    const responsaveis = useQuery({
        queryKey: ["extras", "manutencao-responsaveis"],
        queryFn: adminExtrasService.responsaveisManutencao,
        enabled: isAdmin,
    });
    const invalidar = () => client.invalidateQueries({ queryKey: ["extras", "manutencao"] });
    const criar = useMutation({
        mutationFn: adminExtrasService.criarManutencao,
        onSuccess: async () => {
            setTitulo("");
            setDescricao("");
            setErro("");
            await invalidar();
        },
        onError: (e: Error) => setErro(e.message),
    });
    const atualizar = useMutation({
        mutationFn: ({
            id,
            values,
        }: {
            id: string;
            values: {
                responsavelUsuarioId?: string | null;
                status: string;
                resolucao?: string;
                prioridade: string;
            };
        }) => adminExtrasService.atualizarManutencao(id, values),
        onSuccess: async () => {
            setErro("");
            await invalidar();
        },
        onError: (e: Error) => setErro(e.message),
    });
    const input =
        "h-10 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--input-bg)] px-3 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]";
    const label = "grid gap-1.5 text-[10px] font-semibold text-[var(--text-secondary)]";

    return (
        <section className="mx-auto w-full max-w-[1440px] space-y-6">
            <header className="border-b border-[var(--border)] pb-6">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-[var(--accent-text)]">
                    Sistema / Operação
                </p>
                <h1 className="text-[28px] font-semibold tracking-[-.045em] text-[var(--text-primary)]">
                    Central de manutenção
                </h1>
                <p className="mt-1.5 max-w-2xl text-[12px] leading-5 text-[var(--text-secondary)]">
                    Registre problemas e acompanhe solicitações internas. Administradores também
                    podem verificar os serviços essenciais da aplicação.
                </p>
            </header>
            {isAdmin && (
                <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <BsHeartPulse className="text-[var(--accent)]" />
                                <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                                    Saúde do sistema
                                </h2>
                            </div>
                            <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                                Verificações executadas pela API · atualização automática a cada
                                minuto
                            </p>
                        </div>
                        <button
                            type="button"
                            disabled={saude.isFetching}
                            aria-busy={saude.isFetching}
                            onClick={() => void saude.refetch()}
                            className="h-9 rounded-lg border border-[var(--border)] px-3 text-[10px] font-semibold text-[var(--text-secondary)]"
                        >
                            {saude.isFetching ? "Verificando..." : "Verificar agora"}
                        </button>
                    </div>
                    {saude.isLoading && (
                        <LoadingState
                            label="Verificando serviços..."
                            className="mt-4 justify-start"
                        />
                    )}
                    {saude.isError && (
                        <p className="mt-4 text-xs text-[var(--danger)]">
                            Não foi possível obter o estado do sistema.
                        </p>
                    )}
                    {saude.data && (
                        <>
                            <div className="mt-4 flex flex-wrap items-center gap-3">
                                <span
                                    className={`rounded-lg px-3 py-2 text-[10px] font-bold ${saude.data.statusGeral === "SAUDAVEL" ? "bg-[var(--success-soft)] text-[var(--success)]" : saude.data.statusGeral === "ATENCAO" ? "bg-amber-500/10 text-amber-700" : "bg-[var(--danger-soft)] text-[var(--danger)]"}`}
                                >
                                    {saude.data.statusGeral === "SAUDAVEL"
                                        ? "Operação saudável"
                                        : saude.data.statusGeral === "ATENCAO"
                                          ? "Atenção necessária"
                                          : "Sistema degradado"}
                                </span>
                                <span className="text-[9px] text-[var(--text-muted)]">
                                    Uptime da API: {Math.floor(saude.data.uptimeSegundos / 3600)}h{" "}
                                    {Math.floor((saude.data.uptimeSegundos % 3600) / 60)}min ·
                                    verificado{" "}
                                    {new Date(saude.data.verificadoEm).toLocaleTimeString("pt-BR")}
                                </span>
                            </div>
                            <div className="mt-4 grid gap-3 md:grid-cols-3">
                                {saude.data.verificacoes.map(item => (
                                    <article
                                        key={item.nome}
                                        className="rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] p-4"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-[11px] font-semibold text-[var(--text-primary)]">
                                                {item.nome}
                                            </p>
                                            <span
                                                className={`text-[9px] font-bold ${corStatus[item.status]}`}
                                            >
                                                {item.status}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-[10px] leading-5 text-[var(--text-secondary)]">
                                            {item.detalhe}
                                        </p>
                                        {item.duracaoMs != null && (
                                            <p className="mt-2 text-[9px] text-[var(--text-muted)]">
                                                Resposta: {item.duracaoMs} ms
                                            </p>
                                        )}
                                    </article>
                                ))}
                            </div>
                            <p className="mt-3 text-[9px] text-[var(--text-muted)]">
                                A verificação de SMTP confirma apenas a presença das configurações,
                                não testa autenticação ou entrega. A verificação de armazenamento
                                testa escrita e remoção de um arquivo temporário.
                            </p>
                        </>
                    )}
                </section>
            )}
            <div className="grid items-start gap-5 xl:grid-cols-[minmax(280px,.7fr)_minmax(0,1.5fr)]">
                <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                    <div className="mb-4 flex items-center gap-2">
                        <BsPlusLg className="text-[var(--accent)]" />
                        <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                            Registrar ocorrência
                        </h2>
                    </div>
                    <form
                        className="space-y-3"
                        onSubmit={e => {
                            e.preventDefault();
                            setErro("");
                            criar.mutate({ titulo, descricao, categoria, prioridade });
                        }}
                    >
                        <label className={label}>
                            Título
                            <input
                                required
                                minLength={3}
                                maxLength={140}
                                value={titulo}
                                onChange={e => setTitulo(e.target.value)}
                                className={input}
                                placeholder="Ex.: Falha ao salvar avaliação"
                            />
                        </label>
                        <label className={label}>
                            Descrição
                            <textarea
                                required
                                minLength={5}
                                maxLength={3000}
                                rows={4}
                                value={descricao}
                                onChange={e => setDescricao(e.target.value)}
                                className={`${input} h-auto py-2.5`}
                                placeholder="Descreva o comportamento, tela e passos para reproduzir..."
                            />
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <label className={label}>
                                Categoria
                                <select
                                    value={categoria}
                                    onChange={e => setCategoria(e.target.value)}
                                    className={input}
                                >
                                    <option value="BUG">Erro / bug</option>
                                    <option value="MELHORIA">Melhoria</option>
                                    <option value="INFRAESTRUTURA">Infraestrutura</option>
                                    <option value="DADOS">Dados</option>
                                    <option value="ACESSO">Acesso</option>
                                </select>
                            </label>
                            <label className={label}>
                                Prioridade
                                <select
                                    value={prioridade}
                                    onChange={e => setPrioridade(e.target.value)}
                                    className={input}
                                >
                                    <option value="BAIXA">Baixa</option>
                                    <option value="NORMAL">Normal</option>
                                    <option value="ALTA">Alta</option>
                                    <option value="URGENTE">Urgente</option>
                                </select>
                            </label>
                        </div>
                        {erro && (
                            <p
                                role="alert"
                                className="rounded-lg bg-[var(--danger-soft)] p-2.5 text-[10px] text-[var(--danger)]"
                            >
                                {erro}
                            </p>
                        )}
                        <button
                            disabled={criar.isPending}
                            aria-busy={criar.isPending}
                            className="h-10 w-full rounded-lg bg-[var(--accent)] text-xs font-semibold text-white disabled:opacity-50"
                        >
                            {criar.isPending ? "Registrando..." : "Registrar ocorrência"}
                        </button>
                    </form>
                    {criar.isSuccess && (
                        <p
                            role="status"
                            className="ui-feedback-enter mt-3 rounded-lg bg-[var(--success-soft)] px-3 py-2 text-[10px] text-[var(--success)]"
                        >
                            Ocorrência registrada e encaminhada para acompanhamento.
                        </p>
                    )}
                    <p className="mt-3 text-[9px] leading-4 text-[var(--text-muted)]">
                        {isAdmin
                            ? "Você pode acompanhar e atribuir ocorrências a integrantes da equipe."
                            : "Sua ocorrência será encaminhada à administração. Você poderá acompanhar o status por aqui."}
                    </p>
                </section>
                <section className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                            Registros de manutenção
                        </h2>
                        <span className="text-[10px] text-[var(--text-muted)]">
                            {registros.data?.length ?? 0} ocorrência(s)
                        </span>
                    </div>
                    {registros.isLoading && (
                        <LoadingState
                            label="Carregando registros..."
                            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8"
                        />
                    )}
                    {registros.isError && (
                        <p className="rounded-xl bg-[var(--danger-soft)] p-4 text-xs text-[var(--danger)]">
                            Não foi possível carregar as ocorrências.
                        </p>
                    )}
                    {(registros.data ?? []).length === 0 && !registros.isLoading && (
                        <div className="rounded-xl border border-dashed border-[var(--border-strong)] p-10 text-center">
                            <BsWrenchAdjustable className="mx-auto text-2xl text-[var(--text-muted)]" />
                            <p className="mt-3 text-xs text-[var(--text-muted)]">
                                Nenhuma ocorrência registrada.
                            </p>
                        </div>
                    )}
                    {(registros.data ?? []).map(item => {
                        const value = edicoes[item.id] ?? {
                            responsavelUsuarioId: item.responsavelUsuarioId ?? "",
                            status: item.status,
                            prioridade: item.prioridade,
                            resolucao: item.resolucao ?? "",
                        };
                        return (
                            <article
                                key={item.id}
                                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="rounded-md bg-[var(--surface-tertiary)] px-2 py-1 text-[9px] font-semibold text-[var(--text-secondary)]">
                                                {statusNome[item.status] ?? item.status}
                                            </span>
                                            <span className="text-[9px] text-[var(--text-muted)]">
                                                {item.categoria} · {item.prioridade}
                                            </span>
                                        </div>
                                        <h3 className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                                            {item.titulo}
                                        </h3>
                                    </div>
                                    <span className="text-[9px] text-[var(--text-muted)]">
                                        {new Date(item.criadoEm).toLocaleDateString("pt-BR")}
                                    </span>
                                </div>
                                <p className="mt-2 whitespace-pre-wrap text-[11px] leading-5 text-[var(--text-secondary)]">
                                    {item.descricao}
                                </p>
                                <p className="mt-2 text-[9px] text-[var(--text-muted)]">
                                    Aberto por {item.criadoPor}
                                    {item.responsavel
                                        ? ` · Responsável: ${item.responsavel}`
                                        : " · Sem responsável"}
                                </p>
                                {item.resolucao && (
                                    <div className="mt-3 rounded-lg bg-[var(--success-soft)] p-3">
                                        <p className="text-[9px] font-bold uppercase text-[var(--success)]">
                                            Resolução
                                        </p>
                                        <p className="mt-1 whitespace-pre-wrap text-[10px] text-[var(--text-secondary)]">
                                            {item.resolucao}
                                        </p>
                                    </div>
                                )}
                                {isAdmin && (
                                    <div className="mt-4 grid gap-2 border-t border-[var(--border)] pt-3 sm:grid-cols-2">
                                        <label className={label}>
                                            Responsável
                                            <select
                                                value={value.responsavelUsuarioId}
                                                onChange={e =>
                                                    setEdicoes(v => ({
                                                        ...v,
                                                        [item.id]: {
                                                            ...value,
                                                            responsavelUsuarioId: e.target.value,
                                                        },
                                                    }))
                                                }
                                                className={input}
                                            >
                                                <option value="">Não atribuído</option>
                                                {(responsaveis.data ?? []).map(r => (
                                                    <option key={r.id} value={r.id}>
                                                        {r.nome} · {r.tipo}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                        <label className={label}>
                                            Status
                                            <select
                                                value={value.status}
                                                onChange={e =>
                                                    setEdicoes(v => ({
                                                        ...v,
                                                        [item.id]: {
                                                            ...value,
                                                            status: e.target.value,
                                                        },
                                                    }))
                                                }
                                                className={input}
                                            >
                                                <option value="ABERTO">Aberto</option>
                                                <option value="EM_ANALISE">Em análise</option>
                                                <option value="EM_ANDAMENTO">Em andamento</option>
                                                <option value="RESOLVIDO">Resolvido</option>
                                                <option value="CANCELADO">Cancelado</option>
                                            </select>
                                        </label>
                                        <label className={label}>
                                            Prioridade
                                            <select
                                                value={value.prioridade}
                                                onChange={e =>
                                                    setEdicoes(v => ({
                                                        ...v,
                                                        [item.id]: {
                                                            ...value,
                                                            prioridade: e.target.value,
                                                        },
                                                    }))
                                                }
                                                className={input}
                                            >
                                                <option value="BAIXA">Baixa</option>
                                                <option value="NORMAL">Normal</option>
                                                <option value="ALTA">Alta</option>
                                                <option value="URGENTE">Urgente</option>
                                            </select>
                                        </label>
                                        <label className={`${label} sm:col-span-2`}>
                                            Resolução / retorno
                                            <textarea
                                                rows={2}
                                                value={value.resolucao}
                                                onChange={e =>
                                                    setEdicoes(v => ({
                                                        ...v,
                                                        [item.id]: {
                                                            ...value,
                                                            resolucao: e.target.value,
                                                        },
                                                    }))
                                                }
                                                className={`${input} h-auto py-2`}
                                            />
                                        </label>
                                        <div className="flex justify-end sm:col-span-2">
                                            <button
                                                type="button"
                                                disabled={atualizar.isPending}
                                                aria-busy={atualizar.isPending}
                                                onClick={() =>
                                                    atualizar.mutate({
                                                        id: item.id,
                                                        values: {
                                                            responsavelUsuarioId:
                                                                value.responsavelUsuarioId || null,
                                                            status: value.status,
                                                            prioridade: value.prioridade,
                                                            resolucao: value.resolucao,
                                                        },
                                                    })
                                                }
                                                className="h-9 rounded-lg bg-[var(--accent)] px-4 text-[10px] font-semibold text-white disabled:opacity-50"
                                            >
                                                Salvar alterações
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </article>
                        );
                    })}
                </section>
            </div>
        </section>
    );
}
