namespace TreinoAPI.Model;

public sealed class ConvitePersonal
{
    public Guid Id { get; set; }
    public Guid PersonalId { get; set; }
    public Guid CriadoPorUsuarioId { get; set; }
    public string TokenHash { get; set; } = string.Empty;
    public string? Apelido { get; set; }
    public DateTime CriadoEm { get; set; }
    public DateTime ExpiraEm { get; set; }
    public DateTime? RevogadoEm { get; set; }
    public int Utilizacoes { get; set; }
    public Personal Personal { get; set; } = null!;
    public Usuario CriadoPorUsuario { get; set; } = null!;
}
