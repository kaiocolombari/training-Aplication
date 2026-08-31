namespace TreinoAPI.Model
{
    public class Periodizacao
    {
        public Guid Id { get; set; }
        public Guid AlunoId { get; set; }
        public string? Nome { get; set; }
        public DateTime DataInicio { get; set; }
        public Aluno Aluno { get; set; } = null!;
        public ICollection<PeriodizacaoSemana> PeriodizacaoSemanas { get; set; } = new List<PeriodizacaoSemana>();
    }
}