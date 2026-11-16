using System.ComponentModel.DataAnnotations;

namespace TreinoAPI.DTOs.Anamnese;

public class CriarAnamneseDTO
{
    [Required, StringLength(40)]
    public string Tipo { get; set; } = string.Empty;
    [StringLength(500)]
    public string Objetivo { get; set; } = string.Empty;
    [StringLength(4000)]
    public string Observacoes { get; set; } = string.Empty;
}
