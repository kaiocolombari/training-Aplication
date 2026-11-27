namespace TreinoAPI.Model;

public sealed class TarefaPersonal
{
    public Guid Id { get; set; }
    public Guid? PersonalId { get; set; }
    public Guid? AlunoId { get; set; }
    public Guid CriadoPorUsuarioId { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public string? DicaContexto { get; set; }
    public string Categoria { get; set; } = "GERAL";
    public string Prioridade { get; set; } = "NORMAL";
    public string Status { get; set; } = "PENDENTE";
    public DateTime? DataLimite { get; set; }
    public DateTime CriadaEm { get; set; }
    public DateTime AtualizadaEm { get; set; }
    public DateTime? ConcluidaEm { get; set; }
    public Personal? Personal { get; set; }
    public Aluno? Aluno { get; set; }
    public Usuario CriadoPorUsuario { get; set; } = null!;
}
