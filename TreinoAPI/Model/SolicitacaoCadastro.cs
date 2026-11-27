namespace TreinoAPI.Model;

public class SolicitacaoCadastro
{
    public Guid Id { get; set; }
    public Guid AlunoId { get; set; }
    public string RespostasJson { get; set; } = "{}";
    public DateTime EnviadaEm { get; set; }
    public string StatusAnalise { get; set; } = "AGUARDANDO_ANALISE";
    public string? ObservacaoAnalise { get; set; }
    public Guid? AvaliadorUsuarioId { get; set; }
    public DateTime? AnalisadaEm { get; set; }
    public Aluno Aluno { get; set; } = null!;
    public Usuario? Avaliador { get; set; }
}
