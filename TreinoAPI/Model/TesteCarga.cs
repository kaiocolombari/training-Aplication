namespace TreinoAPI.Model
{
    public class TesteCarga
    {
        public Guid Id {get;set;}
        public Guid AlunoId {get;set;}
        public int Numero {get;set;}
        public DateTime RealizadaEm {get;set;}
        public Aluno Aluno {get;set;} = null!;
        public ICollection<CargaExercicio> CargasExercicios {get;set;} = new List<CargaExercicio>();

    }
}