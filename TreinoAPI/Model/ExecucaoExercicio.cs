namespace TreinoAPI.Model;

public sealed class ExecucaoExercicio
{
    public Guid Id { get; set; }
    public Guid ExecucaoTreinoId { get; set; }
    public Guid? TreinoExercicioId { get; set; }
    public string Nome { get; set; } = string.Empty;
    public int HardSets { get; set; }
    public double Intensidade { get; set; }
    public double Tonelagem { get; set; }
    public double Estimulo { get; set; }
    public ExecucaoTreino ExecucaoTreino { get; set; } = null!;
    public TreinoExercicio? TreinoExercicio { get; set; }
    public ICollection<ExecucaoSerie> Series { get; set; } = new List<ExecucaoSerie>();
}
