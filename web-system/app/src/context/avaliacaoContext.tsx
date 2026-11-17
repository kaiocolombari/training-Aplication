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
import { useAuth } from "./authContext";
import { lerUltimoSalvamento, registrarUltimoSalvamento } from "../utils/lastSaved";

const criarTesteCargaVazio = (): TesteCargaAvaliacao => ({
  supino: { carga: "", repeticoes: "" },
  terra: { carga: "", repeticoes: "" },
  remada: { carga: "", repeticoes: "" },
  agachamento: { carga: "", repeticoes: "" },
});

const anamneseVazia = (): AnamneseAvaliacao => ({ objetivo: "", observacoes: "" });

const formatarDataLocalIso = (data: Date) =>
  `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;

const dataInicioPadrao = new Date();
dataInicioPadrao.setHours(0, 0, 0, 0);
const dataInicioPadraoIso = formatarDataLocalIso(dataInicioPadrao);

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
  treino: [],
  periodizacao: {
    nome: "Periodização principal",
    dataInicio: dataInicioPadraoIso,
    semanas: Array.from({ length: 12 }, (_, semanaIndex) => ({
      numero: semanaIndex + 1,
      dias: Array.from({ length: 7 }, (_, diaIndex) => {
        const data = new Date(dataInicioPadrao);
        data.setDate(data.getDate() + semanaIndex * 7 + diaIndex);
        return {
          data: formatarDataLocalIso(data),
          treinoIds: ["", "", ""],
        };
      }),
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
  | "aluno"
  | "avaliacoes"
  | "comparacao"
  | "prescricao"
  | "periodizacao"
  | "volume"
  | "intensidade";

type AlteracoesPorTela = Record<TelaAvaliacao, boolean>;
export type AutoSaveStatus = "idle" | "waiting" | "saving" | "saved" | "error";

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
  marcarComoSalvo: (snapshot?: Avaliacao, alunoId?: string) => boolean;
  isAlunoSelecionado: (alunoId: string) => boolean;
  autoSaveEnabled: boolean;
  setAutoSaveEnabled: Dispatch<SetStateAction<boolean>>;
  autoSaveDelayMs: number;
  setAutoSaveDelayMs: Dispatch<SetStateAction<number>>;
  autoSaveStatus: AutoSaveStatus;
  setAutoSaveStatus: Dispatch<SetStateAction<AutoSaveStatus>>;
  autoSaveLastSavedAt: Date | null;
  setAutoSaveLastSavedAt: Dispatch<SetStateAction<Date | null>>;
  autoSaveError: string | null;
  setAutoSaveError: Dispatch<SetStateAction<string | null>>;
};

const AvaliacaoContext = createContext<AvaliacaoContextType | undefined>(undefined);

const telas: TelaAvaliacao[] = [
  "aluno",
  "avaliacoes",
  "comparacao",
  "prescricao",
  "periodizacao",
  "volume",
  "intensidade",
];

function criarAlteracoesZeradas(): AlteracoesPorTela {
  return {
    aluno: false,
    avaliacoes: false,
    comparacao: false,
    prescricao: false,
    periodizacao: false,
    volume: false,
    intensidade: false,
  };
}

function calcularAlteracoes(atual: Avaliacao, anterior: Avaliacao): AlteracoesPorTela {
  const novasAlteracoes = criarAlteracoesZeradas();

  for (const tela of telas) {
    if (tela === "prescricao" || tela === "intensidade") continue;
    novasAlteracoes[tela] = propriedadesPorTela[tela].some(
      (propriedade) =>
        JSON.stringify(atual[propriedade]) !== JSON.stringify(anterior[propriedade]),
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
    JSON.stringify(removerSeriesIntensidade(atual.treino)) !==
      JSON.stringify(removerSeriesIntensidade(anterior.treino)) ||
    JSON.stringify(atual.seriesRIR) !== JSON.stringify(anterior.seriesRIR);

  const extrairSeriesIntensidade = (treinos: Avaliacao["treino"]) =>
    treinos.map((treino) => ({
      treinoId: treino.id,
      exercicios: treino.exercicios.map((exercicio) => ({
        exercicioId: exercicio.id,
        series: exercicio.seriesIntensidade ?? [],
      })),
    }));

  novasAlteracoes.intensidade =
    JSON.stringify(extrairSeriesIntensidade(atual.treino)) !==
    JSON.stringify(extrairSeriesIntensidade(anterior.treino));

  return novasAlteracoes;
}

const propriedadesPorTela: Record<TelaAvaliacao, (keyof Avaliacao)[]> = {
  aluno: ["aluno"],
  avaliacoes: ["avaliacoes"],
  comparacao: ["avaliacoes", "anamneseComparacao"],
  prescricao: ["treino", "seriesRIR"],
  periodizacao: ["periodizacao"],
  volume: ["volume"],
  intensidade: ["treino"],
};

export function AvaliacaoProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [avaliacao, setAvaliacao] = useState<Avaliacao>(initialState);
  const [alunoSelecionadoId, setAlunoSelecionadoId] = useState<string | null>(null);
  const alunoSelecionadoIdRef = useRef(alunoSelecionadoId);
  alunoSelecionadoIdRef.current = alunoSelecionadoId;
  const [alteracoesPorTela, setAlteracoesPorTela] = useState<AlteracoesPorTela>(criarAlteracoesZeradas);
  const avaliacaoSalva = useRef<string>(JSON.stringify(initialState));
  const avaliacaoAtualRef = useRef(avaliacao);
  avaliacaoAtualRef.current = avaliacao;
  const [autoSaveEnabledState, setAutoSaveEnabledState] = useState(false);
  const [autoSaveDelayMsState, setAutoSaveDelayMsState] = useState(4000);
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>("idle");
  const [autoSaveLastSavedAt, setAutoSaveLastSavedAtState] = useState<Date | null>(null);
  const [autoSaveError, setAutoSaveError] = useState<string | null>(null);
  const alteracoesPendentes = telas.some((tela) => alteracoesPorTela[tela]);

  const setAutoSaveLastSavedAt = useCallback<Dispatch<SetStateAction<Date | null>>>(
    (value) => {
      setAutoSaveLastSavedAtState((atual) => {
        const proximo = typeof value === "function" ? value(atual) : value;
        registrarUltimoSalvamento(user?.usuarioId, alunoSelecionadoIdRef.current, proximo);
        return proximo;
      });
    },
    [user?.usuarioId],
  );

  useEffect(() => {
    setAutoSaveLastSavedAtState(lerUltimoSalvamento(user?.usuarioId, alunoSelecionadoId));
  }, [user?.usuarioId, alunoSelecionadoId]);

  useEffect(() => {
    try {
      const anterior = JSON.parse(avaliacaoSalva.current) as Avaliacao;
      setAlteracoesPorTela(calcularAlteracoes(avaliacao, anterior));
    } catch (error) {
      console.error("Erro ao detectar alterações:", error);
    }
  }, [avaliacao]);

  useEffect(() => {
    if (!user?.usuarioId) {
      setAutoSaveEnabledState(false);
      setAutoSaveDelayMsState(4000);
      setAutoSaveStatus("idle");
      setAutoSaveLastSavedAtState(null);
      setAutoSaveError(null);
      return;
    }

    try {
      const prefixo = `treino_autosave_${user.usuarioId}`;
      setAutoSaveEnabledState(localStorage.getItem(`${prefixo}_enabled`) === "true");
      const delaySalvo = Number(localStorage.getItem(`${prefixo}_delay`));
      setAutoSaveDelayMsState([2000, 4000, 6000, 10000].includes(delaySalvo) ? delaySalvo : 4000);
    } catch {
      setAutoSaveEnabledState(false);
      setAutoSaveDelayMsState(4000);
    }
  }, [user?.usuarioId]);

  const setAutoSaveEnabled = useCallback<Dispatch<SetStateAction<boolean>>>(
    (value) => {
      setAutoSaveEnabledState((atual) => {
        const proximo = typeof value === "function" ? value(atual) : value;
        if (user?.usuarioId && typeof window !== "undefined") {
          try {
            localStorage.setItem(`treino_autosave_${user.usuarioId}_enabled`, String(proximo));
          } catch {
            // A preferência continua válida durante a sessão mesmo se o storage estiver indisponível.
          }
        }
        return proximo;
      });
    },
    [user?.usuarioId],
  );

  const setAutoSaveDelayMs = useCallback<Dispatch<SetStateAction<number>>>(
    (value) => {
      setAutoSaveDelayMsState((atual) => {
        const solicitado = typeof value === "function" ? value(atual) : value;
        const proximo = [2000, 4000, 6000, 10000].includes(solicitado) ? solicitado : 4000;
        if (user?.usuarioId && typeof window !== "undefined") {
          try {
            localStorage.setItem(`treino_autosave_${user.usuarioId}_delay`, String(proximo));
          } catch {
            // A preferência continua válida durante a sessão mesmo se o storage estiver indisponível.
          }
        }
        return proximo;
      });
    },
    [user?.usuarioId],
  );

  const carregarAvaliacao = useCallback((dados: Avaliacao, alunoId?: string) => {
    avaliacaoSalva.current = JSON.stringify(dados);
    if (alunoId) {
      setAlunoSelecionadoId(alunoId);
      const ultimaAtualizacaoServidor = dados.avaliacoes
        .map((item) => item.atualizadaEm)
        .filter((item): item is string => Boolean(item))
        .map((item) => new Date(item))
        .filter((item) => !Number.isNaN(item.getTime()))
        .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;
      const ultimaAtualizacaoLocal = lerUltimoSalvamento(user?.usuarioId, alunoId);
      const ultimaConfirmada = ultimaAtualizacaoServidor &&
        (!ultimaAtualizacaoLocal || ultimaAtualizacaoServidor > ultimaAtualizacaoLocal)
        ? ultimaAtualizacaoServidor
        : ultimaAtualizacaoLocal;
      setAutoSaveLastSavedAtState(ultimaConfirmada);
      registrarUltimoSalvamento(user?.usuarioId, alunoId, ultimaConfirmada);
    }
    setAvaliacao(dados);
    setAlteracoesPorTela(criarAlteracoesZeradas());
  }, [user?.usuarioId]);

  const marcarComoSalvo = useCallback((snapshot?: Avaliacao, alunoId?: string) => {
    if (alunoId && alunoSelecionadoIdRef.current !== alunoId) return false;
    const dadosSalvos = snapshot ?? avaliacaoAtualRef.current;
    avaliacaoSalva.current = JSON.stringify(dadosSalvos);
    setAlteracoesPorTela(calcularAlteracoes(avaliacaoAtualRef.current, dadosSalvos));
    return true;
  }, []);

  const isAlunoSelecionado = useCallback(
    (alunoId: string) => alunoSelecionadoIdRef.current === alunoId,
    [],
  );

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
        isAlunoSelecionado,
        autoSaveEnabled: autoSaveEnabledState,
        setAutoSaveEnabled,
        autoSaveDelayMs: autoSaveDelayMsState,
        setAutoSaveDelayMs,
        autoSaveStatus,
        setAutoSaveStatus,
        autoSaveLastSavedAt,
        setAutoSaveLastSavedAt,
        autoSaveError,
        setAutoSaveError,
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
