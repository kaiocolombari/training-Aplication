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

/**
 * Para criar um tema, adicione uma nova chave neste objeto.
 * Preencha os tokens de cores em light e dark e as cinco cores de amostra.
 * Os nomes dos tokens são mantidos em português para facilitar a edição da paleta.
 */
export const TEMAS = {
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
  oceano: {
    nome: "Oceano",
    descricao: "Azuis frios para uma interface técnica e serena.",
    amostras: ["#F1F6FA", "#FFFFFF", "#182B3A", "#1678A8", "#E0F1F8"],
    cores: {
      light: {
        COR_TEXTO: "#182B3A", COR_TEXTO_SECUNDARIO: "#4E6576", COR_TEXTO_MUTED: "#778B9A",
        COR_FUNDO: "#F1F6FA", COR_FUNDO_SECUNDARIO: "#EAF1F7", COR_SUPERFICIE: "#FFFFFF",
        COR_SUPERFICIE_2: "#DCE7F0", COR_BORDA: "#D6E1EA", COR_BORDA_FORTE: "#C0D0DD",
        COR_ACENTO: "#1678A8", COR_ACENTO_HOVER: "#0E668F", COR_ACENTO_SUAVE: "#E0F1F8",
      },
      dark: {
        COR_TEXTO: "#EAF4F8", COR_TEXTO_SECUNDARIO: "#B5C8D2", COR_TEXTO_MUTED: "#8098A6",
        COR_FUNDO: "#101B24", COR_FUNDO_SECUNDARIO: "#14232E", COR_SUPERFICIE: "#192A36",
        COR_SUPERFICIE_2: "#253C4A", COR_BORDA: "#2B414F", COR_BORDA_FORTE: "#3B5666",
        COR_ACENTO: "#62BDE5", COR_ACENTO_HOVER: "#80CFEE", COR_ACENTO_SUAVE: "#203F50",
      },
    },
  },
  floresta: {
    nome: "Floresta",
    descricao: "Verdes discretos, com contraste confortável.",
    amostras: ["#F2F6F2", "#FFFFFF", "#1C2C22", "#2F7A54", "#E4F2E9"],
    cores: {
      light: {
        COR_TEXTO: "#1C2C22", COR_TEXTO_SECUNDARIO: "#53645A", COR_TEXTO_MUTED: "#849188",
        COR_FUNDO: "#F2F6F2", COR_FUNDO_SECUNDARIO: "#E9F1EB", COR_SUPERFICIE: "#FFFFFF",
        COR_SUPERFICIE_2: "#DCE8DF", COR_BORDA: "#DBE5DD", COR_BORDA_FORTE: "#C8D6CC",
        COR_ACENTO: "#2F7A54", COR_ACENTO_HOVER: "#256744", COR_ACENTO_SUAVE: "#E4F2E9",
      },
      dark: {
        COR_TEXTO: "#EDF5EF", COR_TEXTO_SECUNDARIO: "#BDCFC1", COR_TEXTO_MUTED: "#8FA394",
        COR_FUNDO: "#131C17", COR_FUNDO_SECUNDARIO: "#18251D", COR_SUPERFICIE: "#1E2C23",
        COR_SUPERFICIE_2: "#2B3C31", COR_BORDA: "#34463A", COR_BORDA_FORTE: "#49604F",
        COR_ACENTO: "#72C596", COR_ACENTO_HOVER: "#91D6AC", COR_ACENTO_SUAVE: "#263F31",
      },
    },
  },
  terracota: {
    nome: "Terracota",
    descricao: "Tons quentes inspirados na identidade original do projeto.",
    amostras: ["#F7F3F0", "#FFFFFF", "#30231E", "#A85F60", "#F5E6E4"],
    cores: {
      light: {
        COR_TEXTO: "#30231E", COR_TEXTO_SECUNDARIO: "#6C5750", COR_TEXTO_MUTED: "#9B8980",
        COR_FUNDO: "#F7F3F0", COR_FUNDO_SECUNDARIO: "#F1E9E4", COR_SUPERFICIE: "#FFFFFF",
        COR_SUPERFICIE_2: "#EBE0D8", COR_BORDA: "#E8DAD2", COR_BORDA_FORTE: "#D8C5BB",
        COR_ACENTO: "#A85F60", COR_ACENTO_HOVER: "#8F4E50", COR_ACENTO_SUAVE: "#F5E6E4",
      },
      dark: {
        COR_TEXTO: "#F5ECE8", COR_TEXTO_SECUNDARIO: "#D1BDB4", COR_TEXTO_MUTED: "#A68E84",
        COR_FUNDO: "#1C1716", COR_FUNDO_SECUNDARIO: "#241D1B", COR_SUPERFICIE: "#2C2321",
        COR_SUPERFICIE_2: "#3A2D29", COR_BORDA: "#493733", COR_BORDA_FORTE: "#604942",
        COR_ACENTO: "#DF9995", COR_ACENTO_HOVER: "#EFB1AB", COR_ACENTO_SUAVE: "#4A302F",
      },
    },
  },
  ametista: {
    nome: "Ametista",
    descricao: "Roxo sofisticado para destacar áreas analíticas.",
    amostras: ["#F5F2F8", "#FFFFFF", "#2A2033", "#8055A8", "#F0E7F7"],
    cores: {
      light: {
        COR_TEXTO: "#2A2033", COR_TEXTO_SECUNDARIO: "#65566F", COR_TEXTO_MUTED: "#93859D",
        COR_FUNDO: "#F5F2F8", COR_FUNDO_SECUNDARIO: "#EEE8F5", COR_SUPERFICIE: "#FFFFFF",
        COR_SUPERFICIE_2: "#E5DDEC", COR_BORDA: "#E5DCE9", COR_BORDA_FORTE: "#D2C5D8",
        COR_ACENTO: "#8055A8", COR_ACENTO_HOVER: "#6D448F", COR_ACENTO_SUAVE: "#F0E7F7",
      },
      dark: {
        COR_TEXTO: "#F3EDF7", COR_TEXTO_SECUNDARIO: "#C9BAD4", COR_TEXTO_MUTED: "#9A8BA6",
        COR_FUNDO: "#19151F", COR_FUNDO_SECUNDARIO: "#211B29", COR_SUPERFICIE: "#292132",
        COR_SUPERFICIE_2: "#362A41", COR_BORDA: "#403349", COR_BORDA_FORTE: "#584563",
        COR_ACENTO: "#C19BE0", COR_ACENTO_HOVER: "#D3B1ED", COR_ACENTO_SUAVE: "#3B2B4C",
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
