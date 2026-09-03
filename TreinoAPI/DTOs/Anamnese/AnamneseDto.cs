namespace TreinoAPI.DTOs.Anamnese;

public class AnamneseDTO
{
    public Guid Id { get; set; }
    public Guid AlunoId { get; set; }
    public string? Tipo { get; set; } = string.Empty;
    public string? Objetivo { get; set; } = string.Empty;
    public string? Observacoes { get; set; } = string.Empty;
    public DateTime? CriadoEm { get; set; }

}