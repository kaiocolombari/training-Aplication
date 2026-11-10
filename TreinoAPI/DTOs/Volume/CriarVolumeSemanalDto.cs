namespace TreinoAPI.DTOs.VolumeSemanal;

public class CriarVolumeSemanalDTO
{
    public Guid GrupoMuscularId { get; set; }
    public int? SeriesDiretas { get; set; }
    public int? SeriesLivres { get; set; }
}
