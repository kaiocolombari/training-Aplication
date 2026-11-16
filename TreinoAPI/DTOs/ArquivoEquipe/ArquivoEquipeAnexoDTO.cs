namespace TreinoAPI.DTOs.ArquivoEquipe;

public sealed class ArquivoEquipeAnexoDTO
{
    public Guid Id { get; set; }
    public string NomeOriginal { get; set; } = string.Empty;
    public long TamanhoBytes { get; set; }
    public DateTime EnviadoEm { get; set; }
}
