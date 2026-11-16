import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    BsCheck2Circle,
    BsClipboardCheck,
    BsClockHistory,
    BsPlusLg,
    BsSliders,
} from "react-icons/bs";
import { useAuth } from "../context/authContext";
import {
    adminExtrasService,
    type ConfiguracaoAcompanhamento,
    type TarefaPersonal,
} from "../service/adminExtrasService";
import { LoadingState } from "../components/LoadingState";

const dataCurta = (valor?: string | null) =>
    valor
        ? new Intl.DateTimeFormat("pt-BR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
          }).format(new Date(valor))
        : "Sem prazo";
const statusLabel: Record<string, string> = {
    PENDENTE: "Pendente",
    EM_ANDAMENTO: "Em andamento",
    CONCLUIDA: "Concluída",
    CANCELADA: "Cancelada",
};
const prioridadeClass: Record<string, string> = {
    BAIXA: "text-[var(--text-muted)]",
    NORMAL: "text-[var(--text-secondary)]",
    ALTA: "text-amber-600",
    URGENTE: "text-[var(--danger)]",
};

export default function TarefasPersonal() {
    const { user } = useAuth();
    const isAdmin = user?.tipo === "ADMIN";
    const queryClient = useQueryClient();
    const [personalId, setPersonalId] = useState("");
    const [titulo, setTitulo] = useState("");
    const [descricao, setDescricao] = useState("");
    const [dica, setDica] = useState("");
    const [alunoId, setAlunoId] = useState("");
    const [categoria, setCategoria] = useState("GERAL");
    const [prioridade, setPrioridade] = useState("NORMAL");
    const [dataLimite, setDataLimite] = useState("");
    const [erro, setErro] = useState("");
    const [config, setConfig] = useState<ConfiguracaoAcompanhamento>({
        intervaloReavaliacaoDias: 90,
        intervaloRevisaoTreinoDias: 60,
        antecedenciaSugestaoDias: 7,
    });

    const personais = useQuery({
        queryKey: ["extras", "personais"],
        queryFn: adminExtrasService.personais,
        enabled: isAdmin,
    });
    useEffect(() => {
        if (isAdmin && !personalId && personais.data?.length) setPersonalId(personais.data[0].id);
    }, [isAdmin, personalId, personais.data]);
    const tarefas = useQuery({
        queryKey: ["extras", "tarefas", isAdmin ? personalId : "proprias"],
        queryFn: () => adminExtrasService.listarTarefas(isAdmin ? personalId : undefined),
        enabled: !isAdmin || Boolean(personalId),
        refetchInterval: 30000,
    });
    const alunos = useQuery({
        queryKey: ["extras", "tarefas-alunos", isAdmin ? personalId : "proprios"],
        queryFn: () => adminExtrasService.alunosDoPersonal(isAdmin ? personalId : undefined),
        enabled: !isAdmin || Boolean(personalId),
    });
    const configuracao = useQuery({
        queryKey: ["extras", "tarefas-config", isAdmin ? personalId : "propria"],
        queryFn: () => adminExtrasService.obterConfiguracao(isAdmin ? personalId : undefined),
        enabled: !isAdmin || Boolean(personalId),
    });
    useEffect(() => {
        if (configuracao.data) setConfig(configuracao.data);
    }, [configuracao.data]);

    const invalidar = () => queryClient.invalidateQueries({ queryKey: ["extras", "tarefas"] });
    const criar = useMutation({
        mutationFn: adminExtrasService.criarTarefa,
        onSuccess: async () => {
            setTitulo("");
            setDescricao("");
            setDica("");
            setAlunoId("");
            setDataLimite("");
            setErro("");
            await invalidar();
        },
        onError: (error: Error) => setErro(error.message),
    });
    const atualizar = useMutation({
        mutationFn: ({ tarefa, status }: { tarefa: TarefaPersonal; status: string }) =>
            adminExtrasService.atualizarTarefa(tarefa.id, {
                titulo: tarefa.titulo,
                descricao: tarefa.descricao,
                dicaContexto: tarefa.dicaContexto ?? undefined,
                categoria: tarefa.categoria,
                prioridade: tarefa.prioridade,
                status,
                dataLimite: tarefa.dataLimite,
            }),
        onSuccess: invalidar,
        onError: (error: Error) => setErro(error.message),
    });
    const salvarConfig = useMutation({
        mutationFn: adminExtrasService.salvarConfiguracao,
        onSuccess: async data => {
            setConfig(data);
            await queryClient.invalidateQueries({ queryKey: ["extras", "tarefas-config"] });
        },
        onError: (error: Error) => setErro(error.message),
    });
    const resumo = useMemo(() => {
        const lista = tarefas.data ?? [];
        return {
            abertas: lista.filter(t => t.status === "PENDENTE" || t.status === "EM_ANDAMENTO")
                .length,
            concluidas: lista.filter(t => t.status === "CONCLUIDA").length,
            atrasadas: lista.filter(
                t =>
                    t.status !== "CONCLUIDA" &&
                    t.status !== "CANCELADA" &&
                    t.dataLimite &&
                    new Date(t.dataLimite).getTime() < Date.now(),
            ).length,
        };
    }, [tarefas.data]);
    const input =
        "h-10 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--input-bg)] px-3 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]";
    const label = "grid gap-1.5 text-[10px] font-semibold text-[var(--text-secondary)]";

    return (
        <section className="mx-auto w-full max-w-[1440px] space-y-6">
            <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--border)] pb-6">
                <div>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-[var(--accent-text)]">
                        Acompanhamento / Organização
                    </p>
                    <h1 className="text-[28px] font-semibold tracking-[-.045em] text-[var(--text-primary)]">
                        Agenda de tarefas
                    </h1>
                    <p className="mt-1.5 max-w-2xl text-[12px] leading-5 text-[var(--text-secondary)]">
                        Uma agenda privada para cada personal, com tarefas administrativas e
                        acompanhamento de alunos.
                    </p>
                </div>
                {isAdmin && (
                    <label className="grid min-w-56 gap-1 text-[10px] font-semibold text-[var(--text-secondary)]">
                        Agenda do profissional
                        <select
                            value={personalId}
                            onChange={e => setPersonalId(e.target.value)}
                            className={input}
                        >
                            <option value="">Selecione</option>
                            {(personais.data ?? []).map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.nome}
                                </option>
                            ))}
                        </select>
                    </label>
                )}
            </header>
            <div className="grid gap-3 sm:grid-cols-3">
                {[
                    {
                        label: "Tarefas em aberto",
                        value: resumo.abertas,
                        icon: <BsClipboardCheck />,
                        tone: "text-[var(--accent)]",
                    },
                    {
                        label: "Concluídas",
                        value: resumo.concluidas,
                        icon: <BsCheck2Circle />,
                        tone: "text-[var(--success)]",
                    },
                    {
                        label: "Atrasadas",
                        value: resumo.atrasadas,
                        icon: <BsClockHistory />,
                        tone: "text-amber-600",
                    },
                ].map(item => (
                    <article
                        key={item.label}
                        className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
                    >
                        <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                            <span>{item.label}</span>
                            <span className={item.tone}>{item.icon}</span>
                        </div>
                        <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                            {item.value}
                        </p>
                    </article>
                ))}
            </div>
            <div className="grid items-start gap-5 xl:grid-cols-[minmax(300px,.85fr)_minmax(0,1.4fr)]">
                <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                    <div className="mb-4 flex items-center gap-2">
                        <BsPlusLg className="text-[var(--accent)]" />
                        <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                            Nova tarefa
                        </h2>
                    </div>
                    <form
                        className="space-y-3"
                        onSubmit={e => {
                            e.preventDefault();
                            setErro("");
                            criar.mutate({
                                personalId: isAdmin ? personalId : undefined,
                                alunoId: alunoId || undefined,
                                titulo,
                                descricao,
                                dicaContexto: dica || undefined,
                                categoria,
                                prioridade,
                                dataLimite: dataLimite
                                    ? new Date(`${dataLimite}T23:59:59`).toISOString()
                                    : undefined,
                            });
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
                                placeholder="Ex.: Revisar treino do aluno"
                                className={input}
                            />
                        </label>
                        <label className={label}>
                            Descrição
                            <textarea
                                required
                                value={descricao}
                                onChange={e => setDescricao(e.target.value)}
                                maxLength={3000}
                                rows={3}
                                placeholder="Descreva o que precisa ser feito..."
                                className={`${input} h-auto py-2.5`}
                            />
                        </label>
                        <label className={label}>
                            Aluno relacionado (opcional)
                            <select
                                value={alunoId}
                                onChange={e => setAlunoId(e.target.value)}
                                className={input}
                            >
                                <option value="">Tarefa geral, sem aluno</option>
                                {(alunos.data ?? []).map(a => (
                                    <option key={a.alunoId} value={a.alunoId}>
                                        {a.nome}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className={label}>
                            Dica / contexto
                            <textarea
                                value={dica}
                                onChange={e => setDica(e.target.value)}
                                maxLength={1500}
                                rows={2}
                                placeholder="Ex.: relatou dor no ombro; revisar com atenção..."
                                className={`${input} h-auto py-2.5`}
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
                                    <option value="GERAL">Geral</option>
                                    <option value="TREINO">Treino</option>
                                    <option value="AVALIACAO">Avaliação</option>
                                    <option value="ALUNO">Aluno</option>
                                    <option value="ADMINISTRATIVO">Administrativo</option>
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
                        <label className={label}>
                            Prazo
                            <input
                                type="date"
                                value={dataLimite}
                                onChange={e => setDataLimite(e.target.value)}
                                className={input}
                            />
                        </label>
                        {erro && (
                            <p
                                role="alert"
                                className="rounded-lg bg-[var(--danger-soft)] p-2.5 text-[10px] text-[var(--danger)]"
                            >
                                {erro}
                            </p>
                        )}
                        <button
                            disabled={criar.isPending || (isAdmin && !personalId)}
                            aria-busy={criar.isPending}
                            className="h-10 w-full rounded-lg bg-[var(--accent)] text-xs font-semibold text-white disabled:opacity-50"
                        >
                            {criar.isPending
                                ? "Salvando..."
                                : isAdmin
                                  ? "Atribuir tarefa ao personal"
                                  : "Adicionar à minha agenda"}
                        </button>
                    </form>
                    {criar.isSuccess && (
                        <p
                            role="status"
                            className="ui-feedback-enter rounded-lg bg-[var(--success-soft)] px-3 py-2 text-[10px] text-[var(--success)]"
                        >
                            Tarefa adicionada à agenda.
                        </p>
                    )}
                </section>
                <section className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                            Tarefas da agenda
                        </h2>
                        <span className="text-[10px] text-[var(--text-muted)]">
                            {tarefas.data?.length ?? 0} registro(s)
                        </span>
                    </div>
                    {tarefas.isLoading && (
                        <LoadingState
                            label="Carregando agenda..."
                            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8"
                        />
                    )}
                    {tarefas.isError && (
                        <p
                            role="alert"
                            className="rounded-xl bg-[var(--danger-soft)] p-4 text-xs text-[var(--danger)]"
                        >
                            Não foi possível carregar as tarefas.
                        </p>
                    )}
                    {(tarefas.data ?? []).length === 0 && !tarefas.isLoading && (
                        <div className="rounded-xl border border-dashed border-[var(--border-strong)] p-10 text-center text-xs text-[var(--text-muted)]">
                            Nenhuma tarefa cadastrada nesta agenda.
                        </div>
                    )}
                    <div className="ui-stagger space-y-3">
                        {(tarefas.data ?? []).map(tarefa => (
                            <article
                                key={tarefa.id}
                                className="ui-card rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="rounded-md bg-[var(--surface-tertiary)] px-2 py-1 text-[9px] font-semibold text-[var(--text-secondary)]">
                                                {statusLabel[tarefa.status]}
                                            </span>
                                            <span
                                                className={`text-[9px] font-bold ${prioridadeClass[tarefa.prioridade]}`}
                                            >
                                                {tarefa.prioridade}
                                            </span>
                                            <span className="text-[9px] text-[var(--text-muted)]">
                                                {tarefa.categoria}
                                            </span>
                                        </div>
                                        <h3 className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                                            {tarefa.titulo}
                                        </h3>
                                        <p className="mt-1 whitespace-pre-wrap text-[11px] leading-5 text-[var(--text-secondary)]">
                                            {tarefa.descricao}
                                        </p>
                                    </div>
                                    <span className="shrink-0 text-[10px] text-[var(--text-muted)]">
                                        {dataCurta(tarefa.dataLimite)}
                                    </span>
                                </div>
                                {tarefa.alunoNome && (
                                    <p className="mt-3 text-[10px] font-semibold text-[var(--accent-text)]">
                                        Aluno: {tarefa.alunoNome}
                                    </p>
                                )}
                                {tarefa.dicaContexto && (
                                    <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                                        <p className="text-[9px] font-bold uppercase tracking-wide text-amber-700">
                                            Contexto / atenção
                                        </p>
                                        <p className="mt-1 whitespace-pre-wrap text-[10px] leading-4 text-[var(--text-secondary)]">
                                            {tarefa.dicaContexto}
                                        </p>
                                    </div>
                                )}
                                {isAdmin && (
                                    <p className="mt-2 text-[9px] text-[var(--text-muted)]">
                                        Responsável: {tarefa.personalNome} · Criada por:{" "}
                                        {tarefa.criadoPor}
                                    </p>
                                )}
                                {tarefa.status !== "CONCLUIDA" && tarefa.status !== "CANCELADA" && (
                                    <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--border)] pt-3">
                                        {tarefa.status === "PENDENTE" && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    atualizar.mutate({
                                                        tarefa,
                                                        status: "EM_ANDAMENTO",
                                                    })
                                                }
                                                className="rounded-lg border border-[var(--border)] px-3 py-2 text-[10px] font-semibold text-[var(--text-secondary)]"
                                            >
                                                Iniciar
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                atualizar.mutate({ tarefa, status: "CONCLUIDA" })
                                            }
                                            className="rounded-lg bg-[var(--success-soft)] px-3 py-2 text-[10px] font-semibold text-[var(--success)]"
                                        >
                                            Concluir tarefa
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                atualizar.mutate({ tarefa, status: "CANCELADA" })
                                            }
                                            className="rounded-lg px-3 py-2 text-[10px] font-semibold text-[var(--text-muted)] hover:bg-[var(--row-hover)]"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                )}
                            </article>
                        ))}
                    </div>
                </section>
            </div>
            <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
                <div className="flex items-start gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                        <BsSliders />
                    </span>
                    <div>
                        <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                            Parâmetros de acompanhamento
                        </h2>
                        <p className="mt-1 max-w-3xl text-[10px] leading-5 text-[var(--text-muted)]">
                            Configure os intervalos de referência desta agenda. Nesta versão, são
                            apenas parâmetros salvos: nenhuma tarefa é gerada automaticamente. No
                            futuro, o mecanismo inteligente poderá usar estes valores para sugerir
                            revisões de treino e novas avaliações.
                        </p>
                    </div>
                </div>
                <form
                    className="mt-5 grid gap-3 sm:grid-cols-3"
                    onSubmit={e => {
                        e.preventDefault();
                        setErro("");
                        salvarConfig.mutate({
                            ...config,
                            personalId: isAdmin ? personalId : undefined,
                        });
                    }}
                >
                    <label className={label}>
                        Intervalo entre reavaliações (dias)
                        <input
                            type="number"
                            min={7}
                            max={730}
                            value={config.intervaloReavaliacaoDias}
                            onChange={e =>
                                setConfig(c => ({
                                    ...c,
                                    intervaloReavaliacaoDias: Number(e.target.value),
                                }))
                            }
                            className={input}
                        />
                    </label>
                    <label className={label}>
                        Intervalo para revisar treino (dias)
                        <input
                            type="number"
                            min={7}
                            max={365}
                            value={config.intervaloRevisaoTreinoDias}
                            onChange={e =>
                                setConfig(c => ({
                                    ...c,
                                    intervaloRevisaoTreinoDias: Number(e.target.value),
                                }))
                            }
                            className={input}
                        />
                    </label>
                    <label className={label}>
                        Antecedência da futura sugestão (dias)
                        <input
                            type="number"
                            min={0}
                            max={90}
                            value={config.antecedenciaSugestaoDias}
                            onChange={e =>
                                setConfig(c => ({
                                    ...c,
                                    antecedenciaSugestaoDias: Number(e.target.value),
                                }))
                            }
                            className={input}
                        />
                    </label>
                    <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-3">
                        <p className="text-[9px] text-[var(--text-muted)]">
                            Configuração individual do personal · salva no servidor
                        </p>
                        <button
                            disabled={salvarConfig.isPending || (isAdmin && !personalId)}
                            aria-busy={salvarConfig.isPending}
                            className="h-9 rounded-lg border border-[var(--border-strong)] px-4 text-[10px] font-semibold text-[var(--text-secondary)] disabled:opacity-50"
                        >
                            {salvarConfig.isPending ? "Salvando..." : "Salvar parâmetros"}
                        </button>
                    </div>
                </form>
            </section>
        </section>
    );
}
