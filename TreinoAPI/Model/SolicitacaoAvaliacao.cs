namespace TreinoAPI.Model;

public sealed class SolicitacaoAvaliacao
{
    public Guid Id { get; set; }
    public Guid AlunoId { get; set; }
    public Guid SolicitanteUsuarioId { get; set; }
    public string Origem { get; set; } = "ALUNO";
    public DateOnly DataDesejada { get; set; }
    public DateOnly? DataAgendada { get; set; }
    public string? Motivo { get; set; }
    public string? DescricaoAgendamento { get; set; }
    public string Status { get; set; } = "PENDENTE";
    public bool Urgente { get; set; }
    public DateTime? EnviadaEm { get; set; }
    public DateTime CriadaEm { get; set; }
    public DateTime? AnalisadaEm { get; set; }
    public Guid? AnalisadaPorUsuarioId { get; set; }

    public Aluno Aluno { get; set; } = null!;
    public Usuario Solicitante { get; set; } = null!;
    public Usuario? AnalisadaPor { get; set; }
}
