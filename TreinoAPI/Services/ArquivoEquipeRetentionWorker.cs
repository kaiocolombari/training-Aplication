using Microsoft.EntityFrameworkCore;
using TreinoAPI.Data;
using TreinoAPI.Model;

namespace TreinoAPI.Services;

public sealed class ArquivoEquipeRetentionWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ArquivoEquipeStorage _storage;
    private readonly ILogger<ArquivoEquipeRetentionWorker> _logger;

    public ArquivoEquipeRetentionWorker(
        IServiceScopeFactory scopeFactory,
        ArquivoEquipeStorage storage,
        ILogger<ArquivoEquipeRetentionWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _storage = storage;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await ProcessarCicloAsync(stoppingToken);

        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(5));
        while (await timer.WaitForNextTickAsync(stoppingToken))
            await ProcessarCicloAsync(stoppingToken);
    }

    private async Task ProcessarCicloAsync(CancellationToken cancellationToken)
    {
        try
        {
            await using var scope = _scopeFactory.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var agora = DateTime.UtcNow;
            var limiteAviso = agora.AddHours(12);

            var publicacoesParaAvisar = await db.ArquivosEquipe
                .AsNoTracking()
                .Where(item => item.AvisoExpiracaoEnviadoEm == null &&
                    item.ExpiraEm > agora && item.ExpiraEm <= limiteAviso)
                .Select(item => new { item.Id, item.Nome, item.ExpiraEm })
                .ToListAsync(cancellationToken);

            foreach (var publicacao in publicacoesParaAvisar)
            {
                await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
                var marcada = await db.ArquivosEquipe
                    .Where(item => item.Id == publicacao.Id &&
                        item.AvisoExpiracaoEnviadoEm == null &&
                        item.ExpiraEm > agora && item.ExpiraEm <= limiteAviso)
                    .ExecuteUpdateAsync(atualizacao => atualizacao
                        .SetProperty(item => item.AvisoExpiracaoEnviadoEm, agora), cancellationToken);

                if (marcada == 0)
                {
                    await transaction.RollbackAsync(cancellationToken);
                    continue;
                }

                var membros = await db.Usuarios
                    .Where(usuario => usuario.Tipo == TipoUsuario.ADMIN || usuario.Tipo == TipoUsuario.PERSONAL)
                    .Select(usuario => usuario.Id)
                    .ToListAsync(cancellationToken);

                var mensagem = $"A publicação '{publicacao.Nome}' será excluída automaticamente em até 12 horas ({publicacao.ExpiraEm:dd/MM/yyyy HH:mm} UTC). Baixe os anexos antes do prazo.";
                db.NotificacoesUsuarios.AddRange(membros.Select(usuarioId => new NotificacaoUsuario
                {
                    Id = Guid.NewGuid(),
                    UsuarioId = usuarioId,
                    Titulo = "Arquivo da equipe perto de expirar",
                    Mensagem = mensagem,
                    Tipo = "ARQUIVO_EQUIPE",
                    ReferenciaId = publicacao.Id,
                    CriadaEm = agora
                }));

                await db.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);
                _logger.LogInformation("Aviso de expiração enviado para a publicação {PublicacaoId}.", publicacao.Id);
            }

            var expiradas = await db.ArquivosEquipe
                .Include(item => item.Arquivos)
                .Where(item => item.ExpiraEm <= agora)
                .ToListAsync(cancellationToken);

            foreach (var publicacao in expiradas)
            {
                try
                {
                    foreach (var anexo in publicacao.Arquivos)
                        _storage.Excluir(anexo.NomeArmazenado);

                    db.ArquivosEquipe.Remove(publicacao);
                }
                catch (Exception exception)
                {
                    _logger.LogWarning(exception, "Não foi possível excluir os anexos da publicação expirada {PublicacaoId}; nova tentativa ocorrerá no próximo ciclo.", publicacao.Id);
                }
            }

            if (expiradas.Count > 0)
                await db.SaveChangesAsync(cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Falha ao processar alertas e expiração dos arquivos da equipe.");
        }
    }
}
