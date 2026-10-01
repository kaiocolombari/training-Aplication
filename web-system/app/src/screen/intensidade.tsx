import { useMemo, useState } from "react";
import { useAvaliacao } from "../context/avaliacaoContext";
import navTool from "../components/navTool";
import { FaRunning } from "react-icons/fa";

const STIMULO_MAX_POSSIVEL = 15 * 1 * 1.1;

type SerieIntensidade = {
    reps?: string;
    carga?: string;
    rir?: string;
};

function extrairNumeros(valor: unknown) {
    return String(valor ?? "")
        .replace(",", ".")
        .match(/\d+(\.\d+)?/g)
        ?.map(Number)
        .filter((numero) => Number.isFinite(numero)) ?? [];
}

function limitarNumero(valor: number, minimo: number, maximo: number) {
    return Math.min(Math.max(valor, minimo), maximo);
}

function calcularFatorCarga(reps: number) {
    if (reps <= 5) return 1.1;
    if (reps <= 10) return 1;
    if (reps <= 15) return 0.9;
    if (reps <= 20) return 0.7;
    return 0.5;
}

function calcularSeries(valor: unknown) {
    const numeros = extrairNumeros(valor);
    return numeros[0] && numeros[0] > 0 ? Math.floor(numeros[0]) : 0;
}

function calcularRepeticoes(valor: unknown) {
    const texto = String(valor ?? "").toLowerCase();
    const numeros = extrairNumeros(texto);

    if (!numeros.length) return 0;

    if (texto.includes("+")) {
        return numeros.reduce((total, numero) => total + numero, 0);
    }

    if (numeros.length >= 2 && (texto.includes("-") || texto.includes(" a "))) {
        return (numeros[0] + numeros[1]) / 2;
    }

    return numeros[0];
}

function calcularNumero(valor: unknown) {
    const numeros = extrairNumeros(valor);
    return numeros[0] ?? 0;
}

function calcularRir(valor: unknown) {
    const numeros = extrairNumeros(valor);

    if (!numeros.length) return null;

    return limitarNumero(numeros[0], 0, 5);
}

function formatarPercentual(valor: number | null) {
    if (valor === null || !Number.isFinite(valor)) return "-";
    return `${Math.round(valor)}%`;
}

function formatarDecimal(valor: number | null, casas = 2) {
    if (valor === null || !Number.isFinite(valor)) return "-";
    return valor.toFixed(casas);
}

function getValorSerie(
    exercicio: any,
    serieIndex: number,
    campo: keyof SerieIntensidade
) {
    const serie = exercicio?.seriesIntensidade?.[serieIndex];

    if (serie?.[campo] !== undefined) {
        return serie[campo] ?? "";
    }

    if (campo === "reps") return String(exercicio?.repeticoes ?? "");
    if (campo === "carga") return String(exercicio?.carga ?? "");
    if (campo === "rir") return String(exercicio?.rirMax ?? "");

    return "";
}

function calcularIntensidadeSerie(serie: SerieIntensidade) {
    const reps = calcularRepeticoes(serie.reps);
    const carga = calcularNumero(serie.carga);
    const rir = calcularRir(serie.rir);

    if (!reps || rir === null) {
        return null;
    }

    const esforco = (5 - rir) / 5;
    const fatorCarga = calcularFatorCarga(reps);
    const stimulo = reps * esforco * fatorCarga;
    const intensidade = limitarNumero(
        (stimulo / STIMULO_MAX_POSSIVEL) * 100,
        0,
        100
    );

    const umRmEstimado = carga
        ? carga * (1 + (reps + rir) / 30)
        : 0;

    const percentualUmRm =
        carga && umRmEstimado
            ? (carga / umRmEstimado) * 100
            : null;

    return {
        reps,
        carga,
        rir,
        esforco,
        percentualEsforco: esforco * 100,
        percentualUmRm,
        stimulo,
        intensidade,
    };
}

function montarSeriesDoExercicio(exercicio: any) {
    const totalSeries = calcularSeries(exercicio?.series);

    return Array.from({ length: totalSeries }).map((_, serieIndex) => ({
        reps: getValorSerie(exercicio, serieIndex, "reps"),
        carga: getValorSerie(exercicio, serieIndex, "carga"),
        rir: getValorSerie(exercicio, serieIndex, "rir"),
    }));
}

function calcularResumoExercicio(exercicio: any) {
    const series = montarSeriesDoExercicio(exercicio);

    const intensidades = series
        .map((serie) => calcularIntensidadeSerie(serie))
        .filter(Boolean) as NonNullable<
            ReturnType<typeof calcularIntensidadeSerie>
        >[];

    if (!intensidades.length) {
        return {
            seriesValidas: 0,
            hardSets: 0,
            intensidade: null,
        };
    }

    const intensidade =
        intensidades.reduce(
            (total, serie) => total + serie.intensidade,
            0
        ) / intensidades.length;

    return {
        seriesValidas: intensidades.length,
        hardSets: intensidades.filter((serie) => serie.rir <= 3).length,
        intensidade,
    };
}

function calcularResumoTreino(treino: any) {
    const exercicios = (treino?.exercicios ?? []).filter(
        (exercicio: any) =>
            exercicio?.exercicio ||
            calcularSeries(exercicio?.series)
    );

    const resumosExercicio = exercicios
        .map((exercicio: any) => calcularResumoExercicio(exercicio))
        .filter((resumo: any) => resumo.intensidade !== null);

    if (!resumosExercicio.length) {
        return {
            exerciciosValidos: 0,
            seriesValidas: 0,
            hardSets: 0,
            intensidade: null,
        };
    }

    return {
        exerciciosValidos: resumosExercicio.length,

        seriesValidas: resumosExercicio.reduce(
            (total: number, resumo: any) =>
                total + resumo.seriesValidas,
            0
        ),

        hardSets: resumosExercicio.reduce(
            (total: number, resumo: any) =>
                total + resumo.hardSets,
            0
        ),

        intensidade:
            resumosExercicio.reduce(
                (total: number, resumo: any) =>
                    total + resumo.intensidade,
                0
            ) / resumosExercicio.length,
    };
}

export default function Intensidade() {
    const { avaliacao, setAvaliacao } = useAvaliacao();

    const [exerciciosAbertos, setExerciciosAbertos] =
        useState<Record<string, boolean>>({});

    const resumosTreino = useMemo(
        () =>
            Array.from({ length: 12 }).map((_, treinoIndex) =>
                calcularResumoTreino(
                    avaliacao?.treino?.[treinoIndex]
                )
            ),
        [avaliacao?.treino]
    );

    function alternarDetalhes(
        treinoIndex: number,
        exercicioIndex: number
    ) {
        const chave = `${treinoIndex}-${exercicioIndex}`;

        setExerciciosAbertos((estadoAtual) => ({
            ...estadoAtual,
            [chave]: !estadoAtual[chave],
        }));
    }

    function alterarSerie(
        treinoIndex: number,
        exercicioIndex: number,
        serieIndex: number,
        campo: keyof SerieIntensidade,
        valor: string
    ) {
        setAvaliacao((avaliacaoAtual: any) => {
            const treinos = [
                ...(avaliacaoAtual?.treino ?? []),
            ];

            const treino = {
                ...(treinos[treinoIndex] ?? {}),
            };

            const exercicios = [
                ...(treino.exercicios ?? []),
            ];

            const exercicio = {
                ...(exercicios[exercicioIndex] ?? {}),
            };

            const seriesIntensidade = [
                ...(exercicio.seriesIntensidade ?? []),
            ];

            seriesIntensidade[serieIndex] = {
                ...(seriesIntensidade[serieIndex] ?? {}),
                [campo]: valor,
            };

            exercicios[exercicioIndex] = {
                ...exercicio,
                seriesIntensidade,
            };

            treino.exercicios = exercicios;
            treinos[treinoIndex] = treino;

            return {
                ...avaliacaoAtual,
                treino: treinos,
            };
        });
    }

    return (
        <main className="min-h-full bg-[#ececec] p-3 md:p-5">
            <div
                className="
                    mb-10
                    flex flex-col gap-4
                    rounded-3xl
                    border border-zinc-300
                    bg-[#f7f7f7]
                    p-6
                    shadow-sm
                    md:flex-row
                    md:items-center
                    md:justify-between
                "
            >
                <div className="flex items-center gap-4">
                    <div>
                        <p
                            className="
                                mb-1
                                text-xs
                                font-bold
                                uppercase
                                tracking-[0.2em]
                                text-[#a85f60]
                            "
                        >
                            Intensidade
                        </p>

                        <h1
                            className="
                                text-2xl
                                font-black
                                tracking-tight
                                text-zinc-800
                                md:text-3xl
                            "
                        >
                            Volume - Intensidade
                        </h1>

                        <p className="mt-1 text-sm text-zinc-500">
                            Configure e acompanhe a intensidade dos exercícios
                            de cada treino.
                        </p>
                    </div>
                </div>
                <div
                    className="
                        flex items-center gap-3
                        rounded-2xl
                        border border-zinc-300
                        bg-[#eeeeee]
                        px-4 py-3
                    "
                >
                    <div
                        className="
                            flex h-10 w-10
                            items-center justify-center
                            rounded-xl
                            bg-[#8f4f51]
                            text-white
                        "
                    >
                        <FaRunning />
                    </div>

                    <div>
                        <p
                            className="
                                text-xs
                                font-semibold
                                uppercase
                                tracking-wide
                                text-zinc-400
                            "
                        >
                            Treinos
                        </p>

                        <p
                            className="
                                text-sm
                                font-black
                                text-zinc-700
                            "
                        >
                            12 disponíveis
                        </p>
                    </div>
                </div>
            </div>
            <section className="mt-6 grid gap-5">
                {Array.from({ length: 12 }).map(
                    (_, treinoIndex) => {
                        const treino =
                            avaliacao?.treino?.[treinoIndex];

                        const resumoTreino =
                            resumosTreino[treinoIndex];

                        return (
                            <article
                                className="
                                    overflow-hidden
                                    rounded-3xl
                                    border
                                    border-zinc-300
                                    bg-[#f7f7f7]
                                    p-4
                                    shadow-sm
                                "
                                key={treinoIndex}
                            >
                                <div
                                    className="
                                        flex flex-col gap-3
                                        rounded-2xl
                                        border
                                        border-zinc-300
                                        bg-[#eeeeee]
                                        p-4
                                        md:flex-row
                                        md:items-end
                                        md:justify-between
                                    "
                                >
                                    <div>
                                        <span
                                            className="
                                                text-xs
                                                font-bold
                                                uppercase
                                                tracking-wide
                                                text-zinc-500
                                            "
                                        >
                                            Treino {treinoIndex + 1}
                                        </span>

                                        <h2
                                            className="
                                                text-xl
                                                font-bold
                                                italic
                                                uppercase
                                                tracking-wide
                                                text-[#a85f60]
                                            "
                                        >
                                            {treino?.nome ||
                                                "Sem nome"}
                                        </h2>
                                    </div>

                                    <div
                                        className="
                                            flex flex-wrap
                                            gap-3
                                            text-sm
                                            font-bold
                                            uppercase
                                            text-zinc-600
                                        "
                                    >
                                        <span
                                            className="
                                                rounded-xl
                                                border
                                                border-zinc-300
                                                bg-[#e2e2e2]
                                                px-3
                                                py-2
                                            "
                                        >
                                            Exercícios:{" "}
                                            {resumoTreino.exerciciosValidos}
                                        </span>

                                        <span
                                            className="
                                                rounded-xl
                                                border
                                                border-zinc-300
                                                bg-[#e2e2e2]
                                                px-3
                                                py-2
                                            "
                                        >
                                            Séries válidas:{" "}
                                            {resumoTreino.seriesValidas}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-4 grid gap-3">
                                    {Array.from({ length: 12 }).map(
                                        (_, exercicioIndex) => {
                                            const exercicio =
                                                treino?.exercicios?.[
                                                exercicioIndex
                                                ];

                                            const totalSeries =
                                                calcularSeries(
                                                    exercicio?.series
                                                );

                                            const resumoExercicio =
                                                calcularResumoExercicio(
                                                    exercicio
                                                );

                                            const chave = `${treinoIndex}-${exercicioIndex}`;

                                            const aberto =
                                                exerciciosAbertos[
                                                chave
                                                ];

                                            if (
                                                !exercicio?.exercicio &&
                                                !totalSeries
                                            ) {
                                                return null;
                                            }

                                            return (
                                                <div
                                                    className="
                                                        overflow-hidden
                                                        rounded-2xl
                                                        border
                                                        border-zinc-300
                                                        bg-[#eeeeee]
                                                        shadow-sm
                                                    "
                                                    key={exercicioIndex}
                                                >
                                                    <div
                                                        className="
                                                            grid gap-3
                                                            p-4
                                                            md:grid-cols-[1.5fr_90px_110px_120px]
                                                            md:items-center
                                                        "
                                                    >
                                                        <div>
                                                            <span
                                                                className="
                                                                    text-xs
                                                                    font-bold
                                                                    uppercase
                                                                    text-zinc-500
                                                                "
                                                            >
                                                                Exercício
                                                            </span>

                                                            <p
                                                                className="
                                                                    text-lg
                                                                    font-bold
                                                                    text-zinc-800
                                                                "
                                                            >
                                                                {exercicio?.exercicio ||
                                                                    "-"}
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <span
                                                                className="
                                                                    text-xs
                                                                    font-bold
                                                                    uppercase
                                                                    text-zinc-500
                                                                "
                                                            >
                                                                Séries
                                                            </span>

                                                            <p
                                                                className="
                                                                    text-lg
                                                                    font-bold
                                                                    text-zinc-800
                                                                "
                                                            >
                                                                {totalSeries ||
                                                                    "-"}
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <span
                                                                className="
                                                                    text-xs
                                                                    font-bold
                                                                    uppercase
                                                                    text-zinc-500
                                                                "
                                                            >
                                                                Reps base
                                                            </span>

                                                            <p
                                                                className="
                                                                    text-lg
                                                                    font-bold
                                                                    text-zinc-800
                                                                "
                                                            >
                                                                {exercicio?.repeticoes ||
                                                                    "-"}
                                                            </p>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                alternarDetalhes(
                                                                    treinoIndex,
                                                                    exercicioIndex
                                                                )
                                                            }
                                                            className="
                                                                h-10
                                                                rounded-xl
                                                                border
                                                                border-[#a87576]
                                                                bg-[#f0e4e4]
                                                                px-4
                                                                text-sm
                                                                font-bold
                                                                uppercase
                                                                text-[#7d4547]
                                                                outline-none
                                                                transition-all
                                                                duration-150
                                                                hover:border-[#8f4f51]
                                                                hover:bg-[#eadada]
                                                                hover:text-[#713b3d]
                                                            "
                                                        >
                                                            {aberto
                                                                ? "Fechar"
                                                                : "Detalhes"}
                                                        </button>
                                                    </div>

                                                    {aberto && (
                                                        <div
                                                            className="
                                                                overflow-x-auto
                                                                border-t
                                                                border-zinc-300
                                                                bg-[#f7f7f7]
                                                                p-4
                                                            "
                                                        >
                                                            <table
                                                                className="
                                                                    w-full
                                                                    min-w-[900px]
                                                                    border-separate
                                                                    border-spacing-0
                                                                    overflow-hidden
                                                                    rounded-xl
                                                                "
                                                            >
                                                                <thead>
                                                                    <tr
                                                                        className="
                                                                            bg-[#eeeeee]
                                                                            font-bold
                                                                            italic
                                                                            uppercase
                                                                            text-zinc-600
                                                                        "
                                                                    >
                                                                        <th className="border border-zinc-300 px-2 py-3 text-center text-xs">
                                                                            Série
                                                                        </th>

                                                                        <th className="border border-zinc-300 px-2 py-3 text-center text-xs">
                                                                            Reps
                                                                        </th>

                                                                        <th className="border border-zinc-300 px-2 py-3 text-center text-xs">
                                                                            Carga
                                                                        </th>

                                                                        <th className="border border-zinc-300 px-2 py-3 text-center text-xs">
                                                                            %1RM
                                                                        </th>

                                                                        <th className="border border-zinc-300 px-2 py-3 text-center text-xs">
                                                                            RIR
                                                                        </th>

                                                                        <th className="border border-zinc-300 px-2 py-3 text-center text-xs">
                                                                            Esforço
                                                                        </th>

                                                                        <th className="border border-zinc-300 px-2 py-3 text-center text-xs">
                                                                            %Esforço
                                                                        </th>
                                                                    </tr>
                                                                </thead>

                                                                <tbody>
                                                                    {montarSeriesDoExercicio(
                                                                        exercicio
                                                                    ).map(
                                                                        (
                                                                            serie,
                                                                            serieIndex
                                                                        ) => {
                                                                            const intensidadeSerie =
                                                                                calcularIntensidadeSerie(
                                                                                    serie
                                                                                );

                                                                            return (
                                                                                <tr
                                                                                    key={
                                                                                        serieIndex
                                                                                    }
                                                                                >
                                                                                    <td className="border border-zinc-300 bg-[#eeeeee]">
                                                                                        <input
                                                                                            type="text"
                                                                                            value={
                                                                                                serieIndex +
                                                                                                1
                                                                                            }
                                                                                            readOnly
                                                                                            className="
                                                                                                h-10
                                                                                                w-full
                                                                                                bg-transparent
                                                                                                px-2
                                                                                                text-center
                                                                                                text-lg
                                                                                                font-bold
                                                                                                text-zinc-700
                                                                                                outline-none
                                                                                            "
                                                                                        />
                                                                                    </td>

                                                                                    <td className="border border-zinc-300 bg-[#e2e2e2]">
                                                                                        <input
                                                                                            type="text"
                                                                                            value={
                                                                                                serie.reps ??
                                                                                                ""
                                                                                            }
                                                                                            onChange={(
                                                                                                evento
                                                                                            ) =>
                                                                                                alterarSerie(
                                                                                                    treinoIndex,
                                                                                                    exercicioIndex,
                                                                                                    serieIndex,
                                                                                                    "reps",
                                                                                                    evento
                                                                                                        .target
                                                                                                        .value
                                                                                                )
                                                                                            }
                                                                                            className="
                                                                                                h-10
                                                                                                w-full
                                                                                                bg-transparent
                                                                                                px-2
                                                                                                text-center
                                                                                                text-lg
                                                                                                font-bold
                                                                                                text-[#8f4f51]
                                                                                                outline-none
                                                                                                transition-all
                                                                                                focus:bg-[#f3e5e5]
                                                                                            "
                                                                                        />
                                                                                    </td>

                                                                                    <td className="border border-zinc-300 bg-[#e2e2e2]">
                                                                                        <input
                                                                                            type="text"
                                                                                            value={
                                                                                                serie.carga ??
                                                                                                ""
                                                                                            }
                                                                                            onChange={(
                                                                                                evento
                                                                                            ) =>
                                                                                                alterarSerie(
                                                                                                    treinoIndex,
                                                                                                    exercicioIndex,
                                                                                                    serieIndex,
                                                                                                    "carga",
                                                                                                    evento
                                                                                                        .target
                                                                                                        .value
                                                                                                )
                                                                                            }
                                                                                            className="
                                                                                                h-10
                                                                                                w-full
                                                                                                bg-transparent
                                                                                                px-2
                                                                                                text-center
                                                                                                text-lg
                                                                                                font-bold
                                                                                                text-[#8f4f51]
                                                                                                outline-none
                                                                                                transition-all
                                                                                                focus:bg-[#f3e5e5]
                                                                                            "
                                                                                        />
                                                                                    </td>

                                                                                    <td className="border border-zinc-300 bg-[#eeeeee]">
                                                                                        <input
                                                                                            type="text"
                                                                                            value={formatarPercentual(
                                                                                                intensidadeSerie?.percentualUmRm ??
                                                                                                null
                                                                                            )}
                                                                                            readOnly
                                                                                            className="
                                                                                                h-10
                                                                                                w-full
                                                                                                bg-transparent
                                                                                                px-2
                                                                                                text-center
                                                                                                text-lg
                                                                                                font-bold
                                                                                                text-zinc-600
                                                                                                outline-none
                                                                                            "
                                                                                        />
                                                                                    </td>

                                                                                    <td className="border border-zinc-300 bg-[#e2e2e2]">
                                                                                        <input
                                                                                            type="text"
                                                                                            value={
                                                                                                serie.rir ??
                                                                                                ""
                                                                                            }
                                                                                            onChange={(
                                                                                                evento
                                                                                            ) =>
                                                                                                alterarSerie(
                                                                                                    treinoIndex,
                                                                                                    exercicioIndex,
                                                                                                    serieIndex,
                                                                                                    "rir",
                                                                                                    evento
                                                                                                        .target
                                                                                                        .value
                                                                                                )
                                                                                            }
                                                                                            className="
                                                                                                h-10
                                                                                                w-full
                                                                                                bg-transparent
                                                                                                px-2
                                                                                                text-center
                                                                                                text-lg
                                                                                                font-bold
                                                                                                text-[#8f4f51]
                                                                                                outline-none
                                                                                                transition-all
                                                                                                focus:bg-[#f3e5e5]
                                                                                            "
                                                                                        />
                                                                                    </td>

                                                                                    <td className="border border-zinc-300 bg-[#eeeeee]">
                                                                                        <input
                                                                                            type="text"
                                                                                            value={formatarDecimal(
                                                                                                intensidadeSerie?.esforco ??
                                                                                                null
                                                                                            )}
                                                                                            readOnly
                                                                                            className="
                                                                                                h-10
                                                                                                w-full
                                                                                                bg-transparent
                                                                                                px-2
                                                                                                text-center
                                                                                                text-lg
                                                                                                font-bold
                                                                                                text-zinc-600
                                                                                                outline-none
                                                                                            "
                                                                                        />
                                                                                    </td>

                                                                                    <td className="border border-zinc-300 bg-[#eeeeee]">
                                                                                        <input
                                                                                            type="text"
                                                                                            value={formatarPercentual(
                                                                                                intensidadeSerie?.percentualEsforco ??
                                                                                                null
                                                                                            )}
                                                                                            readOnly
                                                                                            className="
                                                                                                h-10
                                                                                                w-full
                                                                                                bg-transparent
                                                                                                px-2
                                                                                                text-center
                                                                                                text-lg
                                                                                                font-bold
                                                                                                text-zinc-600
                                                                                                outline-none
                                                                                            "
                                                                                        />
                                                                                    </td>
                                                                                </tr>
                                                                            );
                                                                        }
                                                                    )}
                                                                </tbody>
                                                            </table>

                                                            <div
                                                                className="
                                                                    mt-4
                                                                    flex flex-wrap
                                                                    justify-end
                                                                    gap-3
                                                                    text-sm
                                                                    font-bold
                                                                    uppercase
                                                                    text-zinc-600
                                                                "
                                                            >
                                                                <span
                                                                    className="
                                                                        rounded-xl
                                                                        border
                                                                        border-zinc-300
                                                                        bg-[#eeeeee]
                                                                        px-4
                                                                        py-2
                                                                    "
                                                                >
                                                                    Séries
                                                                    válidas:{" "}
                                                                    {
                                                                        resumoExercicio.seriesValidas
                                                                    }
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        }
                                    )}
                                </div>

                                <div
                                    className="
                                        mt-4
                                        flex flex-wrap
                                        justify-end
                                        gap-3
                                        border-t
                                        border-zinc-300
                                        pt-4
                                        text-sm
                                        font-bold
                                        uppercase
                                        text-zinc-600
                                    "
                                >
                                    <span
                                        className="
                                            rounded-xl
                                            border
                                            border-zinc-300
                                            bg-[#eeeeee]
                                            px-4
                                            py-2
                                        "
                                    >
                                        Intensidade do treino:{" "}
                                        <span className="text-[#8f4f51]">
                                            {formatarPercentual(
                                                resumoTreino.intensidade
                                            )}
                                        </span>
                                    </span>
                                </div>
                            </article>
                        );
                    }
                )}
            </section>

            <br />

            <div className="mt-10">
                {navTool()}
            </div>
        </main>
    );
}