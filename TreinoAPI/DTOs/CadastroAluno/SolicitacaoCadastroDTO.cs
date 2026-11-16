namespace TreinoAPI.DTOs.CadastroAluno;

public sealed class SolicitacaoCadastroDTO
{
    public Guid AlunoId { get; set; }
    public string NomeCompleto { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Telefone { get; set; }
    public DateTime CriadoEm { get; set; }
    public DateTime? EnviadaEm { get; set; }
    public bool FormularioEnviado { get; set; }
    public Dictionary<string, System.Text.Json.JsonElement> Respostas { get; set; } = new();
}
