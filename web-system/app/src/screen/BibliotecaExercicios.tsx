import { useCallback, useEffect, useMemo, useState } from "react";
import {
    BsArrowClockwise,
    BsCheck2,
    BsCollectionPlay,
    BsPencil,
    BsPlayCircle,
    BsPlusLg,
    BsSearch,
    BsStarFill,
    BsTrash3,
    BsUpload,
    BsX,
} from "react-icons/bs";
import {
    exercicioCatalogoService,
    resolverUrlVideo,
    type ExercicioCatalogo,
    type SalvarExercicioCatalogo,
} from "../service/exercicioCatalogoService";

const inputClass = "w-full rounded-xl border border-[var(--border-strong)] bg-[var(--input-bg)] px-3 py-2.5 text-[12px] text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15";
const labelClass = "mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]";

const formVazio: SalvarExercicioCatalogo = {
    nome: "",
    grupoMuscular: "",
    equipamento: "",
    dificuldade: "",
    descricao: "",
    instrucoes: "",
    sinonimos: [],
};

function mensagemErro(error: unknown) {
    return error instanceof Error ? error.message : "Não foi possível concluir a operação.";
}

export default function BibliotecaExercicios() {
    const [exercicios, setExercicios] = useState<ExercicioCatalogo[]>([]);
    const [consulta, setConsulta] = useState("");
    const [selecionadoId, setSelecionadoId] = useState("");
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");
    const [editorAberto, setEditorAberto] = useState(false);
    const [editandoId, setEditandoId] = useState<string | null>(null);
    const [form, setForm] = useState<SalvarExercicioCatalogo>(formVazio);
    const [textoSinonimos, setTextoSinonimos] = useState("");
    const [arquivo, setArquivo] = useState<File | null>(null);
    const [tituloVideo, setTituloVideo] = useState("");
    const [licenca, setLicenca] = useState("PROPRIO");
    const [fonte, setFonte] = useState("");
    const [confirmouDireitos, setConfirmouDireitos] = useState(false);
    const [duracao, setDuracao] = useState("");
    const [enviando, setEnviando] = useState(false);

    const carregar = useCallback(async (filtro = consulta) => {
        setCarregando(true);
        setErro("");
        try {
            const resultado = await exercicioCatalogoService.listar(filtro);
            setExercicios(resultado);
            setSelecionadoId((atual) => resultado.some(item => item.id === atual) ? atual : resultado[0]?.id ?? "");
        } catch (error) {
            setErro(mensagemErro(error));
        } finally {
            setCarregando(false);
        }
    }, [consulta]);

    useEffect(() => {
        const timeout = window.setTimeout(() => void carregar(consulta), 220);
        return () => window.clearTimeout(timeout);
    }, [carregar, consulta]);

    const selecionado = useMemo(
        () => exercicios.find(item => item.id === selecionadoId) ?? null,
        [exercicios, selecionadoId],
    );

    function abrirNovo() {
        setEditandoId(null);
        setForm(formVazio);
        setTextoSinonimos("");
        setErro("");
        setEditorAberto(true);
    }

    function abrirEdicao(item: ExercicioCatalogo) {
        setEditandoId(item.id);
        setForm({
            nome: item.nome,
            grupoMuscular: item.grupoMuscular ?? "",
            equipamento: item.equipamento ?? "",
            dificuldade: item.dificuldade ?? "",
            descricao: item.descricao ?? "",
            instrucoes: item.instrucoes ?? "",
            sinonimos: item.sinonimos,
        });
        setTextoSinonimos(item.sinonimos.join("\n"));
        setErro("");
        setEditorAberto(true);
    }

    async function salvarExercicio(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setEnviando(true);
        setErro("");
        setSucesso("");
        const payload = {
            ...form,
            sinonimos: textoSinonimos.split(/[\n,;]/).map(value => value.trim()).filter(Boolean),
        };
        try {
            const salvo = editandoId
                ? await exercicioCatalogoService.atualizar(editandoId, payload)
                : await exercicioCatalogoService.criar(payload);
            setEditorAberto(false);
            setSelecionadoId(salvo.id);
            setSucesso(editandoId ? "Exercício atualizado." : "Exercício cadastrado.");
            await carregar(consulta);
        } catch (error) {
            setErro(mensagemErro(error));
        } finally {
            setEnviando(false);
        }
    }

    async function enviarVideo(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!selecionado || !arquivo) {
            setErro("Escolha um arquivo MP4 antes de enviar.");
            return;
        }
        if (arquivo.size > 100 * 1024 * 1024) {
            setErro("O vídeo precisa ter até 100 MB.");
            return;
        }
        if (!confirmouDireitos) {
            setErro("Confirme que você possui os direitos ou autorização para usar este vídeo.");
            return;
        }
        if (licenca === "LICENCIADO" && !fonte.trim()) {
            setErro("Informe a origem ou autorização do vídeo licenciado.");
            return;
        }

        const payload = new FormData();
        payload.append("Arquivo", arquivo);
        payload.append("Titulo", tituloVideo.trim() || arquivo.name.replace(/\.mp4$/i, ""));
        payload.append("Licenca", licenca);
        payload.append("Fonte", fonte.trim());
        payload.append("ConfirmouDireitos", String(confirmouDireitos));
        if (duracao.trim() && Number.isFinite(Number(duracao))) {
            payload.append("DuracaoSegundos", String(Math.max(0, Math.round(Number(duracao)))));
        }

        setEnviando(true);
        setErro("");
        setSucesso("");
        try {
            await exercicioCatalogoService.enviarVideo(selecionado.id, payload);
            setArquivo(null);
            setTituloVideo("");
            setFonte("");
            setConfirmouDireitos(false);
            setDuracao("");
            setSucesso("Vídeo adicionado à biblioteca.");
            await carregar(consulta);
        } catch (error) {
            setErro(mensagemErro(error));
        } finally {
            setEnviando(false);
        }
    }

    async function definirPrincipal(videoId: string) {
        if (!selecionado) return;
        setErro("");
        try {
            await exercicioCatalogoService.definirPrincipal(selecionado.id, videoId);
            setSucesso("Vídeo principal atualizado.");
            await carregar(consulta);
        } catch (error) {
            setErro(mensagemErro(error));
        }
    }

    async function excluirVideo(videoId: string) {
        if (!selecionado || !window.confirm("Remover este vídeo do catálogo?")) return;
        setErro("");
        try {
            await exercicioCatalogoService.excluirVideo(selecionado.id, videoId);
            setSucesso("Vídeo removido.");
            await carregar(consulta);
        } catch (error) {
            setErro(mensagemErro(error));
        }
    }

    return (
        <section className="w-full max-w-[1500px] space-y-5">
            <div className="flex flex-col justify-between gap-4 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-end">
                <div>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--accent-text)]">
                        Treinamento / Conteúdo
                    </p>
                    <h1 className="text-[28px] font-semibold tracking-[-0.045em] text-[var(--text-primary)]">
                        Biblioteca de exercícios
                    </h1>
                    <p className="mt-2 max-w-2xl text-[12px] leading-5 text-[var(--text-secondary)]">
                        Centralize nomes, sinônimos e demonstrações. Quando o exercício for escrito na prescrição,
                        o catálogo ajuda a reconhecer o movimento e entregar o vídeo certo no mobile.
                    </p>
                </div>
                <button type="button" onClick={abrirNovo} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 text-[11px] font-bold text-white transition hover:brightness-110">
                    <BsPlusLg /> Novo exercício
                </button>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                    <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">Exercícios</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--text-primary)]">{exercicios.length}</p>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                    <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">Com vídeo</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--text-primary)]">{exercicios.filter(item => item.videos.length > 0).length}</p>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                    <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">Vídeos disponíveis</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--text-primary)]">{exercicios.reduce((total, item) => total + item.videos.length, 0)}</p>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                    <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">Sem demonstração</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--text-primary)]">{exercicios.filter(item => item.videos.length === 0).length}</p>
                </div>
            </div>

            {erro ? <div role="alert" className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-[11px] text-red-600">{erro}</div> : null}
            {sucesso ? <div role="status" className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-[11px] text-emerald-700">{sucesso}</div> : null}

            <div className="grid gap-4 xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.4fr)]">
                <aside className="min-w-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                    <div className="border-b border-[var(--border)] p-4">
                        <label className="relative block">
                            <BsSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                            <input
                                value={consulta}
                                onChange={event => setConsulta(event.target.value)}
                                placeholder="Buscar exercício ou sinônimo..."
                                className={`${inputClass} pl-9 pr-10`}
                            />
                            {consulta ? <button type="button" onClick={() => setConsulta("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"><BsX /></button> : null}
                        </label>
                        <div className="mt-3 flex items-center justify-between">
                            <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">Catálogo compartilhado</span>
                            <button type="button" onClick={() => void carregar(consulta)} className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--accent-text)]"><BsArrowClockwise /> Atualizar</button>
                        </div>
                    </div>
                    <div className="max-h-[720px] overflow-y-auto p-2">
                        {carregando ? (
                            <div className="space-y-2 p-2">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-[76px] animate-pulse rounded-xl bg-[var(--row-hover)]" />)}</div>
                        ) : exercicios.length ? exercicios.map(item => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setSelecionadoId(item.id)}
                                className={`mb-1 w-full rounded-xl border p-3 text-left transition ${selecionadoId === item.id ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-transparent hover:border-[var(--border)] hover:bg-[var(--row-hover)]"}`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <span className="min-w-0 text-[12px] font-bold text-[var(--text-primary)]">{item.nome}</span>
                                    <span className={`shrink-0 rounded-md px-2 py-1 text-[9px] font-bold ${item.videos.length ? "bg-emerald-500/10 text-emerald-700" : "bg-[var(--row-hover)] text-[var(--text-muted)]"}`}>{item.videos.length ? `${item.videos.length} vídeo(s)` : "Sem vídeo"}</span>
                                </div>
                                <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-[var(--text-muted)]">
                                    <span className="truncate">{item.grupoMuscular || "Grupo não definido"}{item.equipamento ? ` · ${item.equipamento}` : ""}</span>
                                    <span className="shrink-0">{item.sinonimos.length} sinônimos</span>
                                </div>
                            </button>
                        )) : (
                            <div className="px-5 py-12 text-center">
                                <BsCollectionPlay className="mx-auto text-2xl text-[var(--text-muted)]" />
                                <p className="mt-3 text-[12px] font-bold text-[var(--text-primary)]">Nenhum exercício encontrado</p>
                                <p className="mt-1 text-[10px] text-[var(--text-muted)]">Tente outro nome ou cadastre um novo movimento.</p>
                                <button type="button" onClick={abrirNovo} className="mt-4 text-[10px] font-bold text-[var(--accent-text)]">Cadastrar exercício</button>
                            </div>
                        )}
                    </div>
                </aside>

                <div className="min-w-0 space-y-4">
                    {selecionado ? (
                        <>
                            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
                                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--accent-text)]">Exercício selecionado</p>
                                        <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">{selecionado.nome}</h2>
                                        <p className="mt-1 text-[10px] text-[var(--text-muted)]">{[selecionado.grupoMuscular, selecionado.equipamento, selecionado.dificuldade].filter(Boolean).join(" · ") || "Complete os dados para enriquecer a identificação."}</p>
                                    </div>
                                    <button type="button" onClick={() => abrirEdicao(selecionado)} className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-[var(--border-strong)] px-3 text-[10px] font-bold text-[var(--text-secondary)] transition hover:bg-[var(--row-hover)]">
                                        <BsPencil /> Editar dados
                                    </button>
                                </div>
                                {selecionado.sinonimos.length ? (
                                    <div className="mt-4 flex flex-wrap gap-1.5">
                                        {selecionado.sinonimos.map(sinonimo => <span key={sinonimo} className="rounded-full bg-[var(--row-hover)] px-2.5 py-1 text-[9px] text-[var(--text-secondary)]">{sinonimo}</span>)}
                                    </div>
                                ) : <p className="mt-3 text-[10px] text-[var(--text-muted)]">Adicione sinônimos usados pela equipe para melhorar a identificação automática.</p>}
                                {selecionado.instrucoes ? <p className="mt-4 whitespace-pre-wrap text-[11px] leading-5 text-[var(--text-secondary)]">{selecionado.instrucoes}</p> : null}
                            </div>

                            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-[13px] font-bold text-[var(--text-primary)]">Demonstrações disponíveis</h3>
                                        <p className="mt-1 text-[10px] text-[var(--text-muted)]">O vídeo principal é exibido automaticamente na execução do mobile.</p>
                                    </div>
                                    <span className="rounded-lg bg-[var(--row-hover)] px-2.5 py-1 text-[10px] font-bold text-[var(--text-secondary)]">{selecionado.videos.length}</span>
                                </div>
                                {selecionado.videos.length ? (
                                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                                        {selecionado.videos.map(video => (
                                            <div key={video.id} className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background)]">
                                                <video
                                                    key={video.url}
                                                    src={resolverUrlVideo(video.url)}
                                                    controls
                                                    muted
                                                    loop
                                                    playsInline
                                                    preload="metadata"
                                                    crossOrigin={video.url.includes("/api/exercicios/catalogo/videos/") ? "use-credentials" : undefined}
                                                    className="aspect-video w-full bg-black object-contain"
                                                />
                                                <div className="p-3">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="min-w-0">
                                                            <p className="truncate text-[11px] font-bold text-[var(--text-primary)]">{video.titulo}</p>
                                                            <p className="mt-1 text-[9px] text-[var(--text-muted)]">{video.origem} · {video.licenca}{video.duracaoSegundos ? ` · ${video.duracaoSegundos.toFixed(1)}s` : ""}</p>
                                                        </div>
                                                        {video.principal ? <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1 text-[9px] font-bold text-amber-700"><BsStarFill /> Principal</span> : null}
                                                    </div>
                                                    {video.fonte ? <p className="mt-2 break-all text-[9px] text-[var(--text-muted)]">{video.fonte}</p> : null}
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        {!video.principal ? <button type="button" onClick={() => void definirPrincipal(video.id)} className="rounded-lg border border-[var(--border-strong)] px-2.5 py-1.5 text-[9px] font-bold text-[var(--text-secondary)] hover:bg-[var(--row-hover)]">Definir principal</button> : null}
                                                        <button type="button" onClick={() => void excluirVideo(video.id)} className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 px-2.5 py-1.5 text-[9px] font-bold text-red-600 hover:bg-red-500/10"><BsTrash3 /> Remover</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="mt-4 rounded-xl border border-dashed border-[var(--border-strong)] px-4 py-8 text-center">
                                        <BsPlayCircle className="mx-auto text-2xl text-[var(--text-muted)]" />
                                        <p className="mt-2 text-[11px] font-bold text-[var(--text-primary)]">Ainda não há vídeo para este exercício</p>
                                        <p className="mt-1 text-[10px] text-[var(--text-muted)]">Adicione uma demonstração própria ou licenciada abaixo.</p>
                                    </div>
                                )}
                            </div>

                            <form onSubmit={enviarVideo} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
                                <div className="flex items-center gap-2">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-text)]"><BsUpload /></span>
                                    <div>
                                        <h3 className="text-[13px] font-bold text-[var(--text-primary)]">Adicionar vídeo</h3>
                                        <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">MP4 até 100 MB · armazenamento privado na API</p>
                                    </div>
                                </div>
                                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                    <label className="sm:col-span-2">
                                        <span className={labelClass}>Arquivo MP4</span>
                                        <input type="file" accept="video/mp4,.mp4" onChange={event => setArquivo(event.target.files?.[0] ?? null)} className={`${inputClass} file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--accent-soft)] file:px-3 file:py-1.5 file:text-[10px] file:font-bold file:text-[var(--accent-text)]`} />
                                    </label>
                                    <label>
                                        <span className={labelClass}>Título do vídeo</span>
                                        <input value={tituloVideo} onChange={event => setTituloVideo(event.target.value)} placeholder="Ex.: Execução lateral" className={inputClass} />
                                    </label>
                                    <label>
                                        <span className={labelClass}>Duração em segundos (opcional)</span>
                                        <input type="number" min={0} max={3600} step={1} value={duracao} onChange={event => setDuracao(event.target.value)} inputMode="numeric" placeholder="Ex.: 12" className={inputClass} />
                                    </label>
                                    <label>
                                        <span className={labelClass}>Direito de uso</span>
                                        <select value={licenca} onChange={event => setLicenca(event.target.value)} className={inputClass}>
                                            <option value="PROPRIO">Vídeo próprio</option>
                                            <option value="LICENCIADO">Vídeo licenciado/autorizado</option>
                                        </select>
                                    </label>
                                    <label>
                                        <span className={labelClass}>Fonte / autorização {licenca === "LICENCIADO" ? "(obrigatório)" : "(opcional)"}</span>
                                        <input value={fonte} onChange={event => setFonte(event.target.value)} placeholder="URL, autor ou documento de autorização" className={inputClass} />
                                    </label>
                                </div>
                                <label className="mt-4 flex cursor-pointer items-start gap-2 rounded-xl bg-[var(--row-hover)] p-3">
                                    <input type="checkbox" checked={confirmouDireitos} onChange={event => setConfirmouDireitos(event.target.checked)} className="mt-0.5 accent-[var(--accent)]" />
                                    <span className="text-[10px] leading-4 text-[var(--text-secondary)]">Confirmo que a equipe possui os direitos autorais, licença ou autorização necessária para armazenar e exibir este vídeo no aplicativo.</span>
                                </label>
                                <div className="mt-4 flex justify-end">
                                    <button type="submit" disabled={enviando || !arquivo} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 text-[10px] font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
                                        {enviando ? <BsArrowClockwise className="animate-spin" /> : <BsUpload />} Enviar vídeo
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface)] p-8 text-center">
                            <BsCollectionPlay className="text-3xl text-[var(--text-muted)]" />
                            <h2 className="mt-3 text-[14px] font-bold text-[var(--text-primary)]">Escolha um exercício</h2>
                            <p className="mt-1 max-w-sm text-[11px] leading-5 text-[var(--text-muted)]">Selecione um movimento na lista para gerenciar seus nomes alternativos e demonstrações.</p>
                        </div>
                    )}
                </div>
            </div>

            {editorAberto ? (
                <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/55 p-3 backdrop-blur-sm" onMouseDown={event => { if (event.target === event.currentTarget) setEditorAberto(false); }}>
                    <form onSubmit={salvarExercicio} className="my-auto w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl sm:p-6">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--accent-text)]">Catálogo central</p>
                                <h2 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{editandoId ? "Editar exercício" : "Novo exercício"}</h2>
                            </div>
                            <button type="button" onClick={() => setEditorAberto(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--row-hover)]"><BsX size={18} /></button>
                        </div>
                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                            <label className="sm:col-span-2">
                                <span className={labelClass}>Nome oficial *</span>
                                <input required minLength={2} maxLength={160} value={form.nome} onChange={event => setForm(current => ({ ...current, nome: event.target.value }))} placeholder="Ex.: Supino inclinado com halteres" className={inputClass} />
                            </label>
                            <label>
                                <span className={labelClass}>Grupo muscular</span>
                                <input value={form.grupoMuscular ?? ""} onChange={event => setForm(current => ({ ...current, grupoMuscular: event.target.value }))} placeholder="Ex.: Peitoral" className={inputClass} />
                            </label>
                            <label>
                                <span className={labelClass}>Equipamento</span>
                                <input value={form.equipamento ?? ""} onChange={event => setForm(current => ({ ...current, equipamento: event.target.value }))} placeholder="Ex.: Halteres e banco" className={inputClass} />
                            </label>
                            <label>
                                <span className={labelClass}>Dificuldade</span>
                                <select value={form.dificuldade ?? ""} onChange={event => setForm(current => ({ ...current, dificuldade: event.target.value }))} className={inputClass}>
                                    <option value="">Não definida</option>
                                    <option value="Iniciante">Iniciante</option>
                                    <option value="Intermediário">Intermediário</option>
                                    <option value="Avançado">Avançado</option>
                                </select>
                            </label>
                            <label className="sm:col-span-2">
                                <span className={labelClass}>Sinônimos / nomes que o algoritmo deve reconhecer</span>
                                <textarea rows={4} value={textoSinonimos} onChange={event => setTextoSinonimos(event.target.value)} placeholder={"Supino inclinado halter\nPress inclinado com halteres\nSupino 45 graus"} className={inputClass} />
                                <span className="mt-1 block text-[9px] text-[var(--text-muted)]">Separe por linha, vírgula ou ponto e vírgula. Inclua abreviações usadas pelos personais.</span>
                            </label>
                            <label className="sm:col-span-2">
                                <span className={labelClass}>Descrição curta</span>
                                <textarea rows={2} value={form.descricao ?? ""} onChange={event => setForm(current => ({ ...current, descricao: event.target.value }))} className={inputClass} />
                            </label>
                            <label className="sm:col-span-2">
                                <span className={labelClass}>Orientações de execução</span>
                                <textarea rows={3} value={form.instrucoes ?? ""} onChange={event => setForm(current => ({ ...current, instrucoes: event.target.value }))} className={inputClass} />
                            </label>
                        </div>
                        <div className="mt-5 flex flex-col-reverse justify-end gap-2 border-t border-[var(--border)] pt-4 sm:flex-row">
                            <button type="button" onClick={() => setEditorAberto(false)} className="h-10 rounded-xl border border-[var(--border-strong)] px-4 text-[10px] font-bold text-[var(--text-secondary)]">Cancelar</button>
                            <button type="submit" disabled={enviando} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 text-[10px] font-bold text-white disabled:opacity-50">
                                {enviando ? <BsArrowClockwise className="animate-spin" /> : <BsCheck2 />} Salvar exercício
                            </button>
                        </div>
                    </form>
                </div>
            ) : null}
        </section>
    );
}
