using Microsoft.EntityFrameworkCore;
using TreinoAPI.Data;
using TreinoAPI.DTOs.Auth;
using TreinoAPI.Model;
using TreinoAPI.Security;
using TreinoAPI.Configuration;
using Microsoft.Extensions.Options;

namespace TreinoAPI.Services;

public sealed class AuthService
{
    private readonly AppDbContext _context;
    private readonly PasswordService _passwords;
    private readonly TokenService _tokens;
    private readonly AuditoriaService _auditoria;
    private readonly IHttpContextAccessor _httpContext;
    private readonly ILogger<AuthService> _logger;
    private readonly InviteOptions _inviteOptions;

    public AuthService(
        AppDbContext context,
        PasswordService passwords,
        TokenService tokens,
        AuditoriaService auditoria,
        IHttpContextAccessor httpContext,
        ILogger<AuthService> logger,
        IOptions<InviteOptions> inviteOptions)
    {
        _context = context;
        _passwords = passwords;
        _tokens = tokens;
        _auditoria = auditoria;
        _httpContext = httpContext;
        _logger = logger;
        _inviteOptions = inviteOptions.Value;
    }

    public async Task<AuthSessionResult?> LoginAsync(LoginDTO dto)
    {
        var email = NormalizeEmail(dto.Email);
        var usuario = await _context.Usuarios
            .Include(u => u.Personal)
            .Include(u => u.Aluno)
                .ThenInclude(a => a!.SolicitacaoCadastro)
            .FirstOrDefaultAsync(u => u.Email == email);

        if (usuario is null)
        {
            await RegistrarTentativaLoginAsync(email, null, "FALHA");
            return null;
        }

        if (!usuario.Ativo)
        {
            await RegistrarTentativaLoginAsync(email, usuario, "FALHA");
            return null;
        }

        var (valid, needsRehash) = _passwords.Verify(dto.Senha, usuario.SenhaHashed);
        if (!valid)
        {
            await RegistrarTentativaLoginAsync(email, usuario, "FALHA");
            return null;
        }

        if (needsRehash)
        {
            usuario.SenhaHashed = _passwords.Hash(dto.Senha);
            await _context.SaveChangesAsync();
        }

        var session = await CreateSessionAsync(usuario);
        await RegistrarTentativaLoginAsync(email, usuario, "SUCESSO");
        return session;
    }

    public async Task<AuthSessionResult> RegistrarAlunoPorConviteAsync(RegistrarAlunoDTO dto)
    {
        var email = NormalizeEmail(dto.Email);
        if (await _context.Usuarios.AnyAsync(u => u.Email == email))
            throw DomainException.Conflict("Já existe uma conta cadastrada com este e-mail.");

        var conviteHash = ConvitePersonalService.HashToken(dto.TokenConvite);
        await using var transaction = await _context.Database.BeginTransactionAsync();
        var convite = await _context.ConvitesPersonais
            .Include(c => c.Personal).ThenInclude(p => p.Usuario)
            .FirstOrDefaultAsync(c => c.TokenHash == conviteHash && c.RevogadoEm == null &&
                c.ExpiraEm > DateTime.UtcNow && c.Personal.Usuario!.Ativo);
        if (convite is null)
            throw DomainException.BadRequest("Este convite não é válido ou expirou. Solicite um novo link à equipe.");
        var maximoPorHora = Math.Clamp(_inviteOptions.MaxRegistrationsPerHourPerInvite, 1, 1000);
        var cadastrosRecentes = await _context.Alunos.CountAsync(a =>
            a.ConvitePersonalId == convite.Id && a.CriadoEm >= DateTime.UtcNow.AddHours(-1));
        if (cadastrosRecentes >= maximoPorHora)
            throw DomainException.BadRequest("Este link recebeu muitas solicitações recentemente. Entre em contato com a equipe para continuar.");

        var usuario = new Usuario
        {
            Email = email,
            Telefone = dto.Telefone?.Trim(),
            SenhaHashed = _passwords.Hash(dto.Senha),
            Tipo = TipoUsuario.ALUNO,
            CriadoEm = DateTime.UtcNow
        };

        var aluno = new Aluno
        {
            NomeCompleto = dto.NomeCompleto.Trim(),
            Usuario = usuario,
            CriadoEm = DateTime.UtcNow,
            StatusCadastro = StatusCadastroAluno.PENDENTE,
            ConvidadoPorPersonalId = convite.PersonalId,
            ConvitePersonalId = convite.Id
        };

        _context.Usuarios.Add(usuario);
        _context.Alunos.Add(aluno);
        _context.PersonalAlunos.Add(new PersonalAluno
        {
            PersonalId = convite.PersonalId,
            Aluno = aluno,
            Ativo = true,
            CriadoEm = DateTime.UtcNow
        });
        convite.Utilizacoes++;
        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            await transaction.RollbackAsync();
            if (await _context.Usuarios.AnyAsync(u => u.Email == email))
                throw DomainException.Conflict("Já existe uma conta cadastrada com este e-mail.");
            throw;
        }

        var session = await CreateSessionAsync(usuario);
        await transaction.CommitAsync();
        await RegistrarTentativaLoginAsync(email, usuario, "CADASTRO");
        return session;
    }

    public async Task<AuthSessionResult?> RenovarAsync(string? refreshToken)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
            return null;

        var hash = TokenService.HashRefreshToken(refreshToken);
        var stored = await _context.RefreshTokens
            .Include(t => t.Usuario)
                .ThenInclude(u => u.Personal)
            .Include(t => t.Usuario)
                .ThenInclude(u => u.Aluno)
                    .ThenInclude(a => a!.SolicitacaoCadastro)
            .FirstOrDefaultAsync(t => t.TokenHash == hash);

        if (stored is null)
            return null;

        if (!stored.Usuario.Ativo)
        {
            var tokensDaConta = await _context.RefreshTokens
                .Where(t => t.UsuarioId == stored.UsuarioId && t.RevogadoEm == null)
                .ToListAsync();
            foreach (var token in tokensDaConta)
                token.RevogadoEm = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return null;
        }

        if (stored.RevogadoEm is not null)
        {
            // Reutilização de refresh token revogado invalida as sessões da conta.
            var activeTokens = await _context.RefreshTokens
                .Where(t => t.UsuarioId == stored.UsuarioId && t.RevogadoEm == null)
                .ToListAsync();
            foreach (var token in activeTokens)
                token.RevogadoEm = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return null;
        }

        if (stored.ExpiraEm <= DateTime.UtcNow)
            return null;

        stored.RevogadoEm = DateTime.UtcNow;
        var result = _tokens.Create(stored.Usuario);
        stored.SubstituidoPorHash = TokenService.HashRefreshToken(result.RefreshToken);
        _context.RefreshTokens.Add(new RefreshToken
        {
            UsuarioId = stored.UsuarioId,
            TokenHash = stored.SubstituidoPorHash,
            CriadoEm = DateTime.UtcNow,
            ExpiraEm = result.RefreshExpiresAt
        });
        await _context.SaveChangesAsync();

        return new AuthSessionResult(result, await MapearUsuarioAsync(stored.Usuario));
    }

    public async Task RevogarAsync(string? refreshToken)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
            return;

        var hash = TokenService.HashRefreshToken(refreshToken);
        var stored = await _context.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == hash);
        if (stored is null || stored.RevogadoEm is not null)
            return;

        stored.RevogadoEm = DateTime.UtcNow;
        await _context.SaveChangesAsync();
    }

    public async Task<UsuarioSessaoDTO?> ObterSessaoAsync(Guid usuarioId)
    {
        var usuario = await _context.Usuarios
            .Include(u => u.Personal)
            .Include(u => u.Aluno)
                .ThenInclude(a => a!.SolicitacaoCadastro)
            .FirstOrDefaultAsync(u => u.Id == usuarioId && u.Ativo);

        return usuario is null ? null : await MapearUsuarioAsync(usuario);
    }

    private async Task<AuthSessionResult> CreateSessionAsync(Usuario usuario)
    {
        var pair = _tokens.Create(usuario);
        _context.RefreshTokens.Add(new RefreshToken
        {
            UsuarioId = usuario.Id,
            TokenHash = TokenService.HashRefreshToken(pair.RefreshToken),
            CriadoEm = DateTime.UtcNow,
            ExpiraEm = pair.RefreshExpiresAt
        });
        await _context.SaveChangesAsync();

        return new AuthSessionResult(pair, await MapearUsuarioAsync(usuario));
    }

    private async Task<UsuarioSessaoDTO> MapearUsuarioAsync(Usuario usuario)
    {
        var sessao = MapearUsuario(usuario);
        if (usuario.Personal is not null)
        {
            sessao.ControleAvancadoHabilitado = await _context.ConfiguracoesAcompanhamento
                .Where(config => config.PersonalId == usuario.Personal.Id)
                .Select(config => config.ControleAvancadoHabilitado)
                .FirstOrDefaultAsync();
        }
        return sessao;
    }

    private static UsuarioSessaoDTO MapearUsuario(Usuario usuario) => new()
    {
        UsuarioId = usuario.Id,
        Email = usuario.Email,
        Tipo = usuario.Tipo.ToString(),
        PersonalId = usuario.Personal?.Id,
        AlunoId = usuario.Aluno?.Id,
        Nome = usuario.Personal?.Nome ?? usuario.Aluno?.NomeCompleto ?? usuario.Email,
        StatusCadastro = usuario.Aluno?.StatusCadastro.ToString(),
        FormularioEnviado = usuario.Aluno?.SolicitacaoCadastro is not null,
        ObservacaoAnalise = usuario.Aluno?.SolicitacaoCadastro?.ObservacaoAnalise
    };

    private async Task RegistrarTentativaLoginAsync(string email, Usuario? usuario, string resultado)
    {
        try
        {
            await _auditoria.RegistrarAsync(
                usuario?.Id,
                email,
                usuario?.Tipo.ToString() ?? "ANONIMO",
                "POST",
                resultado == "CADASTRO" ? "/api/auth/register" : "/api/auth/login",
                resultado == "FALHA" ? StatusCodes.Status401Unauthorized :
                    resultado == "CADASTRO" ? StatusCodes.Status201Created : StatusCodes.Status200OK,
                _httpContext.HttpContext?.Connection.RemoteIpAddress?.ToString(),
                _httpContext.HttpContext?.Request.Headers.UserAgent.ToString());
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Não foi possível registrar o evento de autenticação para {Email}.", email);
        }
    }

    private static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();
}
