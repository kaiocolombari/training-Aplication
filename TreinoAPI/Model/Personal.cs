namespace TreinoAPI.Model
{
    public class Personal
    {
        public Guid Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public Guid UsuarioId { get; set; }
        public Usuario? Usuario { get; set; }

        public ICollection<PersonalAluno> Alunos { get; set; } = new List<PersonalAluno>();
    }
}