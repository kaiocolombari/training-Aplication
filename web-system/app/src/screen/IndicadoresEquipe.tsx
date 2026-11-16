import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BsActivity, BsClipboard2Check, BsPeople, BsStar } from "react-icons/bs";
import { adminExtrasService } from "../service/adminExtrasService";

const hoje = new Date();
const isoDia = (data: Date) => `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
const inicioPadrao = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - 29);

export default function IndicadoresEquipe() {
    const [inicio, setInicio] = useState(isoDia(inicioPadrao));
    const [fim, setFim] = useState(isoDia(hoje));
    const indicadores = useQuery({ queryKey: ["extras", "indicadores-equipe", inicio, fim], queryFn: () => adminExtrasService.indicadoresEquipe(inicio, fim), enabled: Boolean(inicio && fim && inicio <= fim) });
    const lista = indicadores.data?.personais ?? [];
    const total = lista.reduce((acc, item) => ({ alunos: acc.alunos + item.alunosAtivos, treinos: acc.treinos + item.treinosAtivos, avaliacoes: acc.avaliacoes + item.avaliacoesNoPeriodo, tarefas: acc.tarefas + item.tarefasAbertas, feedbacks: acc.feedbacks + item.feedbacksRecebidos }), { alunos: 0, treinos: 0, avaliacoes: 0, tarefas: 0, feedbacks: 0 });
    const cards = [
        { label: "Vínculos ativos", value: total.alunos, icon: <BsPeople /> },
        { label: "Treinos nas carteiras", value: total.treinos, icon: <BsActivity /> },
        { label: "Avaliações no período", value: total.avaliacoes, icon: <BsClipboard2Check /> },
        { label: "Feedbacks recebidos", value: total.feedbacks, icon: <BsStar /> },
    ];

    return <section className="mx-auto w-full max-w-[1440px] space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--border)] pb-6"><div><p className="mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-[var(--accent-text)]">Workspace / Gestão</p><h1 className="text-[28px] font-semibold tracking-[-.045em] text-[var(--text-primary)]">Indicadores da equipe</h1><p className="mt-1.5 max-w-2xl text-[12px] leading-5 text-[var(--text-secondary)]">Visão consolidada da carteira, produção e acompanhamento de cada profissional.</p></div><div className="grid grid-cols-2 gap-2"><label className="grid gap-1 text-[9px] font-semibold text-[var(--text-muted)]">De<input type="date" value={inicio} max={fim} onChange={e => setInicio(e.target.value)} className="h-9 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-2 text-[10px] text-[var(--text-primary)]" /></label><label className="grid gap-1 text-[9px] font-semibold text-[var(--text-muted)]">Até<input type="date" value={fim} min={inicio} max={isoDia(hoje)} onChange={e => setFim(e.target.value)} className="h-9 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-2 text-[10px] text-[var(--text-primary)]" /></label></div></header>
        {indicadores.isLoading && <p className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center text-xs text-[var(--text-muted)]">Calculando indicadores...</p>}
        {indicadores.isError && <p role="alert" className="rounded-xl bg-[var(--danger-soft)] p-4 text-xs text-[var(--danger)]">Não foi possível consultar os indicadores. Verifique o período e tente novamente.</p>}
        {indicadores.data && <>
            <p className="text-[10px] text-[var(--text-muted)]">Período analisado: {new Date(`${indicadores.data.inicio}T12:00:00`).toLocaleDateString("pt-BR")} a {new Date(`${indicadores.data.fim}T12:00:00`).toLocaleDateString("pt-BR")}. Os vínculos e treinos representam as carteiras atuais; as avaliações e ações são filtradas pelo período. Um aluno vinculado a mais de um personal aparece em cada carteira.</p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(card => <article key={card.label} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"><div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]"><span>{card.label}</span><span className="text-[var(--accent)]">{card.icon}</span></div><p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">{card.value}</p></article>)}</div>
            <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                <div className="border-b border-[var(--border)] px-5 py-4">
                    <h2 className="text-sm font-semibold text-[var(--text-primary)]">Desempenho por profissional</h2>
                    <p className="mt-1 text-[10px] text-[var(--text-muted)]">Indicadores calculados a partir dos vínculos, treinos, avaliações, tarefas, feedbacks e auditoria.</p></div>
                <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-[11px]">
                    <thead className="bg-[var(--surface-secondary)] text-[9px] uppercase tracking-wide text-[var(--text-muted)]">
                        <tr>{["Profissional", "Alunos", "Treinos ativos", "Avaliações", "Tarefas abertas", "Concluídas", "Feedback", "Ações"].map(x => <th key={x} className="px-4 py-3 font-semibold">{x}</th>)}</tr></thead><tbody className="divide-y divide-[var(--border)]">{lista.map(p => <tr key={p.personalId} className="hover:bg-[var(--row-hover)]"><td className="px-4 py-3 font-semibold text-[var(--text-primary)]">{p.nome}</td><td className="px-4 py-3 text-[var(--text-secondary)]">{p.alunosAtivos}</td><td className="px-4 py-3 text-[var(--text-secondary)]">{p.treinosAtivos}</td><td className="px-4 py-3 text-[var(--text-secondary)]">{p.avaliacoesNoPeriodo}</td><td className="px-4 py-3 text-[var(--text-secondary)]">{p.tarefasAbertas}</td><td className="px-4 py-3 text-[var(--text-secondary)]">{p.tarefasConcluidas}</td><td className="px-4 py-3 text-[var(--text-secondary)]">{p.notaMediaFeedback == null ? "—" : `${p.notaMediaFeedback.toFixed(1)} / 5`} <span className="text-[9px] text-[var(--text-muted)]">({p.feedbacksRecebidos})</span></td><td className="px-4 py-3 text-[var(--text-secondary)]">{p.acoesRegistradas}</td></tr>)}</tbody></table></div>{lista.length === 0 &&
                            <p className="p-8 text-center text-xs text-[var(--text-muted)]">Nenhum profissional encontrado.</p>}</section>
            <div className="grid gap-4 lg:grid-cols-2"><section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"><h2 className="text-xs font-semibold text-[var(--text-primary)]">Tarefas em aberto por profissional</h2><div className="mt-4 space-y-3">{lista.map(p => <div key={p.personalId}><div className="mb-1.5 flex justify-between gap-2 text-[10px]"><span className="text-[var(--text-secondary)]">{p.nome}</span><strong className="text-[var(--text-primary)]">{p.tarefasAbertas}</strong></div><div className="h-2 overflow-hidden rounded-full bg-[var(--surface-tertiary)]"><div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.min(100, total.tarefas ? p.tarefasAbertas / total.tarefas * 100 : 0)}%` }} /></div></div>)}</div></section><section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"><h2 className="text-xs font-semibold text-[var(--text-primary)]">Leitura dos dados</h2><ul className="mt-3 space-y-2 text-[10px] leading-5 text-[var(--text-secondary)]"><li>• Alunos e treinos representam a carteira ativa atual, não um retrato histórico.</li><li>• Avaliações e ações de auditoria respeitam o intervalo selecionado.</li><li>• Feedback é contabilizado quando enviado diretamente a um personal; feedback geral não é atribuído a um profissional específico.</li><li>• Estes indicadores são operacionais e não representam, isoladamente, qualidade clínica ou desempenho individual.</li></ul></section></div>
        </>}
    </section>;
}
