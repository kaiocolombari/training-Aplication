using System.ComponentModel.DataAnnotations;

namespace TreinoAPI.DTOs.Personal
{
    public class CriarPersonalDTO
    {
        [Required, StringLength(160, MinimumLength = 2)]
        public string NomeCompleto { get; set; } = string.Empty;
        [Required, EmailAddress, StringLength(254)]
        public string Email { get; set; } = string.Empty;
        [Required, MinLength(12), StringLength(128)]
        public string Senha { get; set; } = string.Empty;
        [Phone, StringLength(30)]
        public string? Telefone { get; set; }
    }
}
