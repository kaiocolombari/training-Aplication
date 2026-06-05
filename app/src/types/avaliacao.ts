import type { DobrasCutaneas } from "./dobrasType";

export interface Avaliacao {
    aluno: {
        nomeCompleto: string;
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

    anamnese: {
        objetivo: string;
        observacoes: string;
    };

    avaliacao1: {
        peso: string;
        altura: string;
        percentualGordura: string;
        perimetros: {
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
        dobrasCutaneas: {
            medida1: DobrasCutaneas;
            medida2: DobrasCutaneas;
        }
    };

    avaliacao2: {
        peso: string;
        altura: string;
        percentualGordura: string;
        perimetros: {
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
        dobrasCutaneas: {
            medida1: DobrasCutaneas;
            medida2: DobrasCutaneas;
        }
    };

    testeCarga: {
        supino: {
            carga: string;
            repeticoes: string;
        }

        terra: {
            carga: string;
            repeticoes: string;
        }

        remada: {
            carga: string;
            repeticoes: string;
        }

        agachamento:{
            carga: string;
            repeticoes: string;
        }
    };
}