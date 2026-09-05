namespace TreinoAPI.DTOs.CargaExercicio;

public class CargaExercicioDTO
{
    public Guid Id { get; set; }
    public Guid TesteCargaId { get; set; }
    public string Exercicio { get; set; } = string.Empty;
    public double? Carga { get; set; }
    public double? Repeticoes { get; set; }
}