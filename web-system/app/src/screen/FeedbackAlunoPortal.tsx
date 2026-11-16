import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminExtrasService } from "../service/adminExtrasService";

const statusNome: Record<string, string> = { NOVO: "Recebido", EM_ANALISE: "Em análise", RESPONDIDO: "Respondido", ARQUIVADO: "Arquivado" };

export default function FeedbackAlunoPortal() {
    const client = useQueryClient();
    const [personalId, setPersonalId] = useState("");
    const [categoria, setCategoria] = useState("ACOMPANHAMENTO");
    const [nota, setNota] = useState(5);
    const [comentario, setComentario] = useState("");
    const [erro, setErro] = useState("");
    const personais = useQuery({ queryKey: ["extras", "feedback", "personais-aluno"], queryFn: adminExtrasService.personaisDoAluno });
    const feedbacks = useQuery({ queryKey: ["extras", "feedback", "meus"], queryFn: adminExtrasService.meusFeedbacks, refetchInterval: 30000 });
    const enviar = useMutation({
        mutationFn: adminExtrasService.criarFeedback,
        onSuccess: async () => { setComentario(""); setErro(""); await client.invalidateQueries({ queryKey: ["extras", "feedback", "meus"] }); },
        onError: (error: Error) => setErro(error.message),
    });

    return <section className="mt-10 space-y-5 text-left">
        <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-emerald-300">Sua opinião</p><h2 className="mt-2 text-xl font-semibold">Feedback e acompanhamento</h2><p className="mt-2 text-xs leading-6 text-white/55">Compartilhe como está sendo sua experiência. A equipe poderá acompanhar e responder por aqui.</p></div>
        <form onSubmit={e => { e.preventDefault(); setErro(""); enviar.mutate({ personalId: personalId || undefined, categoria, nota, comentario }); }} className="space-y-3 rounded-2xl border border-white/10 bg-white/[.04] p-4 sm:p-5">
            <label className="grid gap-1.5 text-[10px] font-semibold text-white/65">Enviar para<select value={personalId} onChange={e => setPersonalId(e.target.value)} className="h-10 rounded-lg border border-white/10 bg-[#191d1b] px-3 text-xs text-white"><option value="">Equipe responsável (geral)</option>{(personais.data ?? []).map(p => <option key={p.personalId} value={p.personalId}>{p.nome}</option>)}</select></label>
            <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1.5 text-[10px] font-semibold text-white/65">Assunto<select value={categoria} onChange={e => setCategoria(e.target.value)} className="h-10 rounded-lg border border-white/10 bg-[#191d1b] px-3 text-xs text-white"><option value="ACOMPANHAMENTO">Acompanhamento</option><option value="TREINAMENTO">Treinamento</option><option value="SISTEMA">Aplicativo / sistema</option><option value="SUGESTAO">Sugestão</option></select></label><label className="grid gap-1.5 text-[10px] font-semibold text-white/65">Nota<select value={nota} onChange={e => setNota(Number(e.target.value))} className="h-10 rounded-lg border border-white/10 bg-[#191d1b] px-3 text-xs text-white">{[5,4,3,2,1].map(n => <option key={n} value={n}>{n} de 5</option>)}</select></label></div>
            <label className="grid gap-1.5 text-[10px] font-semibold text-white/65">Comentário<textarea required minLength={5} maxLength={2000} rows={4} value={comentario} onChange={e => setComentario(e.target.value)} placeholder="Conte como está sendo sua experiência..." className="rounded-lg border border-white/10 bg-[#191d1b] px-3 py-2.5 text-xs leading-5 text-white outline-none focus:border-emerald-400"/></label>
            {erro && <p role="alert" className="rounded-lg bg-red-400/10 p-2.5 text-[10px] text-red-300">{erro}</p>}
            <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-[9px] text-white/35">Seu feedback será visível apenas à equipe autorizada.</span><button disabled={enviar.isPending} className="h-10 rounded-lg bg-emerald-400 px-5 text-[11px] font-bold text-[#102019] disabled:opacity-50">{enviar.isPending ? "Enviando..." : "Enviar feedback"}</button></div>
        </form>
        <div className="space-y-3"><h3 className="text-sm font-semibold">Meus feedbacks</h3>{feedbacks.isLoading && <p className="text-xs text-white/40">Carregando histórico...</p>}{feedbacks.isError && <p className="text-xs text-red-300">Não foi possível carregar seu histórico.</p>}{(feedbacks.data ?? []).length === 0 && !feedbacks.isLoading && <p className="rounded-xl border border-dashed border-white/10 p-5 text-center text-xs text-white/40">Você ainda não enviou feedbacks.</p>}{(feedbacks.data ?? []).map(f => <article key={f.id} className="rounded-xl border border-white/10 bg-white/[.03] p-4"><div className="flex flex-wrap justify-between gap-2"><span className="text-[10px] font-semibold text-emerald-300">{f.categoria} · Nota {f.nota}/5</span><span className="text-[9px] text-white/45">{statusNome[f.status] ?? f.status}</span></div><p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-white/75">{f.comentario}</p>{f.respostaEquipe && <div className="mt-3 rounded-lg bg-emerald-300/10 p-3"><p className="text-[9px] font-bold uppercase tracking-wide text-emerald-300">Resposta da equipe</p><p className="mt-1 whitespace-pre-wrap text-[11px] leading-5 text-white/75">{f.respostaEquipe}</p></div>}</article>)}</div>
    </section>;
}
