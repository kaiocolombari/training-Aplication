namespace TreinoAPI.DTOs.Comunicacao;

public sealed class ConversaEquipeDTO
{
    public Guid Id { get; set; }
    public Guid OutroUsuarioId { get; set; }
    public string OutroUsuarioNome { get; set; } = string.Empty;
    public string OutroUsuarioTipo { get; set; } = string.Empty;
    public string? UltimaMensagem { get; set; }
    public DateTime? UltimaMensagemEm { get; set; }
    public int NaoLidas { get; set; }
}
