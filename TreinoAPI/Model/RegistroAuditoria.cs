namespace TreinoAPI.Model;

public sealed class RegistroAuditoria
{
    public Guid Id { get; set; }
    public Guid? UsuarioId { get; set; }
    public string UsuarioEmail { get; set; } = string.Empty;
    public string UsuarioTipo { get; set; } = string.Empty;
    public string Acao { get; set; } = string.Empty;
    public string MetodoHttp { get; set; } = string.Empty;
    public string Rota { get; set; } = string.Empty;
    public string? RecursoId { get; set; }
    public string Resumo { get; set; } = string.Empty;
    public int StatusCode { get; set; }
    public string Resultado { get; set; } = string.Empty;
    public string? EnderecoIp { get; set; }
    public string? UserAgent { get; set; }
    public DateTime CriadoEm { get; set; }
    public Usuario? Usuario { get; set; }
}
