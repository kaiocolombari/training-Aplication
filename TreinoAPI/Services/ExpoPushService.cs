using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using TreinoAPI.Data;

namespace TreinoAPI.Services;

public sealed class ExpoPushService
{
    private readonly AppDbContext _db;
    private readonly HttpClient _http;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ExpoPushService> _logger;

    public ExpoPushService(AppDbContext db, HttpClient http, IConfiguration configuration, ILogger<ExpoPushService> logger)
    {
        _db = db;
        _http = http;
        _configuration = configuration;
        _logger = logger;
        _http.BaseAddress = new Uri("https://exp.host/");
        _http.Timeout = TimeSpan.FromSeconds(8);
    }

    public async Task EnviarMensagemChatAsync(Guid usuarioId, Guid conversaId, Guid remetenteId, string titulo, string mensagem, CancellationToken cancellationToken = default)
    {
        var tokens = await _db.TokensPushUsuarios.AsNoTracking()
            .Where(item => item.UsuarioId == usuarioId)
            .Select(item => item.Token)
            .ToListAsync(cancellationToken);
        if (tokens.Count == 0) return;

        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, "--/api/v2/push/send")
            {
                Content = JsonContent.Create(tokens.Select(token => new
                {
                    to = token,
                    sound = "default",
                    title = titulo,
                    body = mensagem,
                    channelId = "mensagens",
                    priority = "high",
                    data = new { type = "CHAT", conversaId, remetenteId }
                }).ToArray())
            };
            var accessToken = _configuration["EXPO_ACCESS_TOKEN"];
            if (!string.IsNullOrWhiteSpace(accessToken))
                request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);

            using var response = await _http.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
                _logger.LogWarning("Expo Push retornou HTTP {StatusCode} para o usuário {UsuarioId}.", (int)response.StatusCode, usuarioId);
        }
        catch (Exception exception) when (exception is HttpRequestException or TaskCanceledException)
        {
            _logger.LogWarning(exception, "Não foi possível enviar push de chat para o usuário {UsuarioId}.", usuarioId);
        }
    }
}
