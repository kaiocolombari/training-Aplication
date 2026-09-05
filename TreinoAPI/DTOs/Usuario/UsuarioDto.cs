namespace TreinoAPI.DTOs.Usuario;

public class UsuarioDTO
{
    public Guid Id { get; set; }

    public string Email { get; set; } = string.Empty;

    public string? Telefone { get; set; }

    public string Tipo { get; set; } = string.Empty;

    public DateTime CriadoEm { get; set; }
}