using System.ComponentModel.DataAnnotations;

namespace TreinoAPI.DTOs.Auth;

public class LoginDTO
{
    [Required, EmailAddress, StringLength(254)]
    public string Email { get; set; } = string.Empty;
    [Required, StringLength(128)]
    public string Senha { get; set; } = string.Empty;
}
