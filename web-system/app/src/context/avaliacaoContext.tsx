import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import type {
  AnamneseAvaliacao,
  Avaliacao,
  AvaliacaoFisica,
  TesteCargaAvaliacao,
} from "../types/avaliacao";
import { criarAvaliacaoFisicaInicial } from "../types/avaliacao";
import { gruposMusculares } from "../interface/gruposMusculares";

const criarTesteCargaVazio = (): TesteCargaAvaliacao => ({
  supino: { carga: "", repeticoes: "" },
  terra: { carga: "", repeticoes: "" },
  remada: { carga: "", repeticoes: "" },
  agachamento: { carga: "", repeticoes: "" },
});

const anamneseVazia = (): AnamneseAvaliacao => ({ objetivo: "", observacoes: "" });

export const initialState: Avaliacao = {
  aluno: {
    nomeCompleto: "",
    email: "",
    telefone: "",
    dataNascimento: "",
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
  avaliacoes: [],
  anamneseComparacao: anamneseVazia(),
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
    nome: "Periodização principal",
    dataInicio: new Date().toISOString().slice(0, 10),
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
  | "avaliacoes"
  | "comparacao"
  | "prescricao"
  | "periodizacao"
  | "volume"
  | "intensidade";

type AlteracoesPorTela = Record<TelaAvaliacao, boolean>;

type AvaliacaoEditorView = Omit<Avaliacao, "avaliacoes"> & {
  avaliacao1: AvaliacaoFisica;
  testeCarga: { carga1: TesteCargaAvaliacao; carga2: TesteCargaAvaliacao };
  anamnese: AnamneseAvaliacao;
};

type AvaliacaoComparisonView = Avaliacao & {
  avaliacao1: AvaliacaoFisica;
  avaliacao2: AvaliacaoFisica;
  testeCarga: { carga1: TesteCargaAvaliacao; carga2: TesteCargaAvaliacao };
};

type AvaliacaoContextType = {
  avaliacao: Avaliacao;
  setAvaliacao: Dispatch<SetStateAction<Avaliacao>>;
  carregarAvaliacao: (dados: Avaliacao, alunoId?: string) => void;
  limparAvaliacao: () => void;
  alunoSelecionadoId: string | null;
  setAlunoSelecionadoId: Dispatch<SetStateAction<string | null>>;
  alteracoesPendentes: boolean;
  alteracoesPorTela: AlteracoesPorTela;
  marcarComoSalvo: () => void;
};

const AvaliacaoContext = createContext<AvaliacaoContextType | undefined>(undefined);

const telas: TelaAvaliacao[] = [
  "avaliacoes",
  "comparacao",
  "prescricao",
  "periodizacao",
  "volume",
  "intensidade",
];

function criarAlteracoesZeradas(): AlteracoesPorTela {
  return {
    avaliacoes: false,
    comparacao: false,
    prescricao: false,
    periodizacao: false,
    volume: false,
    intensidade: false,
  };
}

const propriedadesPorTela: Record<TelaAvaliacao, (keyof Avaliacao)[]> = {
  avaliacoes: ["avaliacoes"],
  comparacao: ["avaliacoes", "anamneseComparacao"],
  prescricao: ["treino", "seriesRIR"],
  periodizacao: ["periodizacao"],
  volume: ["volume"],
  intensidade: ["treino"],
};

export function AvaliacaoProvider({ children }: { children: ReactNode }) {
  const [avaliacao, setAvaliacao] = useState<Avaliacao>(initialState);
  const [alunoSelecionadoId, setAlunoSelecionadoId] = useState<string | null>(null);
  const [alteracoesPorTela, setAlteracoesPorTela] = useState<AlteracoesPorTela>(criarAlteracoesZeradas);
  const avaliacaoSalva = useRef<string>(JSON.stringify(initialState));
  const alteracoesPendentes = telas.some((tela) => alteracoesPorTela[tela]);

  useEffect(() => {
    try {
      const anterior = JSON.parse(avaliacaoSalva.current) as Avaliacao;
      const novasAlteracoes = criarAlteracoesZeradas();

      for (const tela of telas) {
        if (tela === "prescricao" || tela === "intensidade") continue;
        novasAlteracoes[tela] = propriedadesPorTela[tela].some(
          (propriedade) =>
            JSON.stringify(avaliacao[propriedade]) !== JSON.stringify(anterior[propriedade]),
        );
      }

      const removerSeriesIntensidade = (treinos: Avaliacao["treino"]) =>
        treinos.map((treino) => ({
          ...treino,
          exercicios: treino.exercicios.map((exercicio) => ({
            ...exercicio,
            seriesIntensidade: undefined,
          })),
        }));

      novasAlteracoes.prescricao =
        JSON.stringify(removerSeriesIntensidade(avaliacao.treino)) !==
          JSON.stringify(removerSeriesIntensidade(anterior.treino)) ||
        JSON.stringify(avaliacao.seriesRIR) !== JSON.stringify(anterior.seriesRIR);

      const extrairSeriesIntensidade = (treinos: Avaliacao["treino"]) =>
        treinos.map((treino) => ({
          treinoId: treino.id,
          exercicios: treino.exercicios.map((exercicio) => ({
            exercicioId: exercicio.id,
            series: exercicio.seriesIntensidade ?? [],
          })),
        }));

      novasAlteracoes.intensidade =
        JSON.stringify(extrairSeriesIntensidade(avaliacao.treino)) !==
        JSON.stringify(extrairSeriesIntensidade(anterior.treino));

      setAlteracoesPorTela(novasAlteracoes);
    } catch (error) {
      console.error("Erro ao detectar alterações:", error);
    }
  }, [avaliacao]);

  const carregarAvaliacao = useCallback((dados: Avaliacao, alunoId?: string) => {
    avaliacaoSalva.current = JSON.stringify(dados);
    if (alunoId) setAlunoSelecionadoId(alunoId);
    setAvaliacao(dados);
    setAlteracoesPorTela(criarAlteracoesZeradas());
  }, []);

  const marcarComoSalvo = useCallback(() => {
    avaliacaoSalva.current = JSON.stringify(avaliacao);
    setAlteracoesPorTela(criarAlteracoesZeradas());
  }, [avaliacao]);

  const limparAvaliacao = useCallback(() => {
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
    avaliacaoSalva.current = JSON.stringify(novaAvaliacao);
    setAlunoSelecionadoId(null);
    setAvaliacao(novaAvaliacao);
    setAlteracoesPorTela(criarAlteracoesZeradas());
  }, []);

  return (
    <AvaliacaoContext.Provider
      value={{
        avaliacao,
        setAvaliacao,
        carregarAvaliacao,
        limparAvaliacao,
        alunoSelecionadoId,
        setAlunoSelecionadoId,
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
    throw new Error("useAvaliacao deve ser utilizado dentro de AvaliacaoProvider");
  }
  return context;
}

export function useAvaliacaoEditor(avaliacaoId: string) {
  const context = useAvaliacao();
  const vazia = useMemo(() => criarAvaliacaoFisicaInicial(0), []);
  const selecionada = useMemo(
    () => context.avaliacao.avaliacoes.find((item) => item.id === avaliacaoId),
    [context.avaliacao.avaliacoes, avaliacaoId],
  );

  const avaliacao = useMemo<AvaliacaoEditorView>(() => {
    const atual = selecionada ?? vazia;
    return {
      ...context.avaliacao,
      avaliacao1: atual,
      testeCarga: {
        carga1: atual.testeCarga,
        carga2: criarTesteCargaVazio(),
      },
      anamnese: atual.anamnese,
    };
  }, [context.avaliacao, selecionada, vazia]);

  const setAvaliacao = useCallback<Dispatch<SetStateAction<AvaliacaoEditorView>>>(
    (action) => {
      context.setAvaliacao((current) => {
        const atual = current.avaliacoes.find((item) => item.id === avaliacaoId);
        if (!atual) return current;

        const viewAtual: AvaliacaoEditorView = {
          ...current,
          avaliacao1: atual,
          testeCarga: { carga1: atual.testeCarga, carga2: criarTesteCargaVazio() },
          anamnese: atual.anamnese,
        };
        const proxima = typeof action === "function" ? action(viewAtual) : action;
        const {
          avaliacao1,
          testeCarga,
          anamnese,
          ...raiz
        } = proxima;

        return {
          ...raiz,
          avaliacoes: current.avaliacoes.map((item) =>
            item.id === avaliacaoId
              ? { ...avaliacao1, testeCarga: testeCarga.carga1, anamnese }
              : item,
          ),
        };
      });
    },
    [context.setAvaliacao, avaliacaoId],
  );

  return { ...context, avaliacao, setAvaliacao, avaliacaoSelecionada: selecionada, hasSelection: Boolean(selecionada) };
}

export function useAvaliacaoComparison() {
  const context = useAvaliacao();
  const [ids, setIds] = useState<[string, string]>(() => [
    context.avaliacao.avaliacoes[0]?.id ?? "",
    context.avaliacao.avaliacoes[1]?.id ?? "",
  ]);

  useEffect(() => {
    setIds((current) => {
      const lista = context.avaliacao.avaliacoes;
      const primeiro = lista.find((item) => item.id === current[0])?.id ?? lista[0]?.id ?? "";
      const segundo =
        lista.find((item) => item.id === current[1] && item.id !== primeiro)?.id ??
        lista.find((item) => item.id !== primeiro)?.id ??
        "";
      return [primeiro, segundo];
    });
  }, [context.avaliacao.avaliacoes]);

  const primeira = context.avaliacao.avaliacoes.find((item) => item.id === ids[0]);
  const segunda = context.avaliacao.avaliacoes.find((item) => item.id === ids[1]);
  const vazia1 = useMemo(() => criarAvaliacaoFisicaInicial(1), []);
  const vazia2 = useMemo(() => criarAvaliacaoFisicaInicial(2), []);
  const hasPair = Boolean(primeira && segunda && primeira.id !== segunda.id);

  const avaliacao = useMemo<AvaliacaoComparisonView>(
    () => ({
      ...context.avaliacao,
      avaliacao1: primeira ?? vazia1,
      avaliacao2: segunda ?? vazia2,
      testeCarga: {
        carga1: primeira?.testeCarga ?? vazia1.testeCarga,
        carga2: segunda?.testeCarga ?? vazia2.testeCarga,
      },
    }),
    [context.avaliacao, primeira, segunda, vazia1, vazia2],
  );

  const setAvaliacao = useCallback<Dispatch<SetStateAction<AvaliacaoComparisonView>>>(
    (action) => {
      context.setAvaliacao((current) => {
        const atual1 = current.avaliacoes.find((item) => item.id === ids[0]);
        const atual2 = current.avaliacoes.find((item) => item.id === ids[1]);
        const viewAtual: AvaliacaoComparisonView = {
          ...current,
          avaliacao1: atual1 ?? vazia1,
          avaliacao2: atual2 ?? vazia2,
          testeCarga: {
            carga1: atual1?.testeCarga ?? vazia1.testeCarga,
            carga2: atual2?.testeCarga ?? vazia2.testeCarga,
          },
        };
        const proxima = typeof action === "function" ? action(viewAtual) : action;
        const { avaliacao1, avaliacao2, testeCarga, ...raiz } = proxima;

        return {
          ...raiz,
          avaliacoes: current.avaliacoes.map((item) => {
            if (item.id === ids[0]) {
              return { ...avaliacao1, testeCarga: testeCarga.carga1 };
            }
            if (item.id === ids[1]) {
              return { ...avaliacao2, testeCarga: testeCarga.carga2 };
            }
            return item;
          }),
        };
      });
    },
    [context.setAvaliacao, ids, vazia1, vazia2],
  );

  return {
    ...context,
    avaliacao,
    setAvaliacao,
    avaliacaoIds: ids,
    setAvaliacaoIds: setIds,
    hasPair,
  };
}
