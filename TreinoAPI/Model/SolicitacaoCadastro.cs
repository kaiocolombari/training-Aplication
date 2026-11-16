namespace TreinoAPI.Model;

public class SolicitacaoCadastro
{
    public Guid Id { get; set; }
    public Guid AlunoId { get; set; }
    public string RespostasJson { get; set; } = "{}";
    public DateTime EnviadaEm { get; set; }
    public Aluno Aluno { get; set; } = null!;
}
