using System.ComponentModel.DataAnnotations;
using TreinoAPI.DTOs.Execucao;

namespace TreinoAPI.DTOs.CadastroCompleto;

public sealed class SalvarFichaDTO
{
    [Required]
    public AlunoFichaInputDTO Aluno { get; set; } = new();
    public List<AnamneseFichaInputDTO> Anamneses { get; set; } = [];
    public List<AvaliacaoFichaInputDTO> Avaliacoes { get; set; } = [];
    public List<TesteCargaFichaInputDTO> TestesCarga { get; set; } = [];
    public List<TreinoFichaInputDTO> Treinos { get; set; } = [];
    public PeriodizacaoFichaInputDTO? Periodizacao { get; set; }
    public List<VolumeFichaInputDTO> Volumes { get; set; } = [];
    public List<ExecucaoFichaInputDTO> Execucoes { get; set; } = [];
}

public sealed class AlunoFichaInputDTO
{
    [Required, StringLength(160, MinimumLength = 2)]
    public string NomeCompleto { get; set; } = string.Empty;
    [StringLength(30)]
    public string? Telefone { get; set; }
    public string? Genero { get; set; }
    public DateOnly? DataNascimento { get; set; }
    public string? Etnia { get; set; }
    [Range(0, 500)] public decimal? Massa { get; set; }
    [Range(0, 300)] public decimal? Estatura { get; set; }
    [Range(0, 100)] public decimal? Femur { get; set; }
    [Range(0, 100)] public decimal? Tibia { get; set; }
    [Range(0, 100)] public decimal? Una { get; set; }
    [Range(0, 100)] public decimal? Umero { get; set; }
    [Range(0, 300)] public int? FcRepouso { get; set; }
    [Range(0, 300)] public int? FcReserva { get; set; }
    [Range(0, 2000)] public decimal? Glicose { get; set; }
    [Range(0, 5000)] public decimal? Triglicerideos { get; set; }
    [Range(0, 1000)] public decimal? Ldl { get; set; }
    [Range(0, 1000)] public decimal? Hdl { get; set; }
    [Range(0, 300)] public int? Sistolica { get; set; }
    [Range(0, 300)] public int? Diastolica { get; set; }
}

public sealed class AnamneseFichaInputDTO
{
    [Required, StringLength(40)]
    public string Tipo { get; set; } = string.Empty;
    [StringLength(500)]
    public string? Objetivo { get; set; }
    [StringLength(4000)]
    public string? Observacoes { get; set; }
}

public sealed class AvaliacaoFichaInputDTO
{
    public Guid? Id { get; set; }
    [Range(1, int.MaxValue)]
    public int Numero { get; set; }
    [Range(0, 130)]
    public int? Idade { get; set; }
    [Range(0, 500)]
    public double? Peso { get; set; }
    [Range(0, 300)]
    public double? Altura { get; set; }
    [Range(0, 100)]
    public double? PercentualGordura { get; set; }
    public DateTime? RealizadaEm { get; set; }
    [StringLength(500)] public string? Objetivo { get; set; }
    [StringLength(4000)] public string? Observacoes { get; set; }
    public PerimetroFichaInputDTO? Perimetros { get; set; }
    public List<DobraFichaInputDTO> Dobras { get; set; } = [];
}

public sealed class PerimetroFichaInputDTO
{
    [Range(0, 300)] public double? Braco_D { get; set; }
    [Range(0, 300)] public double? Braco_E { get; set; }
    [Range(0, 300)] public double? Antebraco_D { get; set; }
    [Range(0, 300)] public double? Antebraco_E { get; set; }
    [Range(0, 300)] public double? Torax { get; set; }
    [Range(0, 300)] public double? Cintura { get; set; }
    [Range(0, 300)] public double? Abdomen { get; set; }
    [Range(0, 300)] public double? Quadril { get; set; }
    [Range(0, 300)] public double? Coxa_Sup_D { get; set; }
    [Range(0, 300)] public double? Coxa_Sup_E { get; set; }
    [Range(0, 300)] public double? Coxa_Med_D { get; set; }
    [Range(0, 300)] public double? Coxa_Med_E { get; set; }
    [Range(0, 300)] public double? Panturrilha_D { get; set; }
    [Range(0, 300)] public double? Panturrilha_E { get; set; }
}

public sealed class DobraFichaInputDTO
{
    [Range(1, 2)]
    public int Medida { get; set; }
    [Range(0, 100)] public double? Triceps { get; set; }
    [Range(0, 100)] public double? Subescapular { get; set; }
    [Range(0, 100)] public double? Biceps { get; set; }
    [Range(0, 100)] public double? Iliaca { get; set; }
    [Range(0, 100)] public double? Supraespinhal { get; set; }
    [Range(0, 100)] public double? Abdominal { get; set; }
    [Range(0, 100)] public double? CoxaMedia { get; set; }
    [Range(0, 100)] public double? Panturrilha { get; set; }
}

public sealed class TesteCargaFichaInputDTO
{
    [Range(1, int.MaxValue)]
    public int Numero { get; set; }
    public DateTime? RealizadaEm { get; set; }
    public List<CargaFichaInputDTO> Cargas { get; set; } = [];
}

public sealed class CargaFichaInputDTO
{
    [Required, StringLength(160, MinimumLength = 2)]
    public string Exercicio { get; set; } = string.Empty;
    [Range(0, 2000)] public double? Carga { get; set; }
    [Range(0, 1000)] public double? Repeticoes { get; set; }
}

public sealed class TreinoFichaInputDTO
{
    [Required]
    public Guid Id { get; set; }
    [Required, StringLength(100, MinimumLength = 2)]
    public string Nome { get; set; } = string.Empty;
    public List<ExercicioFichaInputDTO> Exercicios { get; set; } = [];
}

public sealed class ExercicioFichaInputDTO
{
    [Required]
    public Guid Id { get; set; }
    [Required, StringLength(160, MinimumLength = 2)]
    public string Exercicio { get; set; } = string.Empty;
    [Range(0, 1000)] public int? Ordem { get; set; }
    [Range(1, 100)] public int? Series { get; set; }
    [Range(1, 1000)] public int? Repeticoes { get; set; }
    [Range(0, 3600)] public int? Intervalo { get; set; }
    [Range(0, 2000)] public double? Carga { get; set; }
    [Range(0, 5)] public int? RirMax { get; set; }
    [StringLength(2000)] public string? Observacoes { get; set; }
    public List<VariacaoFichaInputDTO> Variacoes { get; set; } = [];
}

public sealed class VariacaoFichaInputDTO
{
    [Required]
    public Guid Id { get; set; }
    [Required, StringLength(160, MinimumLength = 2)]
    public string Exercicio { get; set; } = string.Empty;
    [Range(0, 1000)] public int? Ordem { get; set; }
    [Range(1, 100)] public int? Series { get; set; }
    [Range(1, 1000)] public int? Repeticoes { get; set; }
    [Range(0, 3600)] public int? Intervalo { get; set; }
    [Range(0, 2000)] public double? Carga { get; set; }
    [Range(0, 5)] public int? RirMax { get; set; }
    [StringLength(2000)] public string? Observacoes { get; set; }
}

public sealed class PeriodizacaoFichaInputDTO
{
    [StringLength(100)]
    public string? Nome { get; set; }
    public DateTime DataInicio { get; set; }
    public List<SemanaFichaInputDTO> Semanas { get; set; } = [];
}

public sealed class SemanaFichaInputDTO
{
    [Range(1, 100)]
    public int Numero { get; set; }
    public List<DiaFichaInputDTO> Dias { get; set; } = [];
}

public sealed class DiaFichaInputDTO
{
    public DateOnly Data { get; set; }
    public List<Guid> TreinoIds { get; set; } = [];
}

public sealed class VolumeFichaInputDTO
{
    [Range(1, 100)]
    public int Semana { get; set; }
    public List<GrupoVolumeFichaInputDTO> Grupos { get; set; } = [];
}

public sealed class GrupoVolumeFichaInputDTO
{
    [Required]
    public Guid GrupoMuscularId { get; set; }
    [Range(0, 1000)] public int SeriesDiretas { get; set; }
    [Range(0, 1000)] public int SeriesLivres { get; set; }
}

public sealed class ExecucaoFichaInputDTO
{
    [Required]
    public Guid TreinoId { get; set; }
    public DateOnly Data { get; set; }
    public List<ExecucaoExercicioInputDTO> Exercicios { get; set; } = [];
}
