import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    BsCheckCircle,
    BsClockHistory,
    BsDownload,
    BsExclamationTriangle,
    BsFileEarmark,
    BsFolder2Open,
    BsPencil,
    BsPlusLg,
    BsSearch,
    BsShieldLock,
    BsTrash3,
    BsUpload,
    BsX,
} from "react-icons/bs";
import { ApiError } from "../service/api";
import {
    arquivoEquipeService,
    type ArquivoEquipePublicacao,
    type PrazoRetencaoArquivo,
} from "../service/arquivoEquipeService";
import { Skeleton } from "../components/Skeleton";

const PRAZOS: { value: PrazoRetencaoArquivo; label: string }[] = [
    { value: "24H", label: "24 horas" },
    { value: "7D", label: "7 dias" },
    { value: "1M", label: "1 mês" },
    { value: "6M", label: "6 meses" },
    { value: "1A", label: "1 ano" },
];

function formatarData(valor: string) {
    return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(valor));
}

function formatarTamanho(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function tempoRestante(valor: string) {
    const restante = new Date(valor).getTime() - Date.now();
    if (restante <= 0) return "Expirando";
    const horas = Math.ceil(restante / (60 * 60 * 1000));
    if (horas < 24) return `${horas}h restantes`;
    const dias = Math.ceil(horas / 24);
    if (dias < 30) return `${dias} dias restantes`;
    const meses = Math.ceil(dias / 30);
    if (meses < 12) return `${meses} ${meses === 1 ? "mês" : "meses"} restantes`;
    return "Mais de 1 ano";
}

function erroDa(error: unknown) {
    return error instanceof ApiError ? error.message : "Não foi possível concluir a operação. Tente novamente.";
}

export default function ArquivosEquipe({ isAdmin }: { isAdmin: boolean }) {
    const queryClient = useQueryClient();
    const inputArquivosRef = useRef<HTMLInputElement>(null);
    const [busca, setBusca] = useState("");
    const [modalAberto, setModalAberto] = useState(false);
    const [publicacaoEditando, setPublicacaoEditando] = useState<ArquivoEquipePublicacao | null>(null);
    const [nome, setNome] = useState("");
    const [descricao, setDescricao] = useState("");
    const [prazo, setPrazo] = useState<PrazoRetencaoArquivo>("7D");
    const [arquivosSelecionados, setArquivosSelecionados] = useState<File[]>([]);
    const [erroFormulario, setErroFormulario] = useState("");
    const [feedback, setFeedback] = useState("");
    const [erroDownload, setErroDownload] = useState("");
    const [baixandoId, setBaixandoId] = useState<string | null>(null);

    const publicacoesQuery = useQuery({
        queryKey: ["arquivos-equipe"],
        queryFn: arquivoEquipeService.listar,
        staleTime: 15_000,
    });

    const publicacoesFiltradas = useMemo(() => {
        const termo = busca.trim().toLocaleLowerCase("pt-BR");
        const publicacoes = publicacoesQuery.data ?? [];
        if (!termo) return publicacoes;
        return publicacoes.filter(item =>
            item.nome.toLocaleLowerCase("pt-BR").includes(termo) ||
            item.descricao.toLocaleLowerCase("pt-BR").includes(termo) ||
            item.criadoPorNome.toLocaleLowerCase("pt-BR").includes(termo) ||
            item.arquivos.some(arquivo => arquivo.nomeOriginal.toLocaleLowerCase("pt-BR").includes(termo)),
        );
    }, [publicacoesQuery.data, busca]);

    function fecharModal() {
        setModalAberto(false);
        setPublicacaoEditando(null);
        setNome("");
        setDescricao("");
        setPrazo("7D");
        setArquivosSelecionados([]);
        setErroFormulario("");
        if (inputArquivosRef.current) inputArquivosRef.current.value = "";
    }

    function abrirNovaPublicacao() {
        fecharModal();
        setModalAberto(true);
    }

    function abrirEdicao(publicacao: ArquivoEquipePublicacao) {
        setPublicacaoEditando(publicacao);
        setNome(publicacao.nome);
        setDescricao(publicacao.descricao);
        setPrazo(publicacao.prazoRetencao);
        setArquivosSelecionados([]);
        setErroFormulario("");
        setModalAberto(true);
    }

    function selecionarArquivos(lista: FileList | null) {
        if (!lista) return;
        setArquivosSelecionados(atual => [...atual, ...Array.from(lista)]);
        if (inputArquivosRef.current) inputArquivosRef.current.value = "";
    }

    function removerArquivoSelecionado(index: number) {
        setArquivosSelecionados(atual => atual.filter((_, itemIndex) => itemIndex !== index));
    }

    const salvarMutation = useMutation({
        mutationFn: async () => {
            const form = new FormData();
            form.append("Nome", nome.trim());
            form.append("Descricao", descricao.trim());
            if (!publicacaoEditando) form.append("PrazoRetencao", prazo);
            arquivosSelecionados.forEach(arquivo => form.append("Arquivos", arquivo));

            if (publicacaoEditando) {
                await arquivoEquipeService.atualizar(publicacaoEditando.id, form);
            } else {
                await arquivoEquipeService.criar(form);
            }
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["arquivos-equipe"] });
            setFeedback(publicacaoEditando ? "Publicação atualizada." : "Arquivo publicado para a equipe.");
            fecharModal();
        },
        onError: error => setErroFormulario(erroDa(error)),
    });

    const excluirMutation = useMutation({
        mutationFn: arquivoEquipeService.excluir,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["arquivos-equipe"] });
            setFeedback("Publicação removida.");
        },
        onError: error => setErroDownload(erroDa(error)),
    });

    function salvar(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setErroFormulario("");
        if (!nome.trim() || nome.trim().length < 2) {
            setErroFormulario("Informe um nome com pelo menos 2 caracteres.");
            return;
        }
        if (!publicacaoEditando && arquivosSelecionados.length === 0) {
            setErroFormulario("Selecione pelo menos um arquivo para publicar.");
            return;
        }
        if (arquivosSelecionados.length > 20) {
            setErroFormulario("Envie no máximo 20 arquivos por vez.");
            return;
        }
        if (arquivosSelecionados.some(arquivo => arquivo.size > 25 * 1024 * 1024)) {
            setErroFormulario("Cada arquivo pode ter no máximo 25 MB.");
            return;
        }
        if (arquivosSelecionados.reduce((total, arquivo) => total + arquivo.size, 0) > 50 * 1024 * 1024) {
            setErroFormulario("O envio pode somar no máximo 50 MB por vez.");
            return;
        }
        salvarMutation.mutate();
    }

    async function baixar(publicacaoId: string, arquivoId: string, nomeArquivo: string) {
        setErroDownload("");
        setBaixandoId(arquivoId);
        try {
            const blob = await arquivoEquipeService.baixar(publicacaoId, arquivoId);
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = nomeArquivo;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (error) {
            setErroDownload(erroDa(error));
        } finally {
            setBaixandoId(null);
        }
    }

    function excluir(publicacao: ArquivoEquipePublicacao) {
        if (!window.confirm(`Excluir a publicação "${publicacao.nome}" e todos os seus anexos?`)) return;
        setErroDownload("");
        excluirMutation.mutate(publicacao.id);
    }

    return (
        <section className="mx-auto w-full max-w-[1440px] space-y-6">
            <header className="flex flex-col justify-between gap-4 border-b border-[var(--border)] pb-6 lg:flex-row lg:items-end">
                <div>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-[var(--accent-text)]">Comunicação / Workspace compartilhado</p>
                    <h1 className="text-[28px] font-semibold tracking-[-.045em] text-[var(--text-primary)]">Arquivos da equipe</h1>
                    <p className="mt-2 max-w-2xl text-[12px] leading-5 text-[var(--text-secondary)]">Centralize planilhas, documentos e materiais de trabalho. Os anexos ficam disponíveis para a equipe até a data de expiração definida na publicação.</p>
                </div>
                {isAdmin && <button type="button" onClick={abrirNovaPublicacao} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-[11px] font-semibold text-white transition hover:bg-[var(--accent-hover)]"><BsPlusLg /> Nova publicação</button>}
            </header>

            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(260px,.8fr)]">
                <div className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]"><BsFolder2Open size={17} /></span>
                    <div><p className="text-[11px] font-semibold text-[var(--text-primary)]">Acesso compartilhado</p><p className="mt-1 text-[10px] leading-5 text-[var(--text-muted)]">Administradores publicam e gerenciam. Administradores e Personais podem baixar os arquivos. Alunos não têm acesso a esta área.</p></div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500/10 text-amber-700"><BsClockHistory size={17} /></span>
                    <div><p className="text-[11px] font-semibold text-[var(--text-primary)]">Retenção automática</p><p className="mt-1 text-[10px] leading-5 text-[var(--text-secondary)]">A equipe recebe uma notificação 12 horas antes. Ao atingir o prazo, os arquivos são removidos automaticamente.</p></div>
                </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div><h2 className="text-[14px] font-semibold text-[var(--text-primary)]">Publicações disponíveis</h2><p className="mt-1 text-[10px] text-[var(--text-muted)]">{publicacoesQuery.data?.length ?? 0} publicação(ões) ativas</p></div>
                <label className="relative block w-full sm:w-[320px]"><BsSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[var(--text-muted)]" /><input type="search" value={busca} onChange={event => setBusca(event.target.value)} placeholder="Buscar publicação ou arquivo..." className="h-10 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--input-bg)] pl-9 pr-3 text-[11px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]" /></label>
            </div>

            {feedback && <div role="status" className="flex items-center gap-2 rounded-xl border border-[var(--success)]/20 bg-[var(--success-soft)] px-4 py-3 text-[10px] text-[var(--success)]"><BsCheckCircle /> {feedback}<button type="button" onClick={() => setFeedback("")} className="ml-auto" aria-label="Fechar aviso"><BsX /></button></div>}
            {erroDownload && <div role="alert" className="flex items-center gap-2 rounded-xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] px-4 py-3 text-[10px] text-[var(--danger)]"><BsExclamationTriangle /> {erroDownload}<button type="button" onClick={() => setErroDownload("")} className="ml-auto" aria-label="Fechar erro"><BsX /></button></div>}

            {publicacoesQuery.isLoading ? (
                <div aria-label="Carregando arquivos da equipe" aria-busy="true" className="grid gap-4 xl:grid-cols-2">{Array.from({ length: 4 }, (_, index) => <div key={index} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"><Skeleton className="h-4 w-2/5 rounded" /><Skeleton className="mt-3 h-3 w-4/5 rounded" /><Skeleton className="mt-2 h-3 w-3/5 rounded" /><div className="mt-6 space-y-3">{[1, 2].map(item => <Skeleton key={item} className="h-12 w-full rounded-xl" />)}</div></div>)}</div>
            ) : publicacoesQuery.isError ? (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-10 text-center"><BsExclamationTriangle className="mx-auto text-2xl text-[var(--danger)]" /><p className="mt-3 text-[12px] font-semibold text-[var(--text-primary)]">Não foi possível carregar os arquivos</p><button type="button" onClick={() => void publicacoesQuery.refetch()} className="mt-4 rounded-lg border border-[var(--border)] px-4 py-2 text-[10px] font-semibold text-[var(--text-secondary)]">Tentar novamente</button></div>
            ) : publicacoesFiltradas.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface)] px-6 py-14 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[var(--surface-secondary)] text-[var(--text-muted)]"><BsFolder2Open size={24} /></span><h3 className="mt-4 text-[14px] font-semibold text-[var(--text-primary)]">{busca ? "Nenhum arquivo encontrado" : "Nenhuma publicação ainda"}</h3><p className="mx-auto mt-2 max-w-sm text-[11px] leading-5 text-[var(--text-muted)]">{busca ? "Tente buscar por outro nome ou descrição." : "Quando a administração compartilhar materiais, eles aparecerão aqui para toda a equipe."}</p>{isAdmin && !busca && <button type="button" onClick={abrirNovaPublicacao} className="mt-5 inline-flex h-9 items-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-[10px] font-semibold text-white"><BsUpload /> Publicar primeiro arquivo</button>}</div>
            ) : (
                <div className="grid items-start gap-4 xl:grid-cols-2">
                    {publicacoesFiltradas.map(publicacao => {
                        const restante = new Date(publicacao.expiraEm).getTime() - Date.now();
                        const proximaExpiracao = restante <= 12 * 60 * 60 * 1000;
                        return (
                            <article key={publicacao.id} className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm shadow-black/[.02] transition hover:border-[var(--border-strong)]">
                                <div className="p-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0"><p className="text-[9px] font-bold uppercase tracking-[.15em] text-[var(--accent-text)]">Compartilhado por {publicacao.criadoPorNome}</p><h3 className="mt-1.5 break-words text-[16px] font-semibold tracking-tight text-[var(--text-primary)]">{publicacao.nome}</h3></div>
                                        <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[9px] font-semibold ${proximaExpiracao ? "bg-amber-500/10 text-amber-700" : "bg-[var(--success-soft)] text-[var(--success)]"}`}><BsClockHistory /> {tempoRestante(publicacao.expiraEm)}</span>
                                    </div>
                                    {publicacao.descricao && <p className="mt-3 whitespace-pre-wrap text-[11px] leading-5 text-[var(--text-secondary)]">{publicacao.descricao}</p>}
                                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[9px] text-[var(--text-muted)]"><span>Publicado em {formatarData(publicacao.criadoEm)}</span><span>Prazo: {PRAZOS.find(item => item.value === publicacao.prazoRetencao)?.label ?? publicacao.prazoRetencao}</span><span>Expira em {formatarData(publicacao.expiraEm)}</span></div>
                                    {proximaExpiracao && <p className="mt-3 flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-[9px] font-medium text-amber-700"><BsExclamationTriangle /> Esta publicação será removida em breve. Baixe os anexos antes do prazo.</p>}
                                </div>

                                <div className="border-t border-[var(--border)] bg-[var(--surface-secondary)]/60 p-3">
                                    <div className="mb-2 flex items-center justify-between px-1"><span className="text-[9px] font-bold uppercase tracking-[.13em] text-[var(--text-muted)]">Arquivos anexados</span><span className="text-[9px] text-[var(--text-muted)]">{publicacao.arquivos.length} arquivo(s)</span></div>
                                    <div className="space-y-1.5">
                                        {publicacao.arquivos.map(arquivo => (
                                            <div key={arquivo.id} className="flex min-w-0 items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5">
                                                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]"><BsFileEarmark /></span>
                                                <span className="min-w-0 flex-1"><span className="block truncate text-[10px] font-semibold text-[var(--text-primary)]" title={arquivo.nomeOriginal}>{arquivo.nomeOriginal}</span><span className="mt-0.5 block text-[9px] text-[var(--text-muted)]">{formatarTamanho(arquivo.tamanhoBytes)} · {formatarData(arquivo.enviadoEm)}</span></span>
                                                <button type="button" onClick={() => void baixar(publicacao.id, arquivo.id, arquivo.nomeOriginal)} disabled={baixandoId === arquivo.id} aria-label={`Baixar ${arquivo.nomeOriginal}`} title="Baixar arquivo" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[var(--border)] text-[var(--text-secondary)] transition hover:bg-[var(--row-hover)] disabled:opacity-50"><BsDownload /></button>
                                            </div>
                                        ))}
                                    </div>
                                    {isAdmin && <div className="mt-3 flex justify-end gap-2"><button type="button" onClick={() => abrirEdicao(publicacao)} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 text-[9px] font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--row-hover)]"><BsPencil /> Editar / adicionar arquivos</button><button type="button" onClick={() => excluir(publicacao)} disabled={excluirMutation.isPending} aria-label={`Excluir ${publicacao.nome}`} title="Excluir publicação" className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--danger)]/20 text-[var(--danger)] transition hover:bg-[var(--danger-soft)] disabled:opacity-50"><BsTrash3 /></button></div>}
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}

            {modalAberto && isAdmin && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-black/50 p-4" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !salvarMutation.isPending) fecharModal(); }}>
                    <form onSubmit={salvar} role="dialog" aria-modal="true" aria-labelledby="arquivo-equipe-modal-title" className="my-auto w-full max-w-[620px] rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl sm:p-6">
                        <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-4"><div><p className="text-[9px] font-bold uppercase tracking-[.16em] text-[var(--accent-text)]">Biblioteca da equipe</p><h2 id="arquivo-equipe-modal-title" className="mt-1 text-[17px] font-semibold text-[var(--text-primary)]">{publicacaoEditando ? "Editar publicação" : "Nova publicação"}</h2><p className="mt-1 text-[10px] leading-5 text-[var(--text-muted)]">{publicacaoEditando ? "Atualize os dados ou acrescente novos anexos à publicação existente." : "Defina os dados e selecione os arquivos que serão compartilhados."}</p></div><button type="button" onClick={fecharModal} disabled={salvarMutation.isPending} aria-label="Fechar" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--row-hover)] disabled:opacity-40"><BsX size={18} /></button></div>

                        <div className="mt-5 grid gap-4">
                            <label className="grid gap-1.5"><span className="text-[10px] font-semibold text-[var(--text-secondary)]">Nome da publicação</span><input required minLength={2} maxLength={120} value={nome} onChange={event => setNome(event.target.value)} className="h-10 rounded-lg border border-[var(--border-strong)] bg-[var(--input-bg)] px-3 text-[11px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]" placeholder="Ex.: Planilhas de avaliação física" /></label>
                            <label className="grid gap-1.5"><span className="text-[10px] font-semibold text-[var(--text-secondary)]">Descrição</span><textarea rows={3} maxLength={2000} value={descricao} onChange={event => setDescricao(event.target.value)} className="resize-y rounded-lg border border-[var(--border-strong)] bg-[var(--input-bg)] px-3 py-2.5 text-[11px] leading-5 text-[var(--text-primary)] outline-none focus:border-[var(--accent)]" placeholder="Explique o conteúdo e para que a equipe deve utilizar estes arquivos..." /></label>
                            {!publicacaoEditando ? <label className="grid gap-1.5"><span className="text-[10px] font-semibold text-[var(--text-secondary)]">Tempo de permanência</span><select value={prazo} onChange={event => setPrazo(event.target.value as PrazoRetencaoArquivo)} className="h-10 rounded-lg border border-[var(--border-strong)] bg-[var(--input-bg)] px-3 text-[11px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]">{PRAZOS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label> : <p className="rounded-lg bg-[var(--surface-secondary)] px-3 py-2 text-[9px] leading-4 text-[var(--text-muted)]">O prazo de retenção continua o mesmo da publicação original: {PRAZOS.find(item => item.value === prazo)?.label ?? prazo}. Anexos novos serão removidos junto com os demais.</p>}

                            <div className="rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-secondary)] p-4">
                                <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-[10px] font-semibold text-[var(--text-primary)]">{publicacaoEditando ? "Adicionar novos arquivos" : "Arquivos para compartilhar"}</p><p className="mt-1 text-[9px] text-[var(--text-muted)]">Qualquer formato · até 20 arquivos · 25 MB por arquivo · 50 MB por envio</p></div><button type="button" onClick={() => inputArquivosRef.current?.click()} className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-[10px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--row-hover)]"><BsUpload /> Selecionar arquivos</button></div>
                                <input ref={inputArquivosRef} type="file" multiple className="sr-only" onChange={event => selecionarArquivos(event.target.files)} />
                                {arquivosSelecionados.length > 0 ? <div className="mt-3 space-y-1.5">{arquivosSelecionados.map((arquivo, index) => <div key={`${arquivo.name}-${arquivo.lastModified}-${index}`} className="flex items-center gap-2 rounded-lg bg-[var(--surface)] px-3 py-2"><BsFileEarmark className="shrink-0 text-[var(--accent)]" /><span className="min-w-0 flex-1 truncate text-[9px] text-[var(--text-secondary)]" title={arquivo.name}>{arquivo.name} <span className="text-[var(--text-muted)]">· {formatarTamanho(arquivo.size)}</span></span><button type="button" onClick={() => removerArquivoSelecionado(index)} aria-label={`Remover ${arquivo.name}`} className="grid h-6 w-6 shrink-0 place-items-center rounded text-[var(--text-muted)] hover:bg-[var(--row-hover)]"><BsX /></button></div>)}</div> : <p className="mt-3 text-center text-[9px] text-[var(--text-muted)]">Nenhum arquivo selecionado</p>}
                            </div>
                        </div>

                        {erroFormulario && <p role="alert" className="mt-4 rounded-lg bg-[var(--danger-soft)] px-3 py-2.5 text-[10px] text-[var(--danger)]">{erroFormulario}</p>}
                        <div className="mt-5 flex flex-col-reverse justify-end gap-2 border-t border-[var(--border)] pt-4 sm:flex-row"><button type="button" onClick={fecharModal} disabled={salvarMutation.isPending} className="h-9 rounded-lg border border-[var(--border)] px-4 text-[10px] font-semibold text-[var(--text-secondary)]">Cancelar</button><button type="submit" disabled={salvarMutation.isPending} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-[10px] font-semibold text-white disabled:opacity-50">{salvarMutation.isPending ? "Salvando..." : publicacaoEditando ? "Salvar alterações" : "Publicar para a equipe"}</button></div>
                    </form>
                </div>
            )}
        </section>
    );
}
