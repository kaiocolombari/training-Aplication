import { useMemo, useState } from "react";
import {
    BsActivity,
    BsCheck2,
    BsChevronDown,
    BsChatDots,
    BsClipboardCheck,
    BsPersonCheck,
    BsSearch,
    BsSliders,
} from "react-icons/bs";

export interface AlunoMonitoramentoOption {
    id: string;
    nomeCompleto: string;
    email?: string;
    possuiFichaTecnica: boolean;
    tarefasAbertas: number;
    mensagensNaoLidas: number;
}

type FiltroAluno = "todos" | "tarefas" | "mensagens" | "sem-ficha" | "com-ficha";

const filtros: Array<{ id: FiltroAluno; label: string }> = [
    { id: "todos", label: "Todos" },
    { id: "tarefas", label: "Tarefas" },
    { id: "mensagens", label: "Mensagens" },
    { id: "sem-ficha", label: "Sem ficha" },
    { id: "com-ficha", label: "Com ficha" },
];

function iniciais(nome: string) {
    return nome
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(parte => parte[0]?.toUpperCase() ?? "")
        .join("");
}

export default function AlunoMonitoramentoPicker({
    alunos,
    selectedId,
    onSelectedChange,
    onOpen,
    compact = false,
    loading = false,
}: {
    alunos: AlunoMonitoramentoOption[];
    selectedId?: string;
    onSelectedChange?: (id: string) => void;
    onOpen: (id: string) => void;
    compact?: boolean;
    loading?: boolean;
}) {
    const [busca, setBusca] = useState("");
    const [filtro, setFiltro] = useState<FiltroAluno>("todos");
    const [aberto, setAberto] = useState(false);
    const selecionado = alunos.find(aluno => aluno.id === selectedId);

    const filtrados = useMemo(() => {
        const termo = busca.trim().toLocaleLowerCase("pt-BR");
        return alunos
            .filter(aluno => {
                const correspondeBusca = !termo ||
                    aluno.nomeCompleto.toLocaleLowerCase("pt-BR").includes(termo) ||
                    aluno.email?.toLocaleLowerCase("pt-BR").includes(termo);
                if (!correspondeBusca) return false;
                if (filtro === "tarefas") return aluno.tarefasAbertas > 0;
                if (filtro === "mensagens") return aluno.mensagensNaoLidas > 0;
                if (filtro === "sem-ficha") return !aluno.possuiFichaTecnica;
                if (filtro === "com-ficha") return aluno.possuiFichaTecnica;
                return true;
            })
            .sort((a, b) => a.nomeCompleto.localeCompare(b.nomeCompleto, "pt-BR"));
    }, [alunos, busca, filtro]);

    const filtrosUI = (
        <div className="flex flex-wrap gap-1.5" aria-label="Filtrar alunos">
            {filtros.map(item => (
                <button
                    key={item.id}
                    type="button"
                    onClick={() => setFiltro(item.id)}
                    aria-pressed={filtro === item.id}
                    className={`rounded-full px-3 py-1.5 text-[9px] font-semibold transition ${
                        filtro === item.id
                            ? "bg-[var(--accent)] text-[var(--on-accent)] shadow-sm"
                            : "border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--row-hover)]"
                    }`}
                >
                    {item.label}
                </button>
            ))}
        </div>
    );

    const lista = (
        <>
            <label className="flex h-10 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 focus-within:border-[var(--accent)]">
                <BsSearch className="shrink-0 text-[var(--text-muted)]" />
                <input
                    value={busca}
                    onChange={event => setBusca(event.target.value)}
                    placeholder="Buscar por nome ou e-mail..."
                    aria-label="Buscar aluno por nome ou e-mail"
                    className="min-w-0 flex-1 bg-transparent text-[11px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
                />
                <BsSliders className="shrink-0 text-[var(--text-muted)]" />
            </label>
            {filtrosUI}
            <div className={compact ? "max-h-[min(420px,60vh)] space-y-1.5 overflow-y-auto pr-1" : "grid gap-2 sm:grid-cols-2 xl:grid-cols-3"}>
                {filtrados.map(aluno => {
                    const ativo = aluno.id === selectedId;
                    return (
                        <button
                            key={aluno.id}
                            type="button"
                            onClick={() => {
                                if (compact) {
                                    setAberto(false);
                                    onOpen(aluno.id);
                                    return;
                                }
                                onSelectedChange?.(aluno.id);
                            }}
                            className={`group w-full rounded-xl border p-3 text-left transition ${
                                ativo
                                    ? "border-[var(--accent)] bg-[var(--accent-soft)] shadow-sm"
                                    : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] hover:bg-[var(--row-hover)]"
                            }`}
                        >
                            <div className="flex min-w-0 items-center gap-3">
                                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[11px] font-bold ${ativo ? "bg-[var(--accent)] text-[var(--on-accent)]" : "bg-[var(--surface-tertiary)] text-[var(--text-secondary)]"}`}>
                                    {iniciais(aluno.nomeCompleto) || <BsPersonCheck />}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-[11px] font-semibold text-[var(--text-primary)]">
                                        {aluno.nomeCompleto}
                                    </span>
                                    <span className="mt-0.5 block truncate text-[9px] text-[var(--text-muted)]">
                                        {aluno.email || "E-mail não informado"}
                                    </span>
                                </span>
                                {ativo && <BsCheck2 className="shrink-0 text-[var(--accent-text)]" />}
                            </div>
                            <span className="mt-3 flex flex-wrap items-center gap-1.5">
                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[8px] font-semibold ${aluno.possuiFichaTecnica ? "bg-[var(--success-soft)] text-[var(--success)]" : "bg-[var(--warning-soft)] text-[var(--warning)]"}`}>
                                    <BsActivity /> {aluno.possuiFichaTecnica ? "Ficha completa" : "Ficha pendente"}
                                </span>
                                {aluno.tarefasAbertas > 0 && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--warning-soft)] px-2 py-1 text-[8px] font-semibold text-[var(--warning)]" title="Tarefas abertas criadas pelo administrador ou sistema para este aluno">
                                        <BsClipboardCheck /> {aluno.tarefasAbertas} {aluno.tarefasAbertas === 1 ? "tarefa" : "tarefas"}
                                    </span>
                                )}
                                {aluno.mensagensNaoLidas > 0 && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-soft)] px-2 py-1 text-[8px] font-semibold text-[var(--accent-text)]" title="Mensagens não lidas deste aluno">
                                        <BsChatDots /> {aluno.mensagensNaoLidas} {aluno.mensagensNaoLidas === 1 ? "mensagem" : "mensagens"}
                                    </span>
                                )}
                            </span>
                        </button>
                    );
                })}
                {filtrados.length === 0 && (
                    <div className="rounded-xl border border-dashed border-[var(--border-strong)] px-4 py-8 text-center sm:col-span-2 xl:col-span-3">
                        <p className="text-[11px] font-semibold text-[var(--text-primary)]">Nenhum aluno encontrado</p>
                        <p className="mt-1 text-[9px] text-[var(--text-muted)]">Altere a busca ou escolha outro filtro.</p>
                    </div>
                )}
            </div>
        </>
    );

    if (compact) {
        return (
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setAberto(value => !value)}
                    disabled={loading || alunos.length === 0}
                    aria-expanded={aberto}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-[10px] font-semibold text-[var(--text-primary)] transition hover:bg-[var(--row-hover)] disabled:opacity-50"
                >
                    <span className="max-w-[150px] truncate">{selecionado?.nomeCompleto ?? "Trocar aluno"}</span>
                    {loading ? <span className="ui-spinner" aria-hidden="true" /> : <BsChevronDown className="text-[var(--text-muted)]" />}
                </button>
                {aberto && (
                    <>
                        <button type="button" aria-label="Fechar seletor de alunos" onClick={() => setAberto(false)} className="fixed inset-0 z-40 cursor-default" />
                        <div className="absolute right-0 z-50 mt-2 w-[min(390px,calc(100vw-2rem))] space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-2xl">
                            <div>
                                <p className="text-[10px] font-bold text-[var(--text-primary)]">Trocar aluno</p>
                                <p className="mt-0.5 text-[9px] text-[var(--text-muted)]">Pesquise e acompanhe as pendências antes de abrir.</p>
                            </div>
                            {lista}
                        </div>
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <p className="text-[10px] font-semibold text-[var(--text-primary)]">Sua carteira de alunos</p>
                    <p className="mt-0.5 text-[9px] text-[var(--text-muted)]">{filtrados.length} de {alunos.length} alunos · selecione para abrir o acompanhamento</p>
                </div>
                <span className="rounded-full bg-[var(--surface-tertiary)] px-2.5 py-1 text-[9px] font-semibold text-[var(--text-muted)]">{alunos.length} cadastrados</span>
            </div>
            {lista}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
                <p className="text-[9px] text-[var(--text-muted)]">
                    {selecionado ? `Selecionado: ${selecionado.nomeCompleto}` : "Nenhum aluno selecionado"}
                </p>
                <button
                    type="button"
                    disabled={!selecionado || loading}
                    onClick={() => selecionado && onOpen(selecionado.id)}
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--accent)] px-4 text-[10px] font-semibold text-[var(--on-accent)] transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-45"
                >
                    {loading ? "Carregando aluno..." : "Abrir acompanhamento"}
                    <BsCheck2 />
                </button>
            </div>
        </div>
    );
}
