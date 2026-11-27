namespace TreinoAPI.DTOs.PersonalAluno;

public sealed class PersonalAlunoVinculoDTO
{
    public Guid Id { get; set; }
    public Guid PersonalId { get; set; }
    public string PersonalNome { get; set; } = string.Empty;
    public Guid AlunoId { get; set; }
    public bool Ativo { get; set; }
    public DateTime CriadoEm { get; set; }
}
