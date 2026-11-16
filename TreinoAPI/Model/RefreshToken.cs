namespace TreinoAPI.Model;

public sealed class RefreshToken
{
    public Guid Id { get; set; }
    public Guid UsuarioId { get; set; }
    public string TokenHash { get; set; } = string.Empty;
    public DateTime CriadoEm { get; set; }
    public DateTime ExpiraEm { get; set; }
    public DateTime? RevogadoEm { get; set; }
    public string? SubstituidoPorHash { get; set; }
    public Usuario Usuario { get; set; } = null!;
}
