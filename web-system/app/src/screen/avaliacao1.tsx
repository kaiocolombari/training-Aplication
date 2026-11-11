import { useEffect, useMemo, useState } from "react";
import type { ExamData } from "../types/examData";
import type { PerimetroKey } from "../types/perimetroKey";
import type { PerimetroField } from "../types/perimetroField";
import { NavLink, useNavigate } from "react-router";
import type { DobraKey } from "../types/dobraKey";
import type { DobraField } from "../types/dobraField";
import { calcularMassaAdiposa } from "../functions/calcMassaAdiposa";
import { calcularMassaMuscular } from "../functions/calcMassaMuscular";
import { calcularAreaCoxa } from "../functions/calcCoxa";
import { calcularAreaBraco } from "../functions/calcBraco";
import safeNumber from "../functions/safeNumber";
import ComposicaoCorporalChart from "../components/ComposicaoChart";
import { initialState, useAvaliacao } from "../context/avaliacaoContext";
import navTool from "../components/navTool";

const inputBaseClass = `
  h-9 w-full rounded-md
  border border-[var(--border)]
  bg-[var(--surface-raised)]
  px-3 text-sm font-medium
  text-[var(--text)]
  outline-none transition
  placeholder:text-[var(--text-muted)]
  hover:border-[var(--border-strong)]
  focus:border-[var(--accent)]
  focus:ring-2 focus:ring-[var(--ring)]
  disabled:cursor-not-allowed
  disabled:opacity-60
`;

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
  const imc = calcularIMC(data.massa, data.estatura);

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

  // Efeito da estatura
  const estaturaFactor =
    estatura > 0
      ? 1 + ((estatura - 1.75) * 0.25)
      : 1;

  let value = baseValues[key] * estaturaFactor;

  // Efeito da estrutura óssea
  value += calcularEfeitoEstrutural(data, key);

  // Efeito do IMC
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

  // Efeito da idade
  if (idade >= 50) {
    value -= 1.5;
  }

  return Number(value.toFixed(1));
}

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

type DobraReference = {
  media: number;
  desvio: number;
};

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

function parseDecimal(value: string | number | undefined | null): number {
  if (value === undefined || value === null || value === "") {
    return 0;
  }

  const normalized = String(value)
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");

  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : 0;
}

function parseEstatura(value: string | number | undefined | null): number {
  const estatura = parseDecimal(value);

  if (estatura <= 0) {
    return 0;
  }

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

function classificationBox(label: string, value: string) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-4">
      <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        {label}
      </span>

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-lg font-semibold text-[var(--text)]">
          {value || "Aguardando dados"}
        </span>

        <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--accent)]" />
      </div>
    </div>
  );
}

export default function App() {
  const navigate = useNavigate();
  const { avaliacao, setAvaliacao } = useAvaliacao();

  const data: ExamData = {
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
  };

  const testeCarga = avaliacao.testeCarga;

  const updateTesteCarga = (
    carga: "carga1" | "carga2",
    exercicio: keyof typeof avaliacao.testeCarga.carga1,
    campo: "carga" | "repeticoes",
    valor: string
  ) => {
    setAvaliacao((current) => ({
      ...current,

      testeCarga: {
        ...current.testeCarga,

        [carga]: {
          ...current.testeCarga[carga],

          [exercicio]: {
            ...current.testeCarga[carga][exercicio],

            [campo]: valor,
          },
        },
      },
    }));
  };

  let perimetros = avaliacao.avaliacao1.perimetros;

  const dobras1 = avaliacao.avaliacao1.dobrasCutaneas.medida1;
  const dobras2 = avaliacao.avaliacao1.dobrasCutaneas.medida2;

  const observacoes = avaliacao.anamnese.observacoes;
  const updateObservacoes = (value: string) => {
    setAvaliacao((current) => ({
      ...current,

      anamnese: {
        ...current.anamnese,

        observacoes: value,
      },
    }));
  };

  const updateDobra1 = (
    field: keyof typeof dobras1,
    value: string
  ) => {
    setAvaliacao((current) => ({
      ...current,

      avaliacao1: {
        ...current.avaliacao1,

        dobrasCutaneas: {
          ...current.avaliacao1.dobrasCutaneas,

          medida1: {
            ...current.avaliacao1.dobrasCutaneas.medida1,
            [field]: value,
          },
        },
      },
    }));
  };

  const updateDobra2 = (
    field: keyof typeof dobras1,
    value: string
  ) => {
    setAvaliacao((current) => ({
      ...current,

      avaliacao1: {
        ...current.avaliacao1,

        dobrasCutaneas: {
          ...current.avaliacao1.dobrasCutaneas,

          medida2: {
            ...current.avaliacao1.dobrasCutaneas.medida2,
            [field]: value,
          },
        },
      },
    }));
  };

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

  const fcMaxima = useMemo(() => {
    const idade = Number(data.idade);

    if (!idade || !data.genero) {
      return "";
    }

    return String(
      data.genero === "feminino"
        ? 226 - idade
        : 220 - idade
    );
  }, [data.idade, data.genero]);

  const fcReserva = useMemo(() => {
    if (!fcMaxima || !data.fcRepouso) {
      return "";
    }

    return String(
      Number(fcMaxima) - Number(data.fcRepouso)
    );
  }, [fcMaxima, data.fcRepouso]);

  function calcular1RM(carga: number, repeticoes: number) {
    if (!carga || !repeticoes) return 0;

    return carga / (1.0278 - (0.0278 * repeticoes));
  }

  function classificarForca(valor: number) {
    if (valor >= 180) return "Excelente";
    if (valor >= 140) return "Muito bom";
    if (valor >= 100) return "Bom";
    if (valor >= 70) return "Regular";

    return "Baixo";
  }

  const resultado1RM = useMemo(() => {
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

  const exercicios = [
    { key: "supino", nome: "Supino reto" },
    { key: "terra", nome: "L. Terra" },
    { key: "remada", nome: "Remada" },
    { key: "agachamento", nome: "Agachamento" },
  ] as const;

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

  const classificacaoPressao = useMemo(() => {
    const sistolica = Number(data.sistolica);
    const diastolica = Number(data.diastolica);

    if (!sistolica || !diastolica) return "-";
    return classifyPressure(sistolica, diastolica);
  }, [data.sistolica, data.diastolica]);



  const chartPoints = useMemo(() => {
    if (!dadosAntropometricosValidos) {
      return [];
    }

    const massa = parseDecimal(data.massa);

    return perimetroConfig
      .map((item, idx) => {
        const valorTexto = perimetros[item.key];

        if (!valorTexto) {
          return null;
        }

        const valor = parseDecimal(valorTexto);

        if (valor <= 0) {
          return null;
        }

        const referencia = getReferenceByKey(
          item.key,
          data
        );

        const desvioBase =
          perimetroDesvios[item.key];

        /*
         * Ajuste muito pequeno conforme a massa.
         *
         * Para 70 kg:
         * 1 + ((70 - 70) / 200) = 1
         *
         * Portanto o desvio permanece igual.
         */
        const fatorMassa =
          1 + ((massa - 70) / 200);

        const desvio =
          desvioBase * fatorMassa;

        /*
         * Segurança contra divisão por zero.
         */
        if (desvio <= 0) {
          return null;
        }

        /*
         * Distância da medida em relação à referência.
         *
         * Exemplo:
         *
         * medida = 35
         * referência = 36,4
         * desvio = 4
         *
         * score = -0,35
         */
        const scoreBruto =
          (valor - referencia) / desvio;

        /*
         * Limita o gráfico entre -5 e +5.
         */
        const score =
          Math.max(
            -5,
            Math.min(5, scoreBruto)
          );

        return {
          x: score,
          y: idx + 1,

          /*
           * Deixo essas informações no objeto
           * porque facilitam muito o debug.
           */
          valor,
          referencia,
          desvio,
        };
      })
      .filter(
        (
          point
        ): point is {
          x: number;
          y: number;
          valor: number;
          referencia: number;
          desvio: number;
        } => point !== null
      );
  }, [
    perimetros,
    data,
    dadosAntropometricosValidos,
  ]);

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
    dadosAntropometricosValidos,
  ]);

  function calcularAreaCircular(
    perimetro: number
  ): number {
    if (perimetro <= 0) {
      return 0;
    }

    return (
      (perimetro * perimetro) /
      (4 * Math.PI)
    );
  }

  const analiseCorporal = useMemo(() => {
    const massa = parseDecimal(data.massa);

    const idade = Number(data.idade);

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

    /*
     * IMC calculado diretamente.
     *
     * Não passa mais por getReferenceByKey().
     */
    const imc = calcularIMC(
      data.massa,
      data.estatura
    );

    /*
     * Massa muscular.
     */
    const massaMuscularKg =
      calcularMassaMuscular(
        massa,
        gorduraKg,
        data.genero,
        idade,
        areaBraco,
        areaCoxa,
        imc
      );

    /*
     * Referências dos perímetros.
     */
    const refPerimetroBraco =
      getReferenceByKey(
        "bracoD",
        data
      );

    const refPerimetroCoxa =
      getReferenceByKey(
        "coxaMediaD",
        data
      );

    /*
     * Converte as referências de perímetro
     * para referências de área.
     */
    const refAreaBraco =
      calcularAreaCircular(
        refPerimetroBraco
      );

    const refAreaCoxa =
      calcularAreaCircular(
        refPerimetroCoxa
      );

    /*
     * Percentuais.
     */
    const percentualMuscular =
      massa > 0
        ? massaMuscularKg / massa
        : 0;

    const percentualGordura =
      massa > 0
        ? (gorduraKg / massa) * 100
        : 0;

    /*
     * Classificação da massa muscular.
     */
    let massaMuscular = "";

    if (percentualMuscular >= 0.45) {
      massaMuscular = "Muito elevada";
    } else if (percentualMuscular >= 0.38) {
      massaMuscular = "Elevada";
    } else if (percentualMuscular >= 0.28) {
      massaMuscular = "Normal";
    } else {
      massaMuscular = "Baixa";
    }

    /*
     * Classificação da massa adiposa.
     */
    let massaAdiposa = "";

    if (data.genero === "masculino") {
      if (percentualGordura >= 25) {
        massaAdiposa = "Muito elevada";
      } else if (percentualGordura >= 18) {
        massaAdiposa = "Elevada";
      } else if (percentualGordura >= 10) {
        massaAdiposa = "Adequada";
      } else {
        massaAdiposa = "Baixa";
      }
    } else {
      if (percentualGordura >= 32) {
        massaAdiposa = "Muito elevada";
      } else if (percentualGordura >= 25) {
        massaAdiposa = "Elevada";
      } else if (percentualGordura >= 18) {
        massaAdiposa = "Adequada";
      } else {
        massaAdiposa = "Baixa";
      }
    }

    /*
     * Classificação genérica de faixa.
     */
    const classificarFaixa = (
      valor: number,
      referencia: number,
      margem = 2
    ) => {
      if (
        valor >=
        referencia + margem * 2
      ) {
        return "Muito elevada";
      }

      if (
        valor >=
        referencia + margem
      ) {
        return "Elevada";
      }

      if (
        valor >=
        referencia - margem
      ) {
        return "Normal";
      }

      return "Baixa";
    };

    const areaBracos =
      classificarFaixa(
        areaBraco,
        refAreaBraco,
        5
      );

    const areaCoxas =
      classificarFaixa(
        areaCoxa,
        refAreaCoxa,
        10
      );

    return {
      imc: Number(imc.toFixed(2)),

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

      massaMuscular:
        `${massaMuscular} (${massaMuscularKg.toFixed(1)} kg)`,

      massaAdiposa:
        `${massaAdiposa} (${gorduraKg.toFixed(1)} kg)`,

      areaBraco:
        `${areaBracos} (${areaBraco.toFixed(1)} cm²)`,

      areaCoxa:
        `${areaCoxas} (${areaCoxa.toFixed(1)} cm²)`,
    };
  }, [
    data,
    perimetros,
    resumoDobras,
  ]);

  const updateField = (field: keyof ExamData, value: string) => {
    setAvaliacao((current) => {
      if (field === "massa") {
        return {
          ...current,

          avaliacao1: {
            ...current.avaliacao1,
            peso: value,
          },
        };
      }

      if (field === "estatura") {
        return {
          ...current,

          avaliacao1: {
            ...current.avaliacao1,
            altura: value,
          }
        };
      }

      if (field === "idade") {
        return {
          ...current,

          avaliacao1: {
            ...current.avaliacao1,
            idade: value
          }
        };
      }

      return {
        ...current,

        aluno: {
          ...current.aluno,
          [field]: value,
        },
      };
    });
  };

  const updatePerimetro = (field: PerimetroKey, value: string) => {
    setAvaliacao(
      (current) => ({ ...current, avaliacao1: { ...current.avaliacao1, perimetros: { ...current.avaliacao1.perimetros, [field]: value } } }),
    )
  };

  const clearAllPerimetros = () => {
    setAvaliacao((current) => ({
      ...current,

      avaliacao1: {
        ...current.avaliacao1,

        perimetros: {
          ...initialState.avaliacao1.perimetros,
        },
      },
    }));
  };

  const clearAllDobras = () => {
    setAvaliacao((current) => ({
      ...current,

      avaliacao1: {
        ...current.avaliacao1,

        dobrasCutaneas: {
          ...initialState.avaliacao1.dobrasCutaneas,
        },
      },
    }));
  };

  console.log(avaliacao.aluno.nomeCompleto);
  console.log(avaliacao.avaliacao1.perimetros.bracoD);
  console.log(data.estatura, data.massa);
  console.log(chartPoints);

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
    <main className="min-h-screen bg-[var(--surface-sunken)] px-4 py-6 text-[var(--text)] md:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
  
        {/* CABEÇALHO */}
        <header className="flex flex-col justify-between gap-5 border-b border-[var(--border)] pb-5 md:flex-row md:items-center">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              <span>Avaliação física</span>
              <span>/</span>
              <span className="text-[var(--accent)]">Etapa 01</span>
            </div>
  
            <div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                Primeira avaliação
              </h1>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Avaliação antropométrica, composição corporal e desempenho.
              </p>
            </div>
  
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="rounded-md bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--accent)]">
                Avaliação inicial
              </span>
  
              <span className="text-sm text-[var(--text-muted)]">
                {avaliacao.aluno.nomeCompleto || "Aluno não identificado"}
              </span>
            </div>
          </div>
  
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={clearAllPerimetros}
              className="rounded-md border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-hover)]"
            >
              Limpar perímetros
            </button>
  
            <button
              type="button"
              onClick={() => navigate("/avaliacao2")}
              className="flex items-center gap-2 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--on-accent)] transition hover:bg-[var(--accent-hover)]"
            >
              Próxima avaliação
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </header>
  
        {/* RESUMO */}
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Massa corporal",
              value: data.massa ? `${data.massa} kg` : "--",
              detail: "Peso registrado",
            },
            {
              label: "Estatura",
              value: data.estatura ? `${data.estatura} m` : "--",
              detail: "Altura registrada",
            },
            {
              label: "IMC",
              value: analiseCorporal.imc > 0 ? analiseCorporal.imc.toFixed(2) : "--",
              detail: "Índice de massa corporal",
            },
            {
              label: "Dobras cutâneas",
              value: resumoDobras.somatorio ? `${resumoDobras.somatorio} mm` : "--",
              detail: "Somatório das medidas",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                {item.label}
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight">
                {item.value}
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {item.detail}
              </p>
            </div>
          ))}
        </section>
  
        {/* DADOS GERAIS */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Dados gerais</h2>
              <p className="text-sm text-[var(--text-secondary)]">
                Informações e parâmetros iniciais do avaliado.
              </p>
            </div>
            <span className="text-xs font-medium text-[var(--text-muted)]">
              ETAPA 01 / 04
            </span>
          </div>
  
          <div className="grid gap-4 xl:grid-cols-2">
  
            {/* INFORMAÇÕES PESSOAIS */}
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-5">
              <h3 className="mb-4 text-sm font-semibold">
                Informações pessoais
              </h3>
  
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                    Nome completo
                  </span>
                  <input
                    value={data.nomeCompleto}
                    onChange={(e) => updateField("nomeCompleto", e.target.value)}
                    className={inputBaseClass}
                    placeholder="Nome do aluno"
                  />
                </label>
  
                <label>
                  <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                    Gênero
                  </span>
                  <select
                    value={data.genero}
                    onChange={(e) => updateField("genero", e.target.value)}
                    className={inputBaseClass}
                  >
                    <option value="">Selecione</option>
                    <option value="masculino">Masculino</option>
                    <option value="feminino">Feminino</option>
                  </select>
                </label>
  
                <label>
                  <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                    Idade (anos)
                  </span>
                  <input
                    value={data.idade}
                    onChange={(e) => updateField("idade", sanitizeInteger(e.target.value))}
                    className={inputBaseClass}
                    inputMode="numeric"
                    placeholder="Ex.: 25"
                  />
                </label>
  
                <label>
                  <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                    Etnia
                  </span>
                  <input
                    value={data.etnia}
                    onChange={(e) => updateField("etnia", e.target.value)}
                    className={inputBaseClass}
                    placeholder="Não obrigatório"
                  />
                </label>
  
                <label>
                  <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                    Massa corporal (kg)
                  </span>
                  <input
                    value={data.massa}
                    onChange={(e) => updateField("massa", sanitizeDecimal(e.target.value))}
                    className={inputBaseClass}
                    inputMode="decimal"
                    placeholder="0,0"
                  />
                </label>
  
                <label>
                  <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                    Estatura (m)
                  </span>
                  <input
                    value={data.estatura}
                    onChange={(e) => updateField("estatura", sanitizeDecimal(e.target.value))}
                    className={inputBaseClass}
                    inputMode="decimal"
                    placeholder="0,00"
                  />
                </label>
              </div>
            </div>
  
            {/* DIÂMETROS ÓSSEOS */}
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-5">
              <h3 className="mb-1 text-sm font-semibold">Diâmetros ósseos</h3>
              <p className="mb-4 text-xs text-[var(--text-muted)]">
                Medidas estruturais em centímetros.
              </p>
  
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { label: "Fêmur", field: "femur" as const, value: data.femur },
                  { label: "Tíbia", field: "tibia" as const, value: data.tibia },
                  { label: "Úmero", field: "umero" as const, value: data.umero },
                  { label: "Ulna", field: "una" as const, value: data.una },
                ].map((item) => (
                  <label key={item.field}>
                    <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                      {item.label} (cm)
                    </span>
                    <input
                      value={item.value}
                      onChange={(e) => updateField(item.field, sanitizeDecimal(e.target.value))}
                      className={inputBaseClass}
                      inputMode="decimal"
                      placeholder="0,0"
                    />
                  </label>
                ))}
              </div>
            </div>
  
            {/* FREQUÊNCIA CARDÍACA */}
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-5">
              <h3 className="mb-4 text-sm font-semibold">Frequência cardíaca</h3>
  
              <div className="grid gap-3 sm:grid-cols-3">
                <label>
                  <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                    Repouso (BPM)
                  </span>
                  <input
                    value={data.fcRepouso}
                    onChange={(e) => updateField("fcRepouso", sanitizeInteger(e.target.value))}
                    className={inputBaseClass}
                    inputMode="numeric"
                  />
                </label>
  
                <label>
                  <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                    Máxima estimada
                  </span>
                  <input value={fcMaxima} readOnly className={`${inputBaseClass} bg-[var(--surface-sunken)]`} />
                </label>
  
                <label>
                  <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                    Reserva
                  </span>
                  <input value={fcReserva} readOnly className={`${inputBaseClass} bg-[var(--surface-sunken)]`} />
                </label>
              </div>
            </div>
  
            {/* BIOQUÍMICA */}
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-5">
              <h3 className="mb-4 text-sm font-semibold">Controle bioquímico</h3>
  
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Glicose", field: "glicose" as const, value: data.glicose },
                  { label: "Triglicerídeos", field: "triglicerideos" as const, value: data.triglicerideos },
                  { label: "LDL-C", field: "ldl" as const, value: data.ldl },
                  { label: "HDL-C", field: "hdl" as const, value: data.hdl },
                ].map((item) => (
                  <label key={item.field}>
                    <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                      {item.label}
                    </span>
                    <input
                      value={item.value}
                      onChange={(e) => updateField(item.field, sanitizeInteger(e.target.value))}
                      className={inputBaseClass}
                      inputMode="numeric"
                    />
                  </label>
                ))}
              </div>
            </div>
  
            {/* PRESSÃO ARTERIAL */}
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-5 xl:col-span-2">
              <h3 className="mb-4 text-sm font-semibold">Pressão arterial</h3>
  
              <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
                <div>
                  <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                    Sistólica / diastólica (mmHg)
                  </span>
  
                  <div className="flex items-center gap-2">
                    <input
                      value={data.sistolica}
                      onChange={(e) => updateField("sistolica", sanitizeInteger(e.target.value))}
                      className={inputBaseClass}
                      inputMode="numeric"
                      placeholder="Sistólica"
                    />
                    <span className="text-[var(--text-muted)]">/</span>
                    <input
                      value={data.diastolica}
                      onChange={(e) => updateField("diastolica", sanitizeInteger(e.target.value))}
                      className={inputBaseClass}
                      inputMode="numeric"
                      placeholder="Diastólica"
                    />
                  </div>
                </div>
  
                <div>
                  <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                    Classificação calculada
                  </span>
                  <div className="flex h-9 items-center rounded-md border border-[var(--border)] bg-[var(--surface-sunken)] px-3 text-sm font-semibold">
                    {classificacaoPressao}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
  
        {/* COMPOSIÇÃO CORPORAL */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold">Composição corporal</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Medidas antropométricas e análise de proporcionalidade.
            </p>
          </div>
  
          {!dadosAntropometricosValidos && (
            <div className="rounded-md border border-[var(--warning)] bg-[var(--warning-soft)] px-4 py-3 text-sm text-[var(--text)]">
              <strong>Dados incompletos:</strong> informe {camposFaltando.join(", ")} para habilitar as análises de referência.
            </div>
          )}
  
          {/* PERÍMETROS */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-5">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">Perímetros corporais</h3>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Registre as medidas em centímetros.
                </p>
              </div>
  
              <button
                type="button"
                onClick={clearAllPerimetros}
                className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
              >
                Limpar medidas
              </button>
            </div>
  
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(220px,0.7fr)_minmax(300px,1fr)]">
              <div className="grid content-start gap-2 sm:grid-cols-2 xl:grid-cols-1">
                {perimetroConfig.map((field) => (
                  <label
                    key={field.key}
                    className="grid grid-cols-[1fr_28px_100px] items-center gap-2"
                  >
                    <span className="text-xs font-medium text-[var(--text-secondary)]">
                      {field.label}
                    </span>
                    <span className="text-center text-xs text-[var(--text-muted)]">
                      {field.index}
                    </span>
                    <input
                      value={perimetros[field.key]}
                      onChange={(e) => updatePerimetro(field.key, sanitizeDecimal(e.target.value))}
                      className={inputBaseClass}
                      inputMode="decimal"
                      placeholder="0,0"
                    />
                  </label>
                ))}
              </div>
  
              <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-sunken)] p-4">
                <img
                  src="/app/src/assets/human.png"
                  alt="Referência anatômica dos perímetros corporais"
                  className="max-h-[380px] max-w-full object-contain"
                />
              </div>
  
              <div className="min-w-0">
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Proporcionalidade dos perímetros
                </h4>
  
                <div className="relative aspect-square w-full max-w-[480px] border border-[var(--border)] bg-[var(--surface-raised)] p-5">
                  <div className="absolute inset-0 grid grid-cols-10 overflow-hidden">
                    {[
                      "#e89a9a", "#f3b2b2", "#f7dfaa", "#f5ec99", "#d6e8c7",
                      "#d6e8c7", "#f5ec99", "#f7dfaa", "#f3b2b2", "#e89a9a",
                    ].map((color, index) => (
                      <div key={index} style={{ backgroundColor: color, opacity: 0.65 }} />
                    ))}
                  </div>
  
                  <div className="absolute inset-0 grid grid-rows-14">
                    {Array.from({ length: chartRows }).map((_, index) => (
                      <div key={index} className="border-b border-zinc-500/20" />
                    ))}
                  </div>
  
                  <div className="absolute inset-y-0 left-1/2 w-px bg-zinc-700/70" />
  
                  {chartPoints.map((point, index) => (
                    <div
                      key={index}
                      title={`Medida ${point.y}: ${point.valor} cm`}
                      className="absolute z-10 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[var(--accent)] shadow"
                      style={{
                        left: `${((point.x + 5) / 10) * 100}%`,
                        top: `${((point.y - 0.5) / chartRows) * 100}%`,
                      }}
                    />
                  ))}
                </div>
  
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-[var(--text-muted)]">
                  <span>← Abaixo da referência</span>
                  <span className="font-semibold text-[var(--text)]">0 = Referência</span>
                  <span>Acima da referência →</span>
                </div>
              </div>
            </div>
          </div>
  
          {/* CLASSIFICAÇÕES */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {classificationBox("Massa muscular", analiseCorporal.massaMuscular)}
            {classificationBox("Massa adiposa", analiseCorporal.massaAdiposa)}
            {classificationBox("Área muscular do braço", analiseCorporal.areaBraco)}
            {classificationBox("Área muscular da coxa", analiseCorporal.areaCoxa)}
          </div>
  
          {/* DOBRAS */}
          <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-5">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">Dobras cutâneas</h3>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Duas medições e média final em milímetros.
                  </p>
                </div>
  
                <button
                  type="button"
                  onClick={clearAllDobras}
                  className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
                >
                  Limpar medidas
                </button>
              </div>
  
              <div className="overflow-x-auto">
                <div className="min-w-[560px]">
                  <div className="grid grid-cols-[minmax(130px,1fr)_90px_90px_90px] gap-2 border-b border-[var(--border)] pb-2">
                    <span className="text-xs font-semibold text-[var(--text-muted)]">LOCAL</span>
                    <span className="text-center text-xs font-semibold text-[var(--text-muted)]">1ª MEDIDA</span>
                    <span className="text-center text-xs font-semibold text-[var(--text-muted)]">2ª MEDIDA</span>
                    <span className="text-center text-xs font-semibold text-[var(--accent)]">MÉDIA</span>
                  </div>
  
                  <div className="space-y-2 pt-3">
                    {dobrasConfig.map((field) => (
                      <div
                        key={field.key}
                        className="grid grid-cols-[minmax(130px,1fr)_90px_90px_90px] items-center gap-2"
                      >
                        <span className="text-xs font-medium text-[var(--text-secondary)]">
                          {field.label}
                        </span>
  
                        <input
                          value={dobras1[field.key]}
                          onChange={(e) => updateDobra1(field.key, sanitizeDecimal(e.target.value))}
                          className={inputBaseClass}
                          inputMode="decimal"
                        />
  
                        <input
                          value={dobras2[field.key]}
                          onChange={(e) => updateDobra2(field.key, sanitizeDecimal(e.target.value))}
                          className={inputBaseClass}
                          inputMode="decimal"
                        />
  
                        <input
                          value={resumoDobras.mediaFinal[field.key]}
                          readOnly
                          className={`${inputBaseClass} bg-[var(--surface-sunken)] text-[var(--accent)]`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
  
              <div className="mt-5 grid grid-cols-3 gap-2 border-t border-[var(--border)] pt-4">
                {[
                  { label: "Somatório", value: resumoDobras.somatorio },
                  { label: "Periférico", value: resumoDobras.periferico },
                  { label: "Central", value: resumoDobras.central },
                ].map((item) => (
                  <div key={item.label} className="rounded-md bg-[var(--surface-sunken)] p-3">
                    <span className="text-xs text-[var(--text-muted)]">{item.label}</span>
                    <p className="mt-1 text-lg font-bold">{item.value || "--"} <span className="text-xs font-normal">mm</span></p>
                  </div>
                ))}
              </div>
            </div>
  
            {/* PROPORCIONALIDADE DOBRAS */}
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-5">
              <h3 className="text-sm font-semibold">Proporcionalidade das dobras</h3>
              <p className="mb-5 mt-1 text-xs text-[var(--text-muted)]">
                Distribuição das medidas em relação às referências.
              </p>
  
              <div className="relative w-full border border-[var(--border)]">
                <div className="relative h-[360px] overflow-hidden">
                  <div className="absolute inset-0 grid grid-cols-10">
                    {[
                      "#e89a9a", "#f3b2b2", "#f7dfaa", "#f5ec99", "#d6e8c7",
                      "#d6e8c7", "#f5ec99", "#f7dfaa", "#f3b2b2", "#e89a9a",
                    ].map((color, index) => (
                      <div key={index} style={{ backgroundColor: color, opacity: 0.65 }} />
                    ))}
                  </div>
  
                  <div className="absolute inset-0 grid grid-rows-8">
                    {Array.from({ length: dobraChartRows }).map((_, index) => (
                      <div key={index} className="border-b border-zinc-500/20" />
                    ))}
                  </div>
  
                  <div className="absolute inset-y-0 left-1/2 w-px bg-zinc-700/70" />
  
                  {pontosDobras.map((point, index) => (
                    <div
                      key={index}
                      className="absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[var(--accent)] shadow"
                      style={{
                        left: `${((point.x + 5) / 10) * 100}%`,
                        top: `${((point.y - 0.5) / dobraChartRows) * 100}%`,
                      }}
                    />
                  ))}
                </div>
              </div>
  
              <div className="mt-3 flex justify-between text-xs text-[var(--text-muted)]">
                <span>Abaixo</span>
                <span>Referência</span>
                <span>Acima</span>
              </div>
  
              <div className="mt-5">
                <img
                  src="/app/src/assets/human2.png"
                  alt="Referência anatômica das dobras cutâneas"
                  className="mx-auto max-h-[220px] max-w-full object-contain"
                />
              </div>
            </div>
          </div>
        </section>
  
        {/* DESEMPENHO */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold">Desempenho e força</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Indicadores corporais e estimativas de força máxima.
            </p>
          </div>
  
          <div className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-5">
              <h3 className="mb-4 text-sm font-semibold">Composição corporal</h3>
  
              <ComposicaoCorporalChart
                massaMuscular={analiseCorporal.massaMuscularKg}
                massaLivre={analiseCorporal.massaLivreKg}
                massaAdiposa={analiseCorporal.massaAdiposaKg}
                massaTotal={analiseCorporal.massaTotalKg}
              />
            </div>
  
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-5">
              <div className="mb-4">
                <h3 className="text-sm font-semibold">Teste de carga máxima</h3>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Estimativa de 1RM a partir da carga e repetições.
                </p>
              </div>
  
              <div className="space-y-3">
                {exercicios.map((exercicio) => (
                  <div
                    key={exercicio.key}
                    className="grid grid-cols-[minmax(90px,1fr)_75px_75px_75px] items-center gap-2 border-b border-[var(--border)] pb-3 sm:grid-cols-[minmax(110px,1fr)_90px_90px_90px_100px]"
                  >
                    <span className="text-xs font-semibold">{exercicio.nome}</span>
  
                    <label>
                      <span className="mb-1 block text-[10px] text-[var(--text-muted)]">Carga (kg)</span>
                      <input
                        value={testeCarga.carga1[exercicio.key].carga}
                        onChange={(e) => updateTesteCarga("carga1", exercicio.key, "carga", sanitizeDecimal(e.target.value))}
                        className={inputBaseClass}
                        inputMode="decimal"
                      />
                    </label>
  
                    <label>
                      <span className="mb-1 block text-[10px] text-[var(--text-muted)]">Repetições</span>
                      <input
                        value={testeCarga.carga1[exercicio.key].repeticoes}
                        onChange={(e) => updateTesteCarga("carga1", exercicio.key, "repeticoes", sanitizeInteger(e.target.value))}
                        className={inputBaseClass}
                        inputMode="numeric"
                      />
                    </label>
  
                    <div>
                      <span className="mb-1 block text-[10px] text-[var(--text-muted)]">1RM</span>
                      <div className="flex h-9 items-center rounded-md bg-[var(--surface-sunken)] px-2 text-sm font-bold">
                        {resultado1RM[exercicio.key].rm || "--"}
                      </div>
                    </div>
  
                    <div className="hidden sm:block">
                      <span className="mb-1 block text-[10px] text-[var(--text-muted)]">Classificação</span>
                      <div className="flex h-9 items-center rounded-md bg-[var(--accent-soft)] px-2 text-xs font-semibold text-[var(--accent)]">
                        {resultado1RM[exercicio.key].rm
                          ? classificarForca(resultado1RM[exercicio.key].rm)
                          : "--"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
  
        {/* PARECER */}
        <section className="rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-5">
          <div className="mb-3">
            <h2 className="text-sm font-semibold">Parecer descritivo</h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Registre observações, considerações e recomendações da avaliação.
            </p>
          </div>
  
          <textarea
            value={observacoes}
            onChange={(e) => updateObservacoes(e.target.value)}
            placeholder="Escreva o parecer da avaliação..."
            className="min-h-[140px] w-full resize-y rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]"
          />
        </section>
  
        {/* RODAPÉ */}
        <footer className="flex flex-col justify-between gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold">Primeira avaliação</p>
            <p className="text-xs text-[var(--text-muted)]">
              Continue para registrar a segunda avaliação do aluno.
            </p>
          </div>
  
          <button
            type="button"
            onClick={() => navigate("/avaliacao2")}
            className="flex items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--on-accent)] transition hover:bg-[var(--accent-hover)]"
          >
            Ir para segunda avaliação
            <span aria-hidden="true">→</span>
          </button>
        </footer>
  
      </div>
    </main>
  );
}