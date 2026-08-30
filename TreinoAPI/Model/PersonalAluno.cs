namespace TreinoAPI.Model;

public class PersonalAluno
{
    public Guid Id { get; set; }

    public Guid PersonalId { get; set; }

    public Guid AlunoId { get; set; }

    public DateTime CriadoEm { get; set; }

    public bool Ativo { get; set; }

    public Personal Personal { get; set; } = null!;

    public Aluno Aluno { get; set; } = null!;
}