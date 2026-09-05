namespace TreinoAPI.DTOs.CargaExercicio;

public class AtualizarCargaExercicioDto
{
    public string Exercicio { get; set; } = string.Empty;
    public double? Repeticoes { get; set; }
    public double? Carga { get; set; }
}