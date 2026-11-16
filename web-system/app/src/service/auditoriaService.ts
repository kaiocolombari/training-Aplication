import { apiGet } from "./api";

export interface RegistroAuditoria {
    id: string;
    usuarioId?: string | null;
    usuarioEmail: string;
    usuarioTipo: string;
    acao: string;
    metodoHttp: string;
    rota: string;
    recursoId?: string | null;
    resumo: string;
    statusCode: number;
    resultado: string;
    enderecoIp?: string | null;
    userAgent?: string | null;
    criadoEm: string;
}

export interface ResultadoAuditoria {
    registros: RegistroAuditoria[];
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
}

export interface FiltroAuditoria {
    busca?: string;
    usuarioTipo?: string;
    inicio?: string;
    fim?: string;
    pagina?: number;
    limite?: number;
}

export const auditoriaService = {
    listar: (filtros: FiltroAuditoria) => {
        const params = new URLSearchParams();
        Object.entries(filtros).forEach(([chave, valor]) => {
            if (valor !== undefined && valor !== "") params.set(chave, String(valor));
        });
        return apiGet<ResultadoAuditoria>(`/api/auditoria?${params.toString()}`);
    },
};
