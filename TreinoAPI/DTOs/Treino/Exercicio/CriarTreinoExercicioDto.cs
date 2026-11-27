using System.ComponentModel.DataAnnotations;

namespace TreinoAPI.DTOs.Exercicio;

public class CriarTreinoExercicioDTO
{
    [Required, StringLength(160, MinimumLength = 2)]
    public string Exercicio { get; set; } = string.Empty;
    public Guid? ExercicioCatalogoId { get; set; }
    [Range(0, 1000)]
    public int? Ordem { get; set; }
    [Range(1, 100)]
    public int? Series { get; set; }
    [Range(1, 1000)]
    public int? Repeticoes { get; set; }
    [Range(0, 3600)]
    public int? Intervalo { get; set; }
    [Range(0, 2000)]
    public double? Carga { get; set; }
    [Range(0, 5)]
    public int? RirMax { get; set; }
    public string? Observacoes { get; set; } 
    public List<TreinoExercicioVariacaoInputDTO> Variacoes { get; set; } = new();
}
