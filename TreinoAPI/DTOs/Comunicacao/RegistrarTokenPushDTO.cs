using System.ComponentModel.DataAnnotations;

namespace TreinoAPI.DTOs.Comunicacao;

public sealed class RegistrarTokenPushDTO
{
    [Required, MaxLength(255)]
    public string Token { get; set; } = string.Empty;

    [Required, MaxLength(20)]
    public string Plataforma { get; set; } = string.Empty;
}
