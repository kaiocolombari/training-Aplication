using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using TreinoAPI.Data;
using TreinoAPI.Model;
using TreinoAPI.Services;

namespace TreinoAPI.Hubs;

[Authorize(Roles = "ADMIN,PERSONAL,ALUNO")]
public sealed class ChatHub : Hub
{
    private readonly AppDbContext _db;
    private readonly ChatPresenceTracker _presence;
    private readonly ExpoPushService _push;
    private readonly ILogger<ChatHub> _logger;

    public ChatHub(AppDbContext db, ChatPresenceTracker presence, ExpoPushService push, ILogger<ChatHub> logger)
    {
        _db = db;
        _presence = presence;
        _push = push;
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        if (ObterUsuarioId() is Guid usuarioId && _presence.Connected(usuarioId))
            await NotificarPresencaNasConversasAsync(usuarioId, true);

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (ObterUsuarioId() is Guid usuarioId && _presence.Disconnected(usuarioId))
            await NotificarPresencaNasConversasAsync(usuarioId, false);

        await base.OnDisconnectedAsync(exception);
    }

    public async Task EntrarConversa(Guid conversaId)
    {
        var conversa = await ObterConversaAutorizadaAsync(conversaId);
        if (conversa.EhTemporaria && conversa.ExpiraEm <= DateTime.UtcNow)
            throw new HubException("Esta conversa expirou após 48 horas sem atividade. Inicie uma nova conversa.");

        await Groups.AddToGroupAsync(Context.ConnectionId, Grupo(conversaId));

        var atual = ObterUsuarioId()!.Value;
        var pendentes = await _db.MensagensEquipe
            .Where(m => m.ConversaId == conversaId && m.RemetenteId != atual && m.EntregueEm == null)
            .ToListAsync();
        if (pendentes.Count > 0)
        {
            var agora = DateTime.UtcNow;
            foreach (var mensagem in pendentes) mensagem.EntregueEm = agora;
            await _db.SaveChangesAsync();
            try { await Clients.Group(Grupo(conversaId)).SendAsync("StatusMensagemAtualizado", new
            {
                conversaId,
                mensagemIds = pendentes.Select(m => m.Id),
                status = "ENTREGUE",
                em = agora
            }); }
            catch (Exception exception) { _logger.LogDebug(exception, "Não foi possível transmitir o status de entrega da conversa {ConversaId}.", conversaId); }
        }

        var outroUsuarioId = conversa.UsuarioAId == atual ? conversa.UsuarioBId : conversa.UsuarioAId;
        await Clients.Caller.SendAsync("PresencaInicial", new
        {
            usuarioId = outroUsuarioId,
            online = _presence.IsOnline(outroUsuarioId)
        });
    }

    public async Task SairConversa(Guid conversaId)
    {
        await ObterConversaAutorizadaAsync(conversaId);
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, Grupo(conversaId));
    }

    public async Task EnviarMensagem(Guid conversaId, string conteudo)
    {
        var conversa = await ObterConversaAutorizadaAsync(conversaId);
        var atual = ObterUsuarioId()!.Value;
        var texto = conteudo?.Trim() ?? string.Empty;
        if (texto.Length is < 1 or > 4000)
            throw new HubException("A mensagem deve conter entre 1 e 4.000 caracteres.");
        if (conversa.EhTemporaria && conversa.ExpiraEm <= DateTime.UtcNow)
            throw new HubException("Esta conversa expirou. Inicie uma nova conversa.");

        var destinatarioId = conversa.UsuarioAId == atual ? conversa.UsuarioBId : conversa.UsuarioAId;
        var agora = DateTime.UtcNow;
        var mensagem = new MensagemEquipe
        {
            Id = Guid.NewGuid(),
            ConversaId = conversaId,
            RemetenteId = atual,
            Conteudo = texto,
            EnviadaEm = agora
        };
        conversa.UltimaAtividadeEm = agora;
        if (conversa.EhTemporaria) conversa.ExpiraEm = agora.AddHours(48);

        var remetente = await _db.Usuarios.Include(u => u.Personal).Include(u => u.Aluno).FirstAsync(u => u.Id == atual);
        _db.MensagensEquipe.Add(mensagem);
        _db.NotificacoesUsuarios.Add(new NotificacaoUsuario
        {
            Id = Guid.NewGuid(),
            UsuarioId = destinatarioId,
            Titulo = "Nova mensagem",
            Mensagem = texto.Length > 140 ? texto[..140] + "..." : texto,
            Tipo = "CHAT",
            ReferenciaId = conversaId,
            CriadaEm = agora
        });
        await _db.SaveChangesAsync();

        var dto = new
        {
            id = mensagem.Id,
            conversaId,
            remetenteId = atual,
            remetenteNome = remetente.Personal?.Nome ?? remetente.Aluno?.NomeCompleto ?? remetente.Email,
            remetenteTipo = remetente.Tipo.ToString(),
            conteudo = texto,
            enviadaEm = agora,
            entregueEm = (DateTime?)null,
            lidaEm = (DateTime?)null
        };
        try
        {
            await Clients.Group(Grupo(conversaId)).SendAsync("MensagemRecebida", dto);
        }
        catch (Exception exception)
        {
            _logger.LogWarning(exception, "Mensagem {MensagemId} salva, mas não foi possível transmitir ao grupo da conversa.", mensagem.Id);
        }
        try { await Clients.User(destinatarioId.ToString()).SendAsync("NovaMensagem", new { conversaId, mensagemId = mensagem.Id, remetenteId = atual }); }
        catch (Exception exception) { _logger.LogWarning(exception, "Não foi possível notificar as conexões do destinatário da mensagem {MensagemId}.", mensagem.Id); }
        try { await _push.EnviarMensagemChatAsync(destinatarioId, conversaId, atual, "Nova mensagem", texto, Context.ConnectionAborted); }
        catch (Exception exception) { _logger.LogWarning(exception, "Mensagem {MensagemId} salva, mas o push não pôde ser enviado.", mensagem.Id); }
    }

    public async Task ConfirmarEntrega(Guid mensagemId)
    {
        var atual = ObterUsuarioId() ?? throw new HubException("Sessão inválida.");
        var mensagem = await _db.MensagensEquipe
            .Include(m => m.Conversa)
            .FirstOrDefaultAsync(m => m.Id == mensagemId && m.RemetenteId != atual &&
                (m.Conversa.UsuarioAId == atual || m.Conversa.UsuarioBId == atual));
        if (mensagem is null) throw new HubException("Mensagem não encontrada.");
        await ObterConversaAutorizadaAsync(mensagem.ConversaId);
        if (mensagem.EntregueEm is not null) return;

        mensagem.EntregueEm = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        try { await Clients.Group(Grupo(mensagem.ConversaId)).SendAsync("StatusMensagemAtualizado", new
        {
            conversaId = mensagem.ConversaId,
            mensagemIds = new[] { mensagem.Id },
            status = "ENTREGUE",
            em = mensagem.EntregueEm
        }); }
        catch (Exception exception) { _logger.LogDebug(exception, "Não foi possível transmitir a confirmação de entrega da mensagem {MensagemId}.", mensagemId); }
    }

    public async Task MarcarLida(Guid conversaId)
    {
        await ObterConversaAutorizadaAsync(conversaId);
        var atual = ObterUsuarioId()!.Value;
        var pendentes = await _db.MensagensEquipe
            .Where(m => m.ConversaId == conversaId && m.RemetenteId != atual && m.LidaEm == null)
            .ToListAsync();
        var agora = DateTime.UtcNow;
        foreach (var mensagem in pendentes)
        {
            mensagem.EntregueEm ??= agora;
            mensagem.LidaEm = agora;
        }
        var notificacoes = await _db.NotificacoesUsuarios
            .Where(n => n.UsuarioId == atual && n.Tipo == "CHAT" && n.ReferenciaId == conversaId && n.LidaEm == null)
            .ToListAsync();
        foreach (var notificacao in notificacoes) notificacao.LidaEm = agora;
        if (pendentes.Count == 0 && notificacoes.Count == 0) return;
        await _db.SaveChangesAsync();

        if (pendentes.Count > 0)
        {
            try
            {
                await Clients.Group(Grupo(conversaId)).SendAsync("StatusMensagemAtualizado", new
                {
                    conversaId,
                    mensagemIds = pendentes.Select(m => m.Id),
                    status = "LIDA",
                    em = agora
                });
            }
            catch (Exception exception)
            {
                _logger.LogDebug(exception, "Não foi possível transmitir a confirmação de leitura da conversa {ConversaId}.", conversaId);
            }
        }
    }

    public async Task UsuarioDigitando(Guid conversaId, bool digitando)
    {
        await ObterConversaAutorizadaAsync(conversaId);
        var atual = ObterUsuarioId()!.Value;
        await Clients.OthersInGroup(Grupo(conversaId)).SendAsync("UsuarioDigitando", new
        {
            usuarioId = atual,
            digitando
        });
    }

    private async Task<ConversaEquipe> ObterConversaAutorizadaAsync(Guid conversaId)
    {
        var atual = ObterUsuarioId() ?? throw new HubException("Sessão inválida.");
        var conversa = await _db.ConversasEquipe
            .Include(c => c.UsuarioA)
            .Include(c => c.UsuarioB)
            .FirstOrDefaultAsync(c => c.Id == conversaId &&
                (c.UsuarioAId == atual || c.UsuarioBId == atual) &&
                c.UsuarioA.Ativo && c.UsuarioB.Ativo);
        if (conversa is null) throw new HubException("Conversa não encontrada.");
        if (conversa.EhTemporaria && conversa.ExpiraEm <= DateTime.UtcNow)
            throw new HubException("Esta conversa expirou após 48 horas sem atividade.");

        if (conversa.UsuarioA.Tipo == TipoUsuario.ALUNO || conversa.UsuarioB.Tipo == TipoUsuario.ALUNO)
        {
            if (
                (conversa.UsuarioA.Tipo != TipoUsuario.PERSONAL && conversa.UsuarioB.Tipo != TipoUsuario.PERSONAL))
                throw new HubException("A conversa deve ocorrer entre um aluno e um personal.");
        }

        return conversa;
    }

    private Guid? ObterUsuarioId() =>
        Guid.TryParse(Context.User?.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;

    private async Task NotificarPresencaNasConversasAsync(Guid usuarioId, bool online)
    {
        var agora = DateTime.UtcNow;
        var conversas = await _db.ConversasEquipe.AsNoTracking()
            .Where(c => (c.UsuarioAId == usuarioId || c.UsuarioBId == usuarioId) &&
                c.UsuarioA.Ativo && c.UsuarioB.Ativo &&
                (!c.EhTemporaria || c.ExpiraEm == null || c.ExpiraEm > agora))
            .Select(c => c.Id)
            .Take(200)
            .ToListAsync();
        foreach (var conversaId in conversas)
            await Clients.Group(Grupo(conversaId)).SendAsync("PresencaAtualizada", usuarioId, online);
    }

    public static string Grupo(Guid conversaId) => $"conversa:{conversaId:N}";
}
