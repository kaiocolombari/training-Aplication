using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using Npgsql;
using TreinoAPI.Data;
using TreinoAPI.DTOs.Comunicacao;
using TreinoAPI.Hubs;
using TreinoAPI.Model;
using TreinoAPI.Security;

namespace TreinoAPI.Services;

public sealed class ComunicacaoService
{
    private readonly AppDbContext _db;
    private readonly CurrentUserService _current;
    private readonly IHubContext<ChatHub> _hub;
    private readonly ExpoPushService _push;
    private readonly ChatAttachmentStorage _attachmentStorage;
    private readonly ILogger<ComunicacaoService> _logger;

    public ComunicacaoService(AppDbContext db, CurrentUserService current, IHubContext<ChatHub> hub, ExpoPushService push, ChatAttachmentStorage attachmentStorage, ILogger<ComunicacaoService> logger)
    {
        _db = db;
        _current = current;
        _hub = hub;
        _push = push;
        _attachmentStorage = attachmentStorage;
        _logger = logger;
    }

    // Reusable hooks for domain services to raise alerts when important events occur.
    public async Task NotificarUsuarioAsync(Guid usuarioId, string titulo, string mensagem, string tipo = "SISTEMA", Guid? referenciaId = null)
    {
        if (!await _db.Usuarios.AnyAsync(u => u.Id == usuarioId && u.Ativo))
            return;

        _db.NotificacoesUsuarios.Add(new NotificacaoUsuario
        {
            Id = Guid.NewGuid(),
            UsuarioId = usuarioId,
            Titulo = titulo.Trim(),
            Mensagem = mensagem.Trim(),
            Tipo = tipo,
            ReferenciaId = referenciaId,
            CriadaEm = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();
    }

    public async Task NotificarAdministradoresAsync(
        string titulo,
        string mensagem,
        string tipo = "ALERTA",
        Guid? referenciaId = null)
    {
        var administradores = await _db.Usuarios
            .Where(u => u.Ativo && u.Tipo == TipoUsuario.ADMIN)
            .Select(u => u.Id)
            .ToListAsync();
        var agora = DateTime.UtcNow;
        _db.NotificacoesUsuarios.AddRange(administradores.Select(usuarioId => new NotificacaoUsuario
        {
            Id = Guid.NewGuid(),
            UsuarioId = usuarioId,
            Titulo = titulo.Trim(),
            Mensagem = mensagem.Trim(),
            Tipo = tipo,
            ReferenciaId = referenciaId,
            CriadaEm = agora
        }));
        await _db.SaveChangesAsync();
    }

    public async Task NotificarEquipeAsync(string titulo, string mensagem, string tipo = "SISTEMA", Guid? referenciaId = null)
    {
        var usuarios = await _db.Usuarios
            .Where(u => u.Ativo && (u.Tipo == TipoUsuario.ADMIN || u.Tipo == TipoUsuario.PERSONAL))
            .Select(u => u.Id)
            .ToListAsync();
        var agora = DateTime.UtcNow;
        _db.NotificacoesUsuarios.AddRange(usuarios.Select(usuarioId => new NotificacaoUsuario
        {
            Id = Guid.NewGuid(),
            UsuarioId = usuarioId,
            Titulo = titulo.Trim(),
            Mensagem = mensagem.Trim(),
            Tipo = tipo,
            ReferenciaId = referenciaId,
            CriadaEm = agora
        }));
        await _db.SaveChangesAsync();
    }

    public async Task<List<MembroEquipeDTO>> ListarEquipeAsync()
    {
        var atual = _current.UsuarioId;
        return await _db.Usuarios
            .AsNoTracking()
            .Where(u => u.Ativo && u.Id != atual && (u.Tipo == TipoUsuario.ADMIN || u.Tipo == TipoUsuario.PERSONAL))
            .OrderBy(u => u.Tipo)
            .ThenBy(u => u.Personal != null ? u.Personal.Nome : u.Email)
            .Select(u => new MembroEquipeDTO
            {
                UsuarioId = u.Id,
                Nome = u.Personal != null ? u.Personal.Nome : u.Email,
                Email = u.Email,
                Tipo = u.Tipo.ToString()
            })
            .ToListAsync();
    }

    public async Task<List<ConversaEquipeDTO>> ListarConversasAsync()
    {
        var atual = _current.UsuarioId;
        var conversas = await _db.ConversasEquipe
            .AsNoTracking()
            .Where(c => (c.UsuarioAId == atual || c.UsuarioBId == atual) && !c.EhTemporaria &&
                c.UsuarioA.Ativo && c.UsuarioB.Ativo &&
                c.UsuarioA.Tipo != TipoUsuario.ALUNO && c.UsuarioB.Tipo != TipoUsuario.ALUNO)
            .Include(c => c.UsuarioA).ThenInclude(u => u.Personal)
            .Include(c => c.UsuarioB).ThenInclude(u => u.Personal)
            .Include(c => c.Mensagens.OrderByDescending(m => m.EnviadaEm).Take(1))
            .OrderByDescending(c => c.Mensagens.Max(m => m.EnviadaEm))
            .Take(60)
            .ToListAsync();

        var ids = conversas.Select(c => c.Id).ToArray();
        var naoLidas = await _db.MensagensEquipe
            .Where(m => ids.Contains(m.ConversaId) && m.RemetenteId != atual && m.LidaEm == null)
            .GroupBy(m => m.ConversaId)
            .Select(g => new { ConversaId = g.Key, Total = g.Count() })
            .ToDictionaryAsync(g => g.ConversaId, g => g.Total);

        return conversas.Select(c =>
        {
            var outro = c.UsuarioAId == atual ? c.UsuarioB : c.UsuarioA;
            var ultima = c.Mensagens.OrderByDescending(m => m.EnviadaEm).FirstOrDefault();
            return new ConversaEquipeDTO
            {
                Id = c.Id,
                OutroUsuarioId = outro.Id,
                OutroUsuarioNome = outro.Personal?.Nome ?? outro.Email,
                OutroUsuarioTipo = outro.Tipo.ToString(),
                UltimaMensagem = ultima?.Conteudo,
                UltimaMensagemEm = ultima?.EnviadaEm,
                NaoLidas = naoLidas.GetValueOrDefault(c.Id)
            };
        }).ToList();
    }

    public async Task<List<ConversaAlunoDTO>> ListarConversasAlunosAsync()
    {
        var atual = _current.UsuarioId;
        List<(Guid AlunoId, Guid AlunoUsuarioId, string AlunoNome, Guid PersonalUsuarioId, string PersonalNome)> links;
        if (_current.Role == "PERSONAL")
        {
            var personal = await _db.Personais.AsNoTracking()
                .Where(p => p.UsuarioId == atual && p.Usuario!.Ativo)
                .Select(p => new { p.UsuarioId, p.Nome })
                .FirstOrDefaultAsync() ?? throw DomainException.Forbidden();
            var alunosEquipe = await _db.Alunos.AsNoTracking()
                .Where(a => a.Usuario.Ativo)
                .Select(a => new
                {
                    AlunoId = a.Id,
                    AlunoUsuarioId = a.UsuarioId,
                    AlunoNome = a.NomeCompleto,
                    PersonalUsuarioId = personal.UsuarioId,
                    PersonalNome = personal.Nome
                }).ToListAsync();
            links = alunosEquipe.Select(v => (v.AlunoId, v.AlunoUsuarioId, v.AlunoNome, v.PersonalUsuarioId, v.PersonalNome)).ToList();
        }
        else if (_current.Role == "ADMIN")
        {
            var linksAdmin = await _db.PersonalAlunos.AsNoTracking()
                .Where(v => v.Ativo && v.Aluno.Usuario.Ativo && v.Personal.Usuario != null && v.Personal.Usuario.Ativo)
                .Select(v => new
                {
                    v.AlunoId,
                    AlunoUsuarioId = v.Aluno.UsuarioId,
                    AlunoNome = v.Aluno.NomeCompleto,
                    PersonalUsuarioId = v.Personal.UsuarioId,
                    PersonalNome = v.Personal.Nome
                }).ToListAsync();
            links = linksAdmin.Select(v => (v.AlunoId, v.AlunoUsuarioId, v.AlunoNome, v.PersonalUsuarioId, v.PersonalNome)).ToList();
        }
        else throw DomainException.Forbidden();

        var alunoUsuarios = links.Select(v => v.AlunoUsuarioId).Distinct().ToArray();
        var personalUsuarios = links.Select(v => v.PersonalUsuarioId).Distinct().ToArray();
        var conversas = links.Count == 0 ? new List<ConversaEquipe>() : await _db.ConversasEquipe.AsNoTracking()
            .Where(c =>
                (personalUsuarios.Contains(c.UsuarioAId) && alunoUsuarios.Contains(c.UsuarioBId)) ||
                (personalUsuarios.Contains(c.UsuarioBId) && alunoUsuarios.Contains(c.UsuarioAId)))
            .Where(c => !c.EhTemporaria || c.ExpiraEm == null || c.ExpiraEm > DateTime.UtcNow)
            .Include(c => c.Mensagens.OrderByDescending(m => m.EnviadaEm).Take(1))
            .ToListAsync();
        var porPar = conversas.ToDictionary(c => OrdenarUsuarios(c.UsuarioAId, c.UsuarioBId));
        var conversaIds = conversas.Select(c => c.Id).ToArray();
        var naoLidas = conversaIds.Length == 0
            ? new Dictionary<Guid, int>()
            : await _db.MensagensEquipe.AsNoTracking()
                .Where(m => conversaIds.Contains(m.ConversaId) && m.LidaEm == null && alunoUsuarios.Contains(m.RemetenteId))
                .GroupBy(m => m.ConversaId)
                .Select(g => new { g.Key, Total = g.Count() })
                .ToDictionaryAsync(g => g.Key, g => g.Total);

        var resultado = links.Select(link =>
        {
            porPar.TryGetValue(OrdenarUsuarios(link.PersonalUsuarioId, link.AlunoUsuarioId), out var conversa);
            var ultima = conversa?.Mensagens.OrderByDescending(m => m.EnviadaEm).FirstOrDefault();
            return new ConversaAlunoDTO
            {
                AlunoId = link.AlunoId,
                OutroUsuarioId = link.AlunoUsuarioId,
                OutroUsuarioNome = link.AlunoNome,
                OutroUsuarioTipo = "ALUNO",
                ConversaId = conversa?.Id,
                UltimaMensagem = ultima?.Conteudo,
                UltimaMensagemEm = ultima?.EnviadaEm,
                NaoLidas = conversa is null ? 0 : naoLidas.GetValueOrDefault(conversa.Id),
                ExpiraEm = conversa?.ExpiraEm,
                EhTemporaria = conversa?.EhTemporaria ?? true
            };
        }).ToList();

        // Conversas iniciadas pelo aluno também aparecem para o personal, mesmo sem vínculo formal.
        if (_current.Role == "PERSONAL")
        {
            var conversasDiretas = await _db.ConversasEquipe.AsNoTracking()
                .Where(c => (c.UsuarioAId == atual || c.UsuarioBId == atual) &&
                    (c.UsuarioA.Tipo == TipoUsuario.ALUNO || c.UsuarioB.Tipo == TipoUsuario.ALUNO) &&
                    c.UsuarioA.Ativo && c.UsuarioB.Ativo &&
                    (!c.EhTemporaria || c.ExpiraEm == null || c.ExpiraEm > DateTime.UtcNow))
                .Include(c => c.UsuarioA).ThenInclude(u => u.Aluno)
                .Include(c => c.UsuarioB).ThenInclude(u => u.Aluno)
                .Include(c => c.Mensagens.OrderByDescending(m => m.EnviadaEm).Take(1))
                .ToListAsync();
            var diretasIds = conversasDiretas.Select(c => c.Id).ToArray();
            var naoLidasDiretas = diretasIds.Length == 0
                ? new Dictionary<Guid, int>()
                : await _db.MensagensEquipe.AsNoTracking()
                    .Where(m => diretasIds.Contains(m.ConversaId) && m.RemetenteId != atual && m.LidaEm == null)
                    .GroupBy(m => m.ConversaId)
                    .Select(g => new { g.Key, Total = g.Count() })
                    .ToDictionaryAsync(g => g.Key, g => g.Total);

            foreach (var conversa in conversasDiretas)
            {
                var alunoUsuario = conversa.UsuarioAId == atual ? conversa.UsuarioB : conversa.UsuarioA;
                if (resultado.Any(item => item.OutroUsuarioId == alunoUsuario.Id)) continue;
                var ultima = conversa.Mensagens.OrderByDescending(m => m.EnviadaEm).FirstOrDefault();
                resultado.Add(new ConversaAlunoDTO
                {
                    AlunoId = alunoUsuario.Aluno?.Id ?? Guid.Empty,
                    OutroUsuarioId = alunoUsuario.Id,
                    OutroUsuarioNome = alunoUsuario.Aluno?.NomeCompleto ?? alunoUsuario.Email,
                    OutroUsuarioTipo = "ALUNO",
                    ConversaId = conversa.Id,
                    UltimaMensagem = ultima?.Conteudo,
                    UltimaMensagemEm = ultima?.EnviadaEm,
                    NaoLidas = naoLidasDiretas.GetValueOrDefault(conversa.Id),
                    ExpiraEm = conversa.ExpiraEm,
                    EhTemporaria = conversa.EhTemporaria
                });
            }
        }

        return resultado;
    }

    public async Task<List<ResumoChatAlunoDTO>> ListarResumoChatsAlunosAsync()
    {
        var conversas = await ListarConversasAlunosAsync();
        return conversas.Where(c => c.AlunoId.HasValue).GroupBy(c => c.AlunoId!.Value)
            .Select(g => new ResumoChatAlunoDTO
            {
                AlunoId = g.Key,
                NaoLidas = g.Sum(c => c.NaoLidas)
            })
            .ToList();
    }

    public async Task<List<ConversaAlunoDTO>> ListarConversasPersonaisAlunoAsync()
    {
        if (_current.Role != "ALUNO") throw DomainException.Forbidden();

        var atual = _current.UsuarioId;
        var links = await _db.Usuarios.AsNoTracking()
            .Where(u => u.Ativo && u.Tipo == TipoUsuario.PERSONAL && u.Personal != null)
            .Select(u => new
            {
                PersonalUsuarioId = u.Id,
                PersonalNome = u.Personal!.Nome
            })
            .ToListAsync();
        if (links.Count == 0) return [];

        var personalUsuarios = links.Select(v => v.PersonalUsuarioId).Distinct().ToArray();
        var conversas = await _db.ConversasEquipe.AsNoTracking()
            .Where(c =>
                (c.UsuarioAId == atual && personalUsuarios.Contains(c.UsuarioBId)) ||
                (c.UsuarioBId == atual && personalUsuarios.Contains(c.UsuarioAId)))
            .Where(c => !c.EhTemporaria || c.ExpiraEm == null || c.ExpiraEm > DateTime.UtcNow)
            .Include(c => c.Mensagens.OrderByDescending(m => m.EnviadaEm).Take(1))
            .ToListAsync();
        var porPersonal = conversas.ToDictionary(
            c => c.UsuarioAId == atual ? c.UsuarioBId : c.UsuarioAId);
        var conversaIds = conversas.Select(c => c.Id).ToArray();
        var naoLidas = conversaIds.Length == 0
            ? new Dictionary<Guid, int>()
            : await _db.MensagensEquipe.AsNoTracking()
                .Where(m => conversaIds.Contains(m.ConversaId) && m.LidaEm == null && m.RemetenteId != atual)
                .GroupBy(m => m.ConversaId)
                .Select(g => new { g.Key, Total = g.Count() })
                .ToDictionaryAsync(g => g.Key, g => g.Total);

        return links.Select(link =>
        {
            porPersonal.TryGetValue(link.PersonalUsuarioId, out var conversa);
            var ultima = conversa?.Mensagens.OrderByDescending(m => m.EnviadaEm).FirstOrDefault();
            return new ConversaAlunoDTO
            {
                AlunoId = null,
                OutroUsuarioId = link.PersonalUsuarioId,
                OutroUsuarioNome = link.PersonalNome,
                OutroUsuarioTipo = "PERSONAL",
                ConversaId = conversa?.Id,
                UltimaMensagem = ultima?.Conteudo,
                UltimaMensagemEm = ultima?.EnviadaEm,
                NaoLidas = conversa is null ? 0 : naoLidas.GetValueOrDefault(conversa.Id),
                ExpiraEm = conversa?.ExpiraEm,
                EhTemporaria = conversa?.EhTemporaria ?? true
            };
        }).ToList();
    }

    private static (Guid A, Guid B) OrdenarUsuarios(Guid a, Guid b) =>
        a.CompareTo(b) <= 0 ? (a, b) : (b, a);

    public async Task<List<MensagemEquipeDTO>> ListarMensagensAsync(Guid conversaId)
    {
        var atual = _current.UsuarioId;
        var conversa = await _db.ConversasEquipe
            .FirstOrDefaultAsync(c => c.Id == conversaId &&
                (c.UsuarioAId == atual || c.UsuarioBId == atual) && c.UsuarioA.Ativo && c.UsuarioB.Ativo &&
                (!c.EhTemporaria || c.ExpiraEm == null || c.ExpiraEm > DateTime.UtcNow));
        if (conversa is null)
            throw DomainException.NotFound("Conversa não encontrada.");

        var tiposParticipantes = await _db.Usuarios.AsNoTracking()
            .Where(u => u.Id == conversa.UsuarioAId || u.Id == conversa.UsuarioBId)
            .Select(u => u.Tipo)
            .ToListAsync();
        if (tiposParticipantes.Contains(TipoUsuario.ALUNO) &&
            !await EhVinculoChatAlunoPersonalAsync(conversa.UsuarioAId, conversa.UsuarioBId))
            throw DomainException.NotFound("Conversa não encontrada.");
        if (_current.Role == "ALUNO" && !tiposParticipantes.Contains(TipoUsuario.PERSONAL))
            throw DomainException.NotFound("Conversa não encontrada.");

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
        foreach (var notificacao in notificacoes)
            notificacao.LidaEm = agora;

        if (pendentes.Count > 0 || notificacoes.Count > 0)
        {
            await _db.SaveChangesAsync();
            try { await _hub.Clients.Group(ChatHub.Grupo(conversaId)).SendAsync("StatusMensagemAtualizado", new
            {
                conversaId,
                mensagemIds = pendentes.Select(m => m.Id),
                status = "LIDA",
                em = agora
            }); }
            catch (Exception exception) { _logger.LogDebug(exception, "Não foi possível transmitir o status de leitura da conversa {ConversaId}.", conversaId); }
        }

        var mensagens = await _db.MensagensEquipe
            .AsNoTracking()
            .Where(m => m.ConversaId == conversaId)
            .Include(m => m.Remetente).ThenInclude(u => u.Personal)
            .Include(m => m.Remetente).ThenInclude(u => u.Aluno)
            .Include(m => m.Anexos)
            .OrderByDescending(m => m.EnviadaEm)
            .Take(100)
            .ToListAsync();

        return mensagens.OrderBy(m => m.EnviadaEm).Select(m => new MensagemEquipeDTO
        {
            Id = m.Id,
            RemetenteId = m.RemetenteId,
            RemetenteNome = m.Remetente.Personal?.Nome ?? m.Remetente.Aluno?.NomeCompleto ?? m.Remetente.Email,
            RemetenteTipo = m.Remetente.Tipo.ToString(),
            Conteudo = m.Conteudo,
            EnviadaEm = m.EnviadaEm,
            EntregueEm = m.EntregueEm,
            LidaEm = m.LidaEm,
            Anexos = m.Anexos.Select(a => new MensagemAnexoDTO
            {
                Id = a.Id,
                NomeOriginal = a.NomeOriginal,
                TipoConteudo = a.TipoConteudo,
                TamanhoBytes = a.TamanhoBytes
            }).ToList()
        }).ToList();
    }

    public async Task<Guid> EnviarMensagemAsync(Guid destinatarioId, EnviarMensagemEquipeDTO dto)
    {
        var atual = _current.UsuarioId;
        var conteudo = dto.Conteudo.Trim();
        if (conteudo.Length is < 1 or > 4000)
            throw DomainException.BadRequest("A mensagem deve conter entre 1 e 4.000 caracteres.");

        var remetente = await _db.Usuarios.AsNoTracking()
            .Where(u => u.Id == atual && u.Ativo)
            .Select(u => u.Tipo)
            .FirstOrDefaultAsync();
        var destinatario = await _db.Usuarios
            .FirstOrDefaultAsync(u => u.Id == destinatarioId && u.Ativo);
        if (destinatario is null || destinatarioId == atual)
            throw DomainException.NotFound("Membro da equipe não encontrado.");

        var conversaEquipe =
            (remetente is TipoUsuario.ADMIN or TipoUsuario.PERSONAL) &&
            (destinatario.Tipo is TipoUsuario.ADMIN or TipoUsuario.PERSONAL);
        var conversaAlunoPersonal =
            (remetente == TipoUsuario.PERSONAL && destinatario.Tipo == TipoUsuario.ALUNO) ||
            (remetente == TipoUsuario.ALUNO && destinatario.Tipo == TipoUsuario.PERSONAL);
        if (!conversaEquipe &&
            !conversaAlunoPersonal)
            throw DomainException.NotFound("Destinatário não encontrado ou sem permissão para conversa.");

        var usuarioA = atual.CompareTo(destinatarioId) < 0 ? atual : destinatarioId;
        var usuarioB = atual.CompareTo(destinatarioId) < 0 ? destinatarioId : atual;
        var conversa = await _db.ConversasEquipe
            .Include(c => c.Mensagens).ThenInclude(m => m.Anexos)
            .FirstOrDefaultAsync(c => c.UsuarioAId == usuarioA && c.UsuarioBId == usuarioB);

        if (conversa?.EhTemporaria == true && conversa.ExpiraEm <= DateTime.UtcNow)
        {
            await ExcluirConversaExpiradaAsync(conversa);
            conversa = null;
        }

        if (conversa is null)
        {
            conversa = await CriarConversaOuObterExistenteAsync(usuarioA, usuarioB, conversaAlunoPersonal);
        }

        var agora = DateTime.UtcNow;
        conversa.UltimaAtividadeEm = agora;
        if (conversa.EhTemporaria)
            conversa.ExpiraEm = agora.AddHours(48);
        var mensagemId = Guid.NewGuid();
        _db.MensagensEquipe.Add(new MensagemEquipe
        {
            Id = mensagemId,
            ConversaId = conversa.Id,
            RemetenteId = atual,
            Conteudo = conteudo,
            EnviadaEm = agora
        });
        _db.NotificacoesUsuarios.Add(new NotificacaoUsuario
        {
            Id = Guid.NewGuid(),
            UsuarioId = destinatarioId,
            Titulo = "Nova mensagem",
            Mensagem = conteudo.Length > 140 ? conteudo[..140] + "..." : conteudo,
            Tipo = "CHAT",
            ReferenciaId = conversa.Id,
            CriadaEm = agora
        });

        await _db.SaveChangesAsync();
        var remetenteComPerfil = await _db.Usuarios.AsNoTracking()
            .Include(u => u.Personal)
            .Include(u => u.Aluno)
            .FirstAsync(u => u.Id == atual);
        try
        {
            await _hub.Clients.Group(ChatHub.Grupo(conversa.Id)).SendAsync("MensagemRecebida", new
            {
                id = mensagemId,
                conversaId = conversa.Id,
                remetenteId = atual,
                remetenteNome = remetenteComPerfil.Personal?.Nome ?? remetenteComPerfil.Aluno?.NomeCompleto ?? remetenteComPerfil.Email,
                remetenteTipo = remetente.ToString(),
                conteudo,
                enviadaEm = agora,
                entregueEm = (DateTime?)null,
                lidaEm = (DateTime?)null
            });
        }
        catch (Exception exception)
        {
            _logger.LogWarning(exception, "Mensagem {MensagemId} salva, mas não foi possível transmitir ao grupo da conversa.", mensagemId);
        }
        try { await _hub.Clients.User(destinatarioId.ToString()).SendAsync("NovaMensagem", new { conversaId = conversa.Id, mensagemId, remetenteId = atual }); }
        catch (Exception exception) { _logger.LogWarning(exception, "Não foi possível notificar as conexões do destinatário da mensagem {MensagemId}.", mensagemId); }
        try { await _push.EnviarMensagemChatAsync(destinatarioId, conversa.Id, atual, "Nova mensagem", conteudo, CancellationToken.None); }
        catch (Exception exception) { _logger.LogWarning(exception, "Mensagem {MensagemId} salva, mas o push não pôde ser enviado.", mensagemId); }
        return conversa.Id;
    }

    public async Task<Guid> ObterOuCriarConversaAsync(Guid destinatarioId)
    {
        var atual = _current.UsuarioId;
        var remetente = await _db.Usuarios.AsNoTracking()
            .Where(u => u.Id == atual && u.Ativo).Select(u => u.Tipo).FirstOrDefaultAsync();
        var destinatario = await _db.Usuarios.AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == destinatarioId && u.Ativo);
        if (destinatario is null || destinatarioId == atual)
            throw DomainException.NotFound("Destinatário não encontrado.");

        var equipe = (remetente is TipoUsuario.ADMIN or TipoUsuario.PERSONAL) &&
            (destinatario.Tipo is TipoUsuario.ADMIN or TipoUsuario.PERSONAL);
        var alunoPersonal = (remetente == TipoUsuario.PERSONAL && destinatario.Tipo == TipoUsuario.ALUNO) ||
            (remetente == TipoUsuario.ALUNO && destinatario.Tipo == TipoUsuario.PERSONAL);
        if (!equipe && !alunoPersonal)
            throw DomainException.NotFound("Destinatário não encontrado ou sem permissão para conversa.");

        var usuarioA = atual.CompareTo(destinatarioId) < 0 ? atual : destinatarioId;
        var usuarioB = atual.CompareTo(destinatarioId) < 0 ? destinatarioId : atual;
        var conversa = await _db.ConversasEquipe
            .Include(c => c.Mensagens).ThenInclude(m => m.Anexos)
            .FirstOrDefaultAsync(c => c.UsuarioAId == usuarioA && c.UsuarioBId == usuarioB);
        var agora = DateTime.UtcNow;
        if (conversa?.EhTemporaria == true && conversa.ExpiraEm <= agora)
        {
            await ExcluirConversaExpiradaAsync(conversa);
            conversa = null;
        }

        if (conversa is null)
        {
            conversa = await CriarConversaOuObterExistenteAsync(usuarioA, usuarioB, alunoPersonal, agora);
        }

        return conversa.Id;
    }

    private async Task ExcluirConversaExpiradaAsync(ConversaEquipe conversa)
    {
        foreach (var anexo in conversa.Mensagens.SelectMany(m => m.Anexos))
            _attachmentStorage.Excluir(anexo.NomeArmazenado);
        var notificacoes = await _db.NotificacoesUsuarios
            .Where(n => n.Tipo == "CHAT" && n.ReferenciaId == conversa.Id)
            .ToListAsync();
        _db.NotificacoesUsuarios.RemoveRange(notificacoes);
        _db.ConversasEquipe.Remove(conversa);
        await _db.SaveChangesAsync();
    }

    private async Task<ConversaEquipe> CriarConversaOuObterExistenteAsync(
        Guid usuarioA,
        Guid usuarioB,
        bool temporaria,
        DateTime? criadaEm = null)
    {
        var agora = criadaEm ?? DateTime.UtcNow;
        var nova = new ConversaEquipe
        {
            Id = Guid.NewGuid(),
            UsuarioAId = usuarioA,
            UsuarioBId = usuarioB,
            CriadaEm = agora,
            UltimaAtividadeEm = agora,
            EhTemporaria = temporaria,
            ExpiraEm = temporaria ? agora.AddHours(48) : null
        };
        _db.ConversasEquipe.Add(nova);
        try
        {
            await _db.SaveChangesAsync();
            return nova;
        }
        catch (DbUpdateException exception) when
            (exception.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            _db.Entry(nova).State = EntityState.Detached;
            var existente = await _db.ConversasEquipe.FirstOrDefaultAsync(c =>
                c.UsuarioAId == usuarioA && c.UsuarioBId == usuarioB);
            if (existente is null) throw;
            return existente;
        }
    }

    private async Task<bool> EhVinculoChatAlunoPersonalAsync(Guid usuarioAId, Guid usuarioBId)
    {
        var tipos = await _db.Usuarios.AsNoTracking()
            .Where(u => (u.Id == usuarioAId || u.Id == usuarioBId) && u.Ativo)
            .Select(u => u.Tipo)
            .ToListAsync();
        return tipos.Count == 2 &&
            ((tipos[0] == TipoUsuario.ALUNO && tipos[1] == TipoUsuario.PERSONAL) ||
             (tipos[0] == TipoUsuario.PERSONAL && tipos[1] == TipoUsuario.ALUNO));
    }

    public async Task<List<AvisoGlobalDTO>> ListarAvisosAsync()
    {
        return await _db.AvisosGlobais
            .AsNoTracking()
            .Include(a => a.Autor).ThenInclude(u => u.Personal)
            .OrderByDescending(a => a.PublicadoEm)
            .Take(50)
            .Select(a => new AvisoGlobalDTO
            {
                Id = a.Id,
                AutorId = a.AutorId,
                AutorNome = a.Autor.Personal != null ? a.Autor.Personal.Nome : a.Autor.Email,
                Titulo = a.Titulo,
                Conteudo = a.Conteudo,
                PublicadoEm = a.PublicadoEm
            })
            .ToListAsync();
    }

    public async Task PublicarAvisoAsync(CriarAvisoGlobalDTO dto)
    {
        if (_current.Role != "ADMIN")
            throw DomainException.Forbidden();

        var aviso = new AvisoGlobal
        {
            Id = Guid.NewGuid(),
            AutorId = _current.UsuarioId,
            Titulo = dto.Titulo.Trim(),
            Conteudo = dto.Conteudo.Trim(),
            PublicadoEm = DateTime.UtcNow
        };
        _db.AvisosGlobais.Add(aviso);

        var membros = await _db.Usuarios
            .Where(u => u.Ativo && (u.Tipo == TipoUsuario.ADMIN || u.Tipo == TipoUsuario.PERSONAL))
            .Select(u => u.Id)
            .ToListAsync();
        var agora = DateTime.UtcNow;
        foreach (var usuarioId in membros.Where(id => id != _current.UsuarioId))
        {
            _db.NotificacoesUsuarios.Add(new NotificacaoUsuario
            {
                Id = Guid.NewGuid(),
                UsuarioId = usuarioId,
                Titulo = "Novo aviso no mural",
                Mensagem = aviso.Titulo,
                Tipo = "MURAL",
                ReferenciaId = aviso.Id,
                CriadaEm = agora
            });
        }

        await _db.SaveChangesAsync();
    }

    public async Task<List<NotificacaoDTO>> ListarNotificacoesAsync()
    {
        var atual = _current.UsuarioId;
        return await _db.NotificacoesUsuarios
            .AsNoTracking()
            .Where(n => n.UsuarioId == atual)
            .OrderByDescending(n => n.CriadaEm)
            .Take(60)
            .Select(n => new NotificacaoDTO
            {
                Id = n.Id,
                Titulo = n.Titulo,
                Mensagem = n.Mensagem,
                Tipo = n.Tipo,
                ReferenciaId = n.ReferenciaId,
                CriadaEm = n.CriadaEm,
                LidaEm = n.LidaEm
            })
            .ToListAsync();
    }

    public async Task MarcarNotificacaoLidaAsync(Guid notificacaoId)
    {
        var notificacao = await _db.NotificacoesUsuarios
            .FirstOrDefaultAsync(n => n.Id == notificacaoId && n.UsuarioId == _current.UsuarioId);
        if (notificacao is null)
            throw DomainException.NotFound("Notificação não encontrada.");

        notificacao.LidaEm ??= DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task MarcarTodasNotificacoesLidasAsync()
    {
        var pendentes = await _db.NotificacoesUsuarios
            .Where(n => n.UsuarioId == _current.UsuarioId && n.LidaEm == null)
            .ToListAsync();
        var agora = DateTime.UtcNow;
        foreach (var notificacao in pendentes)
            notificacao.LidaEm = agora;
        await _db.SaveChangesAsync();
    }

    public async Task MarcarAvisosLidosAsync()
    {
        var avisos = await _db.NotificacoesUsuarios
            .Where(n => n.UsuarioId == _current.UsuarioId && n.Tipo == "MURAL" && n.LidaEm == null)
            .ToListAsync();
        var agora = DateTime.UtcNow;
        foreach (var aviso in avisos)
            aviso.LidaEm = agora;
        await _db.SaveChangesAsync();
    }

    public async Task CriarAlertaAsync(CriarAlertaDTO dto)
    {
        if (_current.Role != "ADMIN")
            throw DomainException.Forbidden();

        var membros = _db.Usuarios.Where(u => u.Ativo && (u.Tipo == TipoUsuario.ADMIN || u.Tipo == TipoUsuario.PERSONAL));
        if (dto.UsuarioDestinoId.HasValue)
            membros = membros.Where(u => u.Id == dto.UsuarioDestinoId.Value);

        var destinatarios = await membros.Select(u => u.Id).ToListAsync();
        if (dto.UsuarioDestinoId.HasValue && destinatarios.Count == 0)
            throw DomainException.NotFound("Membro da equipe não encontrado.");

        var agora = DateTime.UtcNow;
        foreach (var usuarioId in destinatarios.Where(id => id != _current.UsuarioId))
        {
            _db.NotificacoesUsuarios.Add(new NotificacaoUsuario
            {
                Id = Guid.NewGuid(),
                UsuarioId = usuarioId,
                Titulo = dto.Titulo.Trim(),
                Mensagem = dto.Mensagem.Trim(),
                Tipo = "ALERTA",
                CriadaEm = agora
            });
        }

        await _db.SaveChangesAsync();
    }
}
