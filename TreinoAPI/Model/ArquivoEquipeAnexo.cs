namespace TreinoAPI.Model;

public sealed class ArquivoEquipeAnexo
{
    public Guid Id { get; set; }
    public Guid ArquivoEquipeId { get; set; }
    public string NomeOriginal { get; set; } = string.Empty;
    public string NomeArmazenado { get; set; } = string.Empty;
    public string TipoConteudo { get; set; } = "application/octet-stream";
    public long TamanhoBytes { get; set; }
    public DateTime EnviadoEm { get; set; }
    public ArquivoEquipe ArquivoEquipe { get; set; } = null!;
}
