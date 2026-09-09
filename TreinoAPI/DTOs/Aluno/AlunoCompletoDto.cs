namespace TreinoAPI.DTOs.Aluno;

public class AlunoCompletoDTO
{
    public Guid Id { get; set; }

    public Guid UsuarioId { get; set; }

    public string NomeCompleto { get; set; } = string.Empty;

    public string? Genero { get; set; }

    public DateOnly? DataNascimento { get; set; }

    public string? Etnia { get; set; }

    public decimal? Massa { get; set; }

    public decimal? Estatura { get; set; }

    public decimal? Femur { get; set; }

    public decimal? Tibia { get; set; }

    public decimal? Una { get; set; }

    public decimal? Umero { get; set; }

    public int? FcRepouso { get; set; }

    public int? FcReserva { get; set; }

    public decimal? Glicose { get; set; }

    public decimal? Triglicerideos { get; set; }

    public decimal? Ldl { get; set; }

    public decimal? Hdl { get; set; }

    public int? Sistolica { get; set; }

    public int? Diastolica { get; set; }

    public DateTime CriadoEm { get; set; }
}