import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BsActivity, BsSearch, BsShieldCheck } from "react-icons/bs";
import { auditoriaService } from "../service/auditoriaService";
import { LoadingState } from "../components/LoadingState";

function dataHora(valor: string) {
    return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(valor));
}

export default function AtividadesAdmin() {
    const [busca, setBusca] = useState("");
    const [usuarioTipo, setUsuarioTipo] = useState("");
    const [inicio, setInicio] = useState("");
    const [fim, setFim] = useState("");
    const [pagina, setPagina] = useState(1);
    const registros = useQuery({
        queryKey: ["auditoria", busca, usuarioTipo, inicio, fim, pagina],
        queryFn: () =>
            auditoriaService.listar({ busca, usuarioTipo, inicio, fim, pagina, limite: 30 }),
        refetchInterval: 30000,
    });

    return (
        <section className="mx-auto w-full max-w-[1440px] space-y-6">
            <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--border)] pb-6">
                <div>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-[var(--accent-text)]">
                        Sistema / Governança
                    </p>
                    <h1 className="text-[28px] font-semibold tracking-[-.045em] text-[var(--text-primary)]">
                        Trilha de auditoria
                    </h1>
                    <p className="mt-1.5 max-w-2xl text-[12px] leading-5 text-[var(--text-secondary)]">
                        Registro cronológico das operações realizadas na API, com responsável, rota,
                        resultado e origem da requisição.
                    </p>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[11px] font-semibold text-[var(--text-secondary)]">
                    <BsShieldCheck className="text-[var(--success)]" /> Acesso exclusivo de ADMIN
                </div>
            </header>

            <div className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_170px_160px_160px_auto] xl:items-end">
                <label className="grid gap-1.5 text-[10px] font-semibold text-[var(--text-secondary)]">
                    Buscar por usuário, ação ou rota
                    <span className="relative">
                        <BsSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                        <input
                            value={busca}
                            onChange={event => {
                                setBusca(event.target.value);
                                setPagina(1);
                            }}
                            placeholder="Ex.: aluno, login, /api/treino"
                            className="h-10 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--input-bg)] pl-9 pr-3 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                        />
                    </span>
                </label>
                <label className="grid gap-1.5 text-[10px] font-semibold text-[var(--text-secondary)]">
                    Tipo de usuário
                    <select
                        value={usuarioTipo}
                        onChange={event => {
                            setUsuarioTipo(event.target.value);
                            setPagina(1);
                        }}
                        className="h-10 rounded-lg border border-[var(--border-strong)] bg-[var(--input-bg)] px-3 text-xs text-[var(--text-primary)]"
                    >
                        <option value="">Todos</option>
                        <option value="ADMIN">ADMIN</option>
                        <option value="PERSONAL">PERSONAL</option>
                        <option value="ALUNO">ALUNO</option>
                        <option value="ANONIMO">ANÔNIMO</option>
                    </select>
                </label>
                <label className="grid gap-1.5 text-[10px] font-semibold text-[var(--text-secondary)]">
                    De
                    <input
                        type="date"
                        value={inicio}
                        onChange={event => {
                            setInicio(event.target.value);
                            setPagina(1);
                        }}
                        className="h-10 rounded-lg border border-[var(--border-strong)] bg-[var(--input-bg)] px-3 text-xs text-[var(--text-primary)]"
                    />
                </label>
                <label className="grid gap-1.5 text-[10px] font-semibold text-[var(--text-secondary)]">
                    Até
                    <input
                        type="date"
                        value={fim}
                        onChange={event => {
                            setFim(event.target.value);
                            setPagina(1);
                        }}
                        className="h-10 rounded-lg border border-[var(--border-strong)] bg-[var(--input-bg)] px-3 text-xs text-[var(--text-primary)]"
                    />
                </label>
                <button
                    type="button"
                    onClick={() => {
                        setBusca("");
                        setUsuarioTipo("");
                        setInicio("");
                        setFim("");
                        setPagina(1);
                    }}
                    className="h-10 rounded-lg border border-[var(--border)] px-4 text-[11px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--row-hover)]"
                >
                    Limpar filtros
                </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--text-muted)]">
                <span>{registros.data?.total ?? 0} evento(s) encontrado(s)</span>
                <span>Atualização automática a cada 30 segundos</span>
            </div>

            {registros.isLoading && (
                <LoadingState label="Carregando trilha de auditoria..." className="py-12" />
            )}
            {registros.isError && (
                <p
                    role="alert"
                    className="rounded-xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-4 text-xs text-[var(--danger)]"
                >
                    Não foi possível carregar os registros. Verifique a autorização ADMIN e tente
                    novamente.
                </p>
            )}
            {registros.data && registros.data.registros.length === 0 && (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-6 py-14 text-center">
                    <BsActivity className="mx-auto text-2xl text-[var(--text-muted)]" />
                    <h2 className="mt-3 text-sm font-semibold text-[var(--text-primary)]">
                        Nenhuma atividade encontrada
                    </h2>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                        Os eventos aparecerão aqui conforme as operações forem realizadas.
                    </p>
                </div>
            )}

            <div className="ui-stagger space-y-3">
                {(registros.data?.registros ?? []).map(item => (
                    <article
                        key={item.id}
                        className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5"
                    >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span
                                        className={`rounded-md px-2 py-1 text-[9px] font-bold ${item.resultado === "SUCESSO" ? "bg-[var(--success-soft)] text-[var(--success)]" : "bg-[var(--danger-soft)] text-[var(--danger)]"}`}
                                    >
                                        {item.resultado} · {item.statusCode}
                                    </span>
                                    <span className="rounded-md bg-[var(--surface-tertiary)] px-2 py-1 text-[9px] font-bold text-[var(--text-secondary)]">
                                        {item.usuarioTipo}
                                    </span>
                                    <span className="text-[10px] text-[var(--text-muted)]">
                                        {item.acao}
                                    </span>
                                </div>
                                <h2 className="mt-2 truncate text-xs font-semibold text-[var(--text-primary)]">
                                    {item.usuarioEmail}
                                </h2>
                                <p className="mt-1 break-all font-mono text-[10px] text-[var(--text-secondary)]">
                                    {item.metodoHttp} {item.rota}
                                </p>
                            </div>
                            <time className="shrink-0 text-[10px] text-[var(--text-muted)]">
                                {dataHora(item.criadoEm)}
                            </time>
                        </div>
                        <details className="mt-3 border-t border-[var(--border)] pt-3">
                            <summary className="cursor-pointer text-[10px] font-semibold text-[var(--accent-text)]">
                                Detalhes técnicos
                            </summary>
                            <dl className="mt-3 grid gap-3 text-[10px] sm:grid-cols-2 xl:grid-cols-3">
                                <div>
                                    <dt className="text-[var(--text-muted)]">ID do responsável</dt>
                                    <dd className="mt-1 break-all font-mono text-[var(--text-secondary)]">
                                        {item.usuarioId ?? "Não autenticado"}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-[var(--text-muted)]">
                                        Recurso identificado
                                    </dt>
                                    <dd className="mt-1 break-all font-mono text-[var(--text-secondary)]">
                                        {item.recursoId ?? "Não identificado"}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-[var(--text-muted)]">Endereço IP</dt>
                                    <dd className="mt-1 font-mono text-[var(--text-secondary)]">
                                        {item.enderecoIp ?? "Não disponível"}
                                    </dd>
                                </div>
                                <div className="sm:col-span-2 xl:col-span-3">
                                    <dt className="text-[var(--text-muted)]">
                                        Navegador / cliente
                                    </dt>
                                    <dd className="mt-1 break-all text-[var(--text-secondary)]">
                                        {item.userAgent ?? "Não disponível"}
                                    </dd>
                                </div>
                            </dl>
                        </details>
                    </article>
                ))}
            </div>

            {registros.data && registros.data.totalPaginas > 1 && (
                <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                    <button
                        type="button"
                        disabled={pagina <= 1}
                        onClick={() => setPagina(value => value - 1)}
                        className="rounded-lg border border-[var(--border)] px-3 py-2 text-[10px] font-semibold text-[var(--text-secondary)] disabled:opacity-40"
                    >
                        Anterior
                    </button>
                    <span className="text-[10px] text-[var(--text-muted)]">
                        Página {pagina} de {registros.data.totalPaginas}
                    </span>
                    <button
                        type="button"
                        disabled={pagina >= registros.data.totalPaginas}
                        onClick={() => setPagina(value => value + 1)}
                        className="rounded-lg border border-[var(--border)] px-3 py-2 text-[10px] font-semibold text-[var(--text-secondary)] disabled:opacity-40"
                    >
                        Próxima
                    </button>
                </div>
            )}
        </section>
    );
}
