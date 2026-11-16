using System.ComponentModel.DataAnnotations;

namespace TreinoAPI.DTOs.Personal;

public class AtualizarPersonalDTO
{
    [StringLength(160, MinimumLength = 2)]
    public string? Nome { get; set; }
    [EmailAddress, StringLength(254)]
    public string? Email { get; set; }
    [Phone, StringLength(30)]
    public string? Telefone { get; set; }
}
