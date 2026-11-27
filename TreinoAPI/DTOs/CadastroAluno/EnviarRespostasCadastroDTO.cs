using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace TreinoAPI.DTOs.CadastroAluno;

public sealed class EnviarRespostasCadastroDTO
{
    [Required]
    public Dictionary<string, JsonElement> Respostas { get; set; } = new();

    [Required, StringLength(2048)]
    public string CaptchaToken { get; set; } = string.Empty;

    [StringLength(200)]
    public string? Website { get; set; }
}
