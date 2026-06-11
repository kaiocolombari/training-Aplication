import { useEffect, useMemo, useState } from "react";
import type { ExamData } from "../types/examData";
import type { PerimetroKey } from "../types/perimetroKey";
import type { PerimetroField } from "../types/perimetroField";
import { NavLink, useNavigate } from "react-router";
import type { DobraKey } from "../types/dobraKey";
import type { DobraField } from "../types/dobraField";
import { calcularMassaAdiposa } from "../functions/calcMassaAdiposa";
import { calcularMassaMuscular } from "../functions/calcMassaMuscular";
import { calcularAreaCoxa } from "../functions/calcCoxa";
import { calcularAreaBraco } from "../functions/calcBraco";
import safeNumber from "../functions/safeNumber";
import ComposicaoCorporalChart from "../components/ComposicaoChart";
import { initialState, useAvaliacao } from "../context/avaliacaoContext";
import navTool from "../components/navTool";

const inputBaseClass =
    "h-9 w-full border border-zinc-950 border-dashed bg-white px-3 text-center text-xl font-medium text-zinc-700 outline-none transition focus:border-zinc-600";

const perimetroConfig: PerimetroField[] = [
    { key: "bracoD", label: "Braco D", index: 1 },
    { key: "bracoE", label: "Braco E", index: 2 },
    { key: "antebracoD", label: "Antebraco D", index: 3 },
    { key: "antebracoE", label: "Antebraco E", index: 4 },
    { key: "torax", label: "Torax", index: 5 },
    { key: "cintura", label: "Cintura", index: 6 },
    { key: "abdomen", label: "Abdomen", index: 7 },
    { key: "quadril", label: "Quadril", index: 8 },
    { key: "coxaSupD", label: "Coxa superior D", index: 9 },
    { key: "coxaSupE", label: "Coxa superior E", index: 10 },
    { key: "coxaMediaD", label: "Coxa media D", index: 11 },
    { key: "coxaMediaE", label: "Coxa media E", index: 12 },
    { key: "panturrilhaD", label: "Panturrilha D", index: 13 },
    { key: "panturrilhaE", label: "Panturrilha E", index: 14 },
];

function getReferenceByKey(
    key: PerimetroKey,
    data: ExamData
): number {

    const umero = parseDecimal(data.umero);
    const femur = parseDecimal(data.femur);
    const tibia = parseDecimal(data.tibia);
    const una = parseDecimal(data.una);

    const idade = Number(data.idade);

    const massa = parseDecimal(data.massa);

    const estatura = parseDecimal(data.estatura);

    const imc =
        estatura > 0
            ? massa / (estatura * estatura)
            : 0;

    const masculino =
        data.genero === "masculino";

    const estaturaFactor =
        1 + ((estatura - 1.75) * 0.25);

    const estruturaBraco =
        umero > 0
            ? (umero - 7) * 1.2
            : 0;

    const estruturaPerna =
        femur > 0
            ? (femur - 9) * 1.4
            : 0;

    const estruturaAntebraco =
        una > 0
            ? (una - 5.5) * 0.8
            : 0;

    const baseValues: Record<PerimetroKey, number> = {
        bracoD: masculino ? 36 : 31,
        bracoE: masculino ? 36 : 31,
        antebracoD: masculino ? 28 : 24,
        antebracoE: masculino ? 28 : 24,
        torax: masculino ? 100 : 90,
        cintura: masculino ? 86 : 76,
        abdomen: masculino ? 88 : 80,
        quadril: masculino ? 98 : 102,
        coxaSupD: masculino ? 56 : 52,
        coxaSupE: masculino ? 56 : 52,
        coxaMediaD: masculino ? 51 : 47,
        coxaMediaE: masculino ? 51 : 47,
        panturrilhaD: masculino ? 36 : 33,
        panturrilhaE: masculino ? 36 : 33,
    };

    let value =
        baseValues[key] * estaturaFactor;

    switch (key) {
        case "bracoD":
        case "bracoE":
            value += estruturaBraco;
            break;

        case "antebracoD":
        case "antebracoE":
            value += estruturaAntebraco;
            break;

        case "coxaSupD":
        case "coxaSupE":
        case "coxaMediaD":
        case "coxaMediaE":
        case "panturrilhaD":
        case "panturrilhaE":
            value += estruturaPerna;
            break;

        case "torax":
            value += estruturaBraco * 0.7;
            break;
    }

    const adiposityAdjustment:
        Partial<Record<PerimetroKey, number>> = {
        cintura:
            imc >= 30 ? 12 :
                imc >= 25 ? 6 : 0,

        abdomen:
            imc >= 30 ? 14 :
                imc >= 25 ? 7 : 0,

        quadril:
            imc >= 30 ? 8 :
                imc >= 25 ? 4 : 0,

        torax:
            imc >= 30 ? 5 :
                imc >= 25 ? 2 : 0,
    };

    value +=
        adiposityAdjustment[key] ?? 0;

    if (idade >= 50) {
        value -= 1.5;
    }

    return Number(value.toFixed(1));
}

const perimetroDesvios: Record<PerimetroKey, number> = {
    bracoD: 4,
    bracoE: 4,

    antebracoD: 3,
    antebracoE: 3,

    torax: 8,

    cintura: 10,

    abdomen: 10,

    quadril: 8,

    coxaSupD: 6,
    coxaSupE: 6,

    coxaMediaD: 5,
    coxaMediaE: 5,

    panturrilhaD: 3,
    panturrilhaE: 3,
};

const chartRows = 14;
const leftAxisMarks = [1, 3, 5, 6, 7, 8, 9, 11, 13];
const dobraChartRows = 8;

const dobrasConfig: DobraField[] = [
    { key: "triceps", label: "Triceps", index: 1 },
    { key: "subescapular", label: "Subescapular", index: 2 },
    { key: "biceps", label: "Biceps", index: 3 },
    { key: "iliaca", label: "Iliaca", index: 4 },
    { key: "supraespinhal", label: "Supraespinhal", index: 5 },
    { key: "abdominal", label: "Abdominal", index: 6 },
    { key: "coxaMedia", label: "Coxa media", index: 7 },
    { key: "panturrilha", label: "Panturrilha", index: 8 },
];

type DobraReference = {
    media: number;
    desvio: number;
};

function getDobraReference(
    key: DobraKey,
    data: ExamData
): DobraReference {
    const masculino = data.genero === "masculino";

    const idade = Number(data.idade);

    const massa = parseDecimal(data.massa);
    const estatura = parseDecimal(data.estatura);

    const imc =
        estatura > 0
            ? massa / (estatura * estatura)
            : 0;

    const base: Record<DobraKey, DobraReference> = {
        triceps: {
            media: masculino ? 10 : 18,
            desvio: 3,
        },

        subescapular: {
            media: masculino ? 12 : 16,
            desvio: 3,
        },

        biceps: {
            media: masculino ? 6 : 10,
            desvio: 2,
        },

        iliaca: {
            media: masculino ? 14 : 22,
            desvio: 4,
        },

        supraespinhal: {
            media: masculino ? 10 : 16,
            desvio: 3,
        },

        abdominal: {
            media: masculino ? 16 : 24,
            desvio: 5,
        },

        coxaMedia: {
            media: masculino ? 18 : 26,
            desvio: 4,
        },

        panturrilha: {
            media: masculino ? 10 : 16,
            desvio: 3,
        },
    };

    let media = base[key].media;
    const desvio = base[key].desvio;

    if (idade >= 40) {
        media += 2;
    }

    if (idade >= 50) {
        media += 4;
    }

    if (imc >= 25) {
        media += 1.5;
    }

    if (imc >= 30) {
        media += 3;
    }

    return {
        media,
        desvio,
    };
}



function classifyPressure(systolic: number, diastolic: number) {
    if (systolic >= 180 || diastolic >= 110) return "Hipertensao estagio 3";
    if (systolic >= 160 || diastolic >= 100) return "Hipertensao estagio 2";
    if (systolic >= 140 || diastolic >= 90) return "Hipertensao estagio 1";
    if (systolic >= 130 || diastolic >= 85) return "Pre-hipertensao";
    if (systolic >= 120 || diastolic >= 80) return "Elevada";
    return "Normal";
}

function sanitizeDecimal(value: string) {
    return value.replace(/[^\d.,]/g, "");
}

function sanitizeInteger(value: string) {
    return value.replace(/\D/g, "");
}

function parseDecimal(value: string) {
    const normalized = value.replace(",", ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
}

function classificationBox(label: string, value: string) {
    return (
        <div >
            <h4 className="mb-2 border-b-2 border-[#b88b8b] pb-1 text-xl font-bold italic uppercase tracking-wide text-[#a85f60]">
                {label}
            </h4>
            <span className="mb-1 block text-sm font-semibold uppercase tracking-wide text-zinc-600">Classificacao</span>
            <div className="flex h-10 items-center justify-center bg-[#4f7fb7] px-3 text-[1.25rem] font-medium text-white">
                {value}
            </div>
        </div>
    );
}

export default function App() {
    const navigate = useNavigate();
    const { avaliacao, setAvaliacao } = useAvaliacao();

    const [data, setData] = useState<ExamData>({
        nomeCompleto: avaliacao.aluno.nomeCompleto,
        genero: avaliacao.aluno.genero,
        idade: avaliacao.avaliacao2.idade,
        etnia: avaliacao.aluno.etnia,
        massa: avaliacao.avaliacao2.peso,
        estatura: avaliacao.avaliacao2.altura,
        femur: avaliacao.aluno.femur,
        tibia: avaliacao.aluno.tibia,
        una: avaliacao.aluno.una,
        umero: avaliacao.aluno.umero,
        fcRepouso: avaliacao.aluno.fcRepouso,
        fcMaxima: "",
        fcReserva: avaliacao.aluno.fcReserva,
        glicose: avaliacao.aluno.glicose,
        triglicerideos: avaliacao.aluno.triglicerideos,
        ldl: avaliacao.aluno.ldl,
        hdl: avaliacao.aluno.hdl,
        sistolica: avaliacao.aluno.sistolica,
        diastolica: avaliacao.aluno.diastolica,
    });

    const testeCarga = avaliacao.testeCarga;

    const updateTesteCarga = (
        carga: "carga1" | "carga2",
        exercicio: keyof typeof avaliacao.testeCarga.carga1,
        campo: "carga" | "repeticoes",
        valor: string
    ) => {
        setAvaliacao((current) => ({
            ...current,

            testeCarga: {
                ...current.testeCarga,

                [carga]: {
                    ...current.testeCarga[carga],

                    [exercicio]: {
                        ...current.testeCarga[carga][exercicio],

                        [campo]: valor,
                    },
                },
            },
        }));
    };

    let perimetros = avaliacao.avaliacao2.perimetros;

    const dobras1 = avaliacao.avaliacao2.dobrasCutaneas.medida1;
    const dobras2 = avaliacao.avaliacao2.dobrasCutaneas.medida2;

    const observacoes = avaliacao.anamnese2.observacoes;
    const updateObservacoes = (value: string) => {
        setAvaliacao((current) => ({
            ...current,

            anamnese2: {
                ...current.anamnese,

                observacoes: value,
            },
        }));
    };

    const updateDobra1 = (
        field: keyof typeof dobras1,
        value: string
    ) => {
        setAvaliacao((current) => ({
            ...current,

            avaliacao2: {
                ...current.avaliacao2,

                dobrasCutaneas: {
                    ...current.avaliacao2.dobrasCutaneas,

                    medida1: {
                        ...current.avaliacao2.dobrasCutaneas.medida1,
                        [field]: value,
                    },
                },
            },
        }));
    };

    const updateDobra2 = (
        field: keyof typeof dobras1,
        value: string
    ) => {
        setAvaliacao((current) => ({
            ...current,

            avaliacao2: {
                ...current.avaliacao2,

                dobrasCutaneas: {
                    ...current.avaliacao2.dobrasCutaneas,

                    medida2: {
                        ...current.avaliacao2.dobrasCutaneas.medida2,
                        [field]: value,
                    },
                },
            },
        }));
    };

    const dadosAntropometricosValidos =
        data.genero &&
        data.idade &&
        data.massa &&
        data.estatura;

    const camposFaltando = [];

    if (!data.genero) camposFaltando.push("Genero");
    if (!data.idade) camposFaltando.push("Idade");
    if (!data.massa) camposFaltando.push("Massa");
    if (!data.estatura) camposFaltando.push("Estatura");

    useEffect(() => {
        const idade = Number(data.idade);

        if (!idade || !data.genero) {
            setData((current) => ({
                ...current,
                fcMaxima: "",
                fcReserva: "",
            }));
            return;
        }

        const fcMaxima = data.genero === "feminino" ? 226 - idade : 220 - idade;
        const fcReserva = data.fcRepouso ? fcMaxima - Number(data.fcRepouso) : 0;

        setData((current) => {
            const nextMaxima = String(fcMaxima);
            const nextReserva = data.fcRepouso ? String(fcReserva) : "";

            if (current.fcMaxima === nextMaxima && current.fcReserva === nextReserva) {
                return current;
            }

            return {
                ...current,
                fcMaxima: nextMaxima,
                fcReserva: nextReserva,
            };
        });
    }, [data.idade, data.genero, data.fcRepouso]);

    function calcular1RM(carga: number, repeticoes: number) {
        if (!carga || !repeticoes) return 0;

        return carga / (1.0278 - (0.0278 * repeticoes));
    }

    function classificarForca(valor: number) {
        if (valor >= 180) return "Excelente";
        if (valor >= 140) return "Muito bom";
        if (valor >= 100) return "Bom";
        if (valor >= 70) return "Regular";

        return "Baixo";
    }

    const resultado1RM = useMemo(() => {
        return {
            supino: {
                rm: Math.round(
                    calcular1RM(
                        Number(testeCarga.carga2.supino.carga),
                        Number(testeCarga.carga2.supino.repeticoes)
                    )
                ),
            },

            terra: {
                rm: Math.round(
                    calcular1RM(
                        Number(testeCarga.carga2.terra.carga),
                        Number(testeCarga.carga2.terra.repeticoes)
                    )
                ),
            },

            remada: {
                rm: Math.round(
                    calcular1RM(
                        Number(testeCarga.carga2.remada.carga),
                        Number(testeCarga.carga2.remada.repeticoes)
                    )
                ),
            },

            agachamento: {
                rm: Math.round(
                    calcular1RM(
                        Number(testeCarga.carga2.agachamento.carga),
                        Number(testeCarga.carga2.agachamento.repeticoes)
                    )
                ),
            },
        };
    }, [testeCarga]);

    const exercicios = [
        { key: "supino", nome: "Supino reto" },
        { key: "terra", nome: "L. Terra" },
        { key: "remada", nome: "Remada" },
        { key: "agachamento", nome: "Agachamento" },
    ] as const;

    const resumoDobras = useMemo(() => {
        const mediaFinal = dobrasConfig.reduce<Record<DobraKey, string>>(
            (acc, item) => {
                const primeira = parseDecimal(dobras1[item.key]);
                const segunda = parseDecimal(dobras2[item.key]);

                const media =
                    segunda > 0
                        ? (primeira + segunda) / 2
                        : primeira;

                acc[item.key] =
                    media > 0
                        ? media.toFixed(1).replace(".", ",")
                        : "";

                return acc;
            },
            {} as Record<DobraKey, string>
        );

        const valores = dobrasConfig.map((item) =>
            parseDecimal(mediaFinal[item.key])
        );

        const somatorio = valores.reduce(
            (total, value) => total + value,
            0
        );

        const periferico =
            parseDecimal(mediaFinal.triceps) +
            parseDecimal(mediaFinal.biceps) +
            parseDecimal(mediaFinal.coxaMedia) +
            parseDecimal(mediaFinal.panturrilha);

        const central =
            parseDecimal(mediaFinal.subescapular) +
            parseDecimal(mediaFinal.iliaca) +
            parseDecimal(mediaFinal.supraespinhal) +
            parseDecimal(mediaFinal.abdominal);

        return {
            mediaFinal,
            somatorio:
                somatorio > 0
                    ? somatorio.toFixed(1).replace(".", ",")
                    : "",

            periferico:
                periferico > 0
                    ? periferico.toFixed(1).replace(".", ",")
                    : "",

            central:
                central > 0
                    ? central.toFixed(1).replace(".", ",")
                    : "",
        };
    }, [dobras1, dobras2]);

    const classificacaoPressao = useMemo(() => {
        const sistolica = Number(data.sistolica);
        const diastolica = Number(data.diastolica);

        if (!sistolica || !diastolica) return "-";
        return classifyPressure(sistolica, diastolica);
    }, [data.sistolica, data.diastolica]);



    const chartPoints = useMemo(() => {
        if (!dadosAntropometricosValidos) {
            return [];
        }

        const massa = parseDecimal(data.massa);

        return perimetroConfig
            .map((item, idx) => {
                const valorTexto = perimetros[item.key];

                if (!valorTexto) {
                    return null;
                }

                const valor = parseDecimal(valorTexto);

                const ref = getReferenceByKey(
                    item.key,
                    data
                );

                const desvio =
                    perimetroDesvios[item.key as PerimetroKey] *
                    (1 + (massa - 70) / 200);

                const score = Math.max(
                    -5,
                    Math.min(
                        5,
                        (valor - ref) / desvio
                    )
                );

                return {
                    x: score,
                    y: idx + 1,
                };
            })
            .filter(
                (
                    point
                ): point is { x: number; y: number } =>
                    point !== null
            );
    }, [
        perimetros,
        data,
        dadosAntropometricosValidos,
    ]);

    const pontosDobras = useMemo(() => {
        if (!dadosAntropometricosValidos) {
            return [];
        }

        return dobrasConfig.flatMap((item, idx) => {
            const valorTexto =
                resumoDobras.mediaFinal[item.key];

            if (!valorTexto) {
                return [];
            }

            const valor = parseDecimal(valorTexto);

            const referencia = getDobraReference(
                item.key,
                data
            );

            const score =
                (valor - referencia.media) /
                referencia.desvio;

            const limitado = Math.max(
                -4,
                Math.min(4, score)
            );

            return [
                {
                    x: limitado,
                    y: idx + 1,
                },
            ];
        });
    }, [
        resumoDobras.mediaFinal,
        data,
        dadosAntropometricosValidos,
    ]);

    const analiseCorporal = useMemo(() => {
        const massa =
            parseDecimal(data.massa);

        const gorduraKg =
            calcularMassaAdiposa(
                data,
                resumoDobras
            ) || 0;

        const areaBraco =
            calcularAreaBraco(
                perimetros,
                resumoDobras
            ) || 0;

        const areaCoxa =
            calcularAreaCoxa(
                perimetros,
                resumoDobras
            ) || 0;

        const massaMuscularKg =
            calcularMassaMuscular(
                massa,
                gorduraKg,
                data.genero,
                Number(data.idade),
                areaBraco,
                areaCoxa,
                getReferenceByKey("imc" as PerimetroKey, data)
            );

        const refBraco = getReferenceByKey("bracoD" as PerimetroKey, data);


        const refCoxa = getReferenceByKey("coxaMediaD", data);

        const percentualMuscular =
            massa > 0
                ? massaMuscularKg / massa
                : 0;

        const percentualGordura =
            massa > 0
                ? (gorduraKg / massa) * 100
                : 0;

        const classificarFaixa = (
            valor: number,
            referencia: number,
            margem = 2
        ) => {
            if (valor >= referencia + margem * 2)
                return "Muito elevada";

            if (valor >= referencia + margem)
                return "Elevada";

            if (valor >= referencia - margem)
                return "Normal";

            return "Baixa";
        };

        let massaMuscular = "";

        if (percentualMuscular >= 0.45) {
            massaMuscular = "Muito elevada";
        } else if (
            percentualMuscular >= 0.38
        ) {
            massaMuscular = "Elevada";
        } else if (
            percentualMuscular >= 0.28
        ) {
            massaMuscular = "Normal";
        } else {
            massaMuscular = "Baixa";
        }

        let massaAdiposa = "";

        if (data.genero === "Masculino") {
            if (percentualGordura >= 25) {
                massaAdiposa = "Muito elevada";
            } else if (
                percentualGordura >= 18
            ) {
                massaAdiposa = "Elevada";
            } else if (
                percentualGordura >= 10
            ) {
                massaAdiposa = "Adequada";
            } else {
                massaAdiposa = "Baixa";
            }
        } else {
            if (percentualGordura >= 32) {
                massaAdiposa = "Muito elevada";
            } else if (
                percentualGordura >= 25
            ) {
                massaAdiposa = "Elevada";
            } else if (
                percentualGordura >= 18
            ) {
                massaAdiposa = "Adequada";
            } else {
                massaAdiposa = "Baixa";
            }
        }

        const areaBracos =
            classificarFaixa(
                areaBraco,
                refBraco,
                2
            );

        const areaCoxas =
            classificarFaixa(
                areaCoxa,
                refCoxa,
                3
            );

        return {
            massaMuscularKg:
                Number(
                    massaMuscularKg.toFixed(1)
                ) || 0,

            massaLivreKg:
                Number(
                    (massa - gorduraKg).toFixed(1)
                ) || 0,

            massaAdiposaKg:
                Number(
                    gorduraKg.toFixed(1)
                ) || 0,

            massaTotalKg:
                Number(
                    massa.toFixed(1)
                ) || 0,

            massaMuscular:
                `${massaMuscular} (${massaMuscularKg.toFixed(1)} kg)`,

            massaAdiposa:
                `${massaAdiposa} (${gorduraKg.toFixed(1)} kg)`,

            areaBraco:
                `${areaBracos} (${areaBraco.toFixed(1)} cm²)`,

            areaCoxa:
                `${areaCoxas} (${areaCoxa.toFixed(1)} cm²)`,
        };
    }, [
        data,
        perimetros,
        resumoDobras,
    ]);


    const updateField = (field: keyof ExamData, value: string) => {
        setData((current) => ({
            ...current,
            [field]: value,
        }));

        setAvaliacao((current) => {
            if (field === "massa") {
                return {
                    ...current,

                    avaliacao2: {
                        ...current.avaliacao2,
                        peso: value,
                    },
                };
            }

            if (field === "estatura") {
                return {
                    ...current,

                    avaliacao2: {
                        ...current.avaliacao2,
                        altura: value,
                    }
                };
            }

            if (field === "idade") {
                return {
                    ...current,

                    avaliacao2: {
                        ...current.avaliacao2,
                        idade: value
                    }
                };
            }

            return {
                ...current,

                aluno: {
                    ...current.aluno,
                    [field]: value,
                },
            };
        });
    };

    const updatePerimetro = (field: PerimetroKey, value: string) => {
        setAvaliacao(
            (current) => ({ ...current, avaliacao2: { ...current.avaliacao2, perimetros: { ...current.avaliacao2.perimetros, [field]: value } } }),
        )
    };

    const clearAllPerimetros = () => {
        setAvaliacao((current) => ({
            ...current,

            avaliacao2: {
                ...current.avaliacao2,

                perimetros: {
                    ...initialState.avaliacao2.perimetros,
                },
            },
        }));
    };

    const clearAllDobras = () => {
        setAvaliacao((current) => ({
            ...current,

            avaliacao2: {
                ...current.avaliacao2,

                dobrasCutaneas: {
                    ...initialState.avaliacao2.dobrasCutaneas,
                },
            },
        }));
    };

    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = "Tem certeza que deseja sair?";
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, []);

    console.log(avaliacao.aluno.nomeCompleto);
    console.log(avaliacao.avaliacao2.perimetros);

    return (
        <main className="min-h-screen bg-[#cfd2d7] p-3 md:p-5">
            <section className="mx-auto w-full border border-zinc-400 bg-[#ececec]">
                <header className="border-b-4 border-[#a55c5d] bg-[#4f7fb7] px-5 py-6">
                    <h1 className="text-5xl font-semibold italic tracking-wide text-white">1ª Avaliação</h1>
                </header>
                <div className="px-5 py-5">
                    <h2 className="mb-3 text-3xl font-bold italic text-zinc-600">DADOS GERAIS</h2>
                    <div className="space-y-5 border-b-8 border-zinc-300 pb-6">
                        <div className="grid gap-5 xl:grid-cols-[2.45fr_1fr]">
                            <div>
                                <h3 className="mb-2 border-b-2 border-[#b88b8b] pb-1 text-xl font-bold italic uppercase tracking-wide text-[#a85f60]">
                                    Informacoes basicas do avaliado
                                </h3>

                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                                    <label className="lg:col-span-2">
                                        <span className="mb-1 block text-sm font-semibold uppercase tracking-wide text-zinc-600">Nome completo</span>
                                        <input
                                            value={data.nomeCompleto}
                                            onChange={(event) => updateField("nomeCompleto", event.target.value)}
                                            className={`${inputBaseClass} text-left text-lg`}
                                        />
                                    </label>

                                    <label>
                                        <span className="mb-1 block text-sm font-semibold uppercase tracking-wide text-zinc-600">Genero</span>
                                        <select
                                            value={data.genero}
                                            onChange={(event) => updateField("genero", event.target.value)}
                                            className={`${inputBaseClass} text-lg`}
                                        >
                                            <option value="">Selecione</option>
                                            <option value="masculino">Masculino</option>
                                            <option value="feminino">Feminino</option>
                                        </select>
                                    </label>

                                    <label>
                                        <span className="mb-1 block text-sm font-semibold uppercase tracking-wide text-zinc-600">Idade (anos)</span>
                                        <input
                                            value={data.idade}
                                            onChange={(event) => updateField("idade", sanitizeInteger(event.target.value))}
                                            className={inputBaseClass}
                                        />
                                    </label>

                                    <label>
                                        <span className="mb-1 block text-sm font-semibold uppercase tracking-wide text-zinc-600">Etnia</span>
                                        <input
                                            value={data.etnia}
                                            onChange={(event) => updateField("etnia", event.target.value)}
                                            className={`${inputBaseClass} text-lg`}
                                        />
                                    </label>

                                    <label>
                                        <span className="mb-1 block text-sm font-semibold uppercase tracking-wide text-zinc-600">Massa (kg)</span>
                                        <input
                                            value={data.massa}
                                            onChange={(event) => updateField("massa", sanitizeDecimal(event.target.value))}
                                            className={inputBaseClass}
                                        />
                                    </label>

                                    <label>
                                        <span className="mb-1 block text-sm font-semibold uppercase tracking-wide text-zinc-600">Estatura (m)</span>
                                        <input
                                            value={data.estatura}
                                            onChange={(event) => updateField("estatura", sanitizeDecimal(event.target.value))}
                                            className={inputBaseClass}
                                        />
                                    </label>
                                </div>
                            </div>

                            <div>
                                <h3 className="mb-2 border-b-2 border-[#b88b8b] pb-1 text-xl font-bold italic uppercase tracking-wide text-[#a85f60]">
                                    Diametros osseos (cm)
                                </h3>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <label>
                                        <span className="mb-1 block text-sm font-semibold uppercase tracking-wide text-zinc-600">Fêmur (cm)</span>
                                        <input
                                            value={data.femur}
                                            onChange={(event) => updateField("femur", sanitizeDecimal(event.target.value))}
                                            className={inputBaseClass}
                                        />
                                    </label>

                                    <label>
                                        <span className="mb-1 block text-sm font-semibold uppercase tracking-wide text-zinc-600">Tíbia (cm)</span>
                                        <input
                                            value={data.tibia}
                                            onChange={(event) => updateField("tibia", sanitizeDecimal(event.target.value))}
                                            className={inputBaseClass}
                                        />
                                    </label>
                                    <label>
                                        <span className="mb-1 block text-sm font-semibold uppercase tracking-wide text-zinc-600">Úmero (cm)</span>
                                        <input
                                            value={data.umero}
                                            onChange={(event) => updateField("umero", sanitizeDecimal(event.target.value))}
                                            className={inputBaseClass}
                                        />
                                    </label>
                                    <label>
                                        <span className="mb-1 block text-sm font-semibold uppercase tracking-wide text-zinc-600">Ulna (cm)</span>
                                        <input
                                            value={data.una}
                                            onChange={(event) => updateField("una", sanitizeDecimal(event.target.value))}
                                            className={inputBaseClass}
                                        />
                                    </label>

                                </div>
                            </div>
                        </div>

                        <div className="grid gap-5 xl:grid-cols-[1.15fr_1.6fr_1.15fr]">
                            <div>
                                <h3 className="mb-2 border-b-2 border-[#b88b8b] pb-1 text-xl font-bold italic uppercase tracking-wide text-[#a85f60]">
                                    Frequencia cardiaca (BPM)
                                </h3>

                                <div className="grid gap-3 sm:grid-cols-3">
                                    <label>
                                        <span className="mb-1 block text-sm font-semibold uppercase tracking-wide text-zinc-600">De repouso</span>
                                        <input
                                            value={data.fcRepouso}
                                            onChange={(event) => updateField("fcRepouso", sanitizeInteger(event.target.value))}
                                            className={inputBaseClass}
                                        />
                                    </label>

                                    <label>
                                        <span className="mb-1 block text-sm font-semibold uppercase tracking-wide text-zinc-600">Maxima</span>
                                        <input value={data.fcMaxima} className={inputBaseClass} readOnly />
                                    </label>

                                    <label>
                                        <span className="mb-1 block text-sm font-semibold uppercase tracking-wide text-zinc-600">De reserva</span>
                                        <input value={data.fcReserva} className={inputBaseClass} readOnly />
                                    </label>
                                </div>
                            </div>

                            <div>
                                <h3 className="mb-2 border-b-2 border-[#b88b8b] pb-1 text-xl font-bold italic uppercase tracking-wide text-[#a85f60]">
                                    Controle bioquimico
                                </h3>

                                <div className="grid gap-3 sm:grid-cols-4">
                                    <label>
                                        <span className="mb-1 block text-sm font-semibold uppercase tracking-wide text-zinc-600">Glicose</span>
                                        <input
                                            value={data.glicose}
                                            onChange={(event) => updateField("glicose", sanitizeInteger(event.target.value))}
                                            className={inputBaseClass}
                                        />
                                    </label>

                                    <label>
                                        <span className="mb-1 block text-sm font-semibold uppercase tracking-wide text-zinc-600">Triglicerideos</span>
                                        <input
                                            value={data.triglicerideos}
                                            onChange={(event) => updateField("triglicerideos", sanitizeInteger(event.target.value))}
                                            className={inputBaseClass}
                                        />
                                    </label>

                                    <label>
                                        <span className="mb-1 block text-sm font-semibold uppercase tracking-wide text-zinc-600">LDL-C</span>
                                        <input
                                            value={data.ldl}
                                            onChange={(event) => updateField("ldl", sanitizeInteger(event.target.value))}
                                            className={inputBaseClass}
                                        />
                                    </label>

                                    <label>
                                        <span className="mb-1 block text-sm font-semibold uppercase tracking-wide text-zinc-600">HDL-C</span>
                                        <input
                                            value={data.hdl}
                                            onChange={(event) => updateField("hdl", sanitizeInteger(event.target.value))}
                                            className={`${inputBaseClass}`}
                                        />
                                    </label>
                                </div>
                            </div>

                            <div>
                                <h3 className="mb-2 border-b-2 border-[#b88b8b] pb-1 text-xl font-bold italic uppercase tracking-wide text-[#a85f60]">
                                    Pressao arterial (mmHg)
                                </h3>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <span className="mb-1 block text-sm font-semibold uppercase tracking-wide text-zinc-600">Sistole / diastole</span>
                                        <div className="flex h-9 items-center border border-zinc-400 bg-white px-2 text-xl text-zinc-700">
                                            <input
                                                value={data.sistolica}
                                                onChange={(event) => updateField("sistolica", sanitizeInteger(event.target.value))}
                                                className="w-full border-none bg-transparent text-center font-medium outline-none"
                                            />
                                            <span className="mx-1 font-semibold">/</span>
                                            <input
                                                value={data.diastolica}
                                                onChange={(event) => updateField("diastolica", sanitizeInteger(event.target.value))}
                                                className="w-full border-none bg-transparent text-center font-medium outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <span className="mb-1 block text-sm font-semibold uppercase tracking-wide text-zinc-600">Classificacao</span>
                                        <div className="flex h-9 items-center justify-center bg-[#4f7fb7] px-3 text-[1.35rem] font-semibold text-white">
                                            {classificacaoPressao}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="px-5 py-5">
                    <h2 className="mb-3 text-3xl font-bold italic text-zinc-600">ANALISE DA COMPOSICAO CORPORAL</h2>
                    <div className="grid gap-5 xl:grid-cols-[2.45fr_1fr]">
                        <div>
                            <h3 className="mb-2 border-b-2 border-[#b88b8b] pb-1 text-xl font-bold italic uppercase tracking-wide text-[#a85f60]">
                                Perimetros corporais (cm)
                            </h3>
                            {!dadosAntropometricosValidos && (
                                <div className="mb-4 rounded-md border border-red-400 bg-red-100 px-4 py-3 text-sm font-semibold text-red-700">
                                    Preencha os seguintes dados para gerar a comparacao antropometrica:
                                    {" "}
                                    {camposFaltando.join(", ")}
                                </div>
                            )}
                            <div className="grid gap-4 lg:grid-cols-[280px_1fr_1.1fr]">
                                <div className="space-y-1">
                                    {perimetroConfig.map((field) => (
                                        <div key={field.key} className="grid grid-cols-[1fr_26px_92px] items-center gap-2">
                                            <span className="text-base font-semibold uppercase italic tracking-wide text-zinc-500">{field.label}</span>
                                            <span className="text-center text-sm font-semibold text-zinc-500">{field.index}</span>
                                            <input
                                                value={perimetros[field.key]}
                                                onChange={(event) => updatePerimetro(field.key, sanitizeDecimal(event.target.value))}
                                                className={inputBaseClass}
                                            />
                                        </div>
                                    ))}
                                    <button type="button" onClick={clearAllPerimetros} className="w-[50%] bg-[#4f7fb7] py-1 px-4 text-base font-semibold  text-white cursor-pointer rounded-[5px] hover:bg-[#4f7fb7]/80">Limpar</button>
                                </div>
                                <div className="flex items-center justify-center border border-zinc-300 bg-white/40 p-2 max-w-[350px]">
                                    <img src="/app/src/assets/human.png" alt="Human" className="max-w-[300px]" />
                                </div>

                                <div className="relative h-[520px] w-[520px] border border-zinc-400 bg-white px-8 py-6">
                                    <div className="absolute inset-0 grid grid-cols-10 overflow-hidden">
                                        <div className="bg-[#e89a9a]" />
                                        <div className="bg-[#f3b2b2]" />
                                        <div className="bg-[#f7dfaa]" />
                                        <div className="bg-[#f5ec99]" />
                                        <div className="bg-[#d6e8c7]" />

                                        <div className="bg-[#d6e8c7]" />
                                        <div className="bg-[#f5ec99]" />
                                        <div className="bg-[#f7dfaa]" />
                                        <div className="bg-[#f3b2b2]" />
                                        <div className="bg-[#e89a9a]" />
                                    </div>

                                    <div className="absolute inset-0 grid grid-cols-10 border-x border-zinc-400">
                                        {Array.from({ length: 8 }).map((_, idx) => (
                                            <div key={`col-${idx}`} className="border-r border-zinc-400/60" />
                                        ))}
                                    </div>

                                    <div className="absolute inset-0 grid grid-rows-14">
                                        {Array.from({ length: 14 }).map((_, idx) => (
                                            <div
                                                key={`row-${idx}`}
                                                className="border-b border-zinc-300"
                                            />
                                        ))}
                                    </div>

                                    <div className="absolute inset-y-0 left-1/2 w-[2px] bg-zinc-700" />

                                    {chartPoints.map((point, idx) => (
                                        <div
                                            key={`point-${idx}`}
                                            className="absolute z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-sky-500 shadow"
                                            style={{
                                                left: `${((point.x + 5) / 10) * 100}%`,
                                                top: `${((point.y - 0.5) / 14) * 100}%`,
                                            }}
                                        />
                                    ))}

                                    <div className="absolute -bottom-8 left-0 right-0 flex justify-between px-2 text-lg font-semibold text-zinc-500">
                                        {[-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map((value) => (
                                            <span
                                                key={`axis-${value}`}
                                                className="w-6 text-center"
                                            >
                                                {value}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="absolute inset-y-0 -left-8 flex flex-col justify-between py-[18px] text-lg font-semibold text-zinc-500">
                                        {Array.from({ length: 14 }).map((_, idx) => (
                                            <span
                                                key={`axis-y-${idx + 1}`}
                                                className="flex h-full items-center"
                                            >
                                                {idx + 1}
                                            </span>
                                        ))}
                                    </div>

                                    <span className="absolute -bottom-16 left-1/2 -translate-x-1/2 text-lg font-semibold text-zinc-500">
                                        1ª Avaliacao
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-8 max-w-[400px]">
                            {classificationBox("Massa muscular", analiseCorporal.massaMuscular)}
                            {classificationBox("Massa adiposa", analiseCorporal.massaAdiposa)}
                            {classificationBox("Area muscular do braço", analiseCorporal.areaBraco)}
                            {classificationBox("Area muscular da coxa", analiseCorporal.areaCoxa)}
                        </div>
                    </div>
                    <div className="mt-10 grid gap-6 xl:grid-cols-[2.45fr_1fr]">
                        <div>
                            <h3 className="mb-3 border-b-2 border-[#b88b8b] pb-1 text-xl font-bold italic uppercase tracking-wide text-[#a85f60]">
                                Dobras cutaneas (mm)
                            </h3>

                            <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
                                <div className="grid gap-4 lg:grid-cols-[1fr_0.95fr]">
                                    <div>
                                        <div className="mb-1 grid grid-cols-[1fr_130px_130px_130px] items-center gap-3 pl-1 text-center text-2xl font-semibold italic text-zinc-500">
                                            <span className="text-left" />
                                            <span>1ª Medida</span>
                                            <span>2ª Medida</span>
                                            <span>Media final</span>
                                        </div>

                                        <div className="space-y-1">
                                            {dobrasConfig.map((field) => (
                                                <div key={field.key} className="grid grid-cols-[1fr_130px_130px_130px] items-center gap-3">
                                                    <div className="flex items-center justify-between pr-3">
                                                        <span className="text-base font-semibold uppercase italic tracking-wide text-zinc-500 pr-3">{field.label}</span>
                                                        <span className="text-sm font-semibold text-zinc-500">{field.index}</span>
                                                    </div>

                                                    <input
                                                        value={dobras1[field.key]}
                                                        onChange={(event) =>
                                                            updateDobra1(
                                                                field.key,
                                                                event.target.value
                                                            )
                                                        }
                                                        className={inputBaseClass}
                                                    />
                                                    <input
                                                        value={dobras2[field.key]}
                                                        onChange={(event) =>
                                                            updateDobra2(
                                                                field.key,
                                                                event.target.value
                                                            )
                                                        }
                                                        className={inputBaseClass}
                                                    />
                                                    <input value={resumoDobras.mediaFinal[field.key]} readOnly className={inputBaseClass} />
                                                </div>
                                            ))}
                                        </div>
                                        <div className="space-y-6 pt-6">
                                            <label className="grid grid-cols-[1fr_130px] items-center gap-4">
                                                <span className="text-xl font-semibold italic text-zinc-500 text-right">Somatorio (mm)</span>
                                                <input value={resumoDobras.somatorio} readOnly className={inputBaseClass} />
                                            </label>

                                            <label className="grid grid-cols-[1fr_130px] items-center gap-4">
                                                <span className="text-xl font-semibold italic text-zinc-500 text-right">Periferico (mm)</span>
                                                <input value={resumoDobras.periferico} readOnly className={inputBaseClass} />
                                            </label>

                                            <label className="grid grid-cols-[1fr_130px] items-center gap-4">
                                                <span className="text-xl font-semibold italic text-zinc-500 text-right">Central (mm)</span>
                                                <input value={resumoDobras.central} readOnly className={inputBaseClass} />
                                            </label>
                                        </div>
                                        <button type="button" onClick={clearAllDobras} className="w-[25%] bg-[#4f7fb7] py-1.5 px-4 text-base font-semibold  text-white cursor-pointer rounded-[5px] hover:bg-[#4f7fb7]/80">Limpar</button>
                                    </div>
                                </div>
                                <div className="flex min-h-[560px] items-center justify-center border border-zinc-300 bg-white/40 p-1">
                                    <img src="/app/src/assets/human2.png" alt="Human" className="" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="mb-3 border-b-2 border-[#b88b8b] pb-1 text-xl font-bold italic uppercase tracking-wide text-[#a85f60]">
                                Proporcionalidade - dobras cutaneas (mm)
                            </h3>
                            {!dadosAntropometricosValidos && (
                                <div className="mb-4 rounded-md border border-red-400 bg-red-100 px-4 py-3 text-sm font-semibold text-red-700">
                                    Preencha os seguintes dados para gerar a proporcionalidade das dobras:
                                    {" "}
                                    {camposFaltando.join(", ")}
                                </div>
                            )}
                            <div className="relative overflow-visible pb-16 pl-10 pr-2 pt-2">
                                <div className="relative h-[460px] border border-zinc-400 bg-white overflow-visible">
                                    <div className="absolute inset-0 grid grid-cols-10 overflow-hidden">
                                        <div className="bg-[#e89a9a]" />
                                        <div className="bg-[#f3b2b2]" />
                                        <div className="bg-[#f7dfaa]" />
                                        <div className="bg-[#f5ec99]" />
                                        <div className="bg-[#d6e8c7]" />

                                        <div className="bg-[#d6e8c7]" />
                                        <div className="bg-[#f5ec99]" />
                                        <div className="bg-[#f7dfaa]" />
                                        <div className="bg-[#f3b2b2]" />
                                        <div className="bg-[#e89a9a]" />
                                    </div>

                                    <div className="absolute inset-0 grid grid-cols-10 border-x border-zinc-400">
                                        {Array.from({ length: 8 }).map((_, idx) => (
                                            <div key={`dobra-col-${idx}`} className="border-r border-zinc-400/60" />
                                        ))}
                                    </div>

                                    <div className="absolute inset-0 grid grid-rows-8 ">
                                        {Array.from({ length: dobraChartRows }).map((_, idx) => (
                                            <div key={`dobra-row-${idx}`} className="border-b border-zinc-300" />
                                        ))}
                                    </div>

                                    <div className="absolute inset-y-0 left-1/2 w-[2px] bg-zinc-700" />
                                    {pontosDobras.map((point, idx) => (
                                        <div
                                            key={`dobra-point-${idx}`}
                                            className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-500"
                                            style={{
                                                left: `${((point.x + 5) / 10) * 100}%`,
                                                top: `${((point.y - 0.5) / dobraChartRows) * 100}%`,
                                            }}
                                        />
                                    ))}

                                    <div className="absolute -bottom-7 left-0 right-0 flex justify-between px-1 text-lg font-semibold text-zinc-500">
                                        {[-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map((value) => (
                                            <span key={`dobra-axis-${value}`}>{value}</span>
                                        ))}
                                    </div>

                                    <div className="pointer-events-none absolute -left-8 top-0 h-full w-8 text-lg font-semibold text-zinc-500">
                                        {dobrasConfig.map((item) => (
                                            <span
                                                key={`dobra-left-axis-${item.index}`}
                                                className="absolute right-1 -translate-y-1/2"
                                                style={{ top: `${((item.index - 0.5) / dobraChartRows) * 100}%` }}
                                            >
                                                {item.index}
                                            </span>
                                        ))}
                                    </div>
                                    <span className="absolute -bottom-14 left-1/2 -translate-x-1/2 text-lg font-semibold text-zinc-500">
                                        1ª Avaliacao
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-10 flex items-end justify-end">
                        <button className="w-[25%] bg-[#4f7fb7] py-1 px-4 text-base font-semibold  text-white cursor-pointer rounded-[5px] hover:bg-[#4f7fb7]/80" onClick={() => { navigate("/avaliacao2") }}>2ª Avaliação</button>
                    </div>
                    <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr] mt-10">
                        <div>
                            <h3 className="mb-3 border-b-2 border-[#b88b8b] pb-1 text-xl font-bold italic uppercase tracking-wide text-[#a85f60]">
                                COMPOSIÇÃO CORPORAL
                            </h3>
                            <ComposicaoCorporalChart
                                massaMuscular={analiseCorporal.massaMuscularKg}
                                massaLivre={analiseCorporal.massaLivreKg}
                                massaAdiposa={analiseCorporal.massaAdiposaKg}
                                massaTotal={analiseCorporal.massaTotalKg}
                            />
                        </div>
                        <div>
                            <h3 className="mb-3 border-b-2 border-[#b88b8b] pb-1 text-xl font-bold italic uppercase tracking-wide text-[#a85f60]">
                                TESTE DE CARGA MÁXIMA - 1RM
                            </h3>
                            {exercicios.map((exercicio) => (
                                <div key={exercicio.key}
                                    className="grid-cols-5 grid gap-1 pt-5">
                                    <div className="grid-rows-1 grid">
                                        <text className="mb-1 block text-sm font-semibold uppercase tracking-wide text-zinc-600">Exercicios</text>
                                        <text className="text-xl font-semibold italic text-zinc-500 text-left">{exercicio.nome}</text>
                                    </div>
                                    <div className="grid-rows-1 grid ">
                                        <text className="mb-1 block text-sm font-semibold uppercase tracking-wide text-zinc-600">Carga</text>
                                        <input
                                            className="h-7 w-[60%] border border-zinc-950 border-dashed bg-white px-3 text-center text-sm font-medium text-zinc-700 outline-none transition focus:border-zinc-600"
                                            value={testeCarga.carga2[exercicio.key].carga}
                                            onChange={(e) =>
                                                updateTesteCarga(
                                                    "carga2",
                                                    exercicio.key,
                                                    "carga",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="grid-rows-1 grid ">
                                        <text className="mb-1 block text-sm font-semibold uppercase tracking-wide text-zinc-600">Repetições</text>
                                        <input
                                            className="h-7 w-[60%] border border-zinc-950 border-dashed bg-white px-3 text-center text-sm font-medium text-zinc-700 outline-none transition focus:border-zinc-600"
                                            value={testeCarga.carga2[exercicio.key].repeticoes}
                                            onChange={(e) =>
                                                updateTesteCarga(
                                                    "carga2",
                                                    exercicio.key,
                                                    "repeticoes",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="grid-rows-1 grid">
                                        <text className="mb-1 block text-sm font-semibold uppercase tracking-wide text-zinc-600">1 RM Predito</text>
                                        <text className="text-xl font-semibold italic text-zinc-500">{resultado1RM[exercicio.key].rm || ""}</text>
                                    </div>
                                    <div className="grid-rows-1 grid">
                                        <text className="mb-1 block text-sm font-semibold uppercase tracking-wide text-zinc-600">Força Muscular</text>
                                        <div className="flex h-8 items-center justify-center bg-[#4f7fb7] px-3 text-[1.25rem] font-medium text-white">{classificarForca(resultado1RM[exercicio.key].rm)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {navTool()}
                    </div>
                    <div className="py-5 border-t-5 border-zinc-400 mt-6">
                        <h3 className="mb-3 pb-1 text-xl font-bold italic uppercase tracking-wide text-zinc-500">Parecer Descritivo</h3>
                        <textarea className="w-full border-2 border-red-700 rounded-sm h-40 pl-1 max-h-52 outline-none transition-all duration-200 focus:border-red-400 focus:ring-4 focus:ring-indigo-500/10"
                            value={observacoes}
                            onChange={(e) => {
                                updateObservacoes(e.target.value)
                            }} />
                    </div>
                </div>
            </section>
        </main >
    );
}