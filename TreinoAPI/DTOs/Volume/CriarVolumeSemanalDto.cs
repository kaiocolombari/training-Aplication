using System.ComponentModel.DataAnnotations;

namespace TreinoAPI.DTOs.VolumeSemanal;

public class CriarVolumeSemanalDTO
{
    [Required]
    public Guid GrupoMuscularId { get; set; }
    [Range(0, 1000)]
    public int? SeriesDiretas { get; set; }
    [Range(0, 1000)]
    public int? SeriesLivres { get; set; }
}
