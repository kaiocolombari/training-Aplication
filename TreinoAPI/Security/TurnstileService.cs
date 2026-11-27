using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;
using TreinoAPI.Configuration;

namespace TreinoAPI.Security;

public sealed class TurnstileService
{
    private const string VerifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
    private readonly HttpClient _http;
    private readonly TurnstileOptions _options;
    private readonly IWebHostEnvironment _environment;
    private readonly IHttpContextAccessor _context;

    public TurnstileService(
        HttpClient http,
        IOptions<TurnstileOptions> options,
        IWebHostEnvironment environment,
        IHttpContextAccessor context)
    {
        _http = http;
        _http.Timeout = TimeSpan.FromSeconds(6);
        _options = options.Value;
        _environment = environment;
        _context = context;
    }

    public async Task ValidarAsync(string? token, string action, CancellationToken cancellationToken = default)
    {
        if (!_options.Enabled && _environment.IsDevelopment()) return;
        if (string.IsNullOrWhiteSpace(_options.SecretKey) || string.IsNullOrWhiteSpace(_options.SiteKey))
            throw new InvalidOperationException("Cloudflare Turnstile não está configurado para o onboarding público.");
        if (string.IsNullOrWhiteSpace(token) || token.Length > 2048)
            throw DomainException.BadRequest("Confirme a verificação de segurança e tente novamente.");

        HttpResponseMessage response;
        try
        {
            response = await _http.PostAsync(
                VerifyUrl,
                new FormUrlEncodedContent(new Dictionary<string, string>
                {
                    ["secret"] = _options.SecretKey,
                    ["response"] = token,
                    ["remoteip"] = _context.HttpContext?.Connection.RemoteIpAddress?.ToString() ?? string.Empty
                }),
                cancellationToken);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            _ = ex;
            throw DomainException.BadRequest("A verificação de segurança está temporariamente indisponível. Tente novamente.");
        }
        using (response)
        {
        if (!response.IsSuccessStatusCode)
            throw DomainException.BadRequest("Não foi possível validar a verificação de segurança. Tente novamente.");

        var result = await response.Content.ReadFromJsonAsync<TurnstileResponse>(cancellationToken: cancellationToken);
        var hostnameValido = string.IsNullOrWhiteSpace(_options.ExpectedHostname) ||
            string.Equals(result?.Hostname, _options.ExpectedHostname, StringComparison.OrdinalIgnoreCase);
        var actionValida = string.Equals(result?.Action, action, StringComparison.Ordinal);
        if (result?.Success != true || !hostnameValido || !actionValida)
            throw DomainException.BadRequest("A verificação de segurança expirou ou não foi aprovada. Tente novamente.");
        }
    }

    private sealed class TurnstileResponse
    {
        [JsonPropertyName("success")] public bool Success { get; set; }
        [JsonPropertyName("hostname")] public string? Hostname { get; set; }
        [JsonPropertyName("action")] public string? Action { get; set; }
    }
}
