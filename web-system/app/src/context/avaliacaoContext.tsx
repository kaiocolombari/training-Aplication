import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { Avaliacao } from "../types/avaliacao";
import { gruposMusculares } from "../interface/gruposMusculares";

// ============================================================
// INITIAL STATE
// ============================================================

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
        id: crypto.randomUUID(),
        exercicio: "",
        series: "",
        repeticoes: "",
        intervalo: "",
        carga: "",
        rirMax: "",
        observacoes: "",
        variacoes: [],
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

  volume: Array.from({ length: 12 }, (_, semana) => ({
    semana: semana + 1,

    grupos: gruposMusculares.map((grupo) => ({
      ...grupo,

      seriesDiretas: 0,
      seriesLivres: 0,
    })),
  })),

  seriesRIR: [],
};

export type TelaAvaliacao =
  | "avaliacao1"
  | "avaliacao2"
  | "comparacao"
  | "prescricao"
  | "periodizacao"
  | "volume"
  | "intensidade";

type AlteracoesPorTela = Record<TelaAvaliacao, boolean>;

type AvaliacaoContextType = {
  avaliacao: Avaliacao;
  setAvaliacao: Dispatch<SetStateAction<Avaliacao>>;
  carregarAvaliacao: (dados: Avaliacao) => void;
  limparAvaliacao: () => void;
  alteracoesPendentes: boolean;
  alteracoesPorTela: AlteracoesPorTela;
  marcarComoSalvo: () => void;
};

const AvaliacaoContext = createContext<AvaliacaoContextType | undefined>(
  undefined,
);

const telas: TelaAvaliacao[] = [
  "avaliacao1",
  "avaliacao2",
  "comparacao",
  "prescricao",
  "periodizacao",
  "volume",
  "intensidade",
];

function criarAlteracoesZeradas(): AlteracoesPorTela {
  return {
    avaliacao1: false,
    avaliacao2: false,
    comparacao: false,
    prescricao: false,
    periodizacao: false,
    volume: false,
    intensidade: false,
  };
}

// Mapeia cada tela para as propriedades que ela controla.
const propriedadesPorTela: Record<TelaAvaliacao, (keyof Avaliacao)[]> = {
  avaliacao1: ["avaliacao1"],
  avaliacao2: ["avaliacao2"],
  comparacao: ["anamneseComparacao", "anamnese2"],
  prescricao: ["treino", "seriesRIR"],
  periodizacao: ["periodizacao"],
  volume: ["volume"],
  intensidade: ["testeCarga"],
};

export function AvaliacaoProvider({ children }: { children: ReactNode }) {
  const [avaliacao, setAvaliacao] = useState<Avaliacao>(initialState);

  const [alteracoesPorTela, setAlteracoesPorTela] = useState<AlteracoesPorTela>(
    criarAlteracoesZeradas,
  );

  const [carregado, setCarregado] = useState(false);

  const avaliacaoSalva = useRef<string>(JSON.stringify(initialState));

  const alteracoesPendentes = telas.some((tela) => alteracoesPorTela[tela]);

  // Carregamento inicial
  useEffect(() => {
    try {
      const dadosSalvos = localStorage.getItem("avaliacao_temp");

      if (dadosSalvos) {
        const dados = JSON.parse(dadosSalvos) as Avaliacao;

        avaliacaoSalva.current = JSON.stringify(dados);
        setAvaliacao(dados);
      } else {
        avaliacaoSalva.current = JSON.stringify(initialState);
      }
    } catch (error) {
      console.error("Erro ao carregar avaliação:", error);
      avaliacaoSalva.current = JSON.stringify(initialState);
    } finally {
      setCarregado(true);
    }
  }, []);

  // Detecta alterações por tela
  useEffect(() => {
    if (!carregado) return;

    try {
      const avaliacaoAtual = JSON.stringify(avaliacao);

      localStorage.setItem("avaliacao_temp", avaliacaoAtual);

      const avaliacaoAnterior = JSON.parse(avaliacaoSalva.current) as Avaliacao;

      const novasAlteracoes = criarAlteracoesZeradas();

      for (const tela of telas) {
        const propriedades = propriedadesPorTela[tela];

        novasAlteracoes[tela] = propriedades.some(
          (propriedade) =>
            JSON.stringify(avaliacao[propriedade]) !==
            JSON.stringify(avaliacaoAnterior[propriedade]),
        );
      }

      setAlteracoesPorTela(novasAlteracoes);
    } catch (error) {
      console.error("Erro ao detectar alterações:", error);
    }
  }, [avaliacao, carregado]);

  // Carrega uma avaliação
  function carregarAvaliacao(dados: Avaliacao) {
    const dadosSerializados = JSON.stringify(dados);

    avaliacaoSalva.current = dadosSerializados;

    localStorage.setItem("avaliacao_temp", dadosSerializados);

    setAvaliacao(dados);
    setAlteracoesPorTela(criarAlteracoesZeradas());
  }

  // Marca a avaliação atual como salva
  function marcarComoSalvo() {
    const dadosSerializados = JSON.stringify(avaliacao);

    avaliacaoSalva.current = dadosSerializados;

    localStorage.setItem("avaliacao_temp", dadosSerializados);

    setAlteracoesPorTela(criarAlteracoesZeradas());
  }

  // Limpa a avaliação
  function limparAvaliacao() {
    const novaAvaliacao: Avaliacao = {
      ...initialState,
      treino: initialState.treino.map((treino) => ({
        ...treino,
        id: crypto.randomUUID(),
        exercicios: treino.exercicios.map((exercicio) => ({
          ...exercicio,
          id: crypto.randomUUID(),
        })),
      })),
    };

    const dadosSerializados = JSON.stringify(novaAvaliacao);

    avaliacaoSalva.current = dadosSerializados;

    localStorage.removeItem("avaliacao_temp");

    setAvaliacao(novaAvaliacao);
    setAlteracoesPorTela(criarAlteracoesZeradas());
  }

  return (
    <AvaliacaoContext.Provider
      value={{
        avaliacao,
        setAvaliacao,
        carregarAvaliacao,
        limparAvaliacao,
        alteracoesPendentes,
        alteracoesPorTela,
        marcarComoSalvo,
      }}
    >
      {children}
    </AvaliacaoContext.Provider>
  );
}

export function useAvaliacao() {
  const context = useContext(AvaliacaoContext);

  if (context === undefined) {
    throw new Error(
      "useAvaliacao deve ser utilizado dentro de AvaliacaoProvider",
    );
  }

  return context;
}