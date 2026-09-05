namespace treinoAPI.DTOs.CargaExercicio;

public class CriarCargaExercicioDTO
{
    public string Exercicio { get; set; } = string.Empty;
    public double? Repeticoes { get; set; }
    public double? Carga { get; set; }
}