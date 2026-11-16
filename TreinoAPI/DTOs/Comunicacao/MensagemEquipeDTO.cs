namespace TreinoAPI.DTOs.Comunicacao;

public sealed class MensagemEquipeDTO
{
    public Guid Id { get; set; }
    public Guid RemetenteId { get; set; }
    public string RemetenteNome { get; set; } = string.Empty;
    public string RemetenteTipo { get; set; } = string.Empty;
    public string Conteudo { get; set; } = string.Empty;
    public DateTime EnviadaEm { get; set; }
    public DateTime? LidaEm { get; set; }
}
