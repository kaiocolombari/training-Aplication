namespace TreinoAPI.Model;

public sealed class ExecucaoSerie
{
    public Guid Id { get; set; }
    public Guid ExecucaoExercicioId { get; set; }
    public int Numero { get; set; }
    public double Carga { get; set; }
    public double Repeticoes { get; set; }
    public double? Rir { get; set; }
    public int? Descanso { get; set; }
    public double? Velocidade { get; set; }
    public double? Rpe { get; set; }
    public bool ClusterAtivo { get; set; }
    public string? ClusterBlocosJson { get; set; }
    public bool DropSet { get; set; }
    public bool RestPause { get; set; }
    public bool Falha { get; set; }
    public ExecucaoExercicio ExecucaoExercicio { get; set; } = null!;
}
