namespace TreinoAPI.DTOs.Auth;

public sealed class UsuarioSessaoDTO
{
    public Guid UsuarioId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Tipo { get; set; } = string.Empty;
    public Guid? PersonalId { get; set; }
    public Guid? AlunoId { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string? StatusCadastro { get; set; }
    public bool FormularioEnviado { get; set; }
    public string? ObservacaoAnalise { get; set; }
    public bool ControleAvancadoHabilitado { get; set; }
}
