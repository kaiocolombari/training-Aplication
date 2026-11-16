namespace TreinoAPI.Model;

public sealed class ExecucaoTreino
{
    public Guid Id { get; set; }
    public Guid TreinoId { get; set; }
    public DateOnly Data { get; set; }
    public DateTime CriadoEm { get; set; }
    public DateTime AtualizadoEm { get; set; }
    public Treino Treino { get; set; } = null!;
    public ICollection<ExecucaoExercicio> Exercicios { get; set; } = new List<ExecucaoExercicio>();
}
