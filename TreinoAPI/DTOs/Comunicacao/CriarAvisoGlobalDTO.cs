using System.ComponentModel.DataAnnotations;

namespace TreinoAPI.DTOs.Comunicacao;

public sealed class CriarAvisoGlobalDTO
{
    [Required, StringLength(120, MinimumLength = 3)]
    public string Titulo { get; set; } = string.Empty;

    [Required, StringLength(4000, MinimumLength = 3)]
    public string Conteudo { get; set; } = string.Empty;
}
