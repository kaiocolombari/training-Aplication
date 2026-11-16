using System.ComponentModel.DataAnnotations;

namespace TreinoAPI.DTOs.TreinoDia;

public class AtualizarTreinoDiaDTO
{
    [Required]
    public Guid TreinoId { get; set; }
    [Range(0, 100)]
    public int Ordem { get; set; }
}
