import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BsChatSquareText, BsStarFill } from "react-icons/bs";
import { adminExtrasService } from "../service/adminExtrasService";

const statusNome: Record<string, string> = { NOVO: "Novo", EM_ANALISE: "Em análise", RESPONDIDO: "Respondido", ARQUIVADO: "Arquivado" };

export default function FeedbackAlunos() {
    const client = useQueryClient();
    const [respostas, setRespostas] = useState<Record<string, string>>({});
    const [status, setStatus] = useState<Record<string, string>>({});
    const [erro, setErro] = useState("");
    const feedbacks = useQuery({ queryKey: ["extras", "feedback", "equipe"], queryFn: adminExtrasService.listarFeedback, refetchInterval: 30000 });
    const atualizar = useMutation({
        mutationFn: ({ id, resposta, novoStatus }: { id: string; resposta: string; novoStatus: string }) => adminExtrasService.atualizarFeedback(id, { status: novoStatus, respostaEquipe: resposta }),
        onSuccess: async () => { setErro(""); await client.invalidateQueries({ queryKey: ["extras", "feedback"] }); },
        onError: (error: Error) => setErro(error.message),
    });

    return <section className="mx-auto w-full max-w-[1280px] space-y-6">
        <header className="border-b border-[var(--border)] pb-6"><p className="mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-[var(--accent-text)]">Comunicação / Voz do aluno</p><h1 className="text-[28px] font-semibold tracking-[-.045em] text-[var(--text-primary)]">Feedback dos alunos</h1><p className="mt-1.5 max-w-2xl text-[12px] leading-5 text-[var(--text-secondary)]">Leia avaliações e sugestões, acompanhe o tratamento e registre uma resposta para o aluno.</p></header>
        <div className="grid gap-3 sm:grid-cols-3">
            {[{ nome: "Recebidos", valor: feedbacks.data?.length ?? 0 }, { nome: "Novos", valor: feedbacks.data?.filter(f => f.status === "NOVO").length ?? 0 }, { nome: "Respondidos", valor: feedbacks.data?.filter(f => f.status === "RESPONDIDO").length ?? 0 }].map(item => <div key={item.nome} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"><p className="text-[10px] text-[var(--text-muted)]">{item.nome}</p><p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">{item.valor}</p></div>)}
        </div>
        {erro && <p role="alert" className="rounded-lg bg-[var(--danger-soft)] p-3 text-xs text-[var(--danger)]">{erro}</p>}
        {feedbacks.isLoading && <p className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center text-xs text-[var(--text-muted)]">Carregando feedbacks...</p>}
        {feedbacks.isError && <p role="alert" className="rounded-xl bg-[var(--danger-soft)] p-4 text-xs text-[var(--danger)]">Não foi possível carregar os feedbacks.</p>}
        {(feedbacks.data ?? []).length === 0 && !feedbacks.isLoading && <div className="rounded-xl border border-dashed border-[var(--border-strong)] p-10 text-center"><BsChatSquareText className="mx-auto text-2xl text-[var(--text-muted)]"/><p className="mt-3 text-sm font-semibold text-[var(--text-primary)]">Ainda não há feedbacks</p><p className="mt-1 text-xs text-[var(--text-muted)]">Quando os alunos enviarem avaliações, elas aparecerão aqui.</p></div>}
        <div className="space-y-3">{(feedbacks.data ?? []).map(item => <article key={item.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-semibold text-[var(--text-primary)]">{item.alunoNome}</p><p className="mt-1 text-[10px] text-[var(--text-muted)]">{item.categoria} · {new Date(item.criadoEm).toLocaleString("pt-BR")}{item.personalNome ? ` · ${item.personalNome}` : " · Feedback geral"}</p></div><span className="rounded-md bg-[var(--surface-tertiary)] px-2.5 py-1 text-[9px] font-semibold text-[var(--text-secondary)]">{statusNome[item.status] ?? item.status}</span></div>
            <div className="mt-3 flex items-center gap-1 text-amber-500" aria-label={`Nota ${item.nota} de 5`}>{Array.from({ length: 5 }, (_, i) => <BsStarFill key={i} className={i < item.nota ? "opacity-100" : "opacity-20"}/>)}</div>
            <p className="mt-3 whitespace-pre-wrap text-[12px] leading-6 text-[var(--text-secondary)]">{item.comentario}</p>
            {item.respostaEquipe && <div className="mt-4 rounded-lg border border-[var(--accent)]/15 bg-[var(--accent-soft)] p-3"><p className="text-[9px] font-bold uppercase tracking-wide text-[var(--accent-text)]">Resposta registrada</p><p className="mt-1 whitespace-pre-wrap text-[11px] leading-5 text-[var(--text-secondary)]">{item.respostaEquipe}</p></div>}
            <form className="mt-4 grid gap-2 border-t border-[var(--border)] pt-4" onSubmit={e => { e.preventDefault(); const resposta = respostas[item.id] ?? item.respostaEquipe ?? ""; atualizar.mutate({ id: item.id, resposta, novoStatus: status[item.id] ?? (resposta.trim() ? "RESPONDIDO" : item.status) }); }}>
                <label className="grid gap-1 text-[10px] font-semibold text-[var(--text-secondary)]">Resposta para o aluno<textarea maxLength={2000} rows={2} value={respostas[item.id] ?? item.respostaEquipe ?? ""} onChange={e => setRespostas(v => ({ ...v, [item.id]: e.target.value }))} placeholder="Escreva uma resposta ou orientação..." className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--input-bg)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"/></label>
                <div className="flex flex-wrap items-center justify-between gap-2"><select aria-label="Status do feedback" value={status[item.id] ?? item.status} onChange={e => setStatus(v => ({ ...v, [item.id]: e.target.value }))} className="h-9 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-2 text-[10px] text-[var(--text-primary)]"><option value="NOVO">Novo</option><option value="EM_ANALISE">Em análise</option><option value="RESPONDIDO">Respondido</option><option value="ARQUIVADO">Arquivado</option></select><button disabled={atualizar.isPending} className="h-9 rounded-lg bg-[var(--accent)] px-4 text-[10px] font-semibold text-white disabled:opacity-50">Salvar resposta</button></div>
            </form>
        </article>)}</div>
    </section>;
}
