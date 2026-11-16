namespace TreinoAPI.Model
{
    public class Avaliacao
    {
        public Guid Id { get; set; }
        public Guid AlunoId { get; set; }
        public int Numero { get; set; }
        public int? Idade { get; set; }
        public double? Peso { get; set; }
        public double? Altura { get; set; }
        public double? PercentualGordura { get; set; }
        public DateTime RealizadaEm { get; set; }
        public string? Objetivo { get; set; }
        public string? Observacoes { get; set; }
        public bool Ativo { get; set; } = true;
        public DateTime CriadaEm { get; set; }
        public Guid? CriadaPorUsuarioId { get; set; }
        public Usuario? CriadaPorUsuario { get; set; }
        public DateTime? AtualizadaEm { get; set; }
        public Guid? AtualizadaPorUsuarioId { get; set; }
        public Usuario? AtualizadaPorUsuario { get; set; }
        public Aluno Aluno { get; set; } = null!;
        public Perimetro? Perimetro { get; set; } = null!;
        public ICollection<DobraCutanea> DobrasCutaneas { get; set; } = new List<DobraCutanea>();
        public ICollection<AvaliacaoHistorico> Historico { get; set; } = new List<AvaliacaoHistorico>();
    }
}
