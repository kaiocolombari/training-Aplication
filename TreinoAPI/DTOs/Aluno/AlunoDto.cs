namespace TreinoAPI.DTOs.Aluno;

public class AlunoDTO
{
    public Guid Id { get; set; }

    public string Email { get; set; } = string.Empty;

    public string? Telefone { get; set; }

    public string NomeCompleto { get; set; } = string.Empty;

    public string? Genero { get; set; }

    public DateOnly? DataNascimento { get; set; }

    public string? Etnia { get; set; }

    public DateTime CriadoEm { get; set; }

    public string StatusCadastro { get; set; } = "APROVADO";

    public bool PossuiFichaTecnica { get; set; }
    public string? ConvidadoPorPersonalNome { get; set; }
}
