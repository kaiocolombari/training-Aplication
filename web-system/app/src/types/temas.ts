import type { CSSProperties } from "react";

export type ModoTema = "light" | "dark";

export type PaletaTema = {
  COR_TEXTO: string;
  COR_TEXTO_SECUNDARIO: string;
  COR_TEXTO_MUTED: string;
  COR_FUNDO: string;
  COR_FUNDO_SECUNDARIO: string;
  COR_SUPERFICIE: string;
  COR_SUPERFICIE_2: string;
  COR_BORDA: string;
  COR_BORDA_FORTE: string;
  COR_ACENTO: string;
  COR_ACENTO_HOVER: string;
  COR_ACENTO_SUAVE: string;
};

type DefinicaoTema = {
  nome: string;
  descricao: string;
  amostras: string[];
  cores: Record<ModoTema, PaletaTema>;
};

export const TEMAS = {
  // ───────────────────────── TEMA 1 — MANTIDO ─────────────────────────
  indigo: {
    nome: "Índigo clássico",
    descricao: "Equilibrado, limpo e próximo da identidade atual.",
    amostras: ["#F3F4F6", "#FFFFFF", "#191B22", "#5558D9", "#EEEEFF"],
    cores: {
      light: {
        COR_TEXTO: "#191B22", COR_TEXTO_SECUNDARIO: "#555966", COR_TEXTO_MUTED: "#858995",
        COR_FUNDO: "#F3F4F6", COR_FUNDO_SECUNDARIO: "#F5F6F8", COR_SUPERFICIE: "#FFFFFF",
        COR_SUPERFICIE_2: "#ECEEF2", COR_BORDA: "#E5E7EB", COR_BORDA_FORTE: "#D5D8DF",
        COR_ACENTO: "#5558D9", COR_ACENTO_HOVER: "#4548C5", COR_ACENTO_SUAVE: "#EEEEFF",
      },
      dark: {
        COR_TEXTO: "#F1F2F5", COR_TEXTO_SECUNDARIO: "#C0C2CC", COR_TEXTO_MUTED: "#9295A3",
        COR_FUNDO: "#15161B", COR_FUNDO_SECUNDARIO: "#1A1C23", COR_SUPERFICIE: "#1D1F25",
        COR_SUPERFICIE_2: "#292B33", COR_BORDA: "#343640", COR_BORDA_FORTE: "#454854",
        COR_ACENTO: "#9293FF", COR_ACENTO_HOVER: "#AAAAFF", COR_ACENTO_SUAVE: "#30304E",
      },
    },
  },

  // ───────────────────────── TEMAS REFORMULADOS ─────────────────────────
  oceano: {
    nome: "Oceano",
    descricao: "Azul oceânico profundo com detalhes em ciano luminoso.",
    amostras: ["#EAF6FA", "#FFFFFF", "#123044", "#087EA4", "#CDEFF7"],
    cores: {
      light: {
        COR_TEXTO: "#123044", COR_TEXTO_SECUNDARIO: "#365D70", COR_TEXTO_MUTED: "#607F8D",
        COR_FUNDO: "#EAF6FA", COR_FUNDO_SECUNDARIO: "#DCEEF4", COR_SUPERFICIE: "#FFFFFF",
        COR_SUPERFICIE_2: "#D0E6EE", COR_BORDA: "#BFD9E3", COR_BORDA_FORTE: "#91BDCC",
        COR_ACENTO: "#087EA4", COR_ACENTO_HOVER: "#066887", COR_ACENTO_SUAVE: "#CDEFF7",
      },
      dark: {
        COR_TEXTO: "#EAF8FC", COR_TEXTO_SECUNDARIO: "#B6D9E5", COR_TEXTO_MUTED: "#83AEBE",
        COR_FUNDO: "#081D29", COR_FUNDO_SECUNDARIO: "#0C2938", COR_SUPERFICIE: "#103447",
        COR_SUPERFICIE_2: "#19465B", COR_BORDA: "#24566B", COR_BORDA_FORTE: "#34748B",
        COR_ACENTO: "#35C5E8", COR_ACENTO_HOVER: "#65D7F0", COR_ACENTO_SUAVE: "#123F50",
      },
    },
  },

  floresta: {
    nome: "Floresta",
    descricao: "Verde esmeralda e tons naturais com aparência orgânica.",
    amostras: ["#EDF7EF", "#FFFFFF", "#173B2B", "#16834A", "#D1F2DC"],
    cores: {
      light: {
        COR_TEXTO: "#173B2B", COR_TEXTO_SECUNDARIO: "#3D654F", COR_TEXTO_MUTED: "#668574",
        COR_FUNDO: "#EDF7EF", COR_FUNDO_SECUNDARIO: "#DFEFE3", COR_SUPERFICIE: "#FFFFFF",
        COR_SUPERFICIE_2: "#D2E8D8", COR_BORDA: "#C2DEC9", COR_BORDA_FORTE: "#91C5A1",
        COR_ACENTO: "#16834A", COR_ACENTO_HOVER: "#106B3C", COR_ACENTO_SUAVE: "#D1F2DC",
      },
      dark: {
        COR_TEXTO: "#EFFBF2", COR_TEXTO_SECUNDARIO: "#BBDCC5", COR_TEXTO_MUTED: "#8FB59A",
        COR_FUNDO: "#0D2117", COR_FUNDO_SECUNDARIO: "#123020", COR_SUPERFICIE: "#193B29",
        COR_SUPERFICIE_2: "#245238", COR_BORDA: "#2E6545", COR_BORDA_FORTE: "#43865D",
        COR_ACENTO: "#48D17D", COR_ACENTO_HOVER: "#70E49A", COR_ACENTO_SUAVE: "#19472D",
      },
    },
  },

  terracota: {
    nome: "Terracota",
    descricao: "Argila, cobre e tons quentes com personalidade.",
    amostras: ["#FBF0E9", "#FFFFFF", "#42271F", "#C65D3A", "#F9D8C8"],
    cores: {
      light: {
        COR_TEXTO: "#42271F", COR_TEXTO_SECUNDARIO: "#795044", COR_TEXTO_MUTED: "#A07869",
        COR_FUNDO: "#FBF0E9", COR_FUNDO_SECUNDARIO: "#F5E2D7", COR_SUPERFICIE: "#FFFCFA",
        COR_SUPERFICIE_2: "#EED3C5", COR_BORDA: "#E8C6B5", COR_BORDA_FORTE: "#D8A28B",
        COR_ACENTO: "#C65D3A", COR_ACENTO_HOVER: "#A8492C", COR_ACENTO_SUAVE: "#F9D8C8",
      },
      dark: {
        COR_TEXTO: "#FFF1E9", COR_TEXTO_SECUNDARIO: "#E2BBAA", COR_TEXTO_MUTED: "#BD9180",
        COR_FUNDO: "#241512", COR_FUNDO_SECUNDARIO: "#321D18", COR_SUPERFICIE: "#40251E",
        COR_SUPERFICIE_2: "#563229", COR_BORDA: "#704337", COR_BORDA_FORTE: "#925744",
        COR_ACENTO: "#F08A65", COR_ACENTO_HOVER: "#FFA486", COR_ACENTO_SUAVE: "#542B20",
      },
    },
  },

  ametista: {
    nome: "Ametista",
    descricao: "Roxo intenso e elegante, com atmosfera criativa.",
    amostras: ["#F5EEFC", "#FFFFFF", "#352047", "#8746C5", "#EAD8FA"],
    cores: {
      light: {
        COR_TEXTO: "#352047", COR_TEXTO_SECUNDARIO: "#684B7D", COR_TEXTO_MUTED: "#907AA2",
        COR_FUNDO: "#F5EEFC", COR_FUNDO_SECUNDARIO: "#EDE1F8", COR_SUPERFICIE: "#FFFCFF",
        COR_SUPERFICIE_2: "#E4D3F1", COR_BORDA: "#D9C4EB", COR_BORDA_FORTE: "#B995D5",
        COR_ACENTO: "#8746C5", COR_ACENTO_HOVER: "#6E35A6", COR_ACENTO_SUAVE: "#EAD8FA",
      },
      dark: {
        COR_TEXTO: "#F7EEFF", COR_TEXTO_SECUNDARIO: "#D7BDEB", COR_TEXTO_MUTED: "#AD8BC8",
        COR_FUNDO: "#1C1028", COR_FUNDO_SECUNDARIO: "#281638", COR_SUPERFICIE: "#352047",
        COR_SUPERFICIE_2: "#482C60", COR_BORDA: "#5A3975", COR_BORDA_FORTE: "#79509A",
        COR_ACENTO: "#C084FC", COR_ACENTO_HOVER: "#D3A5FF", COR_ACENTO_SUAVE: "#43245D",
      },
    },
  },

  grafite: {
    nome: "Grafite",
    descricao: "Visual industrial quase monocromático com acento verde-lima.",
    amostras: ["#F1F3F4", "#FFFFFF", "#20272D", "#526B45", "#E1E9D8"],
    cores: {
      light: {
        COR_TEXTO: "#20272D", COR_TEXTO_SECUNDARIO: "#4D5961", COR_TEXTO_MUTED: "#737F86",
        COR_FUNDO: "#F1F3F4", COR_FUNDO_SECUNDARIO: "#E5E9EB", COR_SUPERFICIE: "#FFFFFF",
        COR_SUPERFICIE_2: "#DCE1E4", COR_BORDA: "#CCD3D7", COR_BORDA_FORTE: "#AAB5BB",
        COR_ACENTO: "#526B45", COR_ACENTO_HOVER: "#405638", COR_ACENTO_SUAVE: "#E1E9D8",
      },
      dark: {
        COR_TEXTO: "#F1F4F5", COR_TEXTO_SECUNDARIO: "#C0C9CD", COR_TEXTO_MUTED: "#929FA5",
        COR_FUNDO: "#111619", COR_FUNDO_SECUNDARIO: "#191F23", COR_SUPERFICIE: "#222A2F",
        COR_SUPERFICIE_2: "#303B41", COR_BORDA: "#3B484F", COR_BORDA_FORTE: "#56656D",
        COR_ACENTO: "#B5D889", COR_ACENTO_HOVER: "#C9E9A0", COR_ACENTO_SUAVE: "#303E29",
      },
    },
  },

  menta: {
    nome: "Menta",
    descricao: "Turquesa fresco e vibrante, com visual leve e moderno.",
    amostras: ["#E8FAF7", "#FFFFFF", "#123D3A", "#00A896", "#C8F5EC"],
    cores: {
      light: {
        COR_TEXTO: "#123D3A", COR_TEXTO_SECUNDARIO: "#356B65", COR_TEXTO_MUTED: "#65918A",
        COR_FUNDO: "#E8FAF7", COR_FUNDO_SECUNDARIO: "#D5F3ED", COR_SUPERFICIE: "#FFFFFF",
        COR_SUPERFICIE_2: "#C8EAE3", COR_BORDA: "#B4DED5", COR_BORDA_FORTE: "#83C8BA",
        COR_ACENTO: "#00A896", COR_ACENTO_HOVER: "#008B7D", COR_ACENTO_SUAVE: "#C8F5EC",
      },
      dark: {
        COR_TEXTO: "#E9FFFA", COR_TEXTO_SECUNDARIO: "#B3E6DC", COR_TEXTO_MUTED: "#80BDB1",
        COR_FUNDO: "#092321", COR_FUNDO_SECUNDARIO: "#0D302D", COR_SUPERFICIE: "#12413D",
        COR_SUPERFICIE_2: "#1B5751", COR_BORDA: "#246B63", COR_BORDA_FORTE: "#358A7F",
        COR_ACENTO: "#42E0C5", COR_ACENTO_HOVER: "#70F0D8", COR_ACENTO_SUAVE: "#164A43",
      },
    },
  },

  ambar: {
    nome: "Âmbar",
    descricao: "Amarelo-ouro e laranja intenso, energético e acolhedor.",
    amostras: ["#FFF7E8", "#FFFFFF", "#422B0B", "#C77700", "#FFE7B3"],
    cores: {
      light: {
        COR_TEXTO: "#422B0B", COR_TEXTO_SECUNDARIO: "#765321", COR_TEXTO_MUTED: "#9A7844",
        COR_FUNDO: "#FFF7E8", COR_FUNDO_SECUNDARIO: "#FBEBCB", COR_SUPERFICIE: "#FFFEFA",
        COR_SUPERFICIE_2: "#F3E0B5", COR_BORDA: "#EBD39A", COR_BORDA_FORTE: "#D8B66A",
        COR_ACENTO: "#C77700", COR_ACENTO_HOVER: "#A65F00", COR_ACENTO_SUAVE: "#FFE7B3",
      },
      dark: {
        COR_TEXTO: "#FFF7E7", COR_TEXTO_SECUNDARIO: "#E8D1A5", COR_TEXTO_MUTED: "#BFA16D",
        COR_FUNDO: "#21180A", COR_FUNDO_SECUNDARIO: "#30220D", COR_SUPERFICIE: "#402E12",
        COR_SUPERFICIE_2: "#574019", COR_BORDA: "#705322", COR_BORDA_FORTE: "#916D2D",
        COR_ACENTO: "#FFC15A", COR_ACENTO_HOVER: "#FFD080", COR_ACENTO_SUAVE: "#4A3513",
      },
    },
  },

  vinho: {
    nome: "Vinho",
    descricao: "Bordô profundo com detalhes em rosa e framboesa.",
    amostras: ["#FBEFF3", "#FFFFFF", "#42172A", "#B32655", "#F8D5E2"],
    cores: {
      light: {
        COR_TEXTO: "#42172A", COR_TEXTO_SECUNDARIO: "#754157", COR_TEXTO_MUTED: "#9B7183",
        COR_FUNDO: "#FBEFF3", COR_FUNDO_SECUNDARIO: "#F5DFE7", COR_SUPERFICIE: "#FFFCFD",
        COR_SUPERFICIE_2: "#EED1DC", COR_BORDA: "#E5BFCF", COR_BORDA_FORTE: "#D493AD",
        COR_ACENTO: "#B32655", COR_ACENTO_HOVER: "#941D45", COR_ACENTO_SUAVE: "#F8D5E2",
      },
      dark: {
        COR_TEXTO: "#FFF0F5", COR_TEXTO_SECUNDARIO: "#E5BDCC", COR_TEXTO_MUTED: "#BB8FA0",
        COR_FUNDO: "#230F18", COR_FUNDO_SECUNDARIO: "#321522", COR_SUPERFICIE: "#421D2D",
        COR_SUPERFICIE_2: "#58283D", COR_BORDA: "#70334D", COR_BORDA_FORTE: "#914460",
        COR_ACENTO: "#F178A3", COR_ACENTO_HOVER: "#FF9ABB", COR_ACENTO_SUAVE: "#512238",
      },
    },
  },

  oliva: {
    nome: "Oliva",
    descricao: "Verde-musgo e tons de campo, com personalidade terrosa.",
    amostras: ["#F4F5E8", "#FFFFFF", "#303719", "#71852B", "#E5EDB8"],
    cores: {
      light: {
        COR_TEXTO: "#303719", COR_TEXTO_SECUNDARIO: "#5D6737", COR_TEXTO_MUTED: "#858D5D",
        COR_FUNDO: "#F4F5E8", COR_FUNDO_SECUNDARIO: "#EAECCF", COR_SUPERFICIE: "#FFFFFA",
        COR_SUPERFICIE_2: "#DFE4B9", COR_BORDA: "#D2D9A5", COR_BORDA_FORTE: "#B5C17A",
        COR_ACENTO: "#71852B", COR_ACENTO_HOVER: "#5A6B20", COR_ACENTO_SUAVE: "#E5EDB8",
      },
      dark: {
        COR_TEXTO: "#F5F6E8", COR_TEXTO_SECUNDARIO: "#D0D7A9", COR_TEXTO_MUTED: "#A5B078",
        COR_FUNDO: "#1A1E0D", COR_FUNDO_SECUNDARIO: "#252B12", COR_SUPERFICIE: "#32391A",
        COR_SUPERFICIE_2: "#424B23", COR_BORDA: "#535F2C", COR_BORDA_FORTE: "#71813A",
        COR_ACENTO: "#C2DF65", COR_ACENTO_HOVER: "#D5ED85", COR_ACENTO_SUAVE: "#3A471B",
      },
    },
  },

  safira: {
    nome: "Safira",
    descricao: "Azul royal intenso, com contraste marcante e tecnológico.",
    amostras: ["#EDF2FF", "#FFFFFF", "#172554", "#315BEA", "#D7E2FF"],
    cores: {
      light: {
        COR_TEXTO: "#172554", COR_TEXTO_SECUNDARIO: "#3F5288", COR_TEXTO_MUTED: "#687BAE",
        COR_FUNDO: "#EDF2FF", COR_FUNDO_SECUNDARIO: "#DFE7FC", COR_SUPERFICIE: "#FFFFFF",
        COR_SUPERFICIE_2: "#D1DDF8", COR_BORDA: "#C0D0F2", COR_BORDA_FORTE: "#91A9E5",
        COR_ACENTO: "#315BEA", COR_ACENTO_HOVER: "#2448C7", COR_ACENTO_SUAVE: "#D7E2FF",
      },
      dark: {
        COR_TEXTO: "#F0F4FF", COR_TEXTO_SECUNDARIO: "#C1CFF5", COR_TEXTO_MUTED: "#91A6DD",
        COR_FUNDO: "#0D1530", COR_FUNDO_SECUNDARIO: "#142044", COR_SUPERFICIE: "#1B2B55",
        COR_SUPERFICIE_2: "#263B70", COR_BORDA: "#304A86", COR_BORDA_FORTE: "#4565AA",
        COR_ACENTO: "#83A5FF", COR_ACENTO_HOVER: "#A4BCFF", COR_ACENTO_SUAVE: "#23396D",
      },
    },
  },

  areia: {
    nome: "Areia (conforto visual)",
    descricao: "Paleta de papel, argila e café, sem branco estourado.",
    amostras: ["#F2EBDD", "#FAF5E9", "#3D3022", "#9A6B32", "#E9D5AE"],
    cores: {
      light: {
        COR_TEXTO: "#3D3022", COR_TEXTO_SECUNDARIO: "#6E5A42", COR_TEXTO_MUTED: "#8D7A61",
        COR_FUNDO: "#F2EBDD", COR_FUNDO_SECUNDARIO: "#E9DECA", COR_SUPERFICIE: "#FAF5E9",
        COR_SUPERFICIE_2: "#DED0B6", COR_BORDA: "#D5C4A5", COR_BORDA_FORTE: "#BDA17A",
        COR_ACENTO: "#9A6B32", COR_ACENTO_HOVER: "#7C5427", COR_ACENTO_SUAVE: "#E9D5AE",
      },
      dark: {
        COR_TEXTO: "#F5EBDD", COR_TEXTO_SECUNDARIO: "#D5C2A5", COR_TEXTO_MUTED: "#B19A78",
        COR_FUNDO: "#211B13", COR_FUNDO_SECUNDARIO: "#2D2419", COR_SUPERFICIE: "#3A2E20",
        COR_SUPERFICIE_2: "#4B3B29", COR_BORDA: "#5E4A32", COR_BORDA_FORTE: "#7A6040",
        COR_ACENTO: "#DDA85F", COR_ACENTO_HOVER: "#EBC080", COR_ACENTO_SUAVE: "#49351D",
      },
    },
  },

  altoContraste: {
    nome: "Alto contraste",
    descricao: "Preto e branco absolutos, com azul elétrico para ações e foco.",
    amostras: ["#FFFFFF", "#F0F0F0", "#000000", "#0047FF", "#DCE6FF"],
    cores: {
      light: {
        COR_TEXTO: "#000000", COR_TEXTO_SECUNDARIO: "#242424", COR_TEXTO_MUTED: "#505050",
        COR_FUNDO: "#FFFFFF", COR_FUNDO_SECUNDARIO: "#F0F0F0", COR_SUPERFICIE: "#FFFFFF",
        COR_SUPERFICIE_2: "#E2E2E2", COR_BORDA: "#777777", COR_BORDA_FORTE: "#333333",
        COR_ACENTO: "#0047FF", COR_ACENTO_HOVER: "#0036C7", COR_ACENTO_SUAVE: "#DCE6FF",
      },
      dark: {
        COR_TEXTO: "#FFFFFF", COR_TEXTO_SECUNDARIO: "#EEEEEE", COR_TEXTO_MUTED: "#C7C7C7",
        COR_FUNDO: "#000000", COR_FUNDO_SECUNDARIO: "#101010", COR_SUPERFICIE: "#191919",
        COR_SUPERFICIE_2: "#292929", COR_BORDA: "#777777", COR_BORDA_FORTE: "#B8B8B8",
        COR_ACENTO: "#6F9BFF", COR_ACENTO_HOVER: "#9AB8FF", COR_ACENTO_SUAVE: "#142B60",
      },
    },
  },
  coral: {
    nome: "Coral",
    descricao: "Coral vivo com base azul-petróleo, criando uma identidade quente e contemporânea.",
    amostras: ["#F8F0EC", "#FFFFFF", "#263B3D", "#E66B5B", "#F9D7CE"],
    cores: {
      light: {
        COR_TEXTO: "#263B3D", COR_TEXTO_SECUNDARIO: "#52696A", COR_TEXTO_MUTED: "#7D9290",
        COR_FUNDO: "#F8F0EC", COR_FUNDO_SECUNDARIO: "#F0E5DF", COR_SUPERFICIE: "#FFFCFA",
        COR_SUPERFICIE_2: "#E9D9D1", COR_BORDA: "#DDC9C0", COR_BORDA_FORTE: "#C5A79B",
        COR_ACENTO: "#E66B5B", COR_ACENTO_HOVER: "#C95447", COR_ACENTO_SUAVE: "#F9D7CE",
      },
      dark: {
        COR_TEXTO: "#F8F1EC", COR_TEXTO_SECUNDARIO: "#C8D2CE", COR_TEXTO_MUTED: "#9EADA7",
        COR_FUNDO: "#172426", COR_FUNDO_SECUNDARIO: "#203033", COR_SUPERFICIE: "#293B3D",
        COR_SUPERFICIE_2: "#385052", COR_BORDA: "#496365", COR_BORDA_FORTE: "#638083",
        COR_ACENTO: "#FF8978", COR_ACENTO_HOVER: "#FFA294", COR_ACENTO_SUAVE: "#50302F",
      },
    },
  },

  orquidea: {
    nome: "Orquídea",
    descricao: "Magenta e ameixa com uma composição expressiva e sofisticada.",
    amostras: ["#F9EFF6", "#FFFCFE", "#3B2038", "#C04491", "#F4D5E9"],
    cores: {
      light: {
        COR_TEXTO: "#3B2038", COR_TEXTO_SECUNDARIO: "#704B6A", COR_TEXTO_MUTED: "#967B91",
        COR_FUNDO: "#F9EFF6", COR_FUNDO_SECUNDARIO: "#F1E1ED", COR_SUPERFICIE: "#FFFCFE",
        COR_SUPERFICIE_2: "#EAD3E4", COR_BORDA: "#DFC1D7", COR_BORDA_FORTE: "#C894B8",
        COR_ACENTO: "#C04491", COR_ACENTO_HOVER: "#A33278", COR_ACENTO_SUAVE: "#F4D5E9",
      },
      dark: {
        COR_TEXTO: "#FFF1FA", COR_TEXTO_SECUNDARIO: "#E2C1D8", COR_TEXTO_MUTED: "#B994AE",
        COR_FUNDO: "#241523", COR_FUNDO_SECUNDARIO: "#321D31", COR_SUPERFICIE: "#422642",
        COR_SUPERFICIE_2: "#563354", COR_BORDA: "#6B4168", COR_BORDA_FORTE: "#895781",
        COR_ACENTO: "#F078BD", COR_ACENTO_HOVER: "#FF9BD0", COR_ACENTO_SUAVE: "#512849",
      },
    },
  },
} as const satisfies Record<string, DefinicaoTema>;


export type TemaId = keyof typeof TEMAS;

export const FONTES_UI = {
  sistema: { nome: "Sistema", css: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  segoe: { nome: "Segoe UI", css: '"Segoe UI", Tahoma, sans-serif' },
  arial: { nome: "Arial", css: 'Arial, Helvetica, sans-serif' },
  verdana: { nome: "Verdana", css: 'Verdana, Geneva, sans-serif' },
  trebuchet: { nome: "Trebuchet MS", css: '"Trebuchet MS", sans-serif' },
  georgia: { nome: "Georgia", css: 'Georgia, "Times New Roman", serif' },
  consolas: { nome: "Consolas", css: 'Consolas, "Courier New", monospace' },
} as const;

export type FonteUiId = keyof typeof FONTES_UI;

export const ESCALAS_TEXTO = {
  compacto: { nome: "Compacto", escala: 0.9, exemplo: "Mais informações na tela" },
  padrao: { nome: "Padrão", escala: 1, exemplo: "Equilíbrio entre leitura e espaço" },
  grande: { nome: "Grande", escala: 1.1, exemplo: "Leitura mais confortável" },
  extra: { nome: "Extra grande", escala: 1.2, exemplo: "Prioriza legibilidade" },
} as const;

export type EscalaTextoId = keyof typeof ESCALAS_TEXTO;

export function gerarVariaveisTema(id: TemaId, modo: ModoTema): CSSProperties {
  const cores = TEMAS[id].cores[modo];
  const textoSobreAcento = modo === "dark" ? "#191B22" : "#FFFFFF";

  return {
    "--surface": cores.COR_SUPERFICIE,
    "--surface-raised": cores.COR_SUPERFICIE,
    "--surface-secondary": cores.COR_FUNDO_SECUNDARIO,
    "--surface-sunken": cores.COR_FUNDO,
    "--surface-tertiary": cores.COR_SUPERFICIE_2,
    "--surface-hover": cores.COR_SUPERFICIE_2,
    "--text": cores.COR_TEXTO,
    "--text-primary": cores.COR_TEXTO,
    "--text-secondary": cores.COR_TEXTO_SECUNDARIO,
    "--text-muted": cores.COR_TEXTO_MUTED,
    "--border": cores.COR_BORDA,
    "--border-strong": cores.COR_BORDA_FORTE,
    "--accent": cores.COR_ACENTO,
    "--accent-hover": cores.COR_ACENTO_HOVER,
    "--accent-soft": cores.COR_ACENTO_SUAVE,
    "--accent-on": textoSobreAcento,
    "--on-accent": textoSobreAcento,
    "--ring": "color-mix(in srgb, " + cores.COR_ACENTO + " 22%, transparent)",
    "--sidebar": cores.COR_SUPERFICIE,
    "--header": cores.COR_SUPERFICIE,
    "--row-hover": cores.COR_SUPERFICIE_2,
    "--input-bg": cores.COR_SUPERFICIE,
    "--menu-bg": cores.COR_SUPERFICIE,
    "--modal-bg": cores.COR_SUPERFICIE,
    "--accent-text": cores.COR_ACENTO,
    "--accent-border": cores.COR_ACENTO,
  } as CSSProperties;
}
