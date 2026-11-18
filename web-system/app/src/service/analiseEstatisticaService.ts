import { apiGet, apiPost } from "./api";

export interface AnaliseEstatisticaRegistro {
    id: string;
    alunoId: string;
    ferramentaId: string;
    nomeFerramenta: string;
    periodoInicio: string | null;
    periodoFim: string | null;
    parametrosJson: string;
    resultadoJson: string;
    resumo: string;
    quantidadeRegistros: number;
    geradoEm: string;
}

export interface CriarAnaliseEstatisticaPayload {
    ferramentaId: string;
    nomeFerramenta: string;
    periodoInicio?: string;
    periodoFim?: string;
    parametrosJson: string;
    resultadoJson: string;
    resumo: string;
    quantidadeRegistros: number;
}

export const analiseEstatisticaService = {
    listar: (alunoId: string) =>
        apiGet<AnaliseEstatisticaRegistro[]>(`/api/alunos/${alunoId}/analises-estatisticas`),
    salvar: (alunoId: string, payload: CriarAnaliseEstatisticaPayload) =>
        apiPost<AnaliseEstatisticaRegistro>(`/api/alunos/${alunoId}/analises-estatisticas`, payload),
};
