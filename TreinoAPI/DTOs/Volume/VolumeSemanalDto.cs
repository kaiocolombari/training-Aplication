namespace TreinoAPI.DTOs.VolumeSemanal;

public class VolumeSemanalDTO
{
    public Guid Id { get; set; }
    public Guid PeriodizacaoSemanaId { get; set; }
    public Guid GrupoMuscularId { get; set; }
    public int? SeriesDiretas { get; set; }
    public int? SeriesLivres { get; set; }
}
