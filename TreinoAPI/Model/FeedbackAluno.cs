namespace TreinoAPI.Model;

public sealed class FeedbackAluno
{
    public Guid Id { get; set; }
    public Guid AlunoId { get; set; }
    public Guid? PersonalId { get; set; }
    public string Categoria { get; set; } = "ACOMPANHAMENTO";
    public int Nota { get; set; }
    public string Comentario { get; set; } = string.Empty;
    public string Status { get; set; } = "NOVO";
    public string? RespostaEquipe { get; set; }
    public DateTime CriadoEm { get; set; }
    public DateTime? AtualizadoEm { get; set; }
    public Aluno Aluno { get; set; } = null!;
    public Personal? Personal { get; set; }
}
