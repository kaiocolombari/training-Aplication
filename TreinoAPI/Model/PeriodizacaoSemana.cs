namespace TreinoAPI.Model
{
    public class PeriodizacaoSemana
    {
        public Guid Id { get; set; }
        public Guid PeriodizacaoId { get; set; }

        public int Numero { get; set; }

        public Periodizacao Periodizacao { get; set; } = null!;

        public ICollection<PeriodizacaoDia> PeriodizacaoDias { get; set; } = new List<PeriodizacaoDia>();
    }
}