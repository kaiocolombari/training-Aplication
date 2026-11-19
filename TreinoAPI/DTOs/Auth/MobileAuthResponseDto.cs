using TreinoAPI.Security;

namespace TreinoAPI.DTOs.Auth;

public sealed class MobileAuthResponseDTO
{
    public string AccessToken { get; init; } = string.Empty;
    public string RefreshToken { get; init; } = string.Empty;
    public DateTime AccessExpiresAt { get; init; }
    public DateTime RefreshExpiresAt { get; init; }
    public UsuarioSessaoDTO Usuario { get; init; } = new();

    public static MobileAuthResponseDTO From(AuthSessionResult session) => new()
    {
        AccessToken = session.Tokens.AccessToken,
        RefreshToken = session.Tokens.RefreshToken,
        AccessExpiresAt = session.Tokens.AccessExpiresAt,
        RefreshExpiresAt = session.Tokens.RefreshExpiresAt,
        Usuario = session.Usuario
    };
}

public sealed class MobileRefreshDTO
{
    [System.ComponentModel.DataAnnotations.Required]
    [System.ComponentModel.DataAnnotations.StringLength(256)]
    public string RefreshToken { get; set; } = string.Empty;
}
