using System.ComponentModel.DataAnnotations;

namespace TreinoAPI.DTOs.CadastroAluno;

public sealed class ReprovarCadastroDTO
{
    [Required, StringLength(1000, MinimumLength = 3)]
    public string Observacao { get; set; } = string.Empty;
}
