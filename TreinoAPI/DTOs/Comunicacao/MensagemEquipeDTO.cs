namespace TreinoAPI.DTOs.Comunicacao;

public sealed class MensagemEquipeDTO
{
    public Guid Id { get; set; }
    public Guid RemetenteId { get; set; }
    public string RemetenteNome { get; set; } = string.Empty;
    public string RemetenteTipo { get; set; } = string.Empty;
    public string Conteudo { get; set; } = string.Empty;
    public DateTime EnviadaEm { get; set; }
    public DateTime? EntregueEm { get; set; }
    public DateTime? LidaEm { get; set; }
    public List<MensagemAnexoDTO> Anexos { get; set; } = [];
}

public sealed class MensagemAnexoDTO
{
    public Guid Id { get; set; }
    public string NomeOriginal { get; set; } = string.Empty;
    public string TipoConteudo { get; set; } = string.Empty;
    public long TamanhoBytes { get; set; }
}
