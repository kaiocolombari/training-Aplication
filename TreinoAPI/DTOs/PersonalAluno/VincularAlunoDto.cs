using System.ComponentModel.DataAnnotations;
using TreinoAPI.Validation;

namespace TreinoAPI.DTOs.PersonalAluno;

public class VincularAlunoDTO
{
    [GuidNotEmpty]
    public Guid AlunoId { get; set; }
    [GuidNotEmpty]
    public Guid PersonalId { get; set; }
}
