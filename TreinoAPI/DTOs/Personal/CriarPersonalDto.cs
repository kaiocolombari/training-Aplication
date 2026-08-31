namespace TreinoAPI.DTOs.Personal
{
    public class CriarPersonalDto
    {
        public string NomeCompleto { get; set; } = string.Empty;
        public string? Genero { get; set; }
        public DateOnly? DataNascimento { get; set; }
    }
}