using System.ComponentModel.DataAnnotations;

namespace TreinoAPI.DTOs.Execucao;

public sealed class AtualizarExecucaoTreinoDTO
{
    public DateOnly? Data { get; set; }

    [Required, MinLength(1)]
    public List<ExecucaoExercicioInputDTO> Exercicios { get; set; } = [];
}

public sealed class ExecucaoExercicioInputDTO
{
    [Required]
    public Guid TreinoExercicioId { get; set; }

    [Required]
    public List<ExecucaoSerieInputDTO> Series { get; set; } = [];
}

public sealed class ExecucaoSerieInputDTO
{
    [Range(1, 100)]
    public int Numero { get; set; }

    [Range(0, 2000)]
    public double Carga { get; set; }

    [Range(0, 1000)]
    public double Repeticoes { get; set; }

    [Range(0, 5)]
    public double? Rir { get; set; }

    [Range(0, 3600)]
    public int? Descanso { get; set; }

    [Range(0, 10)]
    public double? Velocidade { get; set; }

    [Range(0, 10)]
    public double? Rpe { get; set; }

    public bool ClusterAtivo { get; set; }
    public List<int> ClusterBlocos { get; set; } = [];
    public bool DropSet { get; set; }
    public bool RestPause { get; set; }
    public bool Falha { get; set; }
}
