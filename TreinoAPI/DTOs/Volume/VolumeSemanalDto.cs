namespace TreinoAPI.DTOs.VolumeSemanal;

public class VolumeSemanalDTO
{
    public Guid Id { get; set; }
    public Guid PeriodizacaoSemanaId { get; set; }
    public Guid GrupoMuscularId { get; set; }
    public int? Series { get; set; }
}