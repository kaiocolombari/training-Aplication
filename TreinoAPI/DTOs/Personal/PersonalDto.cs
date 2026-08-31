namespace TreinoAPI.DTOs.Personal;

public class PersonalResponseDto
{
    public Guid Id { get; set; }

    public string Nome { get; set; } = string.Empty;

    public Guid UsuarioId { get; set; }
}