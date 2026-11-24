using System.ComponentModel.DataAnnotations;

namespace TreinoAPI.DTOs.Avaliacao;

public sealed class AgendaAvaliacaoDTO
{
    public Guid Id { get; set; }
    public Guid AlunoId { get; set; }
    public string AlunoNome { get; set; } = string.Empty;
    public string Origem { get; set; } = string.Empty;
    public DateOnly DataDesejada { get; set; }
    public DateOnly? DataAgendada { get; set; }
    public string? Motivo { get; set; }
    public string? DescricaoAgendamento { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool Urgente { get; set; }
    public DateTime? EnviadaEm { get; set; }
    public DateTime CriadaEm { get; set; }
    public DateTime? AnalisadaEm { get; set; }
    public string? AnalisadaPorNome { get; set; }
}

public sealed class SolicitarAvaliacaoDTO
{
    [Required]
    public DateOnly DataDesejada { get; set; }

    [StringLength(1000)]
    public string? Motivo { get; set; }

    public bool Urgente { get; set; }
}

public sealed class AgendarAvaliacaoDTO
{
    [Required]
    public DateOnly DataAgendada { get; set; }

    [StringLength(1000)]
    public string? Descricao { get; set; }

    public Guid? SolicitacaoId { get; set; }
}
