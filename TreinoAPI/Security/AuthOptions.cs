namespace TreinoAPI.Security;

public sealed class AuthOptions
{
    public string Secret { get; set; } = string.Empty;
    public string Issuer { get; set; } = "TreinoAPI";
    public string Audience { get; set; } = "TreinoWeb";
    public int AccessTokenMinutes { get; set; } = 15;
    public int RefreshTokenDays { get; set; } = 7;
}
