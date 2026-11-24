import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
    BsCalendar3,
    BsCalendarCheck,
    BsCheck2Circle,
    BsChevronDown,
    BsChevronLeft,
    BsChevronRight,
    BsClockHistory,
    BsExclamationTriangle,
    BsX,
} from "react-icons/bs";
import type { AvaliacaoFisica } from "../types/avaliacao";
import {
    assessmentScheduleService,
    type AgendaAvaliacaoApi,
} from "../service/assessmentScheduleService";

type Props = { alunoId: string; avaliacoes: AvaliacaoFisica[] };
type EventoCalendario = {
    id: string;
    data: string;
    titulo: string;
    tipo: "REALIZADA" | "AGENDADA" | "PENDENTE" | "RECUSADA";
    urgente?: boolean;
    detalhe?: string | null;
};

const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

function chaveData(data: Date) {
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
}

function dataLocal(value: string) {
    const [year, month, day] = value.slice(0, 10).split("-").map(Number);
    return new Date(year, month - 1, day);
}

function dataPt(value?: string | null) {
    if (!value) return "Não definida";
    return dataLocal(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

function dataHoraPt(value?: string | null) {
    if (!value) return "Envio não registrado";
    return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function diasDoMes(mes: Date) {
    const primeiro = new Date(mes.getFullYear(), mes.getMonth(), 1);
    const inicio = new Date(primeiro.getFullYear(), primeiro.getMonth(), 1 - primeiro.getDay());
    return Array.from({ length: 42 }, (_, index) => new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + index));
}

export default function AssessmentScheduleCalendar({ alunoId, avaliacoes }: Props) {
    const queryClient = useQueryClient();
    const hoje = chaveData(new Date());
    const [expandido, setExpandido] = useState(false);
    const [mesVisivel, setMesVisivel] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    const [dataSelecionada, setDataSelecionada] = useState(hoje);
    const [agenda, setAgenda] = useState<AgendaAvaliacaoApi[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [modalAberto, setModalAberto] = useState(false);
    const [dataAgendada, setDataAgendada] = useState(hoje);
    const [descricao, setDescricao] = useState("");
    const [solicitacaoAtual, setSolicitacaoAtual] = useState<string | undefined>();
    const [salvando, setSalvando] = useState(false);

    const carregar = async () => {
        setErro("");
        try {
            setAgenda(await assessmentScheduleService.listar(alunoId));
        } catch (cause) {
            setErro(cause instanceof Error ? cause.message : "Não foi possível carregar a agenda.");
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => {
        let ativo = true;
        assessmentScheduleService.listar(alunoId)
            .then(registros => { if (ativo) setAgenda(registros); })
            .catch(cause => { if (ativo) setErro(cause instanceof Error ? cause.message : "Não foi possível carregar a agenda."); })
            .finally(() => { if (ativo) setCarregando(false); });
        return () => { ativo = false; };
    }, [alunoId]);

    const eventos = useMemo<EventoCalendario[]>(() => [
        ...avaliacoes.filter(item => item.ativo).map(item => ({
            id: `avaliacao-${item.id}`,
            data: item.realizadaEm.slice(0, 10),
            titulo: `Avaliação #${item.numero} realizada`,
            tipo: "REALIZADA" as const,
            detalhe: item.peso ? `Peso registrado: ${item.peso} kg` : "Avaliação física concluída",
        })),
        ...agenda.filter(item => item.status !== "CANCELADA").map(item => ({
            id: item.id,
            data: (item.dataAgendada ?? item.dataDesejada).slice(0, 10),
            titulo: item.status === "AGENDADA" ? "Avaliação agendada" : item.status === "PENDENTE" ? "Solicitação em análise" : "Solicitação recusada",
            tipo: item.status === "AGENDADA" ? "AGENDADA" as const : item.status === "PENDENTE" ? "PENDENTE" as const : "RECUSADA" as const,
            urgente: item.urgente,
            detalhe: item.descricaoAgendamento ?? item.motivo,
        })),
    ], [avaliacoes, agenda]);

    const dias = useMemo(() => diasDoMes(mesVisivel), [mesVisivel]);
    const eventosDoDia = eventos.filter(item => item.data === dataSelecionada);
    const solicitacoesPendentes = agenda
        .filter(item => item.status === "PENDENTE")
        .sort((a, b) => Number(b.urgente) - Number(a.urgente) || (a.dataDesejada ?? "").localeCompare(b.dataDesejada ?? ""));
    const solicitacoesUrgentes = solicitacoesPendentes.filter(item => item.urgente);
    const ultimaAvaliacao = [...avaliacoes].filter(item => item.ativo).sort((a, b) => b.realizadaEm.localeCompare(a.realizadaEm))[0];
    const proximaAvaliacao = agenda
        .filter(item => item.status === "AGENDADA" && item.dataAgendada && item.dataAgendada >= hoje)
        .sort((a, b) => (a.dataAgendada ?? "").localeCompare(b.dataAgendada ?? ""))[0];

    function mudarMes(delta: number) {
        const proximo = new Date(mesVisivel.getFullYear(), mesVisivel.getMonth() + delta, 1);
        setMesVisivel(proximo);
        setDataSelecionada(chaveData(proximo));
    }

    function abrirAgendamento(item?: AgendaAvaliacaoApi) {
        setSolicitacaoAtual(item?.id);
        setDataAgendada(item?.dataDesejada ?? dataSelecionada);
        setDescricao("");
        setModalAberto(true);
    }

    async function salvarAgendamento() {
        if (!dataAgendada || dataAgendada < hoje) {
            window.alert("Escolha hoje ou uma data futura.");
            return;
        }
        setSalvando(true);
        try {
            await assessmentScheduleService.agendar(alunoId, dataAgendada, descricao, solicitacaoAtual);
            setModalAberto(false);
            await carregar();
            await queryClient.invalidateQueries({ queryKey: ["avaliacoes", "solicitacoes", "pendentes"] });
            window.alert("Avaliação agendada. O aluno receberá uma notificação no aplicativo.");
        } catch (cause) {
            window.alert(cause instanceof Error ? cause.message : "Não foi possível agendar a avaliação.");
        } finally {
            setSalvando(false);
        }
    }

    async function recusar(item: AgendaAvaliacaoApi) {
        if (!window.confirm(`Recusar a solicitação de avaliação de ${item.alunoNome}?`)) return;
        try {
            await assessmentScheduleService.recusar(item.id);
            await carregar();
            await queryClient.invalidateQueries({ queryKey: ["avaliacoes", "solicitacoes", "pendentes"] });
        } catch (cause) {
            window.alert(cause instanceof Error ? cause.message : "Não foi possível recusar a solicitação.");
        }
    }

    return (
        <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
            <button
                type="button"
                onClick={() => setExpandido(value => !value)}
                aria-expanded={expandido}
                className="flex w-full items-center justify-between gap-3 p-4 text-left transition hover:bg-[var(--row-hover)]"
            >
                <span className="flex min-w-0 items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-text)]"><BsCalendar3 className="text-lg" /></span>
                    <span className="min-w-0">
                        <strong className="block text-[12px] font-semibold text-[var(--text-primary)]">Agenda de avaliações</strong>
                        <small className="mt-0.5 block text-[10px] text-[var(--text-muted)]">Histórico, solicitações e próximos agendamentos</small>
                    </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                    {solicitacoesPendentes.length > 0 && <span className="flex flex-wrap items-center justify-end gap-1.5"><span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold text-amber-700">{solicitacoesPendentes.length} pendente(s)</span>{solicitacoesUrgentes.length > 0 && <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-[10px] font-bold text-red-700">{solicitacoesUrgentes.length} urgente(s)</span>}</span>}
                    <BsChevronDown className={`transition-transform duration-300 ${expandido ? "rotate-180" : ""}`} />
                </span>
            </button>

            <div className="grid gap-2 px-4 pb-4 sm:grid-cols-2">
                <div className="rounded-xl bg-[var(--surface-secondary)] p-3">
                    <p className="text-[9px] font-bold uppercase tracking-wide text-[var(--text-muted)]">Última atualização da ficha</p>
                    <p className="mt-1 text-[12px] font-semibold text-[var(--text-primary)]">{ultimaAvaliacao ? dataPt(ultimaAvaliacao.realizadaEm) : "Sem avaliação registrada"}</p>
                </div>
                <div className="rounded-xl bg-[var(--surface-secondary)] p-3">
                    <p className="text-[9px] font-bold uppercase tracking-wide text-[var(--text-muted)]">Próxima atualização da ficha</p>
                    <p className="mt-1 text-[12px] font-semibold text-[var(--text-primary)]">{proximaAvaliacao ? dataPt(proximaAvaliacao.dataAgendada) : "Não agendada"}</p>
                </div>
            </div>

            {solicitacoesPendentes.length > 0 && (
                <div className="border-t border-[var(--border)] px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h4 className="text-[12px] font-semibold text-[var(--text-primary)]">Solicitações aguardando análise</h4>
                            <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">Pedidos enviados pelo aluno. Solicitações urgentes aparecem primeiro.</p>
                        </div>
                        <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold text-amber-700">{solicitacoesPendentes.length}</span>
                    </div>
                    <div className="mt-3 space-y-2">
                        {solicitacoesPendentes.map(item => (
                            <article key={item.id} className={`rounded-xl border p-3 ${item.urgente ? "border-[#E8C7B9] bg-[#FCF4EF]" : "border-[var(--border)] bg-[var(--surface-secondary)]"}`}>
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <strong className="text-[11px] font-semibold text-[var(--text-primary)]">Data desejada: {dataPt(item.dataDesejada)}</strong>
                                        {item.urgente && <span className="inline-flex items-center gap-1 rounded-full bg-[#F4DDD4] px-2 py-1 text-[9px] font-bold text-[#A65B45]"><BsExclamationTriangle /> URGENTE</span>}
                                    </div>
                                    <span className="text-[9px] text-[var(--text-muted)]">Enviada em {dataHoraPt(item.enviadaEm)}</span>
                                </div>
                                {item.motivo && <p className="mt-2 text-[11px] leading-5 text-[var(--text-secondary)]">{item.motivo}</p>}
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <button type="button" onClick={() => abrirAgendamento(item)} className="inline-flex h-9 items-center gap-2 rounded-lg bg-[var(--accent)] px-3 text-[10px] font-semibold text-white transition hover:brightness-95"><BsCalendarCheck /> Agendar avaliação</button>
                                    <button type="button" onClick={() => void recusar(item)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--border)] px-3 text-[10px] font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--row-hover)]"><BsX /> Recusar</button>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            )}

            {expandido && (
                <div className="border-t border-[var(--border)] px-4 pb-4 pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between">
                        <button type="button" onClick={() => mudarMes(-1)} aria-label="Mês anterior" className="grid h-9 w-9 place-items-center rounded-full bg-[var(--surface-secondary)] text-[var(--text-secondary)] transition hover:bg-[var(--surface-hover)]"><BsChevronLeft /></button>
                        <div className="text-center"><h4 className="text-[14px] font-semibold text-[var(--text-primary)]">{meses[mesVisivel.getMonth()]}</h4><p className="text-[10px] text-[var(--text-muted)]">{mesVisivel.getFullYear()}</p></div>
                        <button type="button" onClick={() => mudarMes(1)} aria-label="Próximo mês" className="grid h-9 w-9 place-items-center rounded-full bg-[var(--surface-secondary)] text-[var(--text-secondary)] transition hover:bg-[var(--surface-hover)]"><BsChevronRight /></button>
                    </div>
                    <div className="mt-4 grid grid-cols-7 gap-1">
                        {diasSemana.map((dia, index) => <span key={`${dia}-${index}`} className="py-2 text-center text-[9px] font-bold uppercase text-[var(--text-muted)]">{dia}</span>)}
                        {dias.map(day => {
                            const key = chaveData(day);
                            const registros = eventos.filter(evento => evento.data === key);
                            const selecionado = key === dataSelecionada;
                            const mesmoMes = day.getMonth() === mesVisivel.getMonth();
                            return (
                                <button key={key} type="button" onClick={() => setDataSelecionada(key)} className={`flex min-h-[48px] flex-col items-center justify-center rounded-xl border transition ${selecionado ? "border-[var(--accent)] bg-[var(--accent)] text-white" : key === hoje ? "border-[var(--accent)]/50 bg-[var(--accent-soft)] text-[var(--text-primary)]" : "border-transparent hover:bg-[var(--surface-hover)]"} ${!mesmoMes && !selecionado ? "opacity-35" : ""}`}>
                                    <span className="text-[11px] font-semibold">{day.getDate()}</span>
                                    <span className="mt-1 flex h-1 gap-0.5">
                                        {registros.slice(0, 3).map(evento => <span key={evento.id} className={`h-1 w-1 rounded-full ${selecionado ? "bg-white" : evento.tipo === "AGENDADA" ? "bg-[#78935B]" : evento.tipo === "PENDENTE" ? "bg-amber-500" : evento.tipo === "RECUSADA" ? "bg-[#B87564]" : "bg-slate-400"}`} />)}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 text-[9px] text-[var(--text-muted)]">
                        {[{ color: "bg-slate-400", label: "Realizada" }, { color: "bg-[#78935B]", label: "Agendada" }, { color: "bg-amber-500", label: "Em análise" }].map(item => <span key={item.label} className="inline-flex items-center gap-1.5"><span className={`h-1.5 w-1.5 rounded-full ${item.color}`} />{item.label}</span>)}
                    </div>
                    <div className="mt-4 rounded-xl bg-[var(--surface-secondary)] p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <strong className="text-[11px] font-semibold text-[var(--text-primary)]">{dataPt(dataSelecionada)}</strong>
                            <button type="button" onClick={() => abrirAgendamento()} disabled={dataSelecionada < hoje} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[var(--accent)] px-2.5 text-[9px] font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"><BsCalendarCheck /> Agendar nesta data</button>
                        </div>
                        {eventosDoDia.length === 0 ? <p className="py-3 text-[10px] text-[var(--text-muted)]">Nenhum registro nesta data.</p> : (
                            <div className="mt-2 space-y-2">
                                {eventosDoDia.map(evento => <div key={evento.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3"><div className="flex items-center justify-between gap-2"><strong className="text-[10px] text-[var(--text-primary)]">{evento.titulo}</strong>{evento.urgente && <span className="text-[9px] font-bold text-[#A65B45]">URGENTE</span>}</div>{evento.detalhe && <p className="mt-1 text-[10px] leading-4 text-[var(--text-muted)]">{evento.detalhe}</p>}</div>)}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {erro && <button type="button" onClick={() => void carregar()} className="w-full border-t border-[var(--border)] px-4 py-3 text-left text-[10px] text-red-600">{erro} · Clique para tentar novamente.</button>}
            {carregando && <div className="border-t border-[var(--border)] px-4 py-3 text-[10px] text-[var(--text-muted)]"><BsClockHistory className="mr-2 inline" />Carregando agenda...</div>}

            {modalAberto && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4" onMouseDown={event => { if (event.target === event.currentTarget) setModalAberto(false); }}>
                    <section role="dialog" aria-modal="true" aria-labelledby="assessment-schedule-title" className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl">
                        <header className="flex items-start justify-between gap-3">
                            <div><p className="text-[9px] font-bold uppercase tracking-[.15em] text-[var(--accent-text)]">Agenda do aluno</p><h3 id="assessment-schedule-title" className="mt-1 text-[17px] font-semibold text-[var(--text-primary)]">{solicitacaoAtual ? "Analisar e agendar" : "Marcar nova avaliação"}</h3></div>
                            <button type="button" onClick={() => setModalAberto(false)} aria-label="Fechar" className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--surface-secondary)] text-[var(--text-muted)]"><BsX /></button>
                        </header>
                        <p className="mt-2 text-[11px] leading-5 text-[var(--text-muted)]">{solicitacaoAtual ? "Escolha a data confirmada para responder à solicitação do aluno." : "Escolha uma data para adicionar uma avaliação diretamente ao calendário."}</p>
                        <label className="mt-5 block text-[10px] font-semibold text-[var(--text-secondary)]">Data da avaliação</label>
                        <input type="date" min={hoje} value={dataAgendada} onChange={event => setDataAgendada(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] px-3 text-[12px] text-[var(--text-primary)]" />
                        <label className="mt-4 block text-[10px] font-semibold text-[var(--text-secondary)]">Descrição (opcional)</label>
                        <textarea value={descricao} onChange={event => setDescricao(event.target.value)} maxLength={1000} rows={3} placeholder="Orientações ou motivo do agendamento..." className="mt-2 w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] px-3 py-2.5 text-[11px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]" />
                        <div className="mt-5 flex gap-2">
                            <button type="button" onClick={() => setModalAberto(false)} disabled={salvando} className="h-10 flex-1 rounded-lg border border-[var(--border)] text-[10px] font-semibold text-[var(--text-secondary)]">Cancelar</button>
                            <button type="button" onClick={() => void salvarAgendamento()} disabled={salvando || !dataAgendada || dataAgendada < hoje} className="h-10 flex-1 rounded-lg bg-[var(--accent)] text-[10px] font-semibold text-white transition hover:brightness-95 disabled:opacity-50">{salvando ? "Salvando..." : solicitacaoAtual ? "Confirmar agendamento" : "Agendar avaliação"}</button>
                        </div>
                    </section>
                </div>
            )}
        </section>
    );
}
