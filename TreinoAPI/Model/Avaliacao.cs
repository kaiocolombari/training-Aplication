namespace TreinoAPI.Model
{
    public class Avaliacao
    {
        public Guid Id { get; set; }
        public Guid AlunoId { get; set; }
        public int Numero { get; set; }
        public double? Peso { get; set; }
        public double? Altura { get; set; }
        public double? PerceltualGordura { get; set; }
        public DateTime RealizadaEm { get; set; }
        public Aluno Aluno { get; set; } = null!;
    }
}