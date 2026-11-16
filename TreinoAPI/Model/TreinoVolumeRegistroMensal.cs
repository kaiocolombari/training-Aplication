namespace TreinoAPI.Model;

public sealed class TreinoVolumeRegistroMensal
{
    public Guid Id { get; set; }
    public Guid CicloId { get; set; }
    public int MesCiclo { get; set; }
    public int SeriesInformadas { get; set; }
    public string? Observacao { get; set; }
    public DateTime RegistradoEm { get; set; }
    public Guid? RegistradoPorUsuarioId { get; set; }

    public TreinoVolumeCiclo Ciclo { get; set; } = null!;
    public Usuario? RegistradoPorUsuario { get; set; }
}
