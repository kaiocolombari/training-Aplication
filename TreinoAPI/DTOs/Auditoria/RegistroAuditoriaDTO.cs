namespace TreinoAPI.DTOs.Auditoria;

public sealed class RegistroAuditoriaDTO
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
}

public sealed class ResultadoAuditoriaDTO
{
    public List<RegistroAuditoriaDTO> Registros { get; set; } = [];
    public int Pagina { get; set; }
    public int Limite { get; set; }
    public int Total { get; set; }
    public int TotalPaginas { get; set; }
}
