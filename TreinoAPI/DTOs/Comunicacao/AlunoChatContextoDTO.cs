namespace TreinoAPI.DTOs.Comunicacao;

public sealed class AlunoChatContextoDTO
{
    public Guid AlunoId { get; set; }
    public string NomeCompleto { get; set; } = string.Empty;
    public string StatusCadastro { get; set; } = string.Empty;
    public AnamneseChatDTO? UltimaAnamnese { get; set; }
    public List<AvaliacaoChatDTO> Avaliacoes { get; set; } = [];
    public List<HistoricoAvaliacaoChatDTO> HistoricoAvaliacoes { get; set; } = [];
    public List<FeedbackChatDTO> Feedbacks { get; set; } = [];
    public List<SolicitacaoAvaliacaoChatDTO> SolicitacoesAvaliacao { get; set; } = [];
    public List<ExecucaoChatDTO> ExecucoesRecentes { get; set; } = [];
    public List<AtividadeChatDTO> Atividades { get; set; } = [];
}

public sealed class AnamneseChatDTO
{
    public string? Tipo { get; set; }
    public string? Objetivo { get; set; }
    public string? Observacoes { get; set; }
    public DateTime CriadoEm { get; set; }
}

public sealed class AvaliacaoChatDTO
{
    public Guid Id { get; set; }
    public int Numero { get; set; }
    public DateTime RealizadaEm { get; set; }
    public double? Peso { get; set; }
    public double? Altura { get; set; }
    public double? PercentualGordura { get; set; }
    public string? Objetivo { get; set; }
    public string? CriadaPorNome { get; set; }
    public string? AtualizadaPorNome { get; set; }
    public DateTime? AtualizadaEm { get; set; }
}

public sealed class HistoricoAvaliacaoChatDTO
{
    public Guid Id { get; set; }
    public int NumeroAvaliacao { get; set; }
    public string Acao { get; set; } = string.Empty;
    public string Resumo { get; set; } = string.Empty;
    public string UsuarioNome { get; set; } = string.Empty;
    public string UsuarioTipo { get; set; } = string.Empty;
    public DateTime CriadoEm { get; set; }
}

public sealed class FeedbackChatDTO
{
    public string Categoria { get; set; } = string.Empty;
    public int Nota { get; set; }
    public string Comentario { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? RespostaEquipe { get; set; }
    public string? PersonalNome { get; set; }
    public DateTime CriadoEm { get; set; }
}

public sealed class SolicitacaoAvaliacaoChatDTO
{
    public string Origem { get; set; } = string.Empty;
    public DateOnly DataDesejada { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool Urgente { get; set; }
    public string? Motivo { get; set; }
    public string? AnalisadaPorNome { get; set; }
    public DateTime CriadaEm { get; set; }
}

public sealed class ExecucaoChatDTO
{
    public Guid Id { get; set; }
    public string TreinoNome { get; set; } = string.Empty;
    public DateOnly Data { get; set; }
    public DateTime? Inicio { get; set; }
    public DateTime? Fim { get; set; }
    public int? DuracaoSegundos { get; set; }
    public List<ExercicioExecucaoChatDTO> Exercicios { get; set; } = [];
}

public sealed class ExercicioExecucaoChatDTO
{
    public string Nome { get; set; } = string.Empty;
    public string StatusDor { get; set; } = string.Empty;
    public string? Feedback { get; set; }
    public int HardSets { get; set; }
    public double Tonelagem { get; set; }
}

public sealed class AtividadeChatDTO
{
    public string Acao { get; set; } = string.Empty;
    public string Resumo { get; set; } = string.Empty;
    public string UsuarioNome { get; set; } = string.Empty;
    public string Resultado { get; set; } = string.Empty;
    public DateTime CriadoEm { get; set; }
}
