using System.ComponentModel.DataAnnotations;

namespace TreinoAPI.DTOs.Periodizacao;

public class CriarPeriodizacaoDiaDTO
{
    [Required]
    public DateTime Data { get; set; }
    [Range(0, 6)]
    public int DiaSemana { get; set; }
}
