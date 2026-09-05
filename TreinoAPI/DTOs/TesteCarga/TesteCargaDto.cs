namespace TreinoAPI.DTOs.TesteCarga;

public class TesteCargaDTO
{
    public Guid Id { get; set; }
    public Guid AlunoId { get; set; }
    public int Numero { get; set; }
    public DateTime RealizadaEm { get; set; }
}