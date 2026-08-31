namespace TreinoAPI.Model
{
    public class DobraCutanea
    {
        public Guid Id { get; set; }
        public Guid AvaliacaoId { get; set; }
        public int Medida { get; set; }
        public double? Triceps { get; set; }
        public double? Subescapular { get; set; }
        public double? Biceps { get; set; }
        public double? Iliaca { get; set; }
        public double? Supraespinhal { get; set; }
        public double? Abdominal { get; set; }
        public double? CoxaMedia { get; set; }
        public double? Panturrilha { get; set; }
        public Avaliacao Avaliacao { get; set; } = null!;

    }
}