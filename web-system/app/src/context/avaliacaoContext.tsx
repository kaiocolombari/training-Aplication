import { createContext, useState, useContext, } from "react";
import type { ReactNode } from "react";
import type { Avaliacao } from "../types/avaliacao";

type AvaliacaoContextType = {
    avaliacao: Avaliacao;
    setAvaliacao: React.Dispatch<
        React.SetStateAction<Avaliacao>
    >;
};

const AvaliacaoContext =
    createContext<AvaliacaoContextType | null>(null);

export const initialState: Avaliacao = {
    aluno: {
        nomeCompleto: "",
        genero: "",
        idade: "",
        etnia: "",
        massa: "",
        estatura: "",
        femur: "",
        tibia: "",
        una: "",
        umero: "",
        fcRepouso: "",
        fcReserva: "",
        glicose: "",
        triglicerideos: "",
        ldl: "",
        hdl: "",
        sistolica: "",
        diastolica: "",
    },

    anamnese: {
        objetivo: "",
        observacoes: "",
    },

    anamnese2: {
        objetivo: "",
        observacoes: "",
    },

    anamneseComparacao: {
        objetivo: "",
        observacoes: "",
    },

    avaliacao1: {
        peso: "",
        altura: "",
        idade: "",
        percentualGordura: "",
        perimetros: {
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
        },
        dobrasCutaneas: {
            medida1: {
                triceps: "",
                subescapular: "",
                biceps: "",
                iliaca: "",
                supraespinhal: "",
                abdominal: "",
                coxaMedia: "",
                panturrilha: "",
            },

            medida2: {
                triceps: "",
                subescapular: "",
                biceps: "",
                iliaca: "",
                supraespinhal: "",
                abdominal: "",
                coxaMedia: "",
                panturrilha: "",
            },
        },
    },

    avaliacao2: {
        peso: "",
        altura: "",
        idade: "",
        percentualGordura: "",
        perimetros: {
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
        },

        dobrasCutaneas: {
            medida1: {
                triceps: "",
                subescapular: "",
                biceps: "",
                iliaca: "",
                supraespinhal: "",
                abdominal: "",
                coxaMedia: "",
                panturrilha: "",
            },

            medida2: {
                triceps: "",
                subescapular: "",
                biceps: "",
                iliaca: "",
                supraespinhal: "",
                abdominal: "",
                coxaMedia: "",
                panturrilha: "",
            },
        },
    },

    testeCarga: {
        carga1: {
            supino: {
                carga: "",
                repeticoes: "",
            },

            terra: {
                carga: "",
                repeticoes: "",
            },

            remada: {
                carga: "",
                repeticoes: "",
            },

            agachamento: {
                carga: "",
                repeticoes: "",
            },
        },

        carga2: {
            supino: {
                carga: "",
                repeticoes: "",
            },

            terra: {
                carga: "",
                repeticoes: "",
            },

            remada: {
                carga: "",
                repeticoes: "",
            },

            agachamento: {
                carga: "",
                repeticoes: "",
            },
        },
    },

    treino: [
        {
            id: crypto.randomUUID(),
            nome: "",
            exercicios: Array.from({ length: 12 }, () => ({
                exercicio: "",
                series: "",
                repeticoes: "",
                intervalo: "",
                carga: "",
                on: "",
                off: "",
                observacoes: "",
            })),
        },
    ],

    periodizacao: {
        semanas: Array.from({ length: 12 }, (_, semanaIndex) => ({
            numero: semanaIndex + 1,
            dias: Array.from({ length: 7 }, () => ({
                data: "",
                treinoIds: ["", "", ""],
            })),
        })),
    },

    volume: [
        { id: "antebraco", grupo: "Antebraço", volume: 0 },
        { id: "biceps", grupo: "Bíceps", volume: 0 },
        { id: "triceps", grupo: "Tríceps", volume: 0 },

        { id: "costas", grupo: "Costas", volume: 0 },
        { id: "costasUpper", grupo: "Costas (Upper)", volume: 0 },
        { id: "costasLower", grupo: "Costas (Lower)", volume: 0 },
        { id: "lombar", grupo: "Lombar", volume: 0 },

        { id: "peitoral", grupo: "Peitoral", volume: 0 },
        { id: "clavicular", grupo: "Clavicular", volume: 0 },
        { id: "esterocostal", grupo: "Esterocostal", volume: 0 },


        { id: "deltoideAnterior", grupo: "Deltoide Anterior", volume: 0 },
        { id: "deltoideLateral", grupo: "Deltoide Lateral", volume: 0 },
        { id: "deltoidePosterior", grupo: "Deltoide Posterior", volume: 0 },


        { id: "quadriceps", grupo: "Quadríceps", volume: 0 },
        { id: "vastos", grupo: "Vastos", volume: 0 },
        { id: "retoFemoral", grupo: "Reto Femoral", volume: 0 },

        { id: "posteriores", grupo: "Posteriores", volume: 0 },

        { id: "gluteos", grupo: "Glúteos", volume: 0 },
        { id: "gluteoMaximo", grupo: "Glúteos Máximo", volume: 0 },
        { id: "gluteoMedio", grupo: "Glúteos Médio", volume: 0 },
        { id: "gluteoMinimo", grupo: "Glúteos Mínimo", volume: 0 },

        { id: "adutores", grupo: "Adutores", volume: 0 },

        { id: "panturrilhas", grupo: "Panturrilhas", volume: 0 },

        { id: "abdomen", grupo: "Abdômen", volume: 0 },
    ]

};

export function AvaliacaoProvider({
    children,
}: {
    children: ReactNode;
}) {
    const [avaliacao, setAvaliacao] =
        useState<Avaliacao>(initialState);

    return (
        <AvaliacaoContext.Provider
            value={{
                avaliacao,
                setAvaliacao,
            }}
        >
            {children}
        </AvaliacaoContext.Provider>
    );
}

export function useAvaliacao() {
    const context = useContext(AvaliacaoContext);

    if (!context) {
        throw new Error(
            "useAvaliacao deve ser usado dentro do Provider"
        );
    }

    return context;
}