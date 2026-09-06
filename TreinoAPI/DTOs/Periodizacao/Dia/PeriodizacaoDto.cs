namespace TreinoAPI.DTOs.Periodizacao;

public class PeriodizacaoDiaDTO
{
    public Guid Id { get; set; }
    public Guid SemanaId { get; set; }
    public DateTime Data { get; set; }
    public int DiaSemana { get; set; }
}