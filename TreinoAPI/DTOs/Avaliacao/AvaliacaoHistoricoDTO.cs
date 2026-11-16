namespace TreinoAPI.DTOs.Avaliacao;

public sealed class AvaliacaoHistoricoDTO
{
    public Guid Id { get; set; }
    public Guid AvaliacaoId { get; set; }
    public string Acao { get; set; } = string.Empty;
    public string Resumo { get; set; } = string.Empty;
    public DateTime CriadoEm { get; set; }
    public string UsuarioEmail { get; set; } = string.Empty;
    public string UsuarioTipo { get; set; } = string.Empty;
}
