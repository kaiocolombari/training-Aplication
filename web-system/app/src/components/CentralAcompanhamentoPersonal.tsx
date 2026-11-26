import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    BsActivity,
    BsArrowUpRight,
    BsBell,
    BsCalendar2Check,
    BsCheck2Circle,
    BsClipboard2Pulse,
    BsClockHistory,
    BsExclamationTriangle,
    BsFileEarmarkMedical,
    BsHeartPulse,
    BsListCheck,
    BsPerson,
    BsPersonCheck,
    BsStars,
} from "react-icons/bs";
import { acompanhamentoPersonalService, type PendenciaAcompanhamento } from "../service/acompanhamentoPersonalService";
import { ApiError } from "../service/api";
import { LoadingState } from "./LoadingState";

function dataHora(value?: string | null) {
    if (!value) return "Sem registro";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Data indisponível" : date.toLocaleString("pt-BR", {
        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
    });
}

function duracao(segundos?: number | null) {
    if (segundos == null) return "Não informada";
    if (segundos <= 0) return "0 min";
    const minutos = Math.round(segundos / 60);
    return minutos >= 60 ? `${Math.floor(minutos / 60)}h ${minutos % 60}min` : `${minutos} min`;
}

function prioridadeClass(prioridade: string) {
    if (prioridade === "URGENTE") return "border-rose-500/25 bg-rose-500/10 text-rose-600";
    if (prioridade === "ALTA") return "border-amber-500/25 bg-amber-500/10 text-amber-700";
    return "border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--text-muted)]";
}

function Metric({ label, value, detail, icon, alert = false }: {
    label: string; value: number | null; detail: string; icon: React.ReactNode; alert?: boolean;
}) {
    const hasValue = value !== null && Number.isFinite(value);
    return (
        <article className={`rounded-2xl border p-4 ${alert && hasValue && value > 0 ? "border-amber-500/25 bg-amber-500/[.045]" : "border-[var(--border)] bg-[var(--surface)]"}`}>
            <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-medium text-[var(--text-muted)]">{label}</p>
                <span className={`grid h-8 w-8 place-items-center rounded-xl ${alert && hasValue && value > 0 ? "bg-amber-500/10 text-amber-600" : "bg-[var(--accent-soft)] text-[var(--accent-text)]"}`}>{icon}</span>
            </div>
            <p className={`mt-3 text-3xl font-semibold tracking-[-.06em] ${hasValue ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}>{hasValue ? value : "—"}</p>
            <p className="mt-1 text-[10px] text-[var(--text-muted)]">{detail}</p>
        </article>
    );
}

function Empty({ title, detail }: { title: string; detail: string }) {
    return (
        <div className="rounded-2xl border border-dashed border-[var(--border-strong)] px-5 py-8 text-center">
            <BsCheck2Circle className="mx-auto text-2xl text-[var(--success)]" />
            <p className="mt-2 text-[12px] font-semibold text-[var(--text-primary)]">{title}</p>
            <p className="mt-1 text-[11px] text-[var(--text-muted)]">{detail}</p>
        </div>
    );
}

export default function CentralAcompanhamentoPersonal({
    onAbrirAluno,
    onNavigate,
}: {
    onAbrirAluno: (alunoId: string, destino: "ficha" | "controle") => void;
    onNavigate: (section: string) => void;
}) {
    const queryClient = useQueryClient();
    const painel = useQuery({
        queryKey: ["acompanhamento-personal"],
        queryFn: acompanhamentoPersonalService.obterPainel,
        refetchInterval: 30000,
    });
    const revisar = useMutation({
        mutationFn: (id: string) => acompanhamentoPersonalService.revisarExecucao(id, true),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["acompanhamento-personal"] });
        },
    });

    if (painel.isLoading && !painel.data) return <LoadingState label="Carregando dados recebidos dos alunos..." />;
    if (!painel.data) {
        const acessoNegado = painel.error instanceof ApiError && painel.error.status === 403;
        return (
            <div role="alert" className="rounded-2xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-5 text-[12px] text-[var(--danger)]">
                <p className="font-semibold">{acessoNegado ? "Acesso não autorizado" : "Dados do acompanhamento indisponíveis"}</p>
                <p className="mt-1">{acessoNegado ? "Sua conta não possui permissão para consultar este acompanhamento. Se acredita que isso está incorreto, fale com o administrador." : "Não foi possível consultar a API. Verifique sua conexão e tente novamente. Nenhum indicador foi tratado como zero."}</p>
                <button type="button" disabled={painel.isFetching} onClick={() => void painel.refetch()} className="mt-3 rounded-lg border border-current/20 px-3 py-2 font-semibold disabled:opacity-50">{painel.isFetching ? "Tentando novamente..." : "Tentar novamente"}</button>
            </div>
        );
    }

    const data = painel.data;
    const acessoNegado = painel.error instanceof ApiError && painel.error.status === 403;
    const pendenciasCriticas = data.pendencias.filter(item => item.prioridade === "URGENTE" || item.prioridade === "ALTA");

    const abrirPendencia = (item: PendenciaAcompanhamento) => {
        if (item.tipo === "FEEDBACK") {
            onNavigate("feedback");
            return;
        }
        if (item.alunoId) onAbrirAluno(item.alunoId, "controle");
        else if (item.tipo === "TAREFA_ATRASADA") onNavigate("tarefas");
    };

    return (
        <section className="w-full max-w-[1500px] space-y-6">
            <header className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">
                <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-[var(--accent)] opacity-[.08] blur-3xl" />
                <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                    <div className="max-w-2xl">
                        <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[var(--accent-text)]">Workspace · acompanhamento</p>
                        <h1 className="mt-2 text-2xl font-semibold tracking-[-.05em] text-[var(--text-primary)] sm:text-3xl">Central de acompanhamento</h1>
                        <p className="mt-2 text-[12px] leading-5 text-[var(--text-muted)]">
                            Receba os treinos concluídos, revise o que o aluno executou e transforme sinais importantes em ações de acompanhamento.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => onNavigate("tarefas")} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] px-4 text-[11px] font-semibold text-[var(--text-primary)] hover:bg-[var(--row-hover)]">
                            <BsListCheck /> Agenda de tarefas
                        </button>
                        <button type="button" onClick={() => onNavigate("controleAvancado")} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--accent)] px-4 text-[11px] font-semibold text-white hover:bg-[var(--accent-hover)]">
                            <BsStars /> Análises estatísticas <BsArrowUpRight />
                        </button>
                    </div>
                </div>
                <div className="relative mt-5 flex flex-wrap items-center gap-2 text-[9px] text-[var(--text-muted)]">
                    <span>Atualizado em {dataHora(data.geradoEm)}</span>
                    <span>· atualização automática a cada 30 segundos</span>
                    {painel.isFetching ? <span className="font-semibold text-[var(--accent-text)]">Atualizando…</span> : null}
                </div>
            </header>

            {painel.isError ? (
                <div role="status" className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/25 bg-amber-500/[.07] px-4 py-3 text-[10px] text-amber-800">
                    <span>{acessoNegado ? "A API negou acesso à atualização. Os dados anteriores continuam visíveis; verifique suas permissões." : `Não foi possível atualizar. Exibindo os últimos dados carregados em ${dataHora(data.geradoEm)}.`}</span>
                    <button type="button" onClick={() => void painel.refetch()} disabled={painel.isFetching} className="font-bold underline disabled:opacity-50">Tentar novamente</button>
                </div>
            ) : null}
            {revisar.isError ? (
                <div role="alert" className="rounded-xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] px-4 py-3 text-[10px] text-[var(--danger)]">
                    Não foi possível registrar a revisão. A sessão continua pendente. {revisar.error instanceof Error ? revisar.error.message : "Tente novamente."}
                </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
                <Metric label="Alunos ativos" value={data.alunosAtivos} detail="Na sua carteira" icon={<BsPerson />} />
                <Metric label="Treinos recebidos" value={data.sessoesNosUltimos7Dias} detail="Últimos 7 dias" icon={<BsActivity />} />
                <Metric label="Aguardando revisão" value={data.enviosAguardandoRevisao} detail="Sessões concluídas" icon={<BsClipboard2Pulse />} alert />
                <Metric label="Relatos de dor" value={data.alertasDeDor} detail="Nas sessões carregadas" icon={<BsHeartPulse />} alert />
                <Metric label="Avaliações pendentes" value={data.solicitacoesAvaliacaoPendentes} detail="Solicitadas pelos alunos" icon={<BsCalendar2Check />} alert />
                <Metric label="Feedbacks novos" value={data.feedbacksNovos} detail="Aguardando resposta" icon={<BsBell />} alert />
                <Metric label="Tarefas atrasadas" value={data.tarefasAtrasadas} detail="Prazo vencido" icon={<BsClockHistory />} alert />
            </div>

            <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
                <section className="space-y-3">
                    <div className="flex items-end justify-between gap-3">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[var(--accent-text)]">Inbox de execução</p>
                            <h2 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">Treinos enviados pelos alunos</h2>
                        </div>
                        <span className="text-[10px] text-[var(--text-muted)]">{data.execucoesRecentes.length} registros recentes</span>
                    </div>
                    {data.execucoesRecentes.length ? data.execucoesRecentes.map(execucao => (
                        <article key={execucao.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold uppercase tracking-[.12em] text-[var(--accent-text)]">{execucao.tipoTreino === "cardio" ? "Cardio" : "Força"} · {dataHora(execucao.fim ?? execucao.data)}</p>
                                    <h3 className="mt-1 truncate text-[14px] font-semibold text-[var(--text-primary)]">{execucao.nomeTreino}</h3>
                                    <p className="mt-1 text-[11px] text-[var(--text-muted)]">{execucao.nomeAluno} · {duracao(execucao.duracaoSegundos)}</p>
                                </div>
                                <span className={`rounded-full border px-2.5 py-1 text-[9px] font-semibold ${execucao.aguardandoRevisao ? "border-amber-500/25 bg-amber-500/10 text-amber-700" : "border-[var(--success)]/20 bg-[var(--success-soft)] text-[var(--success)]"}`}>
                                    {execucao.aguardandoRevisao ? "Aguardando revisão" : "Revisado"}
                                </span>
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                {[
                                    ["Adesão", execucao.adesaoPercentual == null ? "—" : `${execucao.adesaoPercentual.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`],
                                    ["Séries", execucao.seriesTotais > 0 ? `${execucao.seriesConcluidas}/${execucao.seriesTotais}` : "Sem registro"],
                                    ["Tonelagem", execucao.tonelagem == null ? "Não calculada" : `${Math.round(execucao.tonelagem).toLocaleString("pt-BR")} kg·rep`],
                                    ["Relatos", String(execucao.relatosDor)],
                                ].map(([label, value]) => (
                                    <div key={label} className="rounded-xl bg-[var(--surface-secondary)] px-3 py-2">
                                        <p className="text-[9px] text-[var(--text-muted)]">{label}</p>
                                        <p className="mt-1 text-[12px] font-semibold text-[var(--text-primary)]">{value}</p>
                                    </div>
                                ))}
                            </div>
                            {(execucao.alertas.length > 0 || execucao.feedbacks.length > 0) && (
                                <div className="mt-3 space-y-2">
                                    {execucao.alertas.map((alerta, index) => (
                                        <p key={index} className="flex items-start gap-2 rounded-xl bg-rose-500/[.07] px-3 py-2 text-[10px] text-rose-700">
                                            <BsExclamationTriangle className="mt-0.5 shrink-0" /> {alerta}
                                        </p>
                                    ))}
                                    {execucao.feedbacks.map((feedback, index) => (
                                        <p key={index} className="rounded-xl bg-[var(--surface-secondary)] px-3 py-2 text-[10px] leading-5 text-[var(--text-secondary)]">{feedback}</p>
                                    ))}
                                </div>
                            )}
                            {execucao.alertas.length === 0 && execucao.feedbacks.length === 0 ? (
                                <p className="mt-3 rounded-xl bg-[var(--surface-secondary)] px-3 py-2 text-[10px] text-[var(--text-muted)]">Nenhum relato de dor ou observação textual foi enviado nesta sessão. Isso não substitui uma confirmação clínica do aluno.</p>
                            ) : null}
                            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] pt-3">
                                <button type="button" onClick={() => onAbrirAluno(execucao.alunoId, "controle")} className="text-[10px] font-semibold text-[var(--accent-text)] hover:underline">Abrir controle de {execucao.nomeAluno}</button>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => onAbrirAluno(execucao.alunoId, "ficha")} className="rounded-lg border border-[var(--border)] px-3 py-2 text-[10px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--row-hover)]"><BsFileEarmarkMedical className="mr-1 inline" />Ficha</button>
                                    {execucao.aguardandoRevisao && (
                                        <button type="button" disabled={revisar.isPending} onClick={() => revisar.mutate(execucao.id)} className="rounded-lg bg-[var(--accent)] px-3 py-2 text-[10px] font-semibold text-white disabled:opacity-50"><BsCheck2Circle className="mr-1 inline" />Marcar revisado</button>
                                    )}
                                </div>
                            </div>
                        </article>
                    )) : <Empty title="Nenhum treino recebido recentemente" detail="Quando os alunos concluírem e sincronizarem sessões pelo aplicativo, elas aparecerão aqui." />}
                </section>

                <aside className="space-y-5">
                    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[.15em] text-[var(--accent-text)]">Fila de trabalho</p>
                                <h2 className="mt-1 text-[15px] font-semibold text-[var(--text-primary)]">Pendências e alertas</h2>
                            </div>
                            <BsBell className="text-lg text-[var(--text-muted)]" />
                        </div>
                        {data.pendencias.length ? (
                            <div className="mt-4 space-y-2">
                                {data.pendencias.slice(0, 12).map((item, index) => (
                                    <button key={`${item.tipo}-${item.referenciaId ?? index}`} type="button" onClick={() => abrirPendencia(item)} className="w-full rounded-xl border border-[var(--border)] p-3 text-left transition hover:bg-[var(--row-hover)]">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-[11px] font-semibold text-[var(--text-primary)]">{item.titulo}</p>
                                            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[8px] font-bold ${prioridadeClass(item.prioridade)}`}>{item.prioridade}</span>
                                        </div>
                                        <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-[var(--text-muted)]">{item.nomeAluno ? `${item.nomeAluno} · ` : ""}{item.descricao}</p>
                                        <p className="mt-2 text-[9px] text-[var(--text-muted)]">{dataHora(item.criadaEm)}</p>
                                    </button>
                                ))}
                            </div>
                        ) : <div className="mt-4"><Empty title="Fila em dia" detail="Nenhuma pendência operacional foi encontrada." /></div>}
                        {pendenciasCriticas.length > 0 && <p className="mt-3 text-[9px] text-[var(--text-muted)]">{pendenciasCriticas.length} itens com prioridade alta ou urgente.</p>}
                    </section>

                    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
                        <p className="text-[10px] font-bold uppercase tracking-[.15em] text-[var(--accent-text)]">Carteira</p>
                        <h2 className="mt-1 text-[15px] font-semibold text-[var(--text-primary)]">Alunos para acompanhar</h2>
                        <div className="mt-3 space-y-2">
                            {data.alunos.slice(0, 10).map(aluno => (
                                <div key={aluno.alunoId} className="rounded-xl border border-[var(--border)] p-3">
                                    <div className="flex items-start gap-2">
                                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-text)]"><BsPersonCheck /></span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-[11px] font-semibold text-[var(--text-primary)]">{aluno.nomeCompleto}</p>
                                        <p className="truncate text-[9px] text-[var(--text-muted)]">{aluno.email || "E-mail não informado"}</p>
                                        </div>
                                        {aluno.alertasDeDor > 0 && <span title="Há relatos de dor" className="text-rose-600"><BsHeartPulse /></span>}
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                        <span className="rounded-md bg-[var(--surface-secondary)] px-2 py-1 text-[8px] text-[var(--text-muted)]">{aluno.sessoesNosUltimos7Dias} sessões/7d</span>
                                        <span className="rounded-md bg-[var(--surface-secondary)] px-2 py-1 text-[8px] text-[var(--text-muted)]">{aluno.treinosAtivos} treinos ativos</span>
                                        {aluno.enviosAguardandoRevisao > 0 && <span className="rounded-md bg-amber-500/10 px-2 py-1 text-[8px] text-amber-700">{aluno.enviosAguardandoRevisao} para revisar</span>}
                                        {!aluno.possuiFichaTecnica && <span className="rounded-md bg-rose-500/10 px-2 py-1 text-[8px] text-rose-700">Ficha incompleta</span>}
                                    </div>
                                    <p className="mt-2 text-[9px] text-[var(--text-muted)]">Última execução: {dataHora(aluno.ultimaExecucaoEm)}</p>
                                    <div className="mt-3 flex gap-2">
                                        <button type="button" onClick={() => onAbrirAluno(aluno.alunoId, "controle")} className="flex-1 rounded-lg bg-[var(--accent)] px-2 py-2 text-[9px] font-semibold text-white">Controle</button>
                                        <button type="button" onClick={() => onAbrirAluno(aluno.alunoId, "ficha")} className="flex-1 rounded-lg border border-[var(--border)] px-2 py-2 text-[9px] font-semibold text-[var(--text-secondary)]">Ficha técnica</button>
                                    </div>
                                </div>
                            ))}
                            {!data.alunos.length && <Empty title="Carteira vazia" detail="Os alunos vinculados aparecerão aqui." />}
                        </div>
                    </section>
                    <section className="rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent-soft)] p-4">
                        <div className="flex items-center gap-2 text-[var(--accent-text)]"><BsStars /><p className="text-[11px] font-semibold">Preparado para inteligência assistiva</p></div>
                        <p className="mt-2 text-[10px] leading-5 text-[var(--text-secondary)]">
                            A central já organiza dados estruturados, histórico e sinais explícitos. Uma futura camada de IA poderá sugerir revisões e perguntas, sempre com explicação da evidência e aprovação do personal antes de alterar uma ficha.
                        </p>
                    </section>
                </aside>
            </div>
        </section>
    );
}
