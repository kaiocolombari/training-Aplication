namespace TreinoAPI.Model;

public sealed class NotificacaoUsuario
{
    public Guid Id { get; set; }
    public Guid UsuarioId { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string Mensagem { get; set; } = string.Empty;
    public string Tipo { get; set; } = "SISTEMA";
    public Guid? ReferenciaId { get; set; }
    public DateTime CriadaEm { get; set; }
    public DateTime? LidaEm { get; set; }
    public Usuario Usuario { get; set; } = null!;
}
