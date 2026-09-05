namespace TreinoAPI.DTOs.Usuario;

public class CriarUsuarioDTO
{
    public string Email { get; set; } = string.Empty;

    public string Senha { get; set; } = string.Empty;

    public string? Telefone { get; set; }

    public string Tipo { get; set; } = string.Empty;
}