namespace TreinoAPI.DTOs.Execucao;

public sealed class ExecucaoTreinoDTO
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
    public bool Concluida => Fim.HasValue;
    public List<ExecucaoExercicioDTO> Exercicios { get; set; } = [];
}

public sealed class ExecucaoExercicioDTO
{
    public Guid Id { get; set; }
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
    public int? DescansoPrescrito { get; set; }
    public bool Concluida { get; set; }
    public bool UsouPrescricao { get; set; }
    public double? Velocidade { get; set; }
    public double? Rpe { get; set; }
    public bool ClusterAtivo { get; set; }
    public List<int> ClusterBlocos { get; set; } = [];
    public bool DropSet { get; set; }
    public bool RestPause { get; set; }
    public bool Falha { get; set; }
}
