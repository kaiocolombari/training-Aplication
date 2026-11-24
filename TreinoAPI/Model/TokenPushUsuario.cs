namespace TreinoAPI.Model;

public sealed class TokenPushUsuario
{
    public Guid Id { get; set; }
    public Guid UsuarioId { get; set; }
    public string Token { get; set; } = string.Empty;
    public string Plataforma { get; set; } = string.Empty;
    public DateTime AtualizadoEm { get; set; }
    public Usuario Usuario { get; set; } = null!;
}
