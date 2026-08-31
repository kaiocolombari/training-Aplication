namespace TreinoAPI.Model
{
    public class CargaExercicio
    {
        public Guid Id { get; set; }
        public Guid TesteCargaId { get; set; }
        public string Exercicio { get; set; } = string.Empty;
        public double? Carga { get; set; }
        public double? Repeticoes { get; set; }
        public TesteCarga TesteCarga { get; set; } = null!;
    }
}