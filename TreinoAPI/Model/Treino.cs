namespace TreinoAPI.Model
{
    public class Treino
    {
        public Guid Id { get; set; }
        public Guid AlunoId { get; set; }
        public string Nome { get; set; } = string.Empty;
        public DateTime CriadoEm { get; set; }
        public Aluno Aluno { get; set; } = null!;
        public ICollection<TreinoExercicio> TreinoExercicios { get; set; } = new List<TreinoExercicio>();
    }
}