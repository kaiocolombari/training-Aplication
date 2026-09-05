namespace TreinoAPI.DTOs.Periodizacao;

public class PeriodizacaoDTO
{
    public Guid Id { get; set; }
    public Guid AlunoId { get; set; }
    public string? Nome { get; set; }
    public DateTime DataInicio { get; set; }
    
}