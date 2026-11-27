namespace TreinoAPI.DTOs.Personal;

public sealed class PersonalExclusaoResumoDTO
{
    public Guid Id { get; set; }
    public string NomeCompleto { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public int TotalAlunos { get; set; }
    public List<AlunoAfetadoExclusaoDTO> Alunos { get; set; } = [];
}

public sealed class AlunoAfetadoExclusaoDTO
{
    public Guid Id { get; set; }
    public string NomeCompleto { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}
