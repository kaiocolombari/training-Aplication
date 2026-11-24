using System.ComponentModel.DataAnnotations;

namespace TreinoAPI.DTOs.Execucao;

public sealed class AtualizarExecucaoTreinoDTO
{
    [StringLength(100)]
    public string? SessionId { get; set; }
    public DateOnly? Data { get; set; }
    public DateTime? Inicio { get; set; }
    public DateTime? Fim { get; set; }

    [Range(0, 86400)]
    public int? DuracaoSegundos { get; set; }

    [Range(0, 1440)]
    public int? DuracaoEsperadaMinutos { get; set; }

    [StringLength(20)]
    public string? TipoTreino { get; set; }

    [Range(0, 86400)]
    public int? DuracaoPlanejadaCardioSegundos { get; set; }

    [Range(0, 86400)]
    public int? DuracaoRealCardioSegundos { get; set; }

    [Required, MinLength(1)]
    public List<ExecucaoExercicioInputDTO> Exercicios { get; set; } = [];
}

public sealed class ExecucaoExercicioInputDTO
{
    [Required]
    public Guid TreinoExercicioId { get; set; }

    [StringLength(140)]
    public string? Nome { get; set; }

    [StringLength(100)]
    public string? Musculo { get; set; }

    [Range(0, 100)]
    public int Ordem { get; set; }

    public Guid? VariacaoId { get; set; }

    [StringLength(20)]
    public string? StatusDor { get; set; }

    [StringLength(2000)]
    public string? Feedback { get; set; }

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

    [Range(0, 3600)]
    public int? DescansoPrescrito { get; set; }

    public bool Concluida { get; set; }
    public bool UsouPrescricao { get; set; }

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
