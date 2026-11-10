namespace TreinoAPI.Model;

public class TreinoExercicioVariacao
{
    public Guid Id { get; set; }
    public Guid TreinoExercicioId { get; set; }
    public string Exercicio { get; set; } = string.Empty;
    public int? Ordem { get; set; }
    public int? Series { get; set; }
    public int? Repeticoes { get; set; }
    public int? Intervalo { get; set; }
    public double? Carga { get; set; }
    public int? RiRMAX { get; set; }
    public string? Observacoes { get; set; } = string.Empty;
    public TreinoExercicio TreinoExercicio { get; set; } = null!;
}
