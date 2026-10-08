import {
    createContext,
    useState,
    useContext,
    useEffect,
} from "react";

import type { ReactNode } from "react";
import type { Avaliacao } from "../types/avaliacao";
import { gruposMusculares } from "../interface/gruposMusculares";


// ============================================================
// TIPOS
// ============================================================

type AvaliacaoContextType = {
    avaliacao: Avaliacao;

    setAvaliacao: React.Dispatch<
        React.SetStateAction<Avaliacao>
    >;

    carregarAvaliacao: (dados: Avaliacao) => void;

    limparAvaliacao: () => void;
};


// ============================================================
// CONTEXT
// ============================================================

const AvaliacaoContext =
    createContext<AvaliacaoContextType | null>(null);


// ============================================================
// INITIAL STATE
// ============================================================

export const initialState: Avaliacao = {

    // ========================================================
    // COLOQUE AQUI O SEU initialState ORIGINAL
    // ========================================================

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
            exercicios: Array.from(
                { length: 12 },
                () => ({
                    id: crypto.randomUUID(),
                    exercicio: "",
                    series: "",
                    repeticoes: "",
                    intervalo: "",
                    carga: "",
                    rirMax: "",
                    observacoes: "",
                    variacoes: [],
                })
            ),
        },
    ],
    periodizacao: {
        semanas: Array.from(
            { length: 12 },
            (_, semanaIndex) => ({
                numero: semanaIndex + 1,

                dias: Array.from(
                    { length: 7 },
                    () => ({
                        data: "",
                        treinoIds: ["", "", ""],
                    })
                ),
            })
        ),
    },

    volume: Array.from(
        { length: 12 },
        (_, semana) => ({
            semana: semana + 1,

            grupos: gruposMusculares.map(
                grupo => ({
                    ...grupo,

                    seriesDiretas: 0,
                    seriesLivres: 0,
                })
            ),
        })
    ),

    seriesRIR: [],
};

export function AvaliacaoProvider({
    children,
}: {
    children: ReactNode;
}) {
    const [avaliacao, setAvaliacao] =
        useState<Avaliacao>(initialState);

    useEffect(() => {

        try {

            const dadosSalvos =
                localStorage.getItem(
                    "avaliacao_temp"
                );


            if (!dadosSalvos) {
                return;
            }


            const dados =
                JSON.parse(dadosSalvos);


            setAvaliacao(dados);

        } catch (error) {

            console.error(
                "Erro ao carregar avaliação:",
                error
            );

        }

    }, []);

    useEffect(() => {

        try {

            localStorage.setItem(
                "avaliacao_temp",
                JSON.stringify(avaliacao)
            );

        } catch (error) {

            console.error(
                "Erro ao salvar avaliação:",
                error
            );

        }

    }, [avaliacao]);

    function carregarAvaliacao(dados: Avaliacao) {
        setAvaliacao(dados);

        localStorage.setItem(
            "avaliacao_temp",
            JSON.stringify(dados)
        );
    }

    function limparAvaliacao() {
        localStorage.removeItem("avaliacao_temp");

        setAvaliacao({
            ...initialState,

            treino: initialState.treino.map((treino) => ({
                ...treino,
                id: crypto.randomUUID(),

                exercicios: treino.exercicios.map((exercicio) => ({
                    ...exercicio,
                    id: crypto.randomUUID(),
                    variacoes: [],
                })),
            })),
        });
    }


    // ========================================================
    // PROVIDER
    // ========================================================

    return (
        <AvaliacaoContext.Provider
            value={{
                avaliacao,
                setAvaliacao,
                carregarAvaliacao,
                limparAvaliacao,
            }}
        >
            {children}
        </AvaliacaoContext.Provider>
    );
}

export function useAvaliacao() {

    const context =
        useContext(AvaliacaoContext);


    if (!context) {

        throw new Error(
            "useAvaliacao deve ser usado dentro do Provider"
        );
    }


    return context;
}

