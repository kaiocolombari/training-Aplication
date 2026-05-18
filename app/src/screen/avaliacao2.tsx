import { useEffect, useMemo, useState } from "react";
import type { ExamData } from "../types/examData";
import type { PerimetroKey } from "../types/perimetroKey";
import type { PerimetroField } from "../types/perimetroField";
import { useNavigate } from "react-router";
import { useLocation } from "react-router";
import type { DobraKey } from "../types/dobraKey";
import type { DobraField } from "../types/dobraField";

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

const dobraReferences: Record<DobraKey, number> = {
    triceps: 14,
    subescapular: 18,
    biceps: 8,
    iliaca: 22,
    supraespinhal: 15,
    abdominal: 20,
    coxaMedia: 28,
    panturrilha: 18,
};

function getReferenceByKey(
    key: PerimetroKey,
    data: ExamData
): number {
    const idade = Number(data.idade);
    const massa = parseDecimal(data.massa);
    const estatura = parseDecimal(data.estatura);

    const imc =
        estatura > 0
            ? massa / (estatura * estatura)
            : 0;

    const masculino = data.genero === "masculino";

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

    let value = baseValues[key];

    // ajuste por IMC
    if (imc >= 30) {
        value += 4;
    } else if (imc >= 25) {
        value += 2;
    }

    // ajuste por idade
    if (idade >= 50) {
        value -= 1.5;
    }

    return Number(value.toFixed(1));
}

const emptyPerimetros: Record<PerimetroKey, string> = {
    bracoD: "",
    bracoE: "",
    antebracoD: "",
    antebracoE: "",
    torax: "",
    cintura: "",
    abdomen: "",
    quadril: "",
    coxaSupD: "",
    coxaSupE: "",
    coxaMediaD: "",
    coxaMediaE: "",
    panturrilhaD: "",
    panturrilhaE: "",
};



const emptyDobras = {
    triceps: { primeira: "", segunda: "" },
    subescapular: { primeira: "", segunda: "" },
    biceps: { primeira: "", segunda: "" },
    iliaca: { primeira: "", segunda: "" },
    supraespinhal: { primeira: "", segunda: "" },
    abdominal: { primeira: "", segunda: "" },
    coxaMedia: { primeira: "", segunda: "" },
    panturrilha: { primeira: "", segunda: "" },
};


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
        <div>
            <h4 className="mb-2 border-b-2 border-[#b88b8b] pb-1 text-xl font-bold italic uppercase tracking-wide text-[#a85f60]">
                {label}
            </h4>
            <span className="mb-1 block text-sm font-semibold uppercase tracking-wide text-zinc-600">Classificacao</span>
            <div className="flex h-10 items-center justify-center bg-[#4f7fb7] px-3 text-[1.85rem] font-medium text-white">
                {value}
            </div>
        </div>
    );
}

export default function App() {
    const navigate = useNavigate();
    const location = useLocation();
    const { data2 } = location.state;

    const [data, setData] = useState<ExamData>({
        nomeCompleto: data2.nomeCompleto,
        genero: data2.genero,
        idade: "",
        etnia: data2.etnia,
        massa: "",
        estatura: "",
        femur: data2.femur,
        tibia: data2.tibia,
        una: data2.una,
        umero: data2.umero,
        fcRepouso: "",
        fcMaxima: "",
        fcReserva: "",
        glicose: "",
        triglicerideos: "",
        ldl: "",
        hdl: "",
        sistolica: "",
        diastolica: "",
    });

    const [dobras, setDobras] = useState<Record<DobraKey, { primeira: string; segunda: string }>>({
        triceps: { primeira: "", segunda: "" },
        subescapular: { primeira: "", segunda: "" },
        biceps: { primeira: "", segunda: "" },
        iliaca: { primeira: "", segunda: "" },
        supraespinhal: { primeira: "", segunda: "" },
        abdominal: { primeira: "", segunda: "" },
        coxaMedia: { primeira: "", segunda: "" },
        panturrilha: { primeira: "", segunda: "" },
    });

    const [perimetros, setPerimetros] = useState<Record<PerimetroKey, string>>(emptyPerimetros); ({
        bracoD: "",
        bracoE: "",
        antebracoD: "",
        antebracoE: "",
        torax: "",
        cintura: "",
        abdomen: "",
        quadril: "",
        coxaSupD: "",
        coxaSupE: "",
        coxaMediaD: "",
        coxaMediaE: "",
        panturrilhaD: "",
        panturrilhaE: "",
    });

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

    const classificacaoPressao = useMemo(() => {
        const sistolica = Number(data.sistolica);
        const diastolica = Number(data.diastolica);

        if (!sistolica || !diastolica) return "-";
        return classifyPressure(sistolica, diastolica);
    }, [data.sistolica, data.diastolica]);

    const analiseCorporal = useMemo(() => {
        const massa = parseDecimal(data.massa);
        const estatura = parseDecimal(data.estatura);


        const possuiDadosBasicos =
            data.genero &&
            data.idade &&
            massa > 0 &&
            estatura > 0;

        const possuiPerimetros =
            perimetros.bracoD &&
            perimetros.bracoE &&
            perimetros.coxaMediaD &&
            perimetros.coxaMediaE;

        if (!possuiDadosBasicos || !possuiPerimetros) {
            return {
                massaMuscular: "Dados insuficientes",
                massaAdiposa: "Dados insuficientes",
                areaBraco: "Dados insuficientes",
                areaCoxa: "Dados insuficientes",
            };
        }

        const imc = massa / (estatura * estatura);

        const mediaBraco =
            (parseDecimal(perimetros.bracoD) +
                parseDecimal(perimetros.bracoE)) /
            2;

        const mediaCoxa =
            (parseDecimal(perimetros.coxaMediaD) +
                parseDecimal(perimetros.coxaMediaE)) /
            2;

        const refBraco =
            data.genero === "masculino" ? 36 : 31;

        const refCoxa =
            data.genero === "masculino" ? 52 : 47;

        let massaMuscular = "";

        if (mediaBraco >= refBraco + 3) {
            massaMuscular = "Muito elevada";
        } else if (mediaBraco >= refBraco) {
            massaMuscular = "Adequada";
        } else if (mediaBraco >= refBraco - 2) {
            massaMuscular = "Moderada";
        } else {
            massaMuscular = "Baixa";
        }

        /*
          MASSA ADIPOSA
        */

        let massaAdiposa = "";

        if (imc >= 30) {
            massaAdiposa = "Elevada";
        } else if (imc >= 25) {
            massaAdiposa = "Acima da media";
        } else if (imc >= 18.5) {
            massaAdiposa = "Adequada";
        } else {
            massaAdiposa = "Baixa";
        }

        let areaBraco = "";

        if (mediaBraco >= refBraco + 2) {
            areaBraco = "Excelente";
        } else if (mediaBraco >= refBraco) {
            areaBraco = "Boa";
        } else if (mediaBraco >= refBraco - 2) {
            areaBraco = "Regular";
        } else {
            areaBraco = "Deficit muscular";
        }

        let areaCoxa = "";

        if (mediaCoxa >= refCoxa + 3) {
            areaCoxa = "Excelente";
        } else if (mediaCoxa >= refCoxa) {
            areaCoxa = "Boa";
        } else if (mediaCoxa >= refCoxa - 2) {
            areaCoxa = "Regular";
        } else {
            areaCoxa = "Deficit muscular";
        }

        return {
            massaMuscular,
            massaAdiposa,
            areaBraco,
            areaCoxa,
        };
    }, [data, perimetros]);;

    const chartPoints = useMemo(() => {
        if (!dadosAntropometricosValidos) {
            return [];
        }

        return perimetroConfig.map((item, idx) => {
            const valor = parseDecimal(perimetros[item.key]);

            const ref = getReferenceByKey(item.key, data);

            const score = Math.max(
                -4,
                Math.min(4, (valor - ref) / 1.6)
            );

            return {
                x: score,
                y: idx + 1,
            };
        });
    }, [perimetros, data, dadosAntropometricosValidos]);

    const resumoDobras = useMemo(() => {
        const mediaFinal = dobrasConfig.reduce<Record<DobraKey, string>>((acc, item) => {
            const primeira = parseDecimal(dobras[item.key].primeira);
            const segunda = parseDecimal(dobras[item.key].segunda);
            const media = segunda > 0 ? (primeira + segunda) / 2 : primeira;
            acc[item.key] = media > 0 ? media.toFixed(1).replace(".", ",") : "";
            return acc;
        }, {} as Record<DobraKey, string>);

        const valores = dobrasConfig.map((item) => parseDecimal(mediaFinal[item.key]));
        const somatorio = valores.reduce((total, value) => total + value, 0);
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
            somatorio: somatorio ? somatorio.toFixed(1).replace(".", ",") : "",
            periferico: periferico ? periferico.toFixed(1).replace(".", ",") : "",
            central: central ? central.toFixed(1).replace(".", ",") : "",
        };
    }, [dobras]);

    const pontosDobras = useMemo(() => {
        return dobrasConfig.map((item, idx) => {
            const valor = parseDecimal(resumoDobras.mediaFinal[item.key]);
            const ref = dobraReferences[item.key];
            const score = Math.max(-4, Math.min(4, (valor - ref) / 4));
            return { x: score, y: idx + 1 };
        });
    }, [resumoDobras.mediaFinal]);


    const updateField = (field: keyof ExamData, value: string) => {
        setData((current) => ({ ...current, [field]: value }));
    };

    const updatePerimetro = (field: PerimetroKey, value: string) => {
        setPerimetros((current) => ({ ...current, [field]: value }));
    };

    const updateDobra = (field: DobraKey, measure: "primeira" | "segunda", value: string) => {
        setDobras((current) => ({
            ...current, [field]: { ...current[field], [measure]: sanitizeDecimal(value), },
        }));
    };

    const clearAllDobras = () => {
        setDobras({ ...emptyDobras });
    };

    const clearAllPerimetros = () => {
        setPerimetros({ ...emptyPerimetros });
    };

    return (
        <main className="min-h-screen bg-[#cfd2d7] p-3 md:p-5">
            <section className="mx-auto w-full border border-zinc-400 bg-[#ececec]">
                <header className="border-b-4 border-[#a55c5d] bg-[#4f7fb7] px-5 py-6">
                    <h1 className="text-5xl font-semibold italic tracking-wide text-white">2ª Avaliação</h1>
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
                                            className={`${inputBaseClass} text-left text-lg bg-zinc-300`}
                                            readOnly
                                        />
                                    </label>

                                    <label>
                                        <span className="mb-1 block text-sm font-semibold uppercase tracking-wide text-zinc-600">Genero</span>
                                        <select
                                            value={data.genero}
                                            onChange={(event) => updateField("genero", event.target.value)}
                                            className={`${inputBaseClass} text-lg bg-zinc-300`}
                                            disabled
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
                                            className={`${inputBaseClass} text-lg bg-zinc-300`}
                                            readOnly
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
                                            className={`${inputBaseClass} bg-zinc-300`}
                                            readOnly
                                        />
                                    </label>

                                    <label>
                                        <span className="mb-1 block text-sm font-semibold uppercase tracking-wide text-zinc-600">Tíbia (cm)</span>
                                        <input
                                            value={data.tibia}
                                            onChange={(event) => updateField("tibia", sanitizeDecimal(event.target.value))}
                                            className={`${inputBaseClass} bg-zinc-300`}
                                            readOnly
                                        />
                                    </label>
                                    <label>
                                        <span className="mb-1 block text-sm font-semibold uppercase tracking-wide text-zinc-600">Úmero (cm)</span>
                                        <input
                                            value={data.umero}
                                            onChange={(event) => updateField("umero", sanitizeDecimal(event.target.value))}
                                            className={`${inputBaseClass} bg-zinc-300`}
                                            readOnly
                                        />
                                    </label>
                                    <label>
                                        <span className="mb-1 block text-sm font-semibold uppercase tracking-wide text-zinc-600">Ulna (cm)</span>
                                        <input
                                            value={data.una}
                                            onChange={(event) => updateField("una", sanitizeDecimal(event.target.value))}
                                            className={`${inputBaseClass} bg-zinc-300`}
                                            readOnly
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

                                <div className="relative h-[520px] border border-zinc-400 bg-white px-8 py-6">
                                    <div className="absolute inset-0 grid grid-cols-8 overflow-hidden">
                                        <div className="bg-[#f3b2b2]" />
                                        <div className="bg-[#f7dfaa]" />
                                        <div className="bg-[#f5ec99]" />
                                        <div className="bg-[#d6e8c7]" />
                                        <div className="bg-[#d6e8c7]" />
                                        <div className="bg-[#f5ec99]" />
                                        <div className="bg-[#f7dfaa]" />
                                        <div className="bg-[#f3b2b2]" />
                                    </div>

                                    <div className="absolute inset-0 grid grid-cols-8 border-x border-zinc-400">
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

                                    <div className="absolute inset-y-0 left-1/2 w-px bg-zinc-700" />

                                    {chartPoints.map((point, idx) => (
                                        <div
                                            key={`point-${idx}`}
                                            className="absolute z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-sky-500 shadow"
                                            style={{
                                                left: `${((point.x + 4) / 8) * 100}%`,
                                                top: `${(point.y / 14) * 100}%`,
                                            }}
                                        />
                                    ))}

                                    <div className="absolute -bottom-8 left-0 right-0 flex justify-between px-2 text-lg font-semibold text-zinc-500">
                                        {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((value) => (
                                            <span
                                                key={`axis-${value}`}
                                                className="w-6 text-center"
                                            >
                                                {value}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="absolute inset-y-0 -left-10 flex flex-col justify-between py-[18px] text-lg font-semibold text-zinc-500">
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
                                        1a Avaliacao
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {classificationBox("Massa muscular", analiseCorporal.massaMuscular)}
                            {classificationBox("Massa adiposa", analiseCorporal.massaAdiposa)}
                            {classificationBox("Area muscular do braco", analiseCorporal.areaBraco)}
                            {classificationBox("Area muscular da coxa", analiseCorporal.areaCoxa)}
                        </div>
                    </div>
                    <div className="mt-10 flex items-end justify-end">
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
                                            <span>2a Medida</span>
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
                                                        value={dobras[field.key].primeira}
                                                        onChange={(event) => updateDobra(field.key, "primeira", event.target.value)}
                                                        className={inputBaseClass}
                                                    />

                                                    <input
                                                        value={dobras[field.key].segunda}
                                                        onChange={(event) => updateDobra(field.key, "segunda", event.target.value)}
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

                            <div className="relative pb-16 pl-10 pr-2 pt-2">
                                <div className="relative h-[460px] border border-zinc-400 bg-white">
                                    <div className="absolute inset-0 grid grid-cols-8">
                                        <div className="bg-[#f3b2b2]" />
                                        <div className="bg-[#f7dfaa]" />
                                        <div className="bg-[#f5ec99]" />
                                        <div className="bg-[#d6e8c7]" />
                                        <div className="bg-[#d6e8c7]" />
                                        <div className="bg-[#f5ec99]" />
                                        <div className="bg-[#f7dfaa]" />
                                        <div className="bg-[#f3b2b2]" />
                                    </div>

                                    <div className="absolute inset-0 grid grid-cols-8 border-x border-zinc-400">
                                        {Array.from({ length: 8 }).map((_, idx) => (
                                            <div key={`dobra-col-${idx}`} className="border-r border-zinc-400/60" />
                                        ))}
                                    </div>

                                    <div className="absolute inset-0 grid grid-rows-8">
                                        {Array.from({ length: dobraChartRows }).map((_, idx) => (
                                            <div key={`dobra-row-${idx}`} className="border-b border-zinc-300" />
                                        ))}
                                    </div>

                                    <div className="absolute inset-y-0 left-1/2 w-px bg-zinc-700" />

                                    {pontosDobras.map((point, idx) => (
                                        <div
                                            key={`dobra-point-${idx}`}
                                            className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-500"
                                            style={{
                                                left: `${((point.x + 4) / 8) * 100}%`,
                                                top: `${((point.y - 0.5) / dobraChartRows) * 100}%`,
                                            }}
                                        />
                                    ))}

                                    <div className="absolute -bottom-7 left-0 right-0 flex justify-between px-1 text-lg font-semibold text-zinc-500">
                                        {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((value) => (
                                            <span key={`dobra-axis-${value}`}>{value}</span>
                                        ))}
                                    </div>

                                    <div className="pointer-events-none absolute left-0 top-0 h-full w-8 text-lg font-semibold text-zinc-500">
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
                        <button className="w-[25%] bg-[#4f7fb7] py-1 px-4 text-base font-semibold  text-white cursor-pointer rounded-[5px] hover:bg-[#4f7fb7]/80" onClick={() => { navigate("/") }}>Voltar</button>
                    </div>
                </div>
            </section>
        </main>
    );
}