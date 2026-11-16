using System.ComponentModel.DataAnnotations;

namespace TreinoAPI.DTOs.Comunicacao;

public sealed class EnviarMensagemEquipeDTO
{
    [Required]
    public string Conteudo { get; set; } = string.Empty;
}
