namespace TreinoAPI.DTOs.ArquivoEquipe;

public sealed class ArquivoEquipeDTO
{
    public Guid Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public string PrazoRetencao { get; set; } = string.Empty;
    public string CriadoPorNome { get; set; } = string.Empty;
    public DateTime CriadoEm { get; set; }
    public DateTime ExpiraEm { get; set; }
    public DateTime? AvisoExpiracaoEnviadoEm { get; set; }
    public List<ArquivoEquipeAnexoDTO> Arquivos { get; set; } = [];
}
