using System.ComponentModel.DataAnnotations;

namespace TreinoAPI.DTOs;

public sealed class MotivoOperacaoDTO
{
    [Required]
    [MaxLength(40)]
    public string Motivo { get; set; } = "ENCERRAMENTO_ADMINISTRATIVO";

    [MaxLength(500)]
    public string? Detalhe { get; set; }
}
