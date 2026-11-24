import { apiGet, apiPost } from "./api";

export type AssessmentScheduleItem = {
  id: string;
  alunoId: string;
  alunoNome: string;
  origem: "ALUNO" | "PERSONAL" | string;
  dataDesejada: string;
  dataAgendada?: string | null;
  motivo?: string | null;
  descricaoAgendamento?: string | null;
  status: "PENDENTE" | "AGENDADA" | "RECUSADA" | "CANCELADA" | string;
  urgente: boolean;
  enviadaEm?: string | null;
  criadaEm: string;
  analisadaEm?: string | null;
  analisadaPorNome?: string | null;
};

export const assessmentScheduleService = {
  listMine: () => apiGet<AssessmentScheduleItem[]>("/api/avaliacoes/agenda"),
  request: (dataDesejada: string, motivo: string, urgente: boolean) =>
    apiPost<AssessmentScheduleItem>("/api/avaliacoes/solicitacoes", {
      dataDesejada,
      motivo: motivo.trim() || null,
      urgente,
    }),
};
