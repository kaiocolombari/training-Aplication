import { initialState, useAvaliacao } from '../context/avaliacaoContext'
import { useState, useMemo } from 'react'
import React from 'react'
import navTool from '../components/navTool'
import type { PerimetroField } from '../types/perimetroField';
import type { PerimetroKey } from '../types/perimetroKey';
import type { ExamData } from '../types/examData';
import type { DobraField } from '../types/dobraField';
import type { DobraKey } from '../types/dobraKey';
import { calcularMassaAdiposa } from '../functions/calcMassaAdiposa';
import { calcularAreaBraco } from '../functions/calcBraco';
import { calcularAreaCoxa } from '../functions/calcCoxa';
import { calcularMassaMuscular } from '../functions/calcMassaMuscular';



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

function parseDecimal(value: string) {
    const normalized = value.replace(",", ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
}



function sanitizeDecimal(value: string) {
    return value.replace(/[^\d.,]/g, "");
}

export default function comparacao() {
    const { avaliacao, setAvaliacao } = useAvaliacao();
    let perimetros = avaliacao.avaliacao1.perimetros;
    let perimetros2 = avaliacao.avaliacao2.perimetros;

    const dobras1 = avaliacao.avaliacao1.dobrasCutaneas.medida1;
    const dobras2 = avaliacao.avaliacao1.dobrasCutaneas.medida2;

    const dobras3 = avaliacao.avaliacao2.dobrasCutaneas.medida1;
    const dobras4 = avaliacao.avaliacao2.dobrasCutaneas.medida2;

    const testeCarga = avaliacao.testeCarga;


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

    const resumoDobras2 = useMemo(() => {
        const mediaFinal2 = dobrasConfig.reduce<Record<DobraKey, string>>(
            (acc, item) => {
                const primeira = parseDecimal(dobras3[item.key]);
                const segunda = parseDecimal(dobras4[item.key]);

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
            parseDecimal(mediaFinal2[item.key])
        );

        const somatorio = valores.reduce(
            (total, value) => total + value,
            0
        );

        const periferico =
            parseDecimal(mediaFinal2.triceps) +
            parseDecimal(mediaFinal2.biceps) +
            parseDecimal(mediaFinal2.coxaMedia) +
            parseDecimal(mediaFinal2.panturrilha);

        const central =
            parseDecimal(mediaFinal2.subescapular) +
            parseDecimal(mediaFinal2.iliaca) +
            parseDecimal(mediaFinal2.supraespinhal) +
            parseDecimal(mediaFinal2.abdominal);

        return {
            mediaFinal2,
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
    }, [dobras3, dobras4]);

    const updatePerimetro = (field: PerimetroKey, value: string) => {
        setAvaliacao(
            (current) => ({ ...current, avaliacao1: { ...current.avaliacao1, perimetros: { ...current.avaliacao1.perimetros, [field]: value } } }),
        )
    };

    const updatePerimetro2 = (field: PerimetroKey, value: string) => {
        setAvaliacao(
            (current) => ({ ...current, avaliacao2: { ...current.avaliacao2, perimetros: { ...current.avaliacao2.perimetros, [field]: value } } }),
        )
    };

    const diferencaPerimetros = (field: PerimetroKey) => {
        const diferenca = Number(perimetros2[field]) - Number(perimetros[field]);
        return diferenca
    }

    const diferencaDobras = (field?: DobraKey, type?: "1" | "2" | "3" | "4") => {
        let diferenca: number = 0;
        switch (type) {
            case "1":
                if (!field) return "";
                diferenca =
                    parseDecimal(resumoDobras2.mediaFinal2[field]) -
                    parseDecimal(resumoDobras.mediaFinal[field]);
                break;
            case "2":
                diferenca =
                    parseDecimal(resumoDobras.somatorio) -
                    parseDecimal(resumoDobras2.somatorio);
                break;
            case "3":
                diferenca =
                    parseDecimal(resumoDobras.periferico) -
                    parseDecimal(resumoDobras2.periferico);
                break;
            case "4":
                diferenca =
                    parseDecimal(resumoDobras.central) -
                    parseDecimal(resumoDobras2.central);
                break;
        }

        return diferenca.toFixed(1).replace(".", ",");
    }


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

    const [data, setData] = useState<ExamData>({
        nomeCompleto: avaliacao.aluno.nomeCompleto,
        genero: avaliacao.aluno.genero,
        idade: avaliacao.avaliacao1.idade,
        etnia: avaliacao.aluno.etnia,
        massa: avaliacao.avaliacao1.peso,
        estatura: avaliacao.avaliacao1.altura,
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

    const [data2, setData2] = useState<ExamData>({
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

    const dobraChartRows = 8;

    type DobraReference = {
        media: number;
        desvio: number;
    };

    const dadosAntropometricosValidos =
        data.genero &&
        data.idade &&
        data.massa &&
        data.estatura;

    const dadosAntropometricosValidos2 =
        data2.genero &&
        data2.idade &&
        data2.massa &&
        data2.estatura;

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
    ]);

    const pontosDobras2 = useMemo(() => {
        if (!dadosAntropometricosValidos2) {
            return [];
        }

        return dobrasConfig.flatMap((item, idx) => {
            const valorTexto =
                resumoDobras2.mediaFinal2[item.key];

            if (!valorTexto) {
                return [];
            }

            const valor = parseDecimal(valorTexto);

            const referencia = getDobraReference(
                item.key,
                data2
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
        resumoDobras2.mediaFinal2,
        data2,
    ]);

    function parseDecimal(value: string) {
        const normalized = value.replace(",", ".");
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : 0;
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

    const chartPoints2 = useMemo(() => {
        if (!dadosAntropometricosValidos2) {
            return [];
        }

        const massa = parseDecimal(data2.massa);

        return perimetroConfig
            .map((item, idx) => {
                const valorTexto = perimetros2[item.key];

                if (!valorTexto) {
                    return null;
                }

                const valor = parseDecimal(valorTexto);

                const ref = getReferenceByKey(
                    item.key,
                    data2
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
        perimetros2,
        data2,
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

            areaBracoValue:
                Number(
                    areaBraco.toFixed(1)
                ) || 0,

            areaCoxaValue:
                Number(
                    areaCoxa.toFixed(1)
                ) || 0,

            massaMuscular:
                `${massaMuscular} (${massaMuscularKg.toFixed(1)} kg)`,

            massaAdiposa:
                `${massaAdiposa} (${gorduraKg.toFixed(1)} kg)`,

            areaBraco:
                `${areaBraco.toFixed(1)}`,

            areaCoxa:
                `${areaCoxa.toFixed(1)}`,
        };
    }, [
        data,
        perimetros,
        resumoDobras,
    ]);

    const analiseCorporal2 = useMemo(() => {
        const massa =
            parseDecimal(data2.massa);

        const gorduraKg =
            calcularMassaAdiposa(
                data2,
                resumoDobras2
            ) || 0;

        const areaBraco =
            calcularAreaBraco(
                perimetros2,
                resumoDobras2
            ) || 0;

        const areaCoxa =
            calcularAreaCoxa(
                perimetros2,
                resumoDobras2
            ) || 0;

        const massaMuscularKg =
            calcularMassaMuscular(
                massa,
                gorduraKg,
                data2.genero,
                Number(data2.idade),
                areaBraco,
                areaCoxa,
                getReferenceByKey("imc" as PerimetroKey, data2)
            );

        const refBraco = getReferenceByKey("bracoD" as PerimetroKey, data2);


        const refCoxa = getReferenceByKey("coxaMediaD", data2);

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

        if (data2.genero === "Masculino") {
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

            areaBracoValue:
                Number(
                    areaBraco.toFixed(1)
                ) || 0,

            areaCoxaValue:
                Number(
                    areaCoxa.toFixed(1)
                ) || 0,

            massaMuscular:
                `${massaMuscular} (${massaMuscularKg.toFixed(1)} kg)`,

            massaAdiposa:
                `${massaAdiposa} (${gorduraKg.toFixed(1)} kg)`,

            areaBraco:
                `${areaBraco.toFixed(1)}`,

            areaCoxa:
                `${areaCoxa.toFixed(1)}`,
        };
    }, [
        data2,
        perimetros2,
        resumoDobras2,
    ]);

    const chartRows = 2;

    const pontosComposicao = [
        {
            x: analiseCorporal.massaMuscularKg,
            y: 1,
        },
        {
            x: analiseCorporal.massaAdiposaKg,
            y: 2,
        },
    ];

    const pontosComposicao2 = [
        {
            x: analiseCorporal2.massaMuscularKg,
            y: 1,
        },
        {
            x: analiseCorporal2.massaAdiposaKg,
            y: 2,
        },
    ];

    const maxValor = Math.max(
        analiseCorporal.massaMuscularKg,
        analiseCorporal.massaAdiposaKg,
        analiseCorporal2.massaMuscularKg,
        analiseCorporal2.massaAdiposaKg
    );

    function calcular1RM(carga: number, repeticoes: number) {
        if (!carga || !repeticoes) return 0;

        return carga / (1.0278 - (0.0278 * repeticoes));
    }

    const resultadoRmAV1 = useMemo(() => {
        return {
            supino: {
                rm: Math.round(
                    calcular1RM(
                        Number(testeCarga.carga1.supino.carga),
                        Number(testeCarga.carga1.supino.repeticoes)
                    )
                ),
            },

            terra: {
                rm: Math.round(
                    calcular1RM(
                        Number(testeCarga.carga1.terra.carga),
                        Number(testeCarga.carga1.terra.repeticoes)
                    )
                ),
            },

            remada: {
                rm: Math.round(
                    calcular1RM(
                        Number(testeCarga.carga1.remada.carga),
                        Number(testeCarga.carga1.remada.repeticoes)
                    )
                ),
            },

            agachamento: {
                rm: Math.round(
                    calcular1RM(
                        Number(testeCarga.carga1.agachamento.carga),
                        Number(testeCarga.carga1.agachamento.repeticoes)
                    )
                ),
            },
        };
    }, [testeCarga]);

    const resultadoRmAV2 = useMemo(() => {
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

    const diferencaComposicao = (type: "1" | "2" | "3" | "4") => {
        let diferenca: number = 0;

        switch (type) {
            case "1":
                diferenca = analiseCorporal2.massaMuscularKg - analiseCorporal.massaMuscularKg;
                break;
            case "2":
                diferenca = analiseCorporal2.massaAdiposaKg - analiseCorporal.massaAdiposaKg;
                break;
            case "3":
                diferenca = analiseCorporal2.areaBracoValue - analiseCorporal.areaBracoValue;
                break;
            case "4":
                diferenca = analiseCorporal2.areaCoxaValue - analiseCorporal.areaCoxaValue;
                break;

        }
        return diferenca.toFixed(1).replace(".", ",");
    }

    return (
        <main className="h-full bg-[#ececec] p-3 md:p-5 ">
            <hr className="my-4 border-3 rounded-2xl mb-5 border-zinc-400" />
            <div className="flex flex-col">
                <h1 className="mb-3 text-3xl font-bold italic text-zinc-600">Evolução de atleta</h1>
            </div>
            <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr] mt-10">
                <div>
                    <h3 className="mb-2 border-b-2 border-[#b88b8b] pb-1 text-xl font-bold italic uppercase tracking-wide text-[#a85f60]">
                        Perimetros corporais (cm)
                    </h3>
                    <div className="flex gap-6 items-start max-w-5xl">
                        <div className="flex-1">
                            <div className='grid grid-cols-[200px_140px_140px_140px] items-center gap-2 text-center'>
                                <text></text>
                                <text className="pb-1 font-bold italic uppercase tracking-wide text-[#a85f60]">1ª Avaliação</text>
                                <text className="pb-1 font-bold italic uppercase tracking-wide text-[#a85f60]">2ª Avaliação</text>
                                <text className="pb-1 font-bold italic uppercase tracking-wide text-[#a85f60]">Diferença B-A</text>
                            </div>
                            {perimetroConfig.map((field) => (
                                <div
                                    key={field.key}
                                    className="grid grid-cols-[200px_140px_140px_140px] items-center gap-2"
                                >
                                    <span className="text-sm font-semibold uppercase tracking-wide text-zinc-600">
                                        {field.index} {field.label}
                                    </span>
                                    <input
                                        readOnly
                                        value={perimetros[field.key]}
                                        onChange={(event) =>
                                            updatePerimetro(
                                                field.key,
                                                sanitizeDecimal(event.target.value)
                                            )
                                        }
                                        className={inputBaseClass}
                                    />
                                    <input
                                        readOnly
                                        value={perimetros2[field.key]}
                                        onChange={(event) =>
                                            updatePerimetro2(
                                                field.key,
                                                sanitizeDecimal(event.target.value)
                                            )
                                        }
                                        className={inputBaseClass}
                                    />

                                    <input
                                        readOnly
                                        value={diferencaPerimetros(field.key)}
                                        className={inputBaseClass}
                                    />

                                </div>
                            ))}
                        </div>
                        <img src="./app/src/assets/human.png" alt="" className="max-h-[550px] py-3" />
                    </div>

                </div>
                <div>
                    <h1 className="mb-2 border-b-2 border-[#b88b8b] pb-1 text-xl font-bold italic uppercase tracking-wide text-[#a85f60]">
                        Escala de porprocionalidade
                    </h1>
                    <div className="relative h-[520px] w-[520px] border border-zinc-400 bg-white mx-[20%] ">
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
                                className="absolute z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500 shadow"
                                style={{
                                    left: `${((point.x + 5) / 10) * 100}%`,
                                    top: `${((point.y - 0.5) / 14) * 100}%`,
                                }}
                            />
                        ))}

                        {chartPoints2.map((point, idx) => (
                            <div
                                key={`point-${idx}`}
                                className="absolute z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black bg-yellow-200 shadow"
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
                        <div className="absolute -bottom-16 left-0 right-0 flex items-center justify-center">
                            <div className="h-3 w-3 rounded-full bg-red-500 ml-3" />
                            <span className="text-lg font-semibold text-zinc-500 ml-3">
                                1ª Av
                            </span>
                            <div className="h-3 w-3 rounded-full bg-yellow-200 border ml-3" />
                            <span className="text-lg font-semibold text-zinc-500 ml-3">
                                2ª Av
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr] mt-15 ">
                <div>
                    <h3 className="mb-2 border-b-2 border-[#b88b8b] pb-1 text-xl font-bold italic uppercase tracking-wide text-[#a85f60]">
                        Dobras Cutâneas (cm)
                    </h3>
                    <div className="flex gap-6 items-start max-w-5xl">
                        <div className="flex-1">
                            <div className='grid grid-cols-[200px_140px_140px_140px] items-center gap-2 text-center'>
                                <text></text>
                                <text className="pb-1 font-bold italic uppercase tracking-wide text-[#a85f60]">1ª Avaliação</text>
                                <text className="pb-1 font-bold italic uppercase tracking-wide text-[#a85f60]">2ª Avaliação</text>
                                <text className="pb-1 font-bold italic uppercase tracking-wide text-[#a85f60]">Diferença B-A</text>
                            </div>
                            {dobrasConfig.map((field) => (
                                <div
                                    key={field.key}
                                    className="grid grid-cols-[200px_140px_140px_140px] items-center gap-2"
                                >
                                    <span className="text-sm font-semibold uppercase tracking-wide text-zinc-600">
                                        {field.index} {field.label}
                                    </span>

                                    <input value={resumoDobras.mediaFinal[field.key]} readOnly className={inputBaseClass} />

                                    <input value={resumoDobras2.mediaFinal2[field.key]} readOnly className={inputBaseClass} />

                                    <input value={diferencaDobras(field.key, "1")} readOnly className={inputBaseClass} />
                                </div>
                            ))}
                            <div className="space-y-6 pt-6">
                                <label className="grid grid-cols-[200px_140px_140px_140px] items-center gap-2">
                                    <span className="text-xl font-semibold italic text-zinc-500 text-right">Somatorio (mm)</span>
                                    <input value={resumoDobras.somatorio} readOnly className={inputBaseClass} />
                                    <input value={resumoDobras2.somatorio} readOnly className={inputBaseClass} />
                                    <input value={diferencaDobras(undefined, "2")} readOnly className={inputBaseClass} />
                                </label>
                                <label className="grid grid-cols-[200px_140px_140px_140px] items-center gap-2">
                                    <span className="text-xl font-semibold italic text-zinc-500 text-right">Periferico (mm)</span>
                                    <input value={resumoDobras.periferico} readOnly className={inputBaseClass} />
                                    <input value={resumoDobras2.periferico} readOnly className={inputBaseClass} />
                                    <input value={diferencaDobras(undefined, "3")} readOnly className={inputBaseClass} />
                                </label>
                                <label className="grid grid-cols-[200px_140px_140px_140px] items-center gap-2">
                                    <span className="text-xl font-semibold italic text-zinc-500 text-right">Central (mm)</span>
                                    <input value={resumoDobras.central} readOnly className={inputBaseClass} />
                                    <input value={resumoDobras2.central} readOnly className={inputBaseClass} />
                                    <input value={diferencaDobras(undefined, "4")} readOnly className={inputBaseClass} />
                                </label>
                            </div>
                        </div>
                        <img src="./app/src/assets/human2.png" alt="" className="max-h-[400px] py-3" />
                    </div>

                </div>
                <div>
                    <h1 className="mb-2 border-b-2 border-[#b88b8b] pb-1 text-xl font-bold italic uppercase tracking-wide text-[#a85f60]">
                        Escala de porprocionalidade
                    </h1>
                    <div className="relative h-[520px] w-[520px] border border-zinc-400 bg-white mx-[20%] ">
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

                        <div
                            className="absolute inset-0"
                            style={{
                                display: "grid",
                                gridTemplateRows: `repeat(${dobraChartRows}, 1fr)`
                            }}
                        >
                            {Array.from({ length: 8 }).map((_, idx) => (
                                <div
                                    key={`row-${idx}`}
                                    className="border-b border-zinc-300"
                                />
                            ))}
                        </div>

                        <div className="absolute inset-y-0 left-1/2 w-[2px] bg-zinc-700" />

                        {pontosDobras.map((point, idx) => (
                            <div
                                key={`point-${idx}`}
                                className="absolute z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500 shadow"
                                style={{
                                    left: `${((point.x + 5) / 10) * 100}%`,
                                    top: `${((point.y - 0.5) / dobraChartRows) * 100}%`,
                                }}
                            />
                        ))}

                        {pontosDobras2.map((point, idx) => (
                            <div
                                key={`point-${idx}`}
                                className="absolute z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border bg-yellow-200 shadow"
                                style={{
                                    left: `${((point.x + 5) / 10) * 100}%`,
                                    top: `${((point.y - 0.5) / dobraChartRows) * 100}%`,
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

                        <div className="absolute inset-y-0 -left-8 w-6">
                            {dobrasConfig.map((item) => (
                                <span
                                    key={item.key}
                                    className="absolute right-0 -translate-y-1/2 text-lg font-semibold text-zinc-500"
                                    style={{
                                        top: `${((item.index - 0.5) / dobraChartRows) * 100}%`,
                                    }}
                                >
                                    {item.index}
                                </span>
                            ))}
                        </div>
                        <div className="absolute -bottom-16 left-0 right-0 flex items-center justify-center">
                            <div className="h-3 w-3 rounded-full bg-red-500 ml-3" />
                            <span className="text-lg font-semibold text-zinc-500 ml-3">
                                1ª Av
                            </span>
                            <div className="h-3 w-3 rounded-full bg-yellow-200 border ml-3" />
                            <span className="text-lg font-semibold text-zinc-500 ml-3">
                                2ª Av
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr] mt-20 ">
                <div>
                    <h3 className="mb-2 border-b-2 border-[#b88b8b] pb-1 text-xl font-bold italic uppercase tracking-wide text-[#a85f60]">
                        Composição corporal
                    </h3>
                    <div className="flex gap-6 items-start max-w-5xl">
                        <div className="flex-1">
                            <div className='grid grid-cols-[200px_140px_140px_140px] items-center gap-2 text-center'>
                                <text></text>
                                <text className="pb-1 font-bold italic uppercase tracking-wide text-[#a85f60]">1ª Avaliação</text>
                                <text className="pb-1 font-bold italic uppercase tracking-wide text-[#a85f60]">2ª Avaliação</text>
                                <text className="pb-1 font-bold italic uppercase tracking-wide text-[#a85f60]">Diferença B-A</text>
                            </div>
                            <div className="grid grid-cols-[200px_140px_140px_140px] items-center gap-2">
                                <span className="text-sm font-semibold uppercase tracking-wide text-zinc-600">
                                    1 M. Muscular (kg)
                                </span>
                                <input value={analiseCorporal.massaMuscularKg} readOnly className={inputBaseClass} />
                                <input value={analiseCorporal2.massaMuscularKg} readOnly className={inputBaseClass} />
                                <input value={diferencaComposicao("1")} readOnly className={inputBaseClass} />
                            </div>
                            <div className="grid grid-cols-[200px_140px_140px_140px] items-center gap-2">
                                <span className="text-sm font-semibold uppercase tracking-wide text-zinc-600">
                                    2 M. Adiposa (kg)
                                </span>
                                <input value={analiseCorporal.massaAdiposaKg} readOnly className={inputBaseClass} />
                                <input value={analiseCorporal2.massaAdiposaKg} readOnly className={inputBaseClass} />
                                <input value={diferencaComposicao("2")} readOnly className={inputBaseClass} />
                            </div>
                            <div className="grid grid-cols-[200px_140px_140px_140px] items-center gap-2">
                                <span className="text-sm font-semibold uppercase tracking-wide text-zinc-600">
                                    AMB (cm)
                                </span>
                                <input value={analiseCorporal.areaBraco} readOnly className={inputBaseClass} />
                                <input value={analiseCorporal2.areaBraco} readOnly className={inputBaseClass} />
                                <input value={diferencaComposicao("3")} readOnly className={inputBaseClass} />
                            </div>
                            <div className="grid grid-cols-[200px_140px_140px_140px] items-center gap-2">
                                <span className="text-sm font-semibold uppercase tracking-wide text-zinc-600">
                                    AMC (cm²)
                                </span>
                                <input value={analiseCorporal.areaCoxa} readOnly className={inputBaseClass} />
                                <input value={analiseCorporal2.areaCoxa} readOnly className={inputBaseClass} />
                                <input value={diferencaComposicao("4")} readOnly className={inputBaseClass} />
                            </div>
                        </div>
                    </div>

                </div>
                <div>
                    <h1 className="mb-2 border-b-2 border-[#b88b8b] pb-1 text-xl font-bold italic uppercase tracking-wide text-[#a85f60]">
                        Escala de porprocionalidade
                    </h1>
                    <div className="relative h-[160px] w-[650px] border border-zinc-500 bg-white ml-15">
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

                        <div className="absolute inset-0 grid grid-cols-10">
                            {Array.from({ length: 10 }).map((_, idx) => (
                                <div
                                    key={idx}
                                    className="border-r border-zinc-500/50"
                                />
                            ))}
                        </div>

                        <div
                            className="absolute left-0 right-0 border-b border-zinc-400"
                            style={{ top: "25%" }}
                        />

                        <div
                            className="absolute left-0 right-0 border-b border-zinc-400"
                            style={{ top: "75%" }}
                        />

                        {pontosComposicao.map((point, idx) => (
                            <div
                                key={`av1-${idx}`}
                                className="absolute z-10 h-4 w-4 rounded-full bg-red-500 border border-red-700"
                                style={{
                                    left: `calc(${(point.x / maxValor) * 100}% - 8px)`,
                                    top:
                                        point.y === 1
                                            ? "25%"
                                            : "75%",
                                    transform: "translateY(-50%)",
                                }}
                            />
                        ))}

                        {pontosComposicao2.map((point, idx) => (
                            <div
                                key={`av2-${idx}`}
                                className="absolute z-10 h-4 w-4 rounded-full bg-yellow-300 border border-zinc-700"
                                style={{
                                    left: `calc(${(point.x / maxValor) * 100}% - 8px)`,
                                    top:
                                        point.y === 1
                                            ? "25%"
                                            : "75%",
                                    transform: "translateY(-50%)",
                                }}
                            />
                        ))}

                        <div
                            className="absolute -translate-x-10/4 -translate-y-1/2 text-lg font-semibold text-zinc-500"
                            style={{ top: "25%", transform: "translateY(-50%)" }}
                        >
                            1
                        </div>

                        <div
                            className="absolute -translate-x-7/4 -translate-y-1/2 text-lg font-semibold text-zinc-500"
                            style={{ top: "75%", transform: "translateY(-50%)" }}
                        >
                            2
                        </div>

                        <div className="absolute -bottom-16 left-0 right-0 flex items-center justify-center">
                            <div className="h-3 w-3 rounded-full bg-red-500 ml-3" />
                            <span className="text-lg font-semibold text-zinc-500 ml-3">
                                1ª Av
                            </span>
                            <div className="h-3 w-3 rounded-full bg-yellow-200 border ml-3" />
                            <span className="text-lg font-semibold text-zinc-500 ml-3">
                                2ª Av
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr] mt-25 ">
                <div>
                    <h3 className="mb-2 border-b-2 border-[#b88b8b] pb-1 text-xl font-bold italic uppercase tracking-wide text-[#a85f60]">
                        Teste de Carga Máxima - 1Rm
                    </h3>
                    <div className="flex gap-6 items-start max-w-5xl">
                        <div className="flex-1">
                            <div className='grid grid-cols-[200px_140px_140px_140px] items-center gap-2 text-center'>
                                <text></text>
                                <text className="pb-1 font-bold italic uppercase tracking-wide text-[#a85f60]">1ª Avaliação</text>
                                <text className="pb-1 font-bold italic uppercase tracking-wide text-[#a85f60]">2ª Avaliação</text>
                                <text className="pb-1 font-bold italic uppercase tracking-wide text-[#a85f60]">Diferença B-A</text>
                            </div>
                            <div className="grid grid-cols-[200px_140px_140px_140px] items-center gap-2">
                                <span className="text-sm font-semibold uppercase tracking-wide text-zinc-600">
                                    Supino
                                </span>
                                <input value={resultadoRmAV1.supino.rm} readOnly className={inputBaseClass} />
                                <input value={resultadoRmAV2.supino.rm} readOnly className={inputBaseClass} />
                                <input readOnly className={inputBaseClass} />
                            </div>
                            <div className="grid grid-cols-[200px_140px_140px_140px] items-center gap-2">
                                <span className="text-sm font-semibold uppercase tracking-wide text-zinc-600">
                                    Agachamento
                                </span>
                                <input value={resultadoRmAV1.agachamento.rm} readOnly className={inputBaseClass} />
                                <input value={resultadoRmAV2.agachamento.rm} readOnly className={inputBaseClass} />
                                <input value={diferencaComposicao("2")} readOnly className={inputBaseClass} />
                            </div>
                            <div className="grid grid-cols-[200px_140px_140px_140px] items-center gap-2">
                                <span className="text-sm font-semibold uppercase tracking-wide text-zinc-600">
                                    Remada
                                </span>
                                <input value={resultadoRmAV1.remada.rm} readOnly className={inputBaseClass} />
                                <input value={resultadoRmAV2.remada.rm} readOnly className={inputBaseClass} />
                                <input value={diferencaComposicao("3")} readOnly className={inputBaseClass} />
                            </div>
                            <div className="grid grid-cols-[200px_140px_140px_140px] items-center gap-2">
                                <span className="text-sm font-semibold uppercase tracking-wide text-zinc-600">
                                    Terra
                                </span>
                                <input value={resultadoRmAV1.terra.rm} readOnly className={inputBaseClass} />
                                <input value={resultadoRmAV2.terra.rm} readOnly className={inputBaseClass} />
                                <input value={diferencaComposicao("4")} readOnly className={inputBaseClass} />
                            </div>
                        </div>
                    </div>

                </div>
                <div>
                    <h1 className="mb-2 border-b-2 border-[#b88b8b] pb-1 text-xl font-bold italic uppercase tracking-wide text-[#a85f60]">
                        Escala de porprocionalidade
                    </h1>
                    <div className="relative h-[160px] w-[650px] border border-zinc-500 bg-white ml-15">
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

                        <div className="absolute inset-0 grid grid-cols-10">
                            {Array.from({ length: 10 }).map((_, idx) => (
                                <div
                                    key={idx}
                                    className="border-r border-zinc-500/50"
                                />
                            ))}
                        </div>

                        <div
                            className="absolute left-0 right-0 border-b border-zinc-400"
                            style={{ top: "25%" }}
                        />

                        <div
                            className="absolute left-0 right-0 border-b border-zinc-400"
                            style={{ top: "75%" }}
                        />

                        {pontosComposicao.map((point, idx) => (
                            <div
                                key={`av1-${idx}`}
                                className="absolute z-10 h-4 w-4 rounded-full bg-red-500 border border-red-700"
                                style={{
                                    left: `calc(${(point.x / maxValor) * 100}% - 8px)`,
                                    top:
                                        point.y === 1
                                            ? "25%"
                                            : "75%",
                                    transform: "translateY(-50%)",
                                }}
                            />
                        ))}

                        {pontosComposicao2.map((point, idx) => (
                            <div
                                key={`av2-${idx}`}
                                className="absolute z-10 h-4 w-4 rounded-full bg-yellow-300 border border-zinc-700"
                                style={{
                                    left: `calc(${(point.x / maxValor) * 100}% - 8px)`,
                                    top:
                                        point.y === 1
                                            ? "25%"
                                            : "75%",
                                    transform: "translateY(-50%)",
                                }}
                            />
                        ))}

                        <div
                            className="absolute -translate-x-10/4 -translate-y-1/2 text-lg font-semibold text-zinc-500"
                            style={{ top: "25%", transform: "translateY(-50%)" }}
                        >
                            1
                        </div>

                        <div
                            className="absolute -translate-x-7/4 -translate-y-1/2 text-lg font-semibold text-zinc-500"
                            style={{ top: "75%", transform: "translateY(-50%)" }}
                        >
                            2
                        </div>

                        <div className="absolute -bottom-16 left-0 right-0 flex items-center justify-center">
                            <div className="h-3 w-3 rounded-full bg-red-500 ml-3" />
                            <span className="text-lg font-semibold text-zinc-500 ml-3">
                                1ª Av
                            </span>
                            <div className="h-3 w-3 rounded-full bg-yellow-200 border ml-3" />
                            <span className="text-lg font-semibold text-zinc-500 ml-3">
                                2ª Av
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            <div>
                {navTool()}
            </div>
        </main>
    )
}
