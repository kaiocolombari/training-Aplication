namespace TreinoAPI.DTOs.Comunicacao;

public sealed class ConversaAlunoDTO
{
    public Guid AlunoId { get; set; }
    public Guid OutroUsuarioId { get; set; }
    public string OutroUsuarioNome { get; set; } = string.Empty;
    public string OutroUsuarioTipo { get; set; } = string.Empty;
    public Guid? ConversaId { get; set; }
    public string? UltimaMensagem { get; set; }
    public DateTime? UltimaMensagemEm { get; set; }
    public int NaoLidas { get; set; }
}

public sealed class ResumoChatAlunoDTO
{
    public Guid AlunoId { get; set; }
    public int NaoLidas { get; set; }
}
