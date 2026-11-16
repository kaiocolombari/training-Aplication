namespace TreinoAPI.DTOs.Avaliacao;

public class AvaliacaoDTO
{
    public Guid Id { get; set; }
    public Guid AlunoId { get; set; }
    public int Numero { get; set; }
    public int? Idade { get; set; }
    public double? Peso { get; set; }
    public double? Altura { get; set; }
    public double? PercentualGordura { get; set; }
    public DateTime RealizadaEm { get; set; }
    public string? Objetivo { get; set; }
    public string? Observacoes { get; set; }
    public bool Ativo { get; set; }
    public DateTime CriadaEm { get; set; }
    public string? CriadaPorEmail { get; set; }
    public DateTime? AtualizadaEm { get; set; }
    public string? AtualizadaPorEmail { get; set; }
}
