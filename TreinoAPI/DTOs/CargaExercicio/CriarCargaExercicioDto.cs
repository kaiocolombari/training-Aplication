using System.ComponentModel.DataAnnotations;

namespace TreinoAPI.DTOs.CargaExercicio;

public class CriarCargaExercicioDTO
{
    [Required, StringLength(160, MinimumLength = 2)]
    public string Exercicio { get; set; } = string.Empty;
    [Range(0, 1000)]
    public double? Repeticoes { get; set; }
    [Range(0, 2000)]
    public double? Carga { get; set; }
}
