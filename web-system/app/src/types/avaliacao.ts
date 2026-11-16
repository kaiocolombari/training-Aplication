import type { ExecucaoTreino } from "../interface/execucaoTreino";
import type { Periodizacao } from "../interface/interfacePeriodizacao";
import type { Treino } from "../interface/interfaceTreino";
import type { VolumeSemanal } from "../interface/interfaceVolumeSemanal";
import type { DobrasCutaneas } from "./dobrasType";

export interface AnamneseAvaliacao {
    objetivo: string;
    observacoes: string;
}

export interface TesteCargaAvaliacao {
    supino: { carga: string; repeticoes: string };
    terra: { carga: string; repeticoes: string };
    remada: { carga: string; repeticoes: string };
    agachamento: { carga: string; repeticoes: string };
}

export interface PerimetrosAvaliacao {
    bracoD: string;
    bracoE: string;
    antebracoD: string;
    antebracoE: string;
    torax: string;
    cintura: string;
    abdomen: string;
    quadril: string;
    coxaSupD: string;
    coxaSupE: string;
    coxaMediaD: string;
    coxaMediaE: string;
    panturrilhaD: string;
    panturrilhaE: string;
}

export interface DobrasAvaliacao {
    medida1: DobrasCutaneas;
    medida2: DobrasCutaneas;
}

export interface AvaliacaoFisica {
    id: string;
    numero: number;
    realizadaEm: string;
    criadaEm: string | null;
    criadaPorEmail: string | null;
    atualizadaEm: string | null;
    atualizadaPorEmail: string | null;
    ativo: boolean;
    peso: string;
    altura: string;
    idade: string;
    percentualGordura: string;
    perimetros: PerimetrosAvaliacao;
    dobrasCutaneas: DobrasAvaliacao;
    testeCarga: TesteCargaAvaliacao;
    anamnese: AnamneseAvaliacao;
}

const dataHojeLocal = () => {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, "0");
    const dia = String(agora.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
};

const dobrasVazias = (): DobrasCutaneas => ({
    triceps: "",
    subescapular: "",
    biceps: "",
    iliaca: "",
    supraespinhal: "",
    abdominal: "",
    coxaMedia: "",
    panturrilha: "",
});

export function criarAvaliacaoFisicaInicial(numero: number, id?: string): AvaliacaoFisica {
    const cargaVazia = () => ({
        supino: { carga: "", repeticoes: "" },
        terra: { carga: "", repeticoes: "" },
        remada: { carga: "", repeticoes: "" },
        agachamento: { carga: "", repeticoes: "" },
    });

    return {
        id: id ?? crypto.randomUUID(),
        numero,
        realizadaEm: dataHojeLocal(),
        criadaEm: null,
        criadaPorEmail: null,
        atualizadaEm: null,
        atualizadaPorEmail: null,
        ativo: true,
        peso: "",
        altura: "",
        idade: "",
        percentualGordura: "",
        perimetros: {
            bracoD: "", bracoE: "", antebracoD: "", antebracoE: "",
            torax: "", cintura: "", abdomen: "", quadril: "",
            coxaSupD: "", coxaSupE: "", coxaMediaD: "", coxaMediaE: "",
            panturrilhaD: "", panturrilhaE: "",
        },
        dobrasCutaneas: {
            medida1: dobrasVazias(),
            medida2: dobrasVazias(),
        },
        testeCarga: cargaVazia(),
        anamnese: { objetivo: "", observacoes: "" },
    };
}

export interface Avaliacao {
    aluno: {
        nomeCompleto: string;
        email: string;
        telefone: string;
        dataNascimento: string;
        genero: string;
        idade: string;
        etnia: string;
        massa: string;
        estatura: string;
        femur: string;
        tibia: string;
        una: string;
        umero: string;
        fcRepouso: string;
        fcReserva: string;
        glicose: string;
        triglicerideos: string;
        ldl: string;
        hdl: string;
        sistolica: string;
        diastolica: string;
    };

    avaliacoes: AvaliacaoFisica[];

    anamneseComparacao: AnamneseAvaliacao;
    treino: Treino[];
    periodizacao: Periodizacao;
    volume: VolumeSemanal[];
    seriesRIR: ExecucaoTreino[];
}
