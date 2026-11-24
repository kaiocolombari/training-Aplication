using Microsoft.EntityFrameworkCore;
using TreinoAPI.Data;

namespace TreinoAPI.Services;

public sealed class ChatRetentionWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ChatAttachmentStorage _storage;
    private readonly ILogger<ChatRetentionWorker> _logger;

    public ChatRetentionWorker(IServiceScopeFactory scopeFactory, ChatAttachmentStorage storage, ILogger<ChatRetentionWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _storage = storage;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await ProcessarAsync(stoppingToken);
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(1));
        while (await timer.WaitForNextTickAsync(stoppingToken))
            await ProcessarAsync(stoppingToken);
    }

    private async Task ProcessarAsync(CancellationToken cancellationToken)
    {
        try
        {
            await using var scope = _scopeFactory.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var agora = DateTime.UtcNow;
            var expiradas = await db.ConversasEquipe
                .Where(c => c.EhTemporaria && c.ExpiraEm != null && c.ExpiraEm <= agora)
                .Include(c => c.Mensagens).ThenInclude(m => m.Anexos)
                .Take(250)
                .ToListAsync(cancellationToken);

            if (expiradas.Count == 0) return;

            foreach (var anexo in expiradas.SelectMany(c => c.Mensagens).SelectMany(m => m.Anexos))
                _storage.Excluir(anexo.NomeArmazenado);
            var ids = expiradas.Select(c => c.Id).ToArray();

            await db.ConversasEquipe
                .Where(c => ids.Contains(c.Id) && c.EhTemporaria && c.ExpiraEm <= agora)
                .ExecuteDeleteAsync(cancellationToken);
            await db.NotificacoesUsuarios
                .Where(n => n.Tipo == "CHAT" && n.ReferenciaId != null && ids.Contains(n.ReferenciaId.Value))
                .ExecuteDeleteAsync(cancellationToken);

            _logger.LogInformation("Foram removidas {Quantidade} conversas temporárias expiradas.", ids.Length);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Falha ao remover conversas temporárias expiradas.");
        }
    }
}
