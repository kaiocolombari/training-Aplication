using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using TreinoAPI.Data;
using TreinoAPI.DTOs.Comunicacao;
using TreinoAPI.Hubs;
using TreinoAPI.Model;
using TreinoAPI.Security;

namespace TreinoAPI.Services;

public sealed record ChatAttachmentDownload(Stream Conteudo, string NomeOriginal);

public sealed class ChatAttachmentService
{
    private readonly AppDbContext _db;
    private readonly CurrentUserService _current;
    private readonly ChatAttachmentStorage _storage;
    private readonly ChatAttachmentSecurityScanner _scanner;
    private readonly IHubContext<ChatHub> _hub;
    private readonly ExpoPushService _push;
    private readonly ILogger<ChatAttachmentService> _logger;

    public ChatAttachmentService(
        AppDbContext db,
        CurrentUserService current,
        ChatAttachmentStorage storage,
        ChatAttachmentSecurityScanner scanner,
        IHubContext<ChatHub> hub,
        ExpoPushService push,
        ILogger<ChatAttachmentService> logger)
    {
        _db = db;
        _current = current;
        _storage = storage;
        _scanner = scanner;
        _hub = hub;
        _push = push;
        _logger = logger;
    }

    public async Task<Guid> EnviarAsync(Guid conversaId, IFormFile arquivo, string? legenda, CancellationToken cancellationToken)
    {
        var atual = _current.UsuarioId;
        var conversa = await ObterConversaAutorizadaAsync(conversaId, atual, cancellationToken);
        if (conversa.EhTemporaria && conversa.ExpiraEm <= DateTime.UtcNow)
            throw DomainException.Conflict("Esta conversa expirou. Inicie uma nova conversa para enviar arquivos.");
        if (arquivo is null || arquivo.Length <= 0 || arquivo.Length > ChatAttachmentSecurityScanner.MaxFileBytes)
            throw DomainException.BadRequest("O arquivo deve ter conteúdo e no máximo 20 MB.");

        var conteudo = legenda?.Trim() ?? string.Empty;
        if (conteudo.Length > 4000)
            throw DomainException.BadRequest("A legenda deve ter no máximo 4.000 caracteres.");
        var nome = NormalizarNome(arquivo.FileName);
        if (nome.Length == 0)
            throw DomainException.BadRequest("Nome de arquivo inválido.");

        string? temporario = null;
        string? armazenado = null;
        var persistido = false;
        try
        {
            temporario = await _storage.SalvarTemporarioAsync(arquivo, cancellationToken);
            var (mime, scanner) = await _scanner.VerificarAsync(
                _storage.ObterCaminhoTemporario(temporario), nome, cancellationToken);

            var agora = DateTime.UtcNow;
            var mensagemId = Guid.NewGuid();
            var anexoId = Guid.NewGuid();
            armazenado = _storage.Promover(temporario, anexoId);
            temporario = null;
            var destinatarioId = conversa.UsuarioAId == atual ? conversa.UsuarioBId : conversa.UsuarioAId;
            var mensagem = new MensagemEquipe
            {
                Id = mensagemId,
                ConversaId = conversaId,
                RemetenteId = atual,
                Conteudo = conteudo,
                EnviadaEm = agora
            };
            mensagem.Anexos.Add(new MensagemAnexo
            {
                Id = anexoId,
                MensagemId = mensagemId,
                NomeOriginal = nome,
                NomeArmazenado = armazenado,
                TipoConteudo = mime,
                TamanhoBytes = arquivo.Length,
                VerificadoEm = agora,
                VerificadoPor = scanner
            });
            conversa.UltimaAtividadeEm = agora;
            if (conversa.EhTemporaria) conversa.ExpiraEm = agora.AddHours(48);

            var remetente = await _db.Usuarios.AsNoTracking().Include(u => u.Personal).Include(u => u.Aluno)
                .FirstAsync(u => u.Id == atual, cancellationToken);
            _db.MensagensEquipe.Add(mensagem);
            _db.NotificacoesUsuarios.Add(new NotificacaoUsuario
            {
                Id = Guid.NewGuid(),
                UsuarioId = destinatarioId,
                Titulo = "Novo anexo recebido",
                Mensagem = nome,
                Tipo = "CHAT",
                ReferenciaId = conversaId,
                CriadaEm = agora
            });
            await _db.SaveChangesAsync(cancellationToken);
            persistido = true;

            try
            {
                await _hub.Clients.Group(ChatHub.Grupo(conversaId)).SendAsync("MensagemRecebida", new
                {
                    id = mensagemId,
                    conversaId,
                    remetenteId = atual,
                    remetenteNome = remetente.Personal?.Nome ?? remetente.Aluno?.NomeCompleto ?? remetente.Email,
                    remetenteTipo = remetente.Tipo.ToString(),
                    conteudo,
                    enviadaEm = agora,
                    entregueEm = (DateTime?)null,
                    lidaEm = (DateTime?)null,
                    anexos = new[] { new { id = anexoId, nomeOriginal = nome, tipoConteudo = mime, tamanhoBytes = arquivo.Length } }
                }, cancellationToken);
            }
            catch (Exception exception)
            {
                _logger.LogWarning(exception, "Anexo {AnexoId} salvo, mas não foi possível transmitir ao grupo da conversa.", anexoId);
            }
            try { await _hub.Clients.User(destinatarioId.ToString()).SendAsync("NovaMensagem", new { conversaId, mensagemId, remetenteId = atual }, cancellationToken); }
            catch (Exception exception) { _logger.LogWarning(exception, "Não foi possível notificar as conexões do destinatário do anexo {AnexoId}.", anexoId); }
            try
            {
                await _push.EnviarMensagemChatAsync(destinatarioId, conversaId, atual, "Novo anexo recebido", nome, cancellationToken);
            }
            catch (Exception exception)
            {
                _logger.LogWarning(exception, "Anexo {AnexoId} salvo, mas o envio da notificação push falhou.", anexoId);
            }
            return mensagemId;
        }
        catch
        {
            if (temporario is not null)
            {
                try { _storage.ExcluirTemporario(temporario); } catch { }
            }
            if (armazenado is not null && !persistido)
            {
                try { _storage.Excluir(armazenado); } catch { }
            }
            throw;
        }
    }

    public async Task<ChatAttachmentDownload> AbrirAsync(Guid anexoId, CancellationToken cancellationToken)
    {
        var atual = _current.UsuarioId;
        var anexo = await _db.MensagensAnexos.AsNoTracking()
            .Include(a => a.Mensagem).ThenInclude(m => m.Conversa)
            .Where(a => a.Id == anexoId &&
                (a.Mensagem.Conversa.UsuarioAId == atual || a.Mensagem.Conversa.UsuarioBId == atual) &&
                a.Mensagem.Conversa.UsuarioA.Ativo && a.Mensagem.Conversa.UsuarioB.Ativo &&
                (!a.Mensagem.Conversa.EhTemporaria || a.Mensagem.Conversa.ExpiraEm == null || a.Mensagem.Conversa.ExpiraEm > DateTime.UtcNow))
            .Select(a => new
            {
                a.NomeOriginal,
                a.NomeArmazenado,
                a.Mensagem.Conversa.UsuarioAId,
                a.Mensagem.Conversa.UsuarioBId
            })
            .FirstOrDefaultAsync(cancellationToken);
        if (anexo is null)
            throw DomainException.NotFound("Anexo não encontrado ou conversa expirada.");

        await ValidarVinculoSeConversaAlunoAsync(anexo.UsuarioAId, anexo.UsuarioBId, cancellationToken);
        try
        {
            return new ChatAttachmentDownload(_storage.AbrirLeitura(anexo.NomeArmazenado), anexo.NomeOriginal);
        }
        catch (FileNotFoundException)
        {
            throw DomainException.NotFound("O arquivo não está mais disponível no armazenamento.");
        }
    }

    public async Task<List<MensagemAnexoDTO>> ListarAnexosAsync(Guid mensagemId, CancellationToken cancellationToken) =>
        await _db.MensagensAnexos.AsNoTracking()
            .Where(a => a.MensagemId == mensagemId)
            .OrderBy(a => a.VerificadoEm)
            .Select(a => new MensagemAnexoDTO
            {
                Id = a.Id,
                NomeOriginal = a.NomeOriginal,
                TipoConteudo = a.TipoConteudo,
                TamanhoBytes = a.TamanhoBytes
            })
            .ToListAsync(cancellationToken);

    private async Task<ConversaEquipe> ObterConversaAutorizadaAsync(Guid conversaId, Guid atual, CancellationToken cancellationToken)
    {
        var conversa = await _db.ConversasEquipe
            .Include(c => c.UsuarioA).Include(c => c.UsuarioB)
            .FirstOrDefaultAsync(c => c.Id == conversaId &&
                (c.UsuarioAId == atual || c.UsuarioBId == atual) && c.UsuarioA.Ativo && c.UsuarioB.Ativo,
                cancellationToken);
        if (conversa is null) throw DomainException.NotFound("Conversa não encontrada.");
        await ValidarVinculoSeConversaAlunoAsync(conversa.UsuarioAId, conversa.UsuarioBId, cancellationToken);
        return conversa;
    }

    private async Task ValidarVinculoSeConversaAlunoAsync(Guid usuarioAId, Guid usuarioBId, CancellationToken cancellationToken)
    {
        var tipos = await _db.Usuarios.AsNoTracking()
            .Where(u => (u.Id == usuarioAId || u.Id == usuarioBId) && u.Ativo)
            .Select(u => u.Tipo).ToListAsync(cancellationToken);
        if (!tipos.Contains(TipoUsuario.ALUNO)) return;
        if (!tipos.Contains(TipoUsuario.PERSONAL) || tipos.Count != 2)
            throw DomainException.NotFound("Conversa não encontrada.");
    }

    private static string NormalizarNome(string? nome)
    {
        var seguro = Path.GetFileName((nome ?? string.Empty).Replace('\\', '/'));
        seguro = new string(seguro.Where(c => !char.IsControl(c)).ToArray()).Trim();
        return seguro.Length > 255 ? seguro[..255] : seguro;
    }

}
