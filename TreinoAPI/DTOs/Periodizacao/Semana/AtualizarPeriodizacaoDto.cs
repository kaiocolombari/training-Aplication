using System.ComponentModel.DataAnnotations;

namespace TreinoAPI.DTOs.Periodizacao;

public class AtualizarPeriodizacaoSemanaDTO
{
    [Range(1, 100)]
    public int Numero { get; set; }
}
