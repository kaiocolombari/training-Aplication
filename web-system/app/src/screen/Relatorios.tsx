import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { BsBarChart, BsClipboard2Pulse, BsPeople, BsPersonPlus, BsActivity, BsFileEarmarkText } from "react-icons/bs";
import { relatoriosService } from "../service/relatoriosService";
import { useAuth } from "../context/authContext";

const hojeISO = () => new Date().toISOString().slice(0, 10);
const inicioPadrao = () => {
    const data = new Date();
    data.setDate(data.getDate() - 29);
    return data.toISOString().slice(0, 10);
};

export default function Relatorios() {
    const { user } = useAuth();
    const [inicio, setInicio] = useState(inicioPadrao);
    const [fim, setFim] = useState(hojeISO);
    const relatorio = useQuery({
        queryKey: ["relatorios", inicio, fim],
        queryFn: () => relatoriosService.obter(inicio, fim),
        enabled: Boolean(inicio && fim && inicio <= fim),
    });
    const dados = relatorio.data;
    const maximo = Math.max(1, ...(dados?.evolucaoMensal ?? []).flatMap(item => [item.alunosNovos, item.avaliacoesCriadas, item.treinosCriados, item.execucoes]));

    const indicadores = [
        { titulo: user?.tipo === "ADMIN" ? "Alunos cadastrados" : "Alunos na carteira", valor: dados?.totalAlunos, descricao: user?.tipo === "ADMIN" ? "Contas aprovadas no sistema" : "Alunos com vínculo ativo", icone: <BsPeople />, tom: "accent" },
        { titulo: "Sem ficha técnica", valor: dados?.alunosSemFichaTecnica, descricao: "Precisam iniciar o preenchimento", icone: <BsFileEarmarkText />, tom: "warning" },
        { titulo: "Fichas cadastradas", valor: dados?.alunosComFichaTecnica, descricao: "Com avaliação, anamnese ou treino", icone: <BsClipboard2Pulse />, tom: "success" },
        { titulo: "Em análise", valor: dados?.cadastrosEmAnalise, descricao: `${dados?.cadastrosAguardandoFormulario ?? 0} aguardando formulário`, icone: <BsPersonPlus />, tom: "info" },
        { titulo: "Treinos ativos", valor: dados?.treinosAtivos, descricao: "Prescrições ativas", icone: <BsActivity />, tom: "accent" },
        { titulo: "Avaliações ativas", valor: dados?.avaliacoesAtivas, descricao: "Avaliações físicas registradas", icone: <BsBarChart />, tom: "accent" },
    ] as const;

    return (
        <section className="mx-auto w-full max-w-[1440px] space-y-6">
            <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--border)] pb-6">
                <div>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-[var(--accent-text)]">Treinamento / Indicadores</p>
                    <h1 className="text-[28px] font-semibold tracking-[-.045em] text-[var(--text-primary)]">Relatórios</h1>
                    <p className="mt-1.5 max-w-2xl text-[12px] leading-5 text-[var(--text-secondary)]">Acompanhe a situação da carteira, o preenchimento das fichas e a evolução operacional da equipe.</p>
                </div>
                <div className="grid grid-cols-2 gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 sm:flex sm:items-end">
                    <label className="grid gap-1 text-[9px] font-semibold text-[var(--text-muted)]">De<input type="date" value={inicio} max={fim || undefined} onChange={event => setInicio(event.target.value)} className="h-9 rounded-lg border border-[var(--border-strong)] bg-[var(--input-bg)] px-2 text-[11px] text-[var(--text-primary)]" /></label>
                    <label className="grid gap-1 text-[9px] font-semibold text-[var(--text-muted)]">Até<input type="date" value={fim} min={inicio || undefined} onChange={event => setFim(event.target.value)} className="h-9 rounded-lg border border-[var(--border-strong)] bg-[var(--input-bg)] px-2 text-[11px] text-[var(--text-primary)]" /></label>
                </div>
            </header>

            {inicio && fim && inicio > fim && <p role="alert" className="rounded-lg bg-[var(--danger-soft)] p-3 text-xs text-[var(--danger)]">A data inicial não pode ser posterior à data final.</p>}
            {relatorio.isLoading && <p className="py-10 text-center text-xs text-[var(--text-muted)]">Consolidando indicadores...</p>}
            {relatorio.isError && <p role="alert" className="rounded-xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-4 text-xs text-[var(--danger)]">Não foi possível carregar os relatórios.</p>}

            {dados && <>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {indicadores.map(item => <article key={item.titulo} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                        <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-medium text-[var(--text-muted)]">{item.titulo}</p><p className="mt-1 text-[26px] font-semibold tracking-[-.05em] text-[var(--text-primary)]">{item.valor ?? "—"}</p></div><span className={`grid h-10 w-10 place-items-center rounded-xl ${item.tom === "warning" ? "bg-amber-500/10 text-amber-600" : item.tom === "success" ? "bg-[var(--success-soft)] text-[var(--success)]" : item.tom === "info" ? "bg-sky-500/10 text-sky-600" : "bg-[var(--accent-soft)] text-[var(--accent)]"}`}>{item.icone}</span></div>
                        <p className="mt-2 text-[10px] text-[var(--text-muted)]">{item.descricao}</p>
                    </article>)}
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,.8fr)]">
                    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
                        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-sm font-semibold text-[var(--text-primary)]">Evolução operacional</h2><p className="mt-1 text-[10px] text-[var(--text-muted)]">Últimos seis meses</p></div><span className="rounded-md bg-[var(--surface-tertiary)] px-2 py-1 text-[9px] font-semibold text-[var(--text-secondary)]">Série mensal</span></div>
                        <div className="mt-6 grid grid-cols-6 gap-2 sm:gap-4">
                            {(dados.evolucaoMensal ?? []).map(item => <div key={item.mes} className="flex min-w-0 flex-col items-center gap-2">
                                <div className="flex h-36 w-full items-end justify-center gap-0.5 sm:gap-1">
                                    {[{ valor: item.alunosNovos, cor: "bg-[var(--accent)]", label: "Alunos" }, { valor: item.avaliacoesCriadas, cor: "bg-sky-500", label: "Avaliações" }, { valor: item.treinosCriados, cor: "bg-amber-500", label: "Treinos" }, { valor: item.execucoes, cor: "bg-emerald-500", label: "Execuções" }].map(barra => <div key={barra.label} title={`${barra.label}: ${barra.valor}`} className={`w-full max-w-5 rounded-t-sm ${barra.cor} opacity-90`} style={{ height: `${barra.valor === 0 ? 2 : Math.max(5, barra.valor / maximo * 100)}%` }} />)}
                                </div>
                                <span className="truncate text-[9px] text-[var(--text-muted)]">{item.mes}</span>
                            </div>)}
                        </div>
                        <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 border-t border-[var(--border)] pt-4">
                            {[{ label: "Alunos", cor: "bg-[var(--accent)]" }, { label: "Avaliações", cor: "bg-sky-500" }, { label: "Treinos", cor: "bg-amber-500" }, { label: "Execuções", cor: "bg-emerald-500" }].map(item => <span key={item.label} className="inline-flex items-center gap-1.5 text-[9px] text-[var(--text-secondary)]"><span className={`h-2 w-2 rounded-sm ${item.cor}`} />{item.label}</span>)}
                        </div>
                    </section>

                    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
                        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Atividade no período</h2>
                        <p className="mt-1 text-[10px] text-[var(--text-muted)]">{new Date(`${dados.inicio}T12:00:00`).toLocaleDateString("pt-BR")} até {new Date(`${dados.fim}T12:00:00`).toLocaleDateString("pt-BR")}</p>
                        <div className="mt-5 space-y-4">
                            <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-3"><span className="text-[11px] text-[var(--text-secondary)]">Novos alunos</span><strong className="text-lg text-[var(--text-primary)]">{dados.alunosNovosNoPeriodo}</strong></div>
                            <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-3"><span className="text-[11px] text-[var(--text-secondary)]">Execuções registradas</span><strong className="text-lg text-[var(--text-primary)]">{dados.execucoesNoPeriodo}</strong></div>
                            <div className="flex items-center justify-between gap-3"><span className="text-[11px] text-[var(--text-secondary)]">Alunos sem ficha técnica</span><strong className="text-lg text-amber-600">{dados.alunosSemFichaTecnica}</strong></div>
                        </div>
                    </section>
                </div>
                <p className="text-[10px] leading-5 text-[var(--text-muted)]">Os indicadores de alunos, avaliações e treinos respeitam os vínculos ativos do usuário. Cadastros em análise representam solicitações pendentes da equipe e podem ainda estar aguardando o formulário inicial.</p>
            </>}
        </section>
    );
}
