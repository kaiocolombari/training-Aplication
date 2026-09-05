namespace TreinoAPI.DTOs.Personal
{
    public class CriarPersonalDTO
    {
        public string NomeCompleto { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Senha { get; set; } = string.Empty;
        public string? Telefone { get; set; }
    }
}