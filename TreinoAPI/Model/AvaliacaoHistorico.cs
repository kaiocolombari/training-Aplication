namespace TreinoAPI.Model;

public sealed class AvaliacaoHistorico
{
    public Guid Id { get; set; }
    public Guid AvaliacaoId { get; set; }
    public Guid? UsuarioId { get; set; }
    public string UsuarioEmail { get; set; } = string.Empty;
    public string UsuarioTipo { get; set; } = string.Empty;
    public string Acao { get; set; } = string.Empty;
    public DateTime CriadoEm { get; set; }
    public string Resumo { get; set; } = string.Empty;
    public string? DadosJson { get; set; }

    public Avaliacao Avaliacao { get; set; } = null!;
    public Usuario? Usuario { get; set; }
}
