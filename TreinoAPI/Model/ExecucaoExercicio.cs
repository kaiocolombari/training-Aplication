namespace TreinoAPI.Model;

public sealed class ExecucaoExercicio
{
    public Guid Id { get; set; }
    public Guid ExecucaoTreinoId { get; set; }
    public Guid? TreinoExercicioId { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string? Musculo { get; set; }
    public int Ordem { get; set; }
    public Guid? VariacaoId { get; set; }
    public string StatusDor { get; set; } = "none";
    public string? Feedback { get; set; }
    public int HardSets { get; set; }
    public double Intensidade { get; set; }
    public double Tonelagem { get; set; }
    public double Estimulo { get; set; }
    public ExecucaoTreino ExecucaoTreino { get; set; } = null!;
    public TreinoExercicio? TreinoExercicio { get; set; }
    public ICollection<ExecucaoSerie> Series { get; set; } = new List<ExecucaoSerie>();
}
