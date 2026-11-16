using Microsoft.EntityFrameworkCore;
using TreinoAPI.Data;
using TreinoAPI.DTOs.Auth;
using TreinoAPI.Model;
using TreinoAPI.Security;

namespace TreinoAPI.Services;

public sealed class AuthService
{
    private readonly AppDbContext _context;
    private readonly PasswordService _passwords;
    private readonly TokenService _tokens;

    public AuthService(AppDbContext context, PasswordService passwords, TokenService tokens)
    {
        _context = context;
        _passwords = passwords;
        _tokens = tokens;
    }

    public async Task<AuthSessionResult?> LoginAsync(LoginDTO dto)
    {
        var email = NormalizeEmail(dto.Email);
        var usuario = await _context.Usuarios
            .Include(u => u.Personal)
            .Include(u => u.Aluno)
            .FirstOrDefaultAsync(u => u.Email == email);

        if (usuario is null)
            return null;

        var (valid, needsRehash) = _passwords.Verify(dto.Senha, usuario.SenhaHashed);
        if (!valid)
            return null;

        if (needsRehash)
        {
            usuario.SenhaHashed = _passwords.Hash(dto.Senha);
            await _context.SaveChangesAsync();
        }

        return await CreateSessionAsync(usuario);
    }

    public async Task<AuthSessionResult> RegistrarAlunoAsync(RegistrarAlunoDTO dto)
    {
        var email = NormalizeEmail(dto.Email);
        if (await _context.Usuarios.AnyAsync(u => u.Email == email))
            throw DomainException.Conflict("Já existe uma conta cadastrada com este e-mail.");

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
            CriadoEm = DateTime.UtcNow
        };

        _context.Usuarios.Add(usuario);
        _context.Alunos.Add(aluno);
        await _context.SaveChangesAsync();

        return await CreateSessionAsync(usuario);
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
            .FirstOrDefaultAsync(t => t.TokenHash == hash);

        if (stored is null)
            return null;

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

        return new AuthSessionResult(result, MapearUsuario(stored.Usuario));
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
            .FirstOrDefaultAsync(u => u.Id == usuarioId);

        return usuario is null ? null : MapearUsuario(usuario);
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

        return new AuthSessionResult(pair, MapearUsuario(usuario));
    }

    private static UsuarioSessaoDTO MapearUsuario(Usuario usuario) => new()
    {
        UsuarioId = usuario.Id,
        Email = usuario.Email,
        Tipo = usuario.Tipo.ToString(),
        PersonalId = usuario.Personal?.Id,
        AlunoId = usuario.Aluno?.Id,
        Nome = usuario.Personal?.Nome ?? usuario.Aluno?.NomeCompleto ?? usuario.Email
    };

    private static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();
}
