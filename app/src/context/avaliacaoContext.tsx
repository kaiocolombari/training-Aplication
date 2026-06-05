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

    avaliacao1: {
        peso: "",
        altura: "",
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