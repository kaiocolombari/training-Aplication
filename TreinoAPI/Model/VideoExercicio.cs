namespace TreinoAPI.Model;

public sealed class VideoExercicio
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ExercicioCatalogoId { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string? UrlExterna { get; set; }
    public string? ChaveArmazenamento { get; set; }
    public string TipoConteudo { get; set; } = "video/mp4";
    public string Origem { get; set; } = "UPLOAD";
    public string Licenca { get; set; } = "PROPRIO";
    public string? Fonte { get; set; }
    public double? DuracaoSegundos { get; set; }
    public bool Principal { get; set; }
    public bool Ativo { get; set; } = true;
    public DateTime CriadoEmUtc { get; set; } = DateTime.UtcNow;
    public ExercicioCatalogo ExercicioCatalogo { get; set; } = null!;
}
