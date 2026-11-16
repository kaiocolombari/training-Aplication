using System.ComponentModel.DataAnnotations;

namespace TreinoAPI.DTOs.Periodizacao;

public class AtualizarPeriodizacaoDTO
{
    [StringLength(100)]
    public string? Nome { get; set; }
    [Required]
    public DateTime DataInicio { get; set; }
}
