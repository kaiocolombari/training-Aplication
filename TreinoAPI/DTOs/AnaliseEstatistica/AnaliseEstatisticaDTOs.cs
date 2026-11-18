namespace TreinoAPI.DTOs.AnaliseEstatistica;

public sealed class CriarAnaliseEstatisticaDTO
{
    public string FerramentaId { get; set; } = string.Empty;
    public string NomeFerramenta { get; set; } = string.Empty;
    public DateOnly? PeriodoInicio { get; set; }
    public DateOnly? PeriodoFim { get; set; }
    public string ParametrosJson { get; set; } = "{}";
    public string ResultadoJson { get; set; } = "{}";
    public string Resumo { get; set; } = string.Empty;
    public int QuantidadeRegistros { get; set; }
}

public sealed class AnaliseEstatisticaDTO
{
    public Guid Id { get; set; }
    public Guid AlunoId { get; set; }
    public string FerramentaId { get; set; } = string.Empty;
    public string NomeFerramenta { get; set; } = string.Empty;
    public DateOnly? PeriodoInicio { get; set; }
    public DateOnly? PeriodoFim { get; set; }
    public string ParametrosJson { get; set; } = "{}";
    public string ResultadoJson { get; set; } = "{}";
    public string Resumo { get; set; } = string.Empty;
    public int QuantidadeRegistros { get; set; }
    public DateTime GeradoEm { get; set; }
}
