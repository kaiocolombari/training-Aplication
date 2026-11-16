namespace TreinoAPI.DTOs.Email;

public sealed class EmailStatusDTO
{
    public bool Configurado { get; set; }
    public string Marca { get; set; } = string.Empty;
    public string RemetenteNome { get; set; } = string.Empty;
    public string RemetenteEmail { get; set; } = string.Empty;
    public string CorPrincipal { get; set; } = "#5558D9";
    public string Mensagem { get; set; } = string.Empty;
}
