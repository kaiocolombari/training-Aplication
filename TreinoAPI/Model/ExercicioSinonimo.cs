namespace TreinoAPI.Model;

public sealed class ExercicioSinonimo
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ExercicioCatalogoId { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string NomeNormalizado { get; set; } = string.Empty;
    public string Origem { get; set; } = "MANUAL";
    public ExercicioCatalogo ExercicioCatalogo { get; set; } = null!;
}
