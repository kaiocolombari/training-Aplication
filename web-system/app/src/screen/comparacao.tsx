import { initialState, useAvaliacao } from '../context/avaliacaoContext'
import { useState, useMemo, useEffect } from 'react'
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
import { GraficoForca } from '../components/chartForca';



const valorClass =
    "flex h-10 items-center justify-center rounded-xl border border-zinc-300 bg-[#e2e2e2] px-3 text-sm font-bold text-zinc-700";

const diferencaClass = (valor: number | string) => {
    const numero =
        typeof valor === "number"
            ? valor
            : parseDecimal(String(valor));

    if (numero > 0) {
        return "flex h-10 items-center justify-center rounded-xl border border-[#b88b8b] bg-[#f3e5e5] px-3 text-sm font-black text-[#8f4f51]";
    }

    if (numero < 0) {
        return "flex h-10 items-center justify-center rounded-xl border border-zinc-300 bg-[#e5e5e5] px-3 text-sm font-black text-zinc-600";
    }

    return "flex h-10 items-center justify-center rounded-xl border border-zinc-300 bg-[#eeeeee] px-3 text-sm font-black text-zinc-500";
};

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


    function parseDecimal(
        value: string | number | undefined | null
    ): number {
        if (value === undefined || value === null || value === "") {
            return 0;
        }

        const normalized = String(value)
            .replace(",", ".")
            .replace(/[^\d.-]/g, "");

        const parsed = Number(normalized);

        return Number.isFinite(parsed) ? parsed : 0;
    }

    function parseEstatura(
        value: string | number | undefined | null
    ): number {
        const estatura = parseDecimal(value);

        if (estatura <= 0) {
            return 0;
        }

        // Se vier como 179, transforma em 1.79
        if (estatura > 3) {
            return estatura / 100;
        }

        return estatura;
    }

    function calcularIMC(
        massa: string | number | undefined | null,
        estatura: string | number | undefined | null
    ): number {
        const peso = parseDecimal(massa);
        const altura = parseEstatura(estatura);

        if (peso <= 0 || altura <= 0) {
            return 0;
        }

        return peso / (altura * altura);
    }

    function calcularEfeitoEstrutural(
        data: ExamData,
        key: PerimetroKey
    ): number {
        const estatura = parseEstatura(data.estatura);

        if (estatura <= 0) {
            return 0;
        }

        const alturaCm = estatura * 100;

        const umero = parseDecimal(data.umero);
        const femur = parseDecimal(data.femur);
        const tibia = parseDecimal(data.tibia);
        const una = parseDecimal(data.una);

        // Referências proporcionais à estatura
        const referencias = {
            umero: alturaCm * 0.17,
            una: alturaCm * 0.15,
            femur: alturaCm * 0.26,
            tibia: alturaCm * 0.22,
        };

        switch (key) {

            case "bracoD":
            case "bracoE": {
                if (umero <= 0) return 0;

                const proporcao =
                    (umero / referencias.umero) - 1;

                return proporcao * 10;
            }

            case "antebracoD":
            case "antebracoE": {
                if (una <= 0) return 0;

                const proporcao =
                    (una / referencias.una) - 1;

                return proporcao * 7;
            }

            case "coxaSupD":
            case "coxaSupE":
            case "coxaMediaD":
            case "coxaMediaE": {
                if (femur <= 0) return 0;

                const proporcao =
                    (femur / referencias.femur) - 1;

                return proporcao * 12;
            }

            case "panturrilhaD":
            case "panturrilhaE": {
                if (tibia <= 0) return 0;

                const proporcao =
                    (tibia / referencias.tibia) - 1;

                return proporcao * 8;
            }

            default:
                return 0;
        }
    }

    function getReferenceByKey(
        key: PerimetroKey,
        data: ExamData
    ): number {

        const idade = parseDecimal(data.idade);

        const estatura = parseEstatura(data.estatura);

        const imc = calcularIMC(
            data.massa,
            data.estatura
        );

        const masculino =
            data.genero === "masculino";

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

        const estaturaFactor =
            estatura > 0
                ? 1 + ((estatura - 1.75) * 0.25)
                : 1;

        let value =
            baseValues[key] * estaturaFactor;

        // NOVO cálculo estrutural
        value += calcularEfeitoEstrutural(
            data,
            key
        );

        // Ajuste relacionado ao IMC
        if (imc >= 25) {

            switch (key) {

                case "cintura":
                    value += imc >= 30 ? 12 : 6;
                    break;

                case "abdomen":
                    value += imc >= 30 ? 14 : 7;
                    break;

                case "quadril":
                    value += imc >= 30 ? 8 : 4;
                    break;

                case "torax":
                    value += imc >= 30 ? 5 : 2;
                    break;
            }
        }

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

    const observacoes = avaliacao.anamneseComparacao.observacoes;

    const updateObservacoes = (value: string) => {
        setAvaliacao((current) => ({
            ...current,

            anamneseComparacao: {
                ...current.anamnese,

                observacoes: value,
            },
        }));
    };


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

                const valorTexto =
                    perimetros[item.key];

                if (!valorTexto) {
                    return null;
                }

                const valor =
                    parseDecimal(valorTexto);

                const ref =
                    getReferenceByKey(
                        item.key,
                        data
                    );

                const desvio =
                    perimetroDesvios[item.key] *
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
                ): point is {
                    x: number;
                    y: number;
                } => point !== null
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

                const valorTexto =
                    perimetros2[item.key];

                if (!valorTexto) {
                    return null;
                }

                const valor =
                    parseDecimal(valorTexto);

                const ref =
                    getReferenceByKey(
                        item.key,
                        data2
                    );

                const desvio =
                    perimetroDesvios[item.key] *
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
                ): point is {
                    x: number;
                    y: number;
                } => point !== null
            );

    }, [
        perimetros2,
        data2,
        dadosAntropometricosValidos2,
    ]);

    function calcularAreaCircular(perimetro: number): number {
        if (perimetro <= 0) {
            return 0;
        }

        return (
            (perimetro * perimetro) /
            (4 * Math.PI)
        );
    }

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
                calcularIMC(
                    data.massa,
                    data.estatura
                )
            );

        const refBraco =
            calcularAreaCircular(
                getReferenceByKey(
                    "bracoD",
                    data
                )
            );

        const refCoxa =
            calcularAreaCircular(
                getReferenceByKey(
                    "coxaMediaD",
                    data
                )
            );

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
                calcularIMC(
                    data2.massa,
                    data2.estatura
                )
            );

        const refBraco =
            calcularAreaCircular(
                getReferenceByKey(
                    "bracoD",
                    data2
                )
            );

        const refCoxa =
            calcularAreaCircular(
                getReferenceByKey(
                    "coxaMediaD",
                    data2
                )
            );

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

    const diferencaRM = (type: "1" | "2" | "3" | "4") => {
        let diferenca: number = 0;
        switch (type) {
            case "1":
                diferenca = resultadoRmAV2.supino.rm - resultadoRmAV1.supino.rm;
                break;
            case "2":
                diferenca = resultadoRmAV2.terra.rm - resultadoRmAV1.terra.rm;
                break;
            case "3":
                diferenca = resultadoRmAV2.remada.rm - resultadoRmAV1.remada.rm;
                break;
            case "4":
                diferenca = resultadoRmAV2.agachamento.rm - resultadoRmAV1.agachamento.rm;
                break;
        }
        return diferenca;
    }

    const diferencaQuimica = (type: "1" | "2" | "3" | "4") => {
        let diferenca = 0;

        switch (type) {
            case "1":
                diferenca = Number(data2.glicose) - Number(data.glicose);
                break;

            case "2":
                diferenca =
                    Number(data2.triglicerideos) -
                    Number(data.triglicerideos);
                break;

            case "3":
                diferenca =
                    Number(data2.ldl) -
                    Number(data.ldl);
                break;

            case "4":
                diferenca =
                    Number(data2.hdl) -
                    Number(data.hdl);
                break;
        }

        return diferenca.toFixed(1).replace(".", ",");
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

    return (
        <main className="min-h-full bg-[#ececec] p-3 md:p-5">

            <section className="mb-6 rounded-3xl border border-zinc-300 bg-[#f7f7f7] p-6 shadow-sm">

                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

                    <div>
                        <p className="mb-1 text-sm font-bold uppercase tracking-[0.2em] text-[#a85f60]">
                            Avaliação física
                        </p>

                        <h1 className="text-3xl font-black italic tracking-tight text-zinc-700">
                            Evolução do atleta
                        </h1>

                        <p className="mt-1 text-sm text-zinc-500">
                            Comparação entre a primeira e a segunda avaliação.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">

                        <div className="rounded-2xl border border-zinc-300 bg-[#eeeeee] px-5 py-3 text-center">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                                Avaliações
                            </p>

                            <p className="mt-1 text-lg font-black text-[#8f4f51]">
                                01 → 02
                            </p>
                        </div>

                        <div className="rounded-2xl border border-zinc-300 bg-[#eeeeee] px-5 py-3 text-center">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                                Atleta
                            </p>

                            <p className="mt-1 max-w-[180px] truncate text-sm font-black text-zinc-700">
                                {data.nomeCompleto}
                            </p>
                        </div>

                    </div>
                </div>
            </section>

            <section className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-300 bg-[#f7f7f7] p-4">

                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Leitura:
                </span>

                <div className="flex items-center gap-2 rounded-xl bg-[#eeeeee] px-3 py-2">
                    <div className="h-3 w-3 rounded-full bg-[#a85f60]" />
                    <span className="text-xs font-semibold text-zinc-600">
                        1ª avaliação
                    </span>
                </div>

                <div className="flex items-center gap-2 rounded-xl bg-[#eeeeee] px-3 py-2">
                    <div className="h-3 w-3 rounded-full bg-zinc-500" />
                    <span className="text-xs font-semibold text-zinc-600">
                        2ª avaliação
                    </span>
                </div>

                <div className="flex items-center gap-2 rounded-xl bg-[#eeeeee] px-3 py-2">
                    <div className="h-3 w-3 rounded-full bg-[#8f4f51]" />
                    <span className="text-xs font-semibold text-zinc-600">
                        Diferença
                    </span>
                </div>

            </section>

            <section className="mb-8 rounded-3xl border border-zinc-300 bg-[#f7f7f7] p-5 shadow-sm">

                <div className="mb-5 flex items-center justify-between">

                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-[#a85f60]">
                            Medidas corporais
                        </p>

                        <h2 className="text-2xl font-black text-zinc-700">
                            Perímetros corporais
                        </h2>
                    </div>

                    <div className="hidden rounded-xl bg-[#eeeeee] px-4 py-2 text-xs font-bold text-zinc-500 md:block">
                        Unidade: cm
                    </div>

                </div>


                <div className="grid gap-6 xl:grid-cols-[1.35fr_0.8fr]">

                    <div className="overflow-hidden rounded-2xl border border-zinc-300">

                        <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-2 bg-[#eeeeee] p-3">

                            <span className="text-xs font-black uppercase tracking-wider text-zinc-500">
                                Medida
                            </span>

                            <span className="text-center text-xs font-black uppercase tracking-wider text-[#a85f60]">
                                1ª avaliação
                            </span>

                            <span className="text-center text-xs font-black uppercase tracking-wider text-[#a85f60]">
                                2ª avaliação
                            </span>

                            <span className="text-center text-xs font-black uppercase tracking-wider text-[#a85f60]">
                                Δ diferença
                            </span>

                        </div>


                        {perimetroConfig.map((field, index) => {

                            const diferenca = diferencaPerimetros(field.key);

                            return (
                                <div
                                    key={field.key}
                                    className={`grid grid-cols-[1.4fr_1fr_1fr_1fr] items-center gap-2 p-2 ${index % 2 === 0
                                        ? "bg-[#f7f7f7]"
                                        : "bg-[#eeeeee]"
                                        }`}
                                >

                                    <div className="flex items-center gap-2">

                                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#e2e2e2] text-[10px] font-black text-zinc-500">
                                            {field.index}
                                        </span>

                                        <span className="text-sm font-bold text-zinc-600">
                                            {field.label}
                                        </span>

                                    </div>

                                    <div className={valorClass}>
                                        {perimetros[field.key] || "0"}
                                    </div>

                                    <div className={valorClass}>
                                        {perimetros2[field.key] || "0"}
                                    </div>

                                    <div className={diferencaClass(diferenca)}>
                                        {diferenca > 0 ? "+" : ""}
                                        {diferenca.toFixed(1).replace(".", ",")}
                                    </div>

                                </div>
                            );
                        })}

                    </div>

                    <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-zinc-300 bg-[#eeeeee]">

                        <img
                            src="./app/src/assets/human.png"
                            alt=""
                            className="max-h-[730px] 2- object-contain py-5"
                        />

                    </div>

                </div>
            </section>

            <section className="mb-8 rounded-3xl border border-zinc-300 bg-[#f7f7f7] p-5 shadow-sm">

                <div className="mb-5 flex items-center justify-between">

                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-[#a85f60]">
                            Composição corporal
                        </p>

                        <h2 className="text-2xl font-black text-zinc-700">
                            Dobras cutâneas
                        </h2>
                    </div>

                    <div className="hidden rounded-xl bg-[#eeeeee] px-4 py-2 text-xs font-bold text-zinc-500 md:block">
                        Unidade: mm
                    </div>

                </div>


                <div className="grid gap-6 xl:grid-cols-[1.35fr_0.8fr]">

                    <div className="overflow-hidden rounded-2xl border border-zinc-300">

                        <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-2 bg-[#eeeeee] p-3">

                            <span className="text-xs font-black uppercase tracking-wider text-zinc-500">
                                Ponto
                            </span>

                            <span className="text-center text-xs font-black uppercase tracking-wider text-[#a85f60]">
                                1ª avaliação
                            </span>

                            <span className="text-center text-xs font-black uppercase tracking-wider text-[#a85f60]">
                                2ª avaliação
                            </span>

                            <span className="text-center text-xs font-black uppercase tracking-wider text-[#a85f60]">
                                Δ diferença
                            </span>

                        </div>


                        {dobrasConfig.map((field, index) => {

                            const diferenca = parseDecimal(
                                diferencaDobras(field.key, "1")
                            );

                            return (
                                <div
                                    key={field.key}
                                    className={`grid grid-cols-[1.4fr_1fr_1fr_1fr] items-center gap-2 p-2 ${index % 2 === 0
                                        ? "bg-[#f7f7f7]"
                                        : "bg-[#eeeeee]"
                                        }`}
                                >

                                    <div className="flex items-center gap-2">

                                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#e2e2e2] text-[10px] font-black text-zinc-500">
                                            {field.index}
                                        </span>

                                        <span className="text-sm font-bold text-zinc-600">
                                            {field.label}
                                        </span>

                                    </div>

                                    <div className={valorClass}>
                                        {resumoDobras.mediaFinal[field.key] || "0"}
                                    </div>

                                    <div className={valorClass}>
                                        {resumoDobras2.mediaFinal2[field.key] || "0"}
                                    </div>

                                    <div className={diferencaClass(diferenca)}>
                                        {diferenca > 0 ? "+" : ""}
                                        {diferenca.toFixed(1).replace(".", ",")}
                                    </div>

                                </div>
                            );
                        })}

                        <div className="border-t border-zinc-300 bg-[#eeeeee] p-3">

                            <div className="grid gap-3 md:grid-cols-3">

                                {[
                                    {
                                        label: "Somatório",
                                        v1: resumoDobras.somatorio,
                                        v2: resumoDobras2.somatorio,
                                        diff: diferencaDobras(undefined, "2"),
                                    },
                                    {
                                        label: "Periférico",
                                        v1: resumoDobras.periferico,
                                        v2: resumoDobras2.periferico,
                                        diff: diferencaDobras(undefined, "3"),
                                    },
                                    {
                                        label: "Central",
                                        v1: resumoDobras.central,
                                        v2: resumoDobras2.central,
                                        diff: diferencaDobras(undefined, "4"),
                                    },
                                ].map((item) => (

                                    <div
                                        key={item.label}
                                        className="rounded-2xl border border-zinc-300 bg-[#f7f7f7] p-3"
                                    >

                                        <p className="mb-2 text-xs font-black uppercase tracking-wider text-[#a85f60]">
                                            {item.label}
                                        </p>

                                        <div className="grid grid-cols-3 gap-2">

                                            <div>
                                                <p className="mb-1 text-[10px] font-bold text-zinc-400">
                                                    AV. 01
                                                </p>

                                                <div className={valorClass}>
                                                    {item.v1 || "0"}
                                                </div>
                                            </div>

                                            <div>
                                                <p className="mb-1 text-[10px] font-bold text-zinc-400">
                                                    AV. 02
                                                </p>

                                                <div className={valorClass}>
                                                    {item.v2 || "0"}
                                                </div>
                                            </div>

                                            <div>
                                                <p className="mb-1 text-[10px] font-bold text-zinc-400">
                                                    Δ
                                                </p>

                                                <div className={diferencaClass(item.diff)}>
                                                    {item.diff}
                                                </div>
                                            </div>

                                        </div>

                                    </div>

                                ))}

                            </div>

                        </div>

                    </div>


                    <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-zinc-300 bg-[#eeeeee]">

                        <img
                            src="./app/src/assets/human2.png"
                            alt=""
                            className="max-h-[550px] object-contain py-5"
                        />

                    </div>

                </div>
            </section>

            <section className="mb-8 grid gap-6 xl:grid-cols-2">

                <div className="rounded-3xl border border-zinc-300 bg-[#f7f7f7] p-5 shadow-sm">

                    <div className="mb-4">

                        <p className="text-xs font-bold uppercase tracking-widest text-[#a85f60]">
                            Análise visual
                        </p>

                        <h2 className="text-xl font-black text-zinc-700">
                            Escala de proporcionalidade
                        </h2>

                    </div>

                    <div className="flex justify-center">

                        <div className="relative h-[420px] w-full max-w-[520px] rounded-2xl border border-zinc-300 bg-white">

                            <div className="absolute inset-0 grid grid-cols-10 overflow-hidden rounded-2xl">

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
                                        className="border-r border-zinc-400/40"
                                    />
                                ))}

                            </div>


                            <div className="absolute inset-0 grid grid-rows-14">

                                {Array.from({ length: 14 }).map((_, idx) => (
                                    <div
                                        key={idx}
                                        className="border-b border-zinc-300/60"
                                    />
                                ))}

                            </div>


                            <div className="absolute inset-y-0 left-1/2 w-[2px] bg-zinc-600" />


                            {chartPoints.map((point, idx) => (

                                <div
                                    key={`p1-${idx}`}
                                    className="absolute z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#8f4f51] shadow-md"
                                    style={{
                                        left: `${((point.x + 5) / 10) * 100}%`,
                                        top: `${((point.y - 0.5) / 14) * 100}%`,
                                    }}
                                />

                            ))}


                            {chartPoints2.map((point, idx) => (

                                <div
                                    key={`p2-${idx}`}
                                    className="absolute z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-zinc-600 bg-[#eeeeee] shadow-md"
                                    style={{
                                        left: `${((point.x + 5) / 10) * 100}%`,
                                        top: `${((point.y - 0.5) / 14) * 100}%`,
                                    }}
                                />

                            ))}

                        </div>

                    </div>


                    <div className="mt-5 flex justify-center gap-5">

                        <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
                            <span className="h-3 w-3 rounded-full bg-[#8f4f51]" />
                            1ª avaliação
                        </div>

                        <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
                            <span className="h-3 w-3 rounded-full border-2 border-zinc-600 bg-[#eeeeee]" />
                            2ª avaliação
                        </div>

                    </div>

                </div>

                <div className="rounded-3xl border border-zinc-300 bg-[#f7f7f7] p-5 shadow-sm">

                    <div className="mb-4">

                        <p className="text-xs font-bold uppercase tracking-widest text-[#a85f60]">
                            Análise visual
                        </p>

                        <h2 className="text-xl font-black text-zinc-700">
                            Distribuição das dobras
                        </h2>

                    </div>


                    <div className="flex justify-center">

                        <div className="relative h-[420px] w-full max-w-[520px] rounded-2xl border border-zinc-300 bg-white">

                            <div className="absolute inset-0 grid grid-cols-10 overflow-hidden rounded-2xl">

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
                                        className="border-r border-zinc-400/40"
                                    />
                                ))}

                            </div>


                            <div className="absolute inset-0 grid grid-rows-8">

                                {Array.from({ length: 8 }).map((_, idx) => (
                                    <div
                                        key={idx}
                                        className="border-b border-zinc-300/60"
                                    />
                                ))}

                            </div>


                            <div className="absolute inset-y-0 left-1/2 w-[2px] bg-zinc-600" />


                            {pontosDobras.map((point, idx) => (

                                <div
                                    key={`d1-${idx}`}
                                    className="absolute z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#8f4f51] shadow-md"
                                    style={{
                                        left: `${((point.x + 5) / 10) * 100}%`,
                                        top: `${((point.y - 0.5) / dobraChartRows) * 100}%`,
                                    }}
                                />

                            ))}


                            {pontosDobras2.map((point, idx) => (

                                <div
                                    key={`d2-${idx}`}
                                    className="absolute z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-zinc-600 bg-[#eeeeee] shadow-md"
                                    style={{
                                        left: `${((point.x + 5) / 10) * 100}%`,
                                        top: `${((point.y - 0.5) / dobraChartRows) * 100}%`,
                                    }}
                                />

                            ))}

                        </div>

                    </div>


                    <div className="mt-5 flex justify-center gap-5">

                        <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
                            <span className="h-3 w-3 rounded-full bg-[#8f4f51]" />
                            1ª avaliação
                        </div>

                        <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
                            <span className="h-3 w-3 rounded-full border-2 border-zinc-600 bg-[#eeeeee]" />
                            2ª avaliação
                        </div>

                    </div>

                </div>

            </section>

            <section className="mb-8 rounded-3xl border border-zinc-300 bg-[#f7f7f7] p-5 shadow-sm">

                <div className="mb-5">

                    <p className="text-xs font-bold uppercase tracking-widest text-[#a85f60]">
                        Análise corporal
                    </p>

                    <h2 className="text-2xl font-black text-zinc-700">
                        Composição corporal
                    </h2>

                </div>


                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

                    {[
                        {
                            titulo: "Massa muscular",
                            v1: analiseCorporal.massaMuscularKg,
                            v2: analiseCorporal2.massaMuscularKg,
                            diff: diferencaComposicao("1"),
                            unidade: "kg",
                        },
                        {
                            titulo: "Massa adiposa",
                            v1: analiseCorporal.massaAdiposaKg,
                            v2: analiseCorporal2.massaAdiposaKg,
                            diff: diferencaComposicao("2"),
                            unidade: "kg",
                        },
                        {
                            titulo: "AMB",
                            v1: analiseCorporal.areaBraco,
                            v2: analiseCorporal2.areaBraco,
                            diff: diferencaComposicao("3"),
                            unidade: "cm²",
                        },
                        {
                            titulo: "AMC",
                            v1: analiseCorporal.areaCoxa,
                            v2: analiseCorporal2.areaCoxa,
                            diff: diferencaComposicao("4"),
                            unidade: "cm²",
                        },
                    ].map((item) => (

                        <div
                            key={item.titulo}
                            className="rounded-2xl border border-zinc-300 bg-[#eeeeee] p-4"
                        >

                            <div className="mb-4">

                                <p className="text-xs font-black uppercase tracking-wider text-zinc-500">
                                    {item.titulo}
                                </p>

                                <p className="text-[11px] text-zinc-400">
                                    {item.unidade}
                                </p>

                            </div>


                            <div className="grid grid-cols-3 gap-2">

                                <div>
                                    <p className="mb-1 text-[10px] font-bold uppercase text-zinc-400">
                                        01
                                    </p>

                                    <div className={valorClass}>
                                        {item.v1}
                                    </div>
                                </div>


                                <div>
                                    <p className="mb-1 text-[10px] font-bold uppercase text-zinc-400">
                                        02
                                    </p>

                                    <div className={valorClass}>
                                        {item.v2}
                                    </div>
                                </div>


                                <div>
                                    <p className="mb-1 text-[10px] font-bold uppercase text-zinc-400">
                                        Δ
                                    </p>

                                    <div className={diferencaClass(item.diff)}>
                                        {item.diff}
                                    </div>
                                </div>

                            </div>

                        </div>

                    ))}

                </div>

                <div className="mt-5 rounded-2xl border border-zinc-300 bg-[#eeeeee] p-5">

                    <div className="mb-4">

                        <p className="text-xs font-black uppercase tracking-wider text-[#a85f60]">
                            Distribuição
                        </p>

                        <p className="text-sm text-zinc-500">
                            Comparação da massa muscular e massa adiposa.
                        </p>

                    </div>


                    <div className="relative h-[150px] w-full overflow-hidden rounded-xl border border-zinc-300 bg-white">

                        <div className="absolute left-0 right-0 top-[25%] border-b border-zinc-300" />

                        <div className="absolute left-0 right-0 top-[75%] border-b border-zinc-300" />


                        {pontosComposicao.map((point, idx) => (

                            <div
                                key={`comp1-${idx}`}
                                className="absolute z-10 h-4 w-4 rounded-full bg-[#8f4f51] shadow"
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
                                key={`comp2-${idx}`}
                                className="absolute z-10 h-4 w-4 rounded-full border-2 border-zinc-600 bg-[#eeeeee] shadow"
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

                    </div>

                </div>

            </section>

            <section className="mb-8 rounded-3xl border border-zinc-300 bg-[#f7f7f7] p-5 shadow-sm">

                <div className="mb-5">

                    <p className="text-xs font-bold uppercase tracking-widest text-[#a85f60]">
                        Desempenho
                    </p>

                    <h2 className="text-2xl font-black text-zinc-700">
                        Teste de carga máxima — 1RM
                    </h2>

                </div>


                <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">

                    <div className="grid gap-3 md:grid-cols-2">

                        {[
                            {
                                nome: "Supino",
                                v1: resultadoRmAV1.supino.rm,
                                v2: resultadoRmAV2.supino.rm,
                                diff: diferencaRM("1"),
                            },
                            {
                                nome: "Agachamento",
                                v1: resultadoRmAV1.agachamento.rm,
                                v2: resultadoRmAV2.agachamento.rm,
                                diff: diferencaRM("2"),
                            },
                            {
                                nome: "Remada",
                                v1: resultadoRmAV1.remada.rm,
                                v2: resultadoRmAV2.remada.rm,
                                diff: diferencaRM("3"),
                            },
                            {
                                nome: "Terra",
                                v1: resultadoRmAV1.terra.rm,
                                v2: resultadoRmAV2.terra.rm,
                                diff: diferencaRM("4"),
                            },
                        ].map((item) => (

                            <div
                                key={item.nome}
                                className="rounded-2xl border border-zinc-300 bg-[#eeeeee] p-4"
                            >

                                <div className="mb-4 flex items-center justify-between">

                                    <span className="text-sm font-black uppercase tracking-wide text-zinc-600">
                                        {item.nome}
                                    </span>

                                    <span className="rounded-lg bg-[#e2e2e2] px-2 py-1 text-[10px] font-bold text-zinc-500">
                                        1RM
                                    </span>

                                </div>


                                <div className="grid grid-cols-3 gap-2">

                                    <div>
                                        <p className="mb-1 text-[10px] font-bold text-zinc-400">
                                            AV. 01
                                        </p>

                                        <div className={valorClass}>
                                            {item.v1} kg
                                        </div>
                                    </div>


                                    <div>
                                        <p className="mb-1 text-[10px] font-bold text-zinc-400">
                                            AV. 02
                                        </p>

                                        <div className={valorClass}>
                                            {item.v2} kg
                                        </div>
                                    </div>


                                    <div>
                                        <p className="mb-1 text-[10px] font-bold text-zinc-400">
                                            Δ
                                        </p>

                                        <div className={diferencaClass(item.diff)}>
                                            {item.diff > 0 ? "+" : ""}
                                            {item.diff} kg
                                        </div>
                                    </div>

                                </div>

                            </div>

                        ))}

                    </div>


                    <div className="overflow-hidden rounded-2xl border border-zinc-300 bg-[#eeeeee]">

                        <div className="border-b border-zinc-300 p-4">

                            <p className="text-xs font-black uppercase tracking-wider text-[#a85f60]">
                                Produção de força
                            </p>

                            <p className="text-sm text-zinc-500">
                                Evolução estimada da força máxima.
                            </p>

                        </div>

                        <div className="p-4">

                            <GraficoForca
                                resultadoRmAV1={resultadoRmAV1}
                                resultadoRmAV2={resultadoRmAV2}
                            />

                        </div>

                    </div>

                </div>

            </section>

            <section className="mb-8 rounded-3xl border border-zinc-300 bg-[#f7f7f7] p-5 shadow-sm">

                <div className="mb-5">

                    <p className="text-xs font-bold uppercase tracking-widest text-[#a85f60]">
                        Controle laboratorial
                    </p>

                    <h2 className="text-2xl font-black text-zinc-700">
                        Controle bioquímico
                    </h2>

                </div>


                <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">

                    <div className="overflow-hidden rounded-2xl border border-zinc-300">

                        <div className="grid grid-cols-[1.3fr_1fr_1fr_1fr] bg-[#eeeeee] p-3">

                            <span className="text-xs font-black uppercase tracking-wider text-zinc-500">
                                Exame
                            </span>

                            <span className="text-center text-xs font-black uppercase tracking-wider text-[#a85f60]">
                                AV. 01
                            </span>

                            <span className="text-center text-xs font-black uppercase tracking-wider text-[#a85f60]">
                                AV. 02
                            </span>

                            <span className="text-center text-xs font-black uppercase tracking-wider text-[#a85f60]">
                                Δ
                            </span>

                        </div>


                        {[
                            {
                                nome: "Glicose",
                                v1: data.glicose,
                                v2: data2.glicose,
                                diff: diferencaQuimica("1"),
                            },
                            {
                                nome: "Triglicerídeos",
                                v1: data.triglicerideos,
                                v2: data2.triglicerideos,
                                diff: diferencaQuimica("2"),
                            },
                            {
                                nome: "LDL-C",
                                v1: data.ldl,
                                v2: data2.ldl,
                                diff: diferencaQuimica("3"),
                            },
                            {
                                nome: "HDL-C",
                                v1: data.hdl,
                                v2: data2.hdl,
                                diff: diferencaQuimica("4"),
                            },
                        ].map((item, index) => {

                            const diff = parseDecimal(item.diff);

                            return (
                                <div
                                    key={item.nome}
                                    className={`grid grid-cols-[1.3fr_1fr_1fr_1fr] items-center gap-2 p-3 ${index % 2 === 0
                                        ? "bg-[#f7f7f7]"
                                        : "bg-[#eeeeee]"
                                        }`}
                                >

                                    <span className="text-sm font-bold text-zinc-600">
                                        {item.nome}
                                    </span>

                                    <div className={valorClass}>
                                        {item.v1 || "0"}
                                    </div>

                                    <div className={valorClass}>
                                        {item.v2 || "0"}
                                    </div>

                                    <div className={diferencaClass(diff)}>
                                        {diff > 0 ? "+" : ""}
                                        {item.diff}
                                    </div>

                                </div>
                            );
                        })}

                    </div>

                    <div className="rounded-2xl border border-zinc-300 bg-[#eeeeee] p-4">

                        <div className="mb-4">

                            <p className="text-xs font-black uppercase tracking-wider text-[#a85f60]">
                                Valores de referência
                            </p>

                            <p className="text-sm text-zinc-500">
                                Faixas utilizadas como referência visual.
                            </p>

                        </div>


                        <div className="overflow-hidden rounded-xl border border-zinc-300">

                            <div className="grid grid-cols-3 bg-[#e2e2e2] p-3">

                                <span className="text-xs font-black uppercase text-zinc-500">
                                    Exame
                                </span>

                                <span className="text-center text-xs font-black uppercase text-zinc-500">
                                    Desejável
                                </span>

                                <span className="text-center text-xs font-black uppercase text-zinc-500">
                                    Limítrofe
                                </span>

                            </div>


                            {[
                                ["Glicose", "< 110 mg/dl", "110 - 125 mg/dl"],
                                ["Triglicerídeos", "< 150 mg/dl", "150 - 200 mg/dl"],
                                ["LDL-C", "< 150 mg/dl", "130 - 160 mg/dl"],
                                ["HDL-C", "> 40 mg/dl", "35 - 40 mg/dl"],
                            ].map((item, index) => (

                                <div
                                    key={item[0]}
                                    className={`grid grid-cols-3 items-center p-3 ${index % 2 === 0
                                        ? "bg-[#f7f7f7]"
                                        : "bg-[#eeeeee]"
                                        }`}
                                >

                                    <span className="text-sm font-bold text-zinc-600">
                                        {item[0]}
                                    </span>

                                    <span className="text-center text-xs font-semibold text-zinc-500">
                                        {item[1]}
                                    </span>

                                    <span className="text-center text-xs font-semibold text-zinc-500">
                                        {item[2]}
                                    </span>

                                </div>

                            ))}

                        </div>

                    </div>

                </div>

            </section>

            <section className="mb-20 rounded-3xl border border-zinc-300 bg-[#f7f7f7] p-5 shadow-sm">

                <div className="mb-4">

                    <p className="text-xs font-bold uppercase tracking-widest text-[#a85f60]">
                        Observações
                    </p>

                    <h2 className="text-2xl font-black text-zinc-700">
                        Parecer descritivo
                    </h2>

                    <p className="mt-1 text-sm text-zinc-500">
                        Registre a interpretação geral da evolução do atleta.
                    </p>

                </div>


                <textarea
                    value={observacoes}
                    onChange={(e) => updateObservacoes(e.target.value)}
                    placeholder="Digite aqui o parecer da avaliação..."
                    className="
                    min-h-[180px]
                    w-full
                    resize-y
                    rounded-2xl
                    border-2
                    border-zinc-400
                    bg-[#e2e2e2]
                    p-4
                    text-sm
                    font-medium
                    text-zinc-700
                    outline-none
                    transition-all
                    duration-150
                    placeholder:text-zinc-400
                    hover:border-zinc-500
                    hover:bg-[#dddddd]
                    focus:border-[#8f4f51]
                    focus:bg-[#f3e5e5]
                    focus:ring-2
                    focus:ring-[#8f4f51]/20
                "
                />

            </section>

            {navTool()}

        </main>
    );
}
