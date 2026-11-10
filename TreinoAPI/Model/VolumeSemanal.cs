namespace TreinoAPI.Model
{
    public class VolumeSemanal
    {
        public Guid Id { get; set; }
        public Guid PeriodizacaoSemanaId { get; set; }
        public Guid GrupoMuscularId { get; set; }
        public int? SeriesDiretas { get; set; }
        public int? SeriesLivres { get; set; }
        public PeriodizacaoSemana PeriodizacaoSemana { get; set; } = null!;
        public GrupoMuscular GrupoMuscular { get; set; } = null!;
    }
}
