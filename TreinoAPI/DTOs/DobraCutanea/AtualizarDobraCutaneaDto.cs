using System.ComponentModel.DataAnnotations;

namespace TreinoAPI.DTOs.DobraCutanea;

public class AtualizarDobraCutaneaDTO
{
    [Range(1, 2)]
    public int Medida { get; set; }

    [Range(0, 100)]
    public double? Triceps { get; set; }
    [Range(0, 100)]
    public double? Subescapular { get; set; }
    [Range(0, 100)]
    public double? Biceps { get; set; }
    [Range(0, 100)]
    public double? Iliaca { get; set; }
    [Range(0, 100)]
    public double? Supraespinhal { get; set; }
    [Range(0, 100)]
    public double? Abdominal { get; set; }
    [Range(0, 100)]
    public double? CoxaMedia { get; set; }
    [Range(0, 100)]
    public double? Panturrilha { get; set; }
}
