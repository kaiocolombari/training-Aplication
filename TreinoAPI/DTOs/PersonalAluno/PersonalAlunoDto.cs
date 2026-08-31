namespace TreinoAPI.DTOs.PersonalAluno;

public class PersonalAlunoDto
{
    public Guid Id { get; set; }

    public Guid PersonalId { get; set; }

    public Guid AlunoId { get; set; }

    public bool Ativo { get; set; }

    public DateTime CriadoEm { get; set; }
}