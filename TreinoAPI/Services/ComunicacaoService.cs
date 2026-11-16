using Microsoft.EntityFrameworkCore;
using TreinoAPI.Data;
using TreinoAPI.DTOs.Comunicacao;
using TreinoAPI.Model;
using TreinoAPI.Security;

namespace TreinoAPI.Services;

public sealed class ComunicacaoService
{
    private readonly AppDbContext _db;
    private readonly CurrentUserService _current;

    public ComunicacaoService(AppDbContext db, CurrentUserService current)
    {
        _db = db;
        _current = current;
    }

    // Reusable hooks for domain services to raise alerts when important events occur.
    public async Task NotificarUsuarioAsync(Guid usuarioId, string titulo, string mensagem, string tipo = "SISTEMA", Guid? referenciaId = null)
    {
        if (!await _db.Usuarios.AnyAsync(u => u.Id == usuarioId &&
            (u.Tipo == TipoUsuario.ADMIN || u.Tipo == TipoUsuario.PERSONAL)))
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

    public async Task NotificarEquipeAsync(string titulo, string mensagem, string tipo = "SISTEMA", Guid? referenciaId = null)
    {
        var usuarios = await _db.Usuarios
            .Where(u => u.Tipo == TipoUsuario.ADMIN || u.Tipo == TipoUsuario.PERSONAL)
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
            .Where(u => u.Id != atual && (u.Tipo == TipoUsuario.ADMIN || u.Tipo == TipoUsuario.PERSONAL))
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
            .Where(c => c.UsuarioAId == atual || c.UsuarioBId == atual)
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

    public async Task<List<MensagemEquipeDTO>> ListarMensagensAsync(Guid conversaId)
    {
        var atual = _current.UsuarioId;
        var conversa = await _db.ConversasEquipe
            .FirstOrDefaultAsync(c => c.Id == conversaId && (c.UsuarioAId == atual || c.UsuarioBId == atual));
        if (conversa is null)
            throw DomainException.NotFound("Conversa não encontrada.");

        var pendentes = await _db.MensagensEquipe
            .Where(m => m.ConversaId == conversaId && m.RemetenteId != atual && m.LidaEm == null)
            .ToListAsync();
        var agora = DateTime.UtcNow;
        foreach (var mensagem in pendentes)
            mensagem.LidaEm = agora;

        var notificacoes = await _db.NotificacoesUsuarios
            .Where(n => n.UsuarioId == atual && n.Tipo == "CHAT" && n.ReferenciaId == conversaId && n.LidaEm == null)
            .ToListAsync();
        foreach (var notificacao in notificacoes)
            notificacao.LidaEm = agora;

        if (pendentes.Count > 0 || notificacoes.Count > 0)
            await _db.SaveChangesAsync();

        var mensagens = await _db.MensagensEquipe
            .AsNoTracking()
            .Where(m => m.ConversaId == conversaId)
            .Include(m => m.Remetente).ThenInclude(u => u.Personal)
            .OrderByDescending(m => m.EnviadaEm)
            .Take(100)
            .ToListAsync();

        return mensagens.OrderBy(m => m.EnviadaEm).Select(m => new MensagemEquipeDTO
        {
            Id = m.Id,
            RemetenteId = m.RemetenteId,
            RemetenteNome = m.Remetente.Personal?.Nome ?? m.Remetente.Email,
            RemetenteTipo = m.Remetente.Tipo.ToString(),
            Conteudo = m.Conteudo,
            EnviadaEm = m.EnviadaEm,
            LidaEm = m.LidaEm
        }).ToList();
    }

    public async Task<Guid> EnviarMensagemAsync(Guid destinatarioId, EnviarMensagemEquipeDTO dto)
    {
        var atual = _current.UsuarioId;
        var conteudo = dto.Conteudo.Trim();
        if (conteudo.Length is < 1 or > 4000)
            throw DomainException.BadRequest("A mensagem deve conter entre 1 e 4.000 caracteres.");

        var destinatario = await _db.Usuarios
            .FirstOrDefaultAsync(u => u.Id == destinatarioId &&
                (u.Tipo == TipoUsuario.ADMIN || u.Tipo == TipoUsuario.PERSONAL));
        if (destinatario is null || destinatarioId == atual)
            throw DomainException.NotFound("Membro da equipe não encontrado.");

        var usuarioA = atual.CompareTo(destinatarioId) < 0 ? atual : destinatarioId;
        var usuarioB = atual.CompareTo(destinatarioId) < 0 ? destinatarioId : atual;
        var conversa = await _db.ConversasEquipe
            .FirstOrDefaultAsync(c => c.UsuarioAId == usuarioA && c.UsuarioBId == usuarioB);

        if (conversa is null)
        {
            conversa = new ConversaEquipe
            {
                Id = Guid.NewGuid(),
                UsuarioAId = usuarioA,
                UsuarioBId = usuarioB,
                CriadaEm = DateTime.UtcNow
            };
            _db.ConversasEquipe.Add(conversa);
        }

        var agora = DateTime.UtcNow;
        _db.MensagensEquipe.Add(new MensagemEquipe
        {
            Id = Guid.NewGuid(),
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
        return conversa.Id;
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
            .Where(u => u.Tipo == TipoUsuario.ADMIN || u.Tipo == TipoUsuario.PERSONAL)
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

        var membros = _db.Usuarios.Where(u => u.Tipo == TipoUsuario.ADMIN || u.Tipo == TipoUsuario.PERSONAL);
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
