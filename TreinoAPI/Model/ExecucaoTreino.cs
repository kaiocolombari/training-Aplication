namespace TreinoAPI.Model;

public sealed class ExecucaoTreino
{
    public Guid Id { get; set; }
    public string? SessionId { get; set; }
    public Guid TreinoId { get; set; }
    public DateOnly Data { get; set; }
    public DateTime? Inicio { get; set; }
    public DateTime? Fim { get; set; }
    public int? DuracaoSegundos { get; set; }
    public int? DuracaoEsperadaMinutos { get; set; }
    public string TipoTreino { get; set; } = "strength";
    public int? DuracaoPlanejadaCardioSegundos { get; set; }
    public int? DuracaoRealCardioSegundos { get; set; }
    public DateTime CriadoEm { get; set; }
    public DateTime AtualizadoEm { get; set; }
    public Treino Treino { get; set; } = null!;
    public ICollection<ExecucaoExercicio> Exercicios { get; set; } = new List<ExecucaoExercicio>();
}
