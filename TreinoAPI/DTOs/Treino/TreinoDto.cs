namespace TreinoAPI.DTOs.Treino;

public class TreinoDTO
{
    public Guid Id { get; set; }
    public Guid AlunoId { get; set; }
    public string Nome { get; set; } = string.Empty;
    public DateTime? CriadoEm { get; set; }
}