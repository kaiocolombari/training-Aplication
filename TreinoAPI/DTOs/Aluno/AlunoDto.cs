namespace TreinoAPI.DTOs.Aluno;

public class AlunoDTO
{
    public Guid Id { get; set; }

    public string NomeCompleto { get; set; } = string.Empty;

    public string? Genero { get; set; }

    public DateOnly? DataNascimento { get; set; }

    public string? Etnia { get; set; }
}