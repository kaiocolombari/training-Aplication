using System.ComponentModel.DataAnnotations;

namespace TreinoAPI.DTOs.Auth;

public sealed class RegistrarAlunoDTO
{
    [Required, StringLength(160, MinimumLength = 2)]
    public string NomeCompleto { get; set; } = string.Empty;

    [Required, EmailAddress, StringLength(254)]
    public string Email { get; set; } = string.Empty;

    [StringLength(30)]
    public string? Telefone { get; set; }

    [Required, MinLength(8), StringLength(128)]
    public string Senha { get; set; } = string.Empty;

    [Required, StringLength(256)]
    public string TokenConvite { get; set; } = string.Empty;

    [Required, StringLength(2048)]
    public string CaptchaToken { get; set; } = string.Empty;

    [StringLength(200)]
    public string? Website { get; set; }
}
