import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BsArrowClockwise, BsCheck2Circle, BsCircle, BsListCheck, BsPlusLg } from "react-icons/bs";
import { adminExtrasService, type TarefaPersonal } from "../service/adminExtrasService";

export default function ChecklistAluno({ alunoId }: { alunoId: string }) {
    const queryClient = useQueryClient();
    const [titulo, setTitulo] = useState("");
    const [descricao, setDescricao] = useState("");
    const [prioridade, setPrioridade] = useState("NORMAL");
    const [dataLimite, setDataLimite] = useState("");
    const [erro, setErro] = useState("");
    const tarefas = useQuery({ queryKey: ["extras", "tarefas", "equipe"], queryFn: () => adminExtrasService.listarTarefas() });
    const lista = (tarefas.data ?? []).filter(item => item.alunoId === alunoId);
    const atualizar = useMutation({
        mutationFn: ({ tarefa, status }: { tarefa: TarefaPersonal; status: string }) => adminExtrasService.atualizarTarefa(tarefa.id, {
            titulo: tarefa.titulo, descricao: tarefa.descricao, dicaContexto: tarefa.dicaContexto ?? undefined,
            categoria: tarefa.categoria, prioridade: tarefa.prioridade, status, dataLimite: tarefa.dataLimite,
        }),
        onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["extras", "tarefas"] }); },
        onError: error => setErro(error instanceof Error ? error.message : "Não foi possível atualizar a tarefa."),
    });
    const criar = useMutation({
        mutationFn: () => adminExtrasService.criarTarefa({
            alunoId, titulo: titulo.trim(), descricao: descricao.trim(), categoria: "ALUNO", prioridade,
            dataLimite: dataLimite ? new Date(`${dataLimite}T23:59:59`).toISOString() : undefined,
        }),
        onSuccess: async () => {
            setTitulo(""); setDescricao(""); setDataLimite(""); setErro("");
            await queryClient.invalidateQueries({ queryKey: ["extras", "tarefas"] });
        },
        onError: error => setErro(error instanceof Error ? error.message : "Não foi possível criar a tarefa."),
    });
    const abertas = lista.filter(item => item.status === "PENDENTE" || item.status === "EM_ANDAMENTO");
    const input = "w-full rounded-xl border border-[var(--border-strong)] bg-[var(--input-bg)] px-3 py-2.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]";

    return (
        <section className="space-y-5">
            <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.17em] text-[var(--accent-text)]">Rotina da equipe</p><h3 className="mt-1 text-[16px] font-semibold text-[var(--text-primary)]">Checklist deste aluno</h3><p className="mt-1 text-[11px] text-[var(--text-muted)]">Tarefas compartilhadas, com autoria registrada e atualização por qualquer profissional autorizado.</p></div><span className="rounded-full bg-[var(--accent-soft)] px-3 py-1.5 text-[10px] font-bold text-[var(--accent-text)]">{abertas.length} em aberto</span></header>
            <form onSubmit={event => { event.preventDefault(); setErro(""); criar.mutate(); }} className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-[10px] font-semibold text-[var(--text-secondary)] sm:col-span-2">Nova tarefa<input required minLength={3} maxLength={140} value={titulo} onChange={event => setTitulo(event.target.value)} placeholder="Ex.: revisar medidas e atualizar avaliação" className={input}/></label>
                <label className="grid gap-1.5 text-[10px] font-semibold text-[var(--text-secondary)] sm:col-span-2">Contexto<textarea required maxLength={3000} rows={2} value={descricao} onChange={event => setDescricao(event.target.value)} placeholder="Descreva o que precisa ser feito e o contexto para a equipe..." className={input}/></label>
                <label className="grid gap-1.5 text-[10px] font-semibold text-[var(--text-secondary)]">Prioridade<select value={prioridade} onChange={event => setPrioridade(event.target.value)} className={input}><option value="BAIXA">Baixa</option><option value="NORMAL">Normal</option><option value="ALTA">Alta</option><option value="URGENTE">Urgente</option></select></label>
                <label className="grid gap-1.5 text-[10px] font-semibold text-[var(--text-secondary)]">Prazo (opcional)<input type="date" value={dataLimite} onChange={event => setDataLimite(event.target.value)} className={input}/></label>
                {erro && <p role="alert" className="text-[11px] text-[var(--danger)] sm:col-span-2">{erro}</p>}
                <div className="flex justify-end sm:col-span-2"><button type="submit" disabled={criar.isPending} className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-[11px] font-bold text-white disabled:opacity-50"><BsPlusLg size={14}/>{criar.isPending ? "Criando..." : "Adicionar tarefa"}</button></div>
            </form>
            {tarefas.isLoading ? <p className="py-6 text-center text-xs text-[var(--text-muted)]">Carregando checklist...</p> : tarefas.isError ? <div role="alert" className="rounded-xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-4 text-xs text-[var(--danger)]">Não foi possível carregar as tarefas. <button onClick={() => void tarefas.refetch()} className="ml-1 font-bold underline">Tentar novamente</button></div> : lista.length === 0 ? <div className="rounded-2xl border border-dashed border-[var(--border-strong)] p-8 text-center"><BsListCheck size={22} className="mx-auto text-[var(--text-muted)]"/><p className="mt-3 text-xs font-semibold text-[var(--text-primary)]">Nenhuma tarefa registrada</p><p className="mt-1 text-[10px] text-[var(--text-muted)]">Crie um item para organizar as próximas ações da equipe.</p></div> : <div className="space-y-2">{lista.map(tarefa => <article key={tarefa.id} className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"><button type="button" aria-label={tarefa.status === "CONCLUIDA" ? "Reabrir tarefa" : "Concluir tarefa"} onClick={() => atualizar.mutate({ tarefa, status: tarefa.status === "CONCLUIDA" ? "PENDENTE" : "CONCLUIDA" })} disabled={atualizar.isPending} className="mt-0.5 text-[var(--accent-text)] disabled:opacity-40">{tarefa.status === "CONCLUIDA" ? <BsCheck2Circle size={18}/> : <BsCircle size={18}/>}</button><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h4 className={`text-xs font-bold ${tarefa.status === "CONCLUIDA" ? "text-[var(--text-muted)] line-through" : "text-[var(--text-primary)]"}`}>{tarefa.titulo}</h4><span className="rounded-full bg-[var(--surface-secondary)] px-2 py-0.5 text-[9px] font-semibold text-[var(--text-muted)]">{tarefa.status === "CONCLUIDA" ? "Concluída" : tarefa.status === "EM_ANDAMENTO" ? "Em andamento" : tarefa.status}</span><span className="text-[9px] font-bold text-[var(--text-muted)]">{tarefa.prioridade}</span></div><p className="mt-1.5 whitespace-pre-wrap text-[11px] leading-5 text-[var(--text-secondary)]">{tarefa.descricao}</p><p className="mt-2 text-[9px] text-[var(--text-muted)]">Criada por {tarefa.criadoPor} · {new Date(tarefa.criadaEm).toLocaleString("pt-BR")}{tarefa.dataLimite ? ` · Prazo ${new Date(tarefa.dataLimite).toLocaleDateString("pt-BR")}` : ""}</p></div></article>)}</div>}
            <div className="flex items-center justify-end"><button type="button" onClick={() => void tarefas.refetch()} className="inline-flex items-center gap-2 text-[10px] font-semibold text-[var(--text-muted)]"><BsArrowClockwise size={12}/> Atualizar checklist</button></div>
        </section>
    );
}
