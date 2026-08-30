namespace TreinoAPI.Model
{
    public class Usuario
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string SenhaHashed { get; set; } = string.Empty;
        public string? Telefone { get; set; }
        public string Tipo { get; set; } = string.Empty;
        public DateTime CriadoEm { get; set; }
        public Personal? Personal { get; set; }

        public Aluno? Aluno { get; set; }
    }

}