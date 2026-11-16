import { apiGet } from "./api";

export interface RelatorioMensal {
    mes: string;
    alunosNovos: number;
    avaliacoesCriadas: number;
    treinosCriados: number;
    execucoes: number;
}

export interface RelatorioGeral {
    inicio: string;
    fim: string;
    totalAlunos: number;
    cadastrosEmAnalise: number;
    cadastrosAguardandoFormulario: number;
    alunosSemFichaTecnica: number;
    alunosComFichaTecnica: number;
    treinosAtivos: number;
    avaliacoesAtivas: number;
    alunosNovosNoPeriodo: number;
    execucoesNoPeriodo: number;
    evolucaoMensal: RelatorioMensal[];
}

export const relatoriosService = {
    obter: (inicio: string, fim: string) =>
        apiGet<RelatorioGeral>(`/api/relatorios?inicio=${encodeURIComponent(inicio)}&fim=${encodeURIComponent(fim)}`),
};
