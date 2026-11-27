using System.ComponentModel.DataAnnotations;

namespace TreinoAPI.DTOs.Aluno
{
    public class CriarAlunoDTO
    {
        [Required, StringLength(160, MinimumLength = 2)]
        public string NomeCompleto { get; set; } = string.Empty;
        [Required, EmailAddress, StringLength(254)]
        public string Email { get; set; } = string.Empty;
        [Required, MinLength(8), StringLength(128)]
        public string Senha { get; set; } = string.Empty;
        public string? Telefone { get; set; }

        public string? Genero { get; set; }
        public DateOnly? DataNascimento { get; set; }
        public string? Etnia { get; set; }

        [Range(0, 500)] public decimal? Massa { get; set; }
        [Range(0, 300)] public decimal? Estatura { get; set; }
        [Range(0, 100)] public decimal? Femur { get; set; }
        [Range(0, 100)] public decimal? Tibia { get; set; }
        [Range(0, 100)] public decimal? Una { get; set; }
        [Range(0, 100)] public decimal? Umero { get; set; }
        [Range(0, 300)] public int? FcRepouso { get; set; }
        [Range(0, 300)] public int? FcReserva { get; set; }
        [Range(0, 2000)] public decimal? Glicose { get; set; }
        [Range(0, 5000)] public decimal? Triglicerideos { get; set; }
        [Range(0, 1000)] public decimal? Ldl { get; set; }
        [Range(0, 1000)] public decimal? Hdl { get; set; }
        [Range(0, 300)] public int? Sistolica { get; set; }
        [Range(0, 300)] public int? Diastolica { get; set; }

    }
}
