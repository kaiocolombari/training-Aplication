using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace TreinoAPI.DTOs.CadastroAluno;

public sealed class EnviarRespostasCadastroDTO
{
    [Required]
    public Dictionary<string, JsonElement> Respostas { get; set; } = new();
}
