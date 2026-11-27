namespace TreinoAPI.Configuration;

public sealed class TurnstileOptions
{
    public bool Enabled { get; set; } = true;
    public string SiteKey { get; set; } = string.Empty;
    public string SecretKey { get; set; } = string.Empty;
    public string? ExpectedHostname { get; set; }
}
