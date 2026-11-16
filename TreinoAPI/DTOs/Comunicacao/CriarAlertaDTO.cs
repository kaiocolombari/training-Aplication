using System.ComponentModel.DataAnnotations;

namespace TreinoAPI.DTOs.Comunicacao;

public sealed class CriarAlertaDTO
{
    [Required, StringLength(120, MinimumLength = 3)]
    public string Titulo { get; set; } = string.Empty;

    [Required, StringLength(1000, MinimumLength = 3)]
    public string Mensagem { get; set; } = string.Empty;

    public Guid? UsuarioDestinoId { get; set; }
}
