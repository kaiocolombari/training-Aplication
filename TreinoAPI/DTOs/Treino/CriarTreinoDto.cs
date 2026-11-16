using System.ComponentModel.DataAnnotations;

namespace TreinoAPI.DTOs.Treino;

public class CriarTreinoDTO
{
    [Required, StringLength(100, MinimumLength = 2)]
    public string Nome { get; set; } = string.Empty;
}
