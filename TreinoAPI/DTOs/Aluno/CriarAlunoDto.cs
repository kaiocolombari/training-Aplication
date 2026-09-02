namespace TreinoAPI.DTOs.Aluno
{
    public class CriarAlunoDTO
    {
        public string NomeCompleto { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Senha { get; set; } = string.Empty;
        public string? Telefone { get; set; }

        public string? Genero { get; set; }
        public DateTime? DataNascimento { get; set; }
        public string? Etnia { get; set; }

        public Guid PersonalId { get; set; }
    }
}