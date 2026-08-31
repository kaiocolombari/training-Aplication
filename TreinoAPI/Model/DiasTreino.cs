namespace TreinoAPI.Model
{
    public class DiaTreino
    {
        public Guid Id { get; set; }
        public Guid DiaId { get; set; }
        public Guid TreinoId { get; set; }
        public int Ordem { get; set; }
        public PeriodizacaoDia PeriodizacaoDia { get; set; } = null!;
        public Treino Treino { get; set; } = null!;

    }
}