import { api, apiDownload, apiGet, apiPost, apiPatch } from "./api";

export interface MembroEquipe {
    usuarioId: string;
    nome: string;
    email: string;
    tipo: "ADMIN" | "PERSONAL";
}

export interface ConversaEquipe {
    id: string;
    outroUsuarioId: string;
    outroUsuarioNome: string;
    outroUsuarioTipo: "ADMIN" | "PERSONAL";
    ultimaMensagem: string | null;
    ultimaMensagemEm: string | null;
    naoLidas: number;
    expiraEm?: string | null;
    ehTemporaria?: boolean;
}

export interface ConversaAluno {
    alunoId: string | null;
    outroUsuarioId: string;
    outroUsuarioNome: string;
    outroUsuarioTipo: "PERSONAL" | "ALUNO";
    conversaId: string | null;
    ultimaMensagem: string | null;
    ultimaMensagemEm: string | null;
    naoLidas: number;
    expiraEm?: string | null;
    ehTemporaria?: boolean;
}

export interface ResumoChatAluno {
    alunoId: string;
    naoLidas: number;
}

export interface MensagemEquipe {
    id: string;
    remetenteId: string;
    remetenteNome: string;
    remetenteTipo: "ADMIN" | "PERSONAL" | "ALUNO";
    conteudo: string;
    enviadaEm: string;
    lidaEm: string | null;
    entregueEm?: string | null;
    anexos?: Array<{ id: string; nomeOriginal: string; tipoConteudo: string; tamanhoBytes: number }>;
}

export interface ContextoChatAluno {
    alunoId: string;
    nomeCompleto: string;
    statusCadastro: string;
    solicitacaoCadastro: {
        enviadaEm: string;
        statusAnalise: string;
        observacaoAnalise?: string | null;
        avaliadorNome?: string | null;
        analisadaEm?: string | null;
        respostasJson: string;
    } | null;
    ultimaAnamnese: { tipo?: string | null; objetivo?: string | null; observacoes?: string | null; criadoEm: string } | null;
    avaliacoes: Array<{ id: string; numero: number; idade?: number | null; realizadaEm: string; peso?: number | null; altura?: number | null; percentualGordura?: number | null; objetivo?: string | null; observacoes?: string | null; criadaPorNome?: string | null; atualizadaPorNome?: string | null; atualizadaEm?: string | null; perimetros: Array<{ nome: string; valor: number | null }>; dobrasCutaneas: Array<{ nome: string; valor: number | null }> }>;
    historicoAvaliacoes: Array<{ id: string; numeroAvaliacao: number; acao: string; resumo: string; usuarioNome: string; usuarioTipo: string; criadoEm: string; dadosJson?: string | null }>;
    feedbacks: Array<{ categoria: string; nota: number; comentario: string; status: string; respostaEquipe?: string | null; personalNome?: string | null; criadoEm: string }>;
    solicitacoesAvaliacao: Array<{ origem: string; dataDesejada: string; status: string; urgente: boolean; motivo?: string | null; analisadaPorNome?: string | null; criadaEm: string }>;
    execucoesRecentes: Array<{ id: string; treinoNome: string; data: string; inicio?: string | null; fim?: string | null; duracaoSegundos?: number | null; exercicios: Array<{ nome: string; statusDor: string; feedback?: string | null; hardSets: number; tonelagem: number }> }>;
    treinosAtuais: Array<{ id: string; nome: string; criadoEm: string; exercicios: Array<{ nome: string; series?: number | null; repeticoes?: number | null; carga?: number | null; descansoSegundos?: number | null; rir?: number | null; observacoes?: string | null }> }>;
    periodizacoes: Array<{ id: string; nome: string; dataInicio: string; totalSemanas: number }>;
    tarefas: Array<{ id: string; titulo: string; descricao: string; categoria: string; prioridade: string; status: string; dataLimite?: string | null; criadaEm: string; atualizadaEm: string; concluidaEm?: string | null; criadoPorNome: string }>;
    atividades: Array<{ acao: string; resumo: string; usuarioNome: string; usuarioTipo: string; resultado: string; metodoHttp: string; rota: string; statusCode: number; criadoEm: string }>;
}

export interface AvisoGlobal {
    id: string;
    autorId: string;
    autorNome: string;
    titulo: string;
    conteudo: string;
    publicadoEm: string;
}

export interface Notificacao {
    id: string;
    titulo: string;
    mensagem: string;
    tipo:
        | "CHAT"
        | "MURAL"
        | "ALERTA"
        | "SISTEMA"
        | "ARQUIVO_EQUIPE"
        | "TAREFA_PERSONAL"
        | "ALERTA_ACOMPANHAMENTO"
        | "VINCULO_REMOVIDO";
    referenciaId: string | null;
    criadaEm: string;
    lidaEm: string | null;
}

export const comunicacaoService = {
    listarEquipe: () => apiGet<MembroEquipe[]>("/api/comunicacao/equipe"),
    listarConversas: () => apiGet<ConversaEquipe[]>("/api/comunicacao/conversas"),
    listarConversasAlunos: () => apiGet<ConversaAluno[]>("/api/comunicacao/conversas/alunos"),
    listarResumoChatsAlunos: () => apiGet<ResumoChatAluno[]>("/api/comunicacao/conversas/alunos/resumo"),
    listarConversasPersonaisAluno: () => apiGet<ConversaAluno[]>("/api/comunicacao/conversas/personais"),
    listarMensagens: (conversaId: string) =>
        apiGet<MensagemEquipe[]>(`/api/comunicacao/conversas/${conversaId}/mensagens`),
    enviarMensagem: (destinatarioId: string, conteudo: string) =>
        apiPost<{ conversaId: string }>(`/api/comunicacao/mensagens/para/${destinatarioId}`, { conteudo }),
    obterOuCriarConversa: (destinatarioId: string) =>
        apiPost<{ conversaId: string }>(`/api/comunicacao/conversas/para/${destinatarioId}`),
    enviarAnexo: (conversaId: string, arquivo: File, legenda = "") => {
        const form = new FormData();
        form.append("arquivo", arquivo);
        form.append("legenda", legenda);
        return api<{ mensagemId: string }>(`/api/comunicacao/conversas/${conversaId}/anexos`, { method: "POST", body: form });
    },
    baixarAnexo: (id: string, nome: string) => apiDownload(`/api/comunicacao/anexos/${id}`, nome),
    obterContextoChatAluno: (alunoId: string) =>
        apiGet<ContextoChatAluno>(`/api/comunicacao/alunos/${alunoId}/contexto-chat`),
    listarAvisos: () => apiGet<AvisoGlobal[]>("/api/comunicacao/avisos"),
    publicarAviso: (titulo: string, conteudo: string) =>
        apiPost<void>("/api/comunicacao/avisos", { titulo, conteudo }),
    listarNotificacoes: () => apiGet<Notificacao[]>("/api/comunicacao/notificacoes"),
    marcarNotificacaoLida: (id: string) =>
        apiPatch<void>(`/api/comunicacao/notificacoes/${id}/lida`),
    marcarTodasLidas: () => apiPost<void>("/api/comunicacao/notificacoes/lidas"),
    marcarAvisosLidos: () => apiPost<void>("/api/comunicacao/notificacoes/mural-lidas"),
    criarAlerta: (titulo: string, mensagem: string, usuarioDestinoId?: string) =>
        apiPost<void>("/api/comunicacao/alertas", { titulo, mensagem, usuarioDestinoId }),
};
