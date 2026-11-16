using System.ComponentModel.DataAnnotations;

namespace TreinoAPI.DTOs.Periodizacao;

public class AtualizarPeriodizacaoDiaDTO
{
    [Range(0, 6)]
    public int DiaSemana { get; set; }
}
