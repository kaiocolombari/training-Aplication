using System.ComponentModel.DataAnnotations;

namespace TreinoAPI.DTOs.TesteCarga;

public class AtualizarTesteCargaDTO
{
    [Range(1, int.MaxValue)]
    public int Numero { get; set; }
}
