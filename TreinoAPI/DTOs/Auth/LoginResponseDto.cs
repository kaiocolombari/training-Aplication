namespace TreinoAPI.DTOs.Auth;

public class LoginRespostaDTO
{
    public string Token { get; set; } = string.Empty;
    public Guid UsuarioId { get; set; }
    public string Tipo { get; set; } = string.Empty;
}