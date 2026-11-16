export type TipoPerguntaCadastro = "text" | "textarea" | "number" | "select";

export interface PerguntaCadastro {
    id: string;
    titulo: string;
    descricao?: string;
    tipo: TipoPerguntaCadastro;
    obrigatoria: boolean;
    opcoes?: string[];
}

// Configure o questionário adicionando, removendo ou alterando itens desta lista.
export const perguntasCadastro: PerguntaCadastro[] = [
    {
        id: "objetivo",
        titulo: "Qual é seu principal objetivo com os treinos?",
        tipo: "select",
        obrigatoria: true,
        opcoes: ["Hipertrofia", "Emagrecimento", "Condicionamento físico", "Saúde e qualidade de vida", "Outro"],
    },
    {
        id: "experiencia",
        titulo: "Como você descreveria sua experiência com musculação?",
        tipo: "select",
        obrigatoria: true,
        opcoes: ["Nunca treinei", "Sou iniciante", "Treino há alguns meses", "Treino há mais de um ano"],
    },
    {
        id: "frequencia",
        titulo: "Quantos dias por semana pretende treinar?",
        tipo: "select",
        obrigatoria: true,
        opcoes: ["2 dias", "3 dias", "4 dias", "5 dias", "6 dias ou mais"],
    },
    {
        id: "observacoes",
        titulo: "Existe alguma informação importante que devemos saber?",
        descricao: "Conte sobre sua rotina, preferências ou qualquer ponto relevante.",
        tipo: "textarea",
        obrigatoria: false,
    },
];
