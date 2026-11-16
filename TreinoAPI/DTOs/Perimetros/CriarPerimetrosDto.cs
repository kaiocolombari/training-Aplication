using System.ComponentModel.DataAnnotations;

namespace TreinoAPI.DTOs.Perimetro;

public class CriarPerimetroDTO
{
    [Range(0, 300)]
    public double? Braco_D { get; set; }
    [Range(0, 300)]
    public double? Braco_E { get; set; }
    [Range(0, 300)]
    public double? Antebraco_D { get; set; }
    [Range(0, 300)]
    public double? Antebraco_E { get; set; }
    [Range(0, 300)]
    public double? Torax { get; set; }
    [Range(0, 300)]
    public double? Cintura { get; set; }
    [Range(0, 300)]
    public double? Abdomen { get; set; }
    [Range(0, 300)]
    public double? Quadril { get; set; }
    [Range(0, 300)]
    public double? Coxa_Sup_D { get; set; }
    [Range(0, 300)]
    public double? Coxa_Sup_E { get; set; }
    [Range(0, 300)]
    public double? Coxa_Med_D { get; set; }
    [Range(0, 300)]
    public double? Coxa_Med_E { get; set; }
    [Range(0, 300)]
    public double? Panturrilha_D { get; set; }
    [Range(0, 300)]
    public double? Panturrilha_E { get; set; }
}
