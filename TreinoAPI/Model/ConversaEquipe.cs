namespace TreinoAPI.Model;

public sealed class ConversaEquipe
{
    public Guid Id { get; set; }
    public Guid UsuarioAId { get; set; }
    public Guid UsuarioBId { get; set; }
    public DateTime CriadaEm { get; set; }
    public bool EhTemporaria { get; set; }
    public DateTime? UltimaAtividadeEm { get; set; }
    public DateTime? ExpiraEm { get; set; }
    public Usuario UsuarioA { get; set; } = null!;
    public Usuario UsuarioB { get; set; } = null!;
    public ICollection<MensagemEquipe> Mensagens { get; set; } = new List<MensagemEquipe>();
}
