namespace TreinoAPI.Model;

public sealed class MensagemEquipe
{
    public Guid Id { get; set; }
    public Guid ConversaId { get; set; }
    public Guid RemetenteId { get; set; }
    public string Conteudo { get; set; } = string.Empty;
    public DateTime EnviadaEm { get; set; }
    public DateTime? LidaEm { get; set; }
    public ConversaEquipe Conversa { get; set; } = null!;
    public Usuario Remetente { get; set; } = null!;
}
