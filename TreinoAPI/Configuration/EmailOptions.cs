namespace TreinoAPI.Configuration;

public sealed class EmailOptions
{
    public bool Enabled { get; set; }
    public string BrandName { get; set; } = "GGP";
    public string SenderName { get; set; } = "GGP | Gestão de Performance";
    public string SenderEmail { get; set; } = string.Empty;
    public string ReplyToEmail { get; set; } = string.Empty;
    public string LogoUrl { get; set; } = string.Empty;
    public string PrimaryColor { get; set; } = "#5558D9";
    public SmtpEmailOptions Smtp { get; set; } = new();
}

public sealed class SmtpEmailOptions
{
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 587;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public bool EnableSsl { get; set; } = true;
    public int TimeoutMs { get; set; } = 20000;
}
