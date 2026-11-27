import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BsArrowClockwise, BsClipboard, BsLink45Deg, BsPeople, BsPlusLg, BsShieldCheck, BsXCircle } from "react-icons/bs";
import { useAuth } from "../context/authContext";
import { ApiError } from "../service/api";
import { conviteService } from "../service/conviteService";

function data(value: string) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleDateString("pt-BR");
}

export default function ConvitesEquipe() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const admin = user?.tipo === "ADMIN";
    const [apelido, setApelido] = useState("");
    const [nomePersonal, setNomePersonal] = useState("");
    const [linkCriado, setLinkCriado] = useState("");
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");

    const meus = useQuery({ queryKey: ["convites", "meus"], queryFn: conviteService.meus, enabled: Boolean(user) });
    const equipe = useQuery({ queryKey: ["convites", "equipe"], queryFn: conviteService.equipe, enabled: admin });
    const criar = useMutation({
        mutationFn: () => conviteService.criar(apelido.trim(), admin && !user?.personalId ? nomePersonal.trim() : undefined),
        onSuccess: async convite => {
            const url = `${window.location.origin}/convite/${convite.token}`;
            setLinkCriado(url);
            setErro("");
            setSucesso("Link criado. Copie e envie diretamente à pessoa convidada.");
            setApelido("");
            setNomePersonal("");
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["convites", "meus"] }),
                queryClient.invalidateQueries({ queryKey: ["convites", "equipe"] }),
                queryClient.invalidateQueries({ queryKey: ["personais"] }),
                queryClient.invalidateQueries({ queryKey: ["auth", "me"] }),
            ]);
        },
        onError: error => setErro(error instanceof ApiError ? error.message : "Não foi possível criar o convite."),
    });
    const revogar = useMutation({
        mutationFn: conviteService.revogar,
        onSuccess: async () => {
            setSucesso("Convite revogado. O link não poderá ser utilizado em novos cadastros.");
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["convites", "meus"] }),
                queryClient.invalidateQueries({ queryKey: ["convites", "equipe"] }),
            ]);
        },
        onError: error => setErro(error instanceof ApiError ? error.message : "Não foi possível revogar o convite."),
    });

    async function copiar(value: string) {
        try {
            await navigator.clipboard.writeText(value);
            setSucesso("Link copiado para a área de transferência.");
            setErro("");
        } catch {
            setErro("Não foi possível copiar automaticamente. Selecione o link e copie manualmente.");
        }
    }

    return (
        <section className="w-full max-w-[1200px] space-y-6">
            <header className="border-b border-[var(--border)] pb-6">
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[var(--accent-text)]">Workspace / Entrada de alunos</p>
                <h1 className="mt-2 text-[30px] font-semibold tracking-[-.045em] text-[var(--text-primary)]">{admin ? "Convites da equipe" : "Meus links de convite"}</h1>
                <p className="mt-2 max-w-2xl text-[13px] leading-6 text-[var(--text-secondary)]">{admin ? "Você também pode convidar alunos pelo seu próprio perfil profissional. Acompanhe seus links e a origem de todos os cadastros da equipe." : "Gere links rastreáveis para convidar novos alunos. O vínculo identifica quem fez o convite; toda a equipe poderá acompanhar e editar o cadastro."}</p>
            </header>

            {erro && <p role="alert" className="rounded-xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-3 text-xs text-[var(--danger)]">{erro}</p>}
            {sucesso && <p role="status" className="rounded-xl border border-[var(--accent)]/20 bg-[var(--accent-soft)] p-3 text-xs text-[var(--accent-text)]">{sucesso}</p>}

            <>
                <form onSubmit={event => { event.preventDefault(); criar.mutate(); }} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
                    <div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-text)]"><BsLink45Deg size={18}/></span><div className="flex-1"><h2 className="text-sm font-bold text-[var(--text-primary)]">{admin ? "Seu link como personal" : "Criar novo link"}</h2><p className="mt-1 text-[11px] leading-5 text-[var(--text-secondary)]">O convite registra seu perfil como origem do cadastro. Cada link é aleatório, pode ser revogado e expira em 30 dias.</p></div></div>
                    {admin && !user?.personalId && <label className="mt-5 block"><span className="mb-2 block text-[10px] font-semibold text-[var(--text-secondary)]">Nome profissional que aparecerá no convite</span><input required maxLength={160} value={nomePersonal} onChange={event => setNomePersonal(event.target.value)} placeholder="Seu nome e sobrenome" className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--input-bg)] px-4 py-3 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"/></label>}
                    <div className="mt-5 flex flex-col gap-3 sm:flex-row"><input maxLength={80} value={apelido} onChange={event => setApelido(event.target.value)} placeholder="Ex.: Indicação novembro, campanha academia..." className="min-w-0 flex-1 rounded-xl border border-[var(--border-strong)] bg-[var(--input-bg)] px-4 py-3 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"/><button type="submit" disabled={criar.isPending || (admin && !user?.personalId && !nomePersonal.trim())} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-xs font-bold text-white disabled:opacity-50"><BsPlusLg size={15}/>{criar.isPending ? "Gerando..." : "Gerar convite"}</button></div>
                    {linkCriado && <div className="mt-4 rounded-xl border border-[var(--accent)]/20 bg-[var(--accent-soft)] p-4"><p className="text-[10px] font-bold text-[var(--accent-text)]">Link criado · copie agora, ele não será exibido novamente após sair desta tela.</p><div className="mt-3 flex flex-col gap-2 sm:flex-row"><input readOnly value={linkCriado} className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[11px] text-[var(--text-primary)]"/><button type="button" onClick={() => void copiar(linkCriado)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-[11px] font-bold text-white"><BsClipboard size={14}/> Copiar link</button></div></div>}
                </form>

                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                    <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4"><div><h2 className="text-sm font-bold text-[var(--text-primary)]">Links gerados</h2><p className="mt-1 text-[10px] text-[var(--text-muted)]">O uso mostra quantas contas foram criadas por cada link.</p></div><button type="button" onClick={() => void meus.refetch()} className="rounded-lg border border-[var(--border)] p-2 text-[var(--text-secondary)]"><BsArrowClockwise size={14}/></button></div>
                    {meus.isLoading ? <p className="p-6 text-xs text-[var(--text-muted)]">Carregando convites...</p> : meus.isError ? <p className="p-6 text-xs text-[var(--danger)]">Não foi possível carregar os convites.</p> : (meus.data ?? []).length === 0 ? <p className="p-8 text-center text-xs text-[var(--text-muted)]">Você ainda não criou links de convite.</p> : <div className="divide-y divide-[var(--border)]">{(meus.data ?? []).map(item => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-bold text-[var(--text-primary)]">{item.apelido}</p><span className={`rounded-full px-2 py-1 text-[9px] font-bold ${item.ativo ? "bg-emerald-500/10 text-emerald-600" : "bg-zinc-500/10 text-[var(--text-muted)]"}`}>{item.ativo ? "Ativo" : "Expirado / revogado"}</span></div><p className="mt-1 text-[10px] text-[var(--text-muted)]">{item.utilizacoes} cadastros · criado {data(item.criadoEm)} · expira {data(item.expiraEm)}</p></div>{item.ativo && <button type="button" onClick={() => revogar.mutate(item.id)} disabled={revogar.isPending} className="inline-flex items-center gap-2 rounded-lg border border-[var(--danger)]/20 px-3 py-2 text-[10px] font-bold text-[var(--danger)]"><BsXCircle size={13}/> Revogar</button>}</div>)}</div>}
                </div>
            </>

            {admin && <>
                {equipe.isLoading ? <p className="rounded-xl border border-[var(--border)] p-6 text-xs text-[var(--text-muted)]">Carregando indicadores...</p> : equipe.isError ? <p role="alert" className="rounded-xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-4 text-xs text-[var(--danger)]">Não foi possível carregar os convites da equipe.</p> : <div className="space-y-4">{(equipe.data ?? []).map(personal => <article key={personal.personalId} className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]"><div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border)] p-5"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-text)]"><BsPeople size={18}/></span><div><h2 className="text-sm font-bold text-[var(--text-primary)]">{personal.personalNome}</h2><p className="mt-1 text-[10px] text-[var(--text-muted)]">{personal.convitesCriados} links gerados · {personal.pessoasRegistradas} pessoas registradas</p></div></div><div className="flex flex-wrap gap-2 text-[10px]"><span className="rounded-lg bg-amber-500/10 px-3 py-2 font-bold text-amber-600">{personal.cadastrosPendentes} pendentes</span><span className="rounded-lg bg-emerald-500/10 px-3 py-2 font-bold text-emerald-600">{personal.cadastrosAprovados} aprovados</span><span className="rounded-lg bg-rose-500/10 px-3 py-2 font-bold text-rose-600">{personal.cadastrosReprovados} ajustes</span></div></div><div className="divide-y divide-[var(--border)]">{personal.convidados.length === 0 ? <p className="px-5 py-6 text-xs text-[var(--text-muted)]">Nenhum cadastro recebido por este profissional.</p> : personal.convidados.map(aluno => <div key={aluno.alunoId} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"><div><p className="text-xs font-semibold text-[var(--text-primary)]">{aluno.nome}</p><p className="mt-1 text-[10px] text-[var(--text-muted)]">{aluno.email} · {data(aluno.criadoEm)}{aluno.conviteApelido ? ` · ${aluno.conviteApelido}` : ""}</p></div><span className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${aluno.statusCadastro === "APROVADO" ? "bg-emerald-500/10 text-emerald-600" : aluno.statusCadastro === "REPROVADO" ? "bg-rose-500/10 text-rose-600" : "bg-amber-500/10 text-amber-600"}`}>{aluno.statusCadastro === "APROVADO" ? "Aprovado" : aluno.statusCadastro === "REPROVADO" ? "Ajustes solicitados" : "Pendente"}</span></div>)}</div></article>)}</div>}
                <p className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]"><BsShieldCheck size={14}/> A origem do convite é um dado de auditoria. Ela não limita o acesso de nenhum profissional da equipe.</p>
            </>}
        </section>
    );
}
