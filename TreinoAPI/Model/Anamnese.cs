namespace TreinoAPI.Model
{
    public class Anamnese
    {
        public Guid Id { get; set; }
        public Guid AlunoId { get; set; }
        public string? Tipo {get; set;}
        public string? Objetivo {get; set;}
        public string? Observacoes {get; set;}
        public DateTime CriadoEm { get; set; }
        public Aluno Aluno { get; set; } = null!;

    }
}