import type { VolumeCicloAcompanhamento } from "../service/volumeAcompanhamentoService";

function dataPt(value: string) {
    const date = new Date(`${value.slice(0, 10)}T12:00:00`);
    return Number.isNaN(date.getTime())
        ? value
        : date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function sinal(value: number) {
    return value > 0 ? `+${value}` : String(value);
}

function percentual(value: number | null) {
    if (value === null) return "Sem comparação";
    return `${value > 0 ? "+" : ""}${value.toFixed(2).replace(".", ",")}%`;
}

function statusNome(value: string | null) {
    if (value === "EVOLUCAO") return "Acima da referência";
    if (value === "QUEDA") return "Abaixo da referência";
    if (value === "MANUTENCAO") return "Igual à referência";
    return value === "REFERENCIA" ? "Referência inicial" : "Não registrado";
}

export default function VolumeCicloChart({
    ciclo,
    dark = false,
}: {
    ciclo: VolumeCicloAcompanhamento;
    dark?: boolean;
}) {
    const surface = dark
        ? "border-white/10 bg-white/[.035]"
        : "border-[var(--border)] bg-[var(--surface)]";
    const muted = dark ? "text-white/45" : "text-[var(--text-muted)]";
    const primary = dark ? "text-white" : "text-[var(--text-primary)]";
    const secondary = dark ? "text-white/65" : "text-[var(--text-secondary)]";
    const latest = [...ciclo.meses].reverse().find(month => month.series !== null);
    const maxValue = Math.max(
        ciclo.referenciaSeries,
        ...ciclo.meses.map(month => month.series ?? 0),
        1,
    );
    const scaleMax = Math.max(5, Math.ceil(maxValue * 1.2));
    const left = 42;
    const right = 18;
    const top = 16;
    const bottom = 30;
    const width = 760;
    const height = 250;
    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;
    const x = (month: number) => left + ((month - 1) / 11) * plotWidth;
    const y = (series: number) => top + plotHeight - (series / scaleMax) * plotHeight;

    const segments: string[][] = [];
    let segment: string[] = [];
    for (const month of ciclo.meses) {
        if (month.series === null) {
            if (segment.length) segments.push(segment);
            segment = [];
            continue;
        }
        segment.push(`${x(month.mesCiclo)},${y(month.series)}`);
    }
    if (segment.length) segments.push(segment);

    return (
        <section className={`rounded-2xl border p-4 sm:p-5 ${surface}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className={`text-[9px] font-bold uppercase tracking-[.16em] ${muted}`}>
                        Ciclo de 12 meses · iniciado em {dataPt(ciclo.dataInicio)}
                    </p>
                    <h4 className={`mt-1 text-[14px] font-semibold ${primary}`}>
                        {ciclo.treinoNome}
                    </h4>
                    <p className={`mt-1 text-[10px] ${muted}`}>
                        Referência fixa: {ciclo.referenciaSeries} séries planejadas por sessão
                    </p>
                    <details className="mt-2 text-[9px]">
                        <summary className={`cursor-pointer font-semibold ${secondary}`}>
                            Ver prescrição usada como referência
                        </summary>
                        <ul className={`mt-2 grid gap-1 sm:grid-cols-2 ${muted}`}>
                            {ciclo.exercicios.map((exercicio, index) => (
                                <li
                                    key={`${index}-${exercicio.exercicio}`}
                                    className="flex justify-between gap-3"
                                >
                                    <span className="truncate">{exercicio.exercicio}</span>
                                    <strong className="shrink-0">
                                        {exercicio.seriesPlanejadas} séries
                                    </strong>
                                </li>
                            ))}
                        </ul>
                    </details>
                </div>
                <span
                    className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${
                        ciclo.encerrado
                            ? dark
                                ? "bg-white/10 text-white/55"
                                : "bg-[var(--surface-tertiary)] text-[var(--text-muted)]"
                            : dark
                              ? "bg-emerald-300/10 text-emerald-200"
                              : "bg-[var(--success-soft)] text-[var(--success)]"
                    }`}
                >
                    {ciclo.encerrado ? "Ciclo encerrado" : "Ciclo em andamento"}
                </span>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <div className={`rounded-xl border p-3 ${surface}`}>
                    <p className={`text-[9px] ${muted}`}>Variação acumulada de séries</p>
                    <p className={`mt-1 text-[20px] font-semibold tracking-tight ${primary}`}>
                        {latest?.variacaoReferenciaPercentual === null ||
                        latest?.variacaoReferenciaPercentual === undefined
                            ? "—"
                            : percentual(latest.variacaoReferenciaPercentual)}
                    </p>
                    <p className={`mt-0.5 text-[9px] ${secondary}`}>
                        {latest?.diferencaReferencia === null ||
                        latest?.diferencaReferencia === undefined
                            ? "Aguardando registro"
                            : `${sinal(latest.diferencaReferencia)} séries em relação ao início`}
                    </p>
                </div>
                <div className={`rounded-xl border p-3 ${surface}`}>
                    <p className={`text-[9px] ${muted}`}>Variação do último mês registrado</p>
                    <p className={`mt-1 text-[20px] font-semibold tracking-tight ${primary}`}>
                        {latest?.variacaoMesAnteriorPercentual === null ||
                        latest?.variacaoMesAnteriorPercentual === undefined
                            ? latest?.diferencaMesAnterior !== null &&
                              latest?.diferencaMesAnterior !== undefined
                                ? `${sinal(latest.diferencaMesAnterior)} séries`
                                : "—"
                            : percentual(latest.variacaoMesAnteriorPercentual)}
                    </p>
                    <p className={`mt-0.5 text-[9px] ${secondary}`}>
                        {latest?.classificacaoMesAnterior
                            ? statusNome(latest.classificacaoMesAnterior)
                            : "Mês anterior sem registro comparável"}
                    </p>
                </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border border-inherit px-1 py-2">
                <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 px-3">
                    <span className={`inline-flex items-center gap-1.5 text-[9px] ${secondary}`}>
                        <span className="h-0.5 w-4 border-t-2 border-dashed border-sky-400" />
                        Referência inicial
                    </span>
                    <span className={`inline-flex items-center gap-1.5 text-[9px] ${secondary}`}>
                        <span className="h-0.5 w-4 rounded bg-emerald-400" />
                        Séries informadas
                    </span>
                    <span className={`inline-flex items-center gap-1.5 text-[9px] ${secondary}`}>
                        <span className="h-2 w-2 rounded-full bg-emerald-400" /> Acima
                        <span className="h-2 w-2 rounded-full bg-slate-400" /> Igual
                        <span className="h-2 w-2 rounded-full bg-rose-400" /> Abaixo
                    </span>
                </div>
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    role="img"
                    aria-label={`Evolução mensal de séries de ${ciclo.treinoNome} durante 12 meses`}
                    className="h-auto w-full"
                >
                    {[0, 1, 2, 3, 4].map(tick => {
                        const value = (scaleMax / 4) * tick;
                        const tickY = y(value);
                        return (
                            <g key={tick}>
                                <line
                                    x1={left}
                                    x2={width - right}
                                    y1={tickY}
                                    y2={tickY}
                                    stroke="currentColor"
                                    opacity=".12"
                                    strokeDasharray="3 5"
                                />
                                <text
                                    x={left - 9}
                                    y={tickY + 3}
                                    textAnchor="end"
                                    fill="currentColor"
                                    opacity=".55"
                                    fontSize="10"
                                >
                                    {Math.round(value)}
                                </text>
                            </g>
                        );
                    })}
                    <line
                        x1={left}
                        x2={width - right}
                        y1={y(ciclo.referenciaSeries)}
                        y2={y(ciclo.referenciaSeries)}
                        stroke="#38bdf8"
                        strokeWidth="2"
                        strokeDasharray="7 5"
                    />
                    {segments.map((points, index) => (
                        <polyline
                            key={index}
                            points={points.join(" ")}
                            fill="none"
                            stroke="#34d399"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    ))}
                    {ciclo.meses.map(month => (
                        <g key={month.mesCiclo}>
                            {month.series !== null && (
                                <>
                                    <circle
                                        cx={x(month.mesCiclo)}
                                        cy={y(month.series)}
                                        r="5"
                                        fill={
                                            month.mesCiclo === 1
                                                ? "#38bdf8"
                                                : month.classificacaoReferencia === "EVOLUCAO"
                                                  ? "#34d399"
                                                  : month.classificacaoReferencia === "QUEDA"
                                                    ? "#fb7185"
                                                    : "#94a3b8"
                                        }
                                        stroke={dark ? "#111312" : "white"}
                                        strokeWidth="2"
                                    />
                                    <title>{`Mês ${month.mesCiclo}: ${month.series} séries`}</title>
                                </>
                            )}
                            <text
                                x={x(month.mesCiclo)}
                                y={height - 8}
                                textAnchor="middle"
                                fill="currentColor"
                                opacity=".6"
                                fontSize="10"
                            >
                                {month.mesCiclo}
                            </text>
                        </g>
                    ))}
                </svg>
                <p className={`px-3 pb-1 text-[9px] ${muted}`}>
                    Meses sem registro ficam em branco; a linha não presume manutenção nem queda.
                </p>
            </div>

            <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[520px] text-left">
                    <thead>
                        <tr className={`border-b text-[9px] uppercase tracking-wide ${muted}`}>
                            <th className="px-2 py-2 font-semibold">Período</th>
                            <th className="px-2 py-2 font-semibold">Séries</th>
                            <th className="px-2 py-2 font-semibold">Vs. início</th>
                            <th className="px-2 py-2 font-semibold">Vs. mês anterior</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ciclo.meses.map(month => (
                            <tr
                                key={month.mesCiclo}
                                className="border-b border-inherit last:border-0"
                            >
                                <td className={`px-2 py-2 text-[10px] ${primary}`}>
                                    <span className="block font-semibold">
                                        Mês {month.mesCiclo}
                                    </span>
                                    <span className={`text-[8px] ${muted}`}>
                                        {month.mesCiclo === 1
                                            ? dataPt(month.inicio)
                                            : `${dataPt(month.inicio)} – ${dataPt(month.fim)}`}
                                    </span>
                                </td>
                                <td className={`px-2 py-2 text-[10px] font-semibold ${secondary}`}>
                                    {month.series === null
                                        ? "Não registrado"
                                        : `${month.series} séries`}
                                    {month.observacao && (
                                        <span
                                            className={`mt-0.5 block max-w-[180px] truncate text-[8px] font-normal ${muted}`}
                                            title={month.observacao}
                                        >
                                            {month.observacao}
                                        </span>
                                    )}
                                </td>
                                <td className={`px-2 py-2 text-[9px] ${secondary}`}>
                                    {month.variacaoReferenciaPercentual === null ? (
                                        month.mesCiclo === 1 ? (
                                            "Referência"
                                        ) : (
                                            "—"
                                        )
                                    ) : (
                                        <>
                                            <span className="block">
                                                {sinal(month.diferencaReferencia ?? 0)} ·{" "}
                                                {percentual(month.variacaoReferenciaPercentual)}
                                            </span>
                                            <span
                                                className={`mt-0.5 block text-[8px] ${month.classificacaoReferencia === "EVOLUCAO" ? "text-emerald-500" : month.classificacaoReferencia === "QUEDA" ? "text-rose-400" : "text-slate-400"}`}
                                            >
                                                {statusNome(month.classificacaoReferencia)}
                                            </span>
                                        </>
                                    )}
                                </td>
                                <td className={`px-2 py-2 text-[9px] ${secondary}`}>
                                    {month.diferencaMesAnterior === null
                                        ? "—"
                                        : `${sinal(month.diferencaMesAnterior)} · ${percentual(month.variacaoMesAnteriorPercentual)}`}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
