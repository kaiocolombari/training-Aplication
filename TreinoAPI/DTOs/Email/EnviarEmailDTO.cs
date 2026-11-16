namespace TreinoAPI.DTOs.Email;

public sealed class EnviarEmailDTO
{
    public Guid[] DestinatariosIds { get; set; } = [];
    public string Assunto { get; set; } = string.Empty;
    public string Mensagem { get; set; } = string.Empty;
}
