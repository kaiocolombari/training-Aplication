namespace TreinoAPI.DTOs.Comunicacao;

public sealed class NotificacaoDTO
{
    public Guid Id { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string Mensagem { get; set; } = string.Empty;
    public string Tipo { get; set; } = string.Empty;
    public Guid? ReferenciaId { get; set; }
    public DateTime CriadaEm { get; set; }
    public DateTime? LidaEm { get; set; }
}
