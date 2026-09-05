namespace TreinoAPI.DTOs.PersonalAluno;

public class VincularAlunoDTO
{
    public Guid AlunoId { get; set; }
    public Guid PersonalId { get; internal set; }
}