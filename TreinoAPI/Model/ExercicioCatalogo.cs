namespace TreinoAPI.Model;

public sealed class ExercicioCatalogo
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Nome { get; set; } = string.Empty;
    public string NomeNormalizado { get; set; } = string.Empty;
    public string? GrupoMuscular { get; set; }
    public string? Equipamento { get; set; }
    public string? Dificuldade { get; set; }
    public string? Descricao { get; set; }
    public string? Instrucoes { get; set; }
    public string? CodigoFonte { get; set; }
    public string? FonteDados { get; set; }
    public string? LicencaDados { get; set; }
    public bool Ativo { get; set; } = true;
    public DateTime CriadoEmUtc { get; set; } = DateTime.UtcNow;
    public DateTime AtualizadoEmUtc { get; set; } = DateTime.UtcNow;
    public ICollection<ExercicioSinonimo> Sinonimos { get; set; } = new List<ExercicioSinonimo>();
    public ICollection<VideoExercicio> Videos { get; set; } = new List<VideoExercicio>();
}
