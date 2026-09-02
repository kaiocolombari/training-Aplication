namespace TreinoAPI.DTOs.Personal;

public class PersonalDTO
{
    public Guid Id { get; set; }
    public Guid UsuarioId { get; set; }
    public string NomeCompleto { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Telefone { get; set; }
}