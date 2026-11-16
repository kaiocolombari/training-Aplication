namespace TreinoAPI.DTOs.Execucao;

public sealed class ExecucaoTreinoDTO
{
    public Guid Id { get; set; }
    public Guid TreinoId { get; set; }
    public DateOnly Data { get; set; }
    public List<ExecucaoExercicioDTO> Exercicios { get; set; } = [];
}

public sealed class ExecucaoExercicioDTO
{
    public Guid Id { get; set; }
    public Guid? TreinoExercicioId { get; set; }
    public string Nome { get; set; } = string.Empty;
    public int HardSets { get; set; }
    public double Intensidade { get; set; }
    public double Tonelagem { get; set; }
    public double Estimulo { get; set; }
    public List<ExecucaoSerieDTO> Series { get; set; } = [];
}

public sealed class ExecucaoSerieDTO
{
    public Guid Id { get; set; }
    public int Numero { get; set; }
    public double Carga { get; set; }
    public double Repeticoes { get; set; }
    public double? Rir { get; set; }
    public int? Descanso { get; set; }
    public double? Velocidade { get; set; }
    public double? Rpe { get; set; }
    public bool ClusterAtivo { get; set; }
    public List<int> ClusterBlocos { get; set; } = [];
    public bool DropSet { get; set; }
    public bool RestPause { get; set; }
    public bool Falha { get; set; }
}
