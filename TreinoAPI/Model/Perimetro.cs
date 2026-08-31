namespace TreinoAPI.Model
{
    public class Perimetro
    {
        public Guid Id { get; set; }
        public Guid AvaliacaoId { get; set; }
        public double? Braco_D { get; set; }
        public double? Braco_E { get; set; }
        public double? Antebraco_D { get; set; }
        public double? Antebraco_E { get; set; }
        public double? Torax { get; set; }
        public double? Cintura { get; set; }
        public double? Abdomen { get; set; }
        public double? Quadril { get; set; }
        public double? Coxa_Sup_D { get; set; }
        public double? Coxa_Sup_E { get; set; }
        public double? Coxa_Med_D { get; set; }
        public double? Coxa_Med_E { get; set; }
        public double? Panturrilha_D { get; set; }
        public double? Panturrilha_E { get; set; }
        public Avaliacao Avaliacao { get; set; } = null!;
    }
}