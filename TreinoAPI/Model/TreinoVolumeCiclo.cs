namespace TreinoAPI.Model;

public sealed class TreinoVolumeCiclo
{
    public Guid Id { get; set; }
    public Guid AlunoId { get; set; }
    public Guid TreinoId { get; set; }
    public string TreinoNomeSnapshot { get; set; } = string.Empty;
    public int ReferenciaSeries { get; set; }
    public DateOnly DataInicio { get; set; }
    public string ExerciciosSnapshotJson { get; set; } = "[]";
    public DateTime CriadoEm { get; set; }
    public Guid? CriadoPorUsuarioId { get; set; }
    public DateTime? EncerradoEm { get; set; }

    public Aluno Aluno { get; set; } = null!;
    public Treino Treino { get; set; } = null!;
    public Usuario? CriadoPorUsuario { get; set; }
    public ICollection<TreinoVolumeRegistroMensal> Registros { get; set; } = new List<TreinoVolumeRegistroMensal>();
}
