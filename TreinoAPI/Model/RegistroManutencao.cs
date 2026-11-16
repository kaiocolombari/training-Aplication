namespace TreinoAPI.Model;

public sealed class RegistroManutencao
{
    public Guid Id { get; set; }
    public Guid CriadoPorUsuarioId { get; set; }
    public Guid? ResponsavelUsuarioId { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public string Categoria { get; set; } = "BUG";
    public string Prioridade { get; set; } = "NORMAL";
    public string Status { get; set; } = "ABERTO";
    public string? Resolucao { get; set; }
    public DateTime CriadoEm { get; set; }
    public DateTime AtualizadoEm { get; set; }
    public DateTime? ResolvidoEm { get; set; }
    public Usuario CriadoPorUsuario { get; set; } = null!;
    public Usuario? ResponsavelUsuario { get; set; }
}
