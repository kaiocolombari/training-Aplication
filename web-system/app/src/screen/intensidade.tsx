import { useMemo } from "react";
import { useAvaliacao } from "../context/avaliacaoContext";
import navTool from "../components/navTool";

const STIMULO_MAX_POSSIVEL = 15 * 1 * 1.1;

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
    return numeros[0] && numeros[0] > 0 ? numeros[0] : 0;
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

function calcularRir(valor: unknown) {
    const numeros = extrairNumeros(valor);

    if (!numeros.length) return null;

    return limitarNumero(Math.max(...numeros), 0, 5);
}

function formatarPercentual(valor: number | null) {
    if (valor === null || !Number.isFinite(valor)) return "-";
    return `${Math.round(valor)}%`;
}

function calcularIntensidadeSerie(exercicio: any) {
    const reps = calcularRepeticoes(exercicio?.repeticoes);
    const rir = calcularRir(exercicio?.rirMax);

    if (!reps || rir === null) {
        return null;
    }

    const esforco = (5 - rir) / 5;
    const fatorCarga = calcularFatorCarga(reps);
    const stimulo = reps * esforco * fatorCarga;
    const percentual = limitarNumero((stimulo / STIMULO_MAX_POSSIVEL) * 100, 0, 100);

    return {
        reps,
        rir,
        fatorCarga,
        stimulo,
        percentual,
    };
}

function calcularResumoTreino(treino: any) {
    const exercicios = treino?.exercicios ?? [];

    return exercicios.reduce(
        (resumo: any, exercicio: any) => {
            const series = calcularSeries(exercicio?.series);
            const intensidadeSerie = calcularIntensidadeSerie(exercicio);

            if (!series || !intensidadeSerie) {
                return resumo;
            }

            resumo.stimuloTotal += intensidadeSerie.stimulo * series;
            resumo.seriesValidas += series;

            if (intensidadeSerie.rir <= 3) {
                resumo.hardSets += series;
            }

            return resumo;
        },
        {
            stimuloTotal: 0,
            seriesValidas: 0,
            hardSets: 0,
        }
    );
}

export default function Intensidade() {
    const { avaliacao } = useAvaliacao();

    const resumosTreino = useMemo(
        () =>
            Array.from({ length: 12 }).map((_, treinoIndex) =>
                calcularResumoTreino(avaliacao?.treino?.[treinoIndex])
            ),
        [avaliacao?.treino]
    );

    return (
        <main className="h-full bg-[#ececec] p-3 md:p-5">
            <h1 className="w-full border-b-2 border-[#b88b8b] pb-1 text-2xl font-bold italic uppercase tracking-wide text-[#a85f60]">
                Intensidade
            </h1>

            {Array.from({ length: 12 }).map((_, treinoIndex) => {
                const treino = avaliacao?.treino?.[treinoIndex];
                const resumoTreino = resumosTreino[treinoIndex];
                const mediaStimulo = resumoTreino.seriesValidas
                    ? resumoTreino.stimuloTotal / resumoTreino.seriesValidas
                    : 0;
                const intensidadeTreino = resumoTreino.seriesValidas
                    ? limitarNumero((mediaStimulo / STIMULO_MAX_POSSIVEL) * 100, 0, 100)
                    : null;

                return (
                    <div className="mt-10 overflow-x-auto" key={treinoIndex}>
                        <div className="mt-5 flex flex-col gap-2">
                            <h1 className="w-full border-b-2 border-[#b88b8b] pb-1 text-lg font-bold italic uppercase tracking-wide text-[#a85f60]">
                                Treino {treinoIndex + 1}
                            </h1>

                            <div className="flex flex-wrap gap-3 text-sm font-bold uppercase text-zinc-700">
                                <span>Intensidade do treino: {formatarPercentual(intensidadeTreino)}</span>
                                <span>Volume: {resumoTreino.seriesValidas} séries válidas</span>
                                <span>Hard sets: {resumoTreino.hardSets}</span>
                            </div>
                        </div>

                        <div className="flex min-w-[1250px] items-start gap-4">
                            <div className="w-[115px] shrink-0">
                                <div className="pb-1 py-1 text-center text-x font-bold italic uppercase text-zinc-600 mt-3.5">
                                    Nome Treino
                                </div>

                                <input
                                    type="text"
                                    value={treino?.nome ?? ""}
                                    readOnly
                                    className="h-9 w-full border-2 border-zinc-700 bg-white px-2 text-center text-lg text-zinc-700 outline-none mt-2.5"
                                />
                            </div>

                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="font-bold italic uppercase text-zinc-600">
                                        <th className="w-[18%] px-2 py-1 text-center text-x">
                                            Exercício
                                        </th>
                                        <th className="w-[7%] px-2 py-1 text-center text-x">
                                            Séries
                                        </th>
                                        <th className="w-[8%] px-2 py-1 text-center text-x">
                                            Repetições
                                        </th>
                                        <th className="w-[9%] px-2 py-1 text-center text-x">
                                            Intervalo
                                        </th>
                                        <th className="w-[7%] px-2 py-1 text-center text-x">
                                            Carga
                                        </th>
                                        <th className="w-[6%] px-2 py-1 text-center text-x">
                                            RIR Max
                                        </th>
                                        <th className="w-[8%] px-2 py-1 text-center text-x">
                                            Intens. série
                                        </th>
                                        <th className="w-[8%] px-2 py-1 text-center text-x">
                                            Intens. exercício
                                        </th>
                                        <th className="w-[29%] px-2 py-1 text-center text-x">
                                            Observações
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {Array.from({ length: 12 }).map((_, exercicioIndex) => {
                                        const exercicio = treino?.exercicios?.[exercicioIndex];
                                        const series = calcularSeries(exercicio?.series);
                                        const intensidadeSerie = calcularIntensidadeSerie(exercicio);
                                        const intensidadeExercicio =
                                            series && intensidadeSerie ? intensidadeSerie.percentual : null;

                                        return (
                                            <tr key={exercicioIndex}>
                                                <td className="border-2 border-zinc-700">
                                                    <input
                                                        type="text"
                                                        value={exercicio?.exercicio ?? ""}
                                                        readOnly
                                                        className="h-8 w-full bg-transparent px-2 text-xl text-black outline-none"
                                                    />
                                                </td>

                                                <td className="border-2 border-zinc-700">
                                                    <input
                                                        type="text"
                                                        value={exercicio?.series ?? ""}
                                                        readOnly
                                                        className="h-8 w-full bg-transparent px-2 text-center text-xl text-black outline-none"
                                                    />
                                                </td>

                                                <td className="border-2 border-zinc-700">
                                                    <input
                                                        type="text"
                                                        value={exercicio?.repeticoes ?? ""}
                                                        readOnly
                                                        className="h-8 w-full bg-transparent px-2 text-center text-xl text-black outline-none"
                                                    />
                                                </td>

                                                <td className="border-2 border-zinc-700">
                                                    <input
                                                        type="text"
                                                        value={exercicio?.intervalo ?? ""}
                                                        readOnly
                                                        className="h-8 w-full bg-transparent px-2 text-center text-xl text-black outline-none"
                                                    />
                                                </td>

                                                <td className="border-2 border-zinc-700">
                                                    <input
                                                        type="text"
                                                        value={exercicio?.carga ?? ""}
                                                        readOnly
                                                        className="h-8 w-full bg-transparent px-2 text-center text-xl text-black outline-none"
                                                    />
                                                </td>

                                                <td className="border-2 border-zinc-700">
                                                    <input
                                                        type="text"
                                                        value={exercicio?.rirMax ?? ""}
                                                        readOnly
                                                        className="h-8 w-full bg-transparent px-2 text-center text-xl text-black outline-none"
                                                    />
                                                </td>

                                                <td className="border-2 border-zinc-700 bg-white/60">
                                                    <input
                                                        type="text"
                                                        value={formatarPercentual(intensidadeSerie?.percentual ?? null)}
                                                        readOnly
                                                        className="h-8 w-full bg-transparent px-2 text-center text-xl font-bold text-[#a85f60] outline-none"
                                                    />
                                                </td>

                                                <td className="border-2 border-zinc-700 bg-white/60">
                                                    <input
                                                        type="text"
                                                        value={formatarPercentual(intensidadeExercicio)}
                                                        readOnly
                                                        className="h-8 w-full bg-transparent px-2 text-center text-xl font-bold text-[#a85f60] outline-none"
                                                    />
                                                </td>

                                                <td className="border-2 border-zinc-700">
                                                    <input
                                                        type="text"
                                                        value={exercicio?.observacoes ?? ""}
                                                        readOnly
                                                        className="h-8 w-full bg-transparent px-2 text-xl text-black outline-none"
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })}
            <div>{navTool()}</div>
        </main>
    );
}
