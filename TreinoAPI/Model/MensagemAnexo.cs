namespace TreinoAPI.Model;

public sealed class MensagemAnexo
{
    public Guid Id { get; set; }
    public Guid MensagemId { get; set; }
    public string NomeOriginal { get; set; } = string.Empty;
    public string NomeArmazenado { get; set; } = string.Empty;
    public string TipoConteudo { get; set; } = "application/octet-stream";
    public long TamanhoBytes { get; set; }
    public DateTime VerificadoEm { get; set; }
    public string VerificadoPor { get; set; } = string.Empty;
    public MensagemEquipe Mensagem { get; set; } = null!;
}
