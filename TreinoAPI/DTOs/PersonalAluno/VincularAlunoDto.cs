namespace TreinoAPI.DTOs.PersonalAluno;

public class VincularAlunoDto
{
    public Guid AlunoId { get; set; }
    public Guid PersonalId { get; internal set; }
}