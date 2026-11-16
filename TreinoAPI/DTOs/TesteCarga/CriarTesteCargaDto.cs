using System.ComponentModel.DataAnnotations;

namespace TreinoAPI.DTOs.TesteCarga;

public class CriarTesteCargaDTO
{
    [Range(1, int.MaxValue)]
    public int Numero { get; set; }
    public DateTime RealizadaEm { get; set; }
}
