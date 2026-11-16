namespace TreinoAPI.Model;

public sealed class ArquivoEquipe
{
    public Guid Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public string PrazoRetencao { get; set; } = string.Empty;
    public Guid CriadoPorUsuarioId { get; set; }
    public DateTime CriadoEm { get; set; }
    public DateTime ExpiraEm { get; set; }
    public DateTime? AvisoExpiracaoEnviadoEm { get; set; }
    public Usuario CriadoPorUsuario { get; set; } = null!;
    public ICollection<ArquivoEquipeAnexo> Arquivos { get; set; } = new List<ArquivoEquipeAnexo>();
}
