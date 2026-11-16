using System.ComponentModel.DataAnnotations;

namespace TreinoAPI.DTOs.Avaliacao;

public class CriarAvaliacaoDTO
{
    [Range(0, 120)]
    public int? Idade { get; set; }
    [Range(0.1, 500)]
    public double? Peso { get; set; }
    [Range(0.3, 2.5)]
    public double? Altura { get; set; }
    [Range(0, 100)]
    public double? PercentualGordura { get; set; }
    public DateTime? RealizadaEm { get; set; }
    [StringLength(500)] public string? Objetivo { get; set; }
    [StringLength(4000)] public string? Observacoes { get; set; }
}
