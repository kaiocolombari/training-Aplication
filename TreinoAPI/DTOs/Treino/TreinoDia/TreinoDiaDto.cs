namespace TreinoAPI.DTOs.TreinoDia;

public class TreinoDiaDTO
{
    public Guid Id { get; set; }
    public Guid DiaId { get; set; }
    public Guid TreinoId { get; set; }
    public int Ordem { get; set; }
}