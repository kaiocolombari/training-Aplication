using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using TreinoAPI.Model;

namespace TreinoAPI.Security;

public sealed record TokenPair(string AccessToken, string RefreshToken, DateTime AccessExpiresAt, DateTime RefreshExpiresAt);

public sealed class TokenService
{
    private readonly AuthOptions _options;

    public TokenService(IOptions<AuthOptions> options) => _options = options.Value;

    public TokenPair Create(Usuario usuario)
    {
        var now = DateTime.UtcNow;
        var accessExpires = now.AddMinutes(_options.AccessTokenMinutes);
        var refreshExpires = now.AddDays(_options.RefreshTokenDays);
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.Secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, usuario.Id.ToString()),
            new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
            new Claim(ClaimTypes.Email, usuario.Email),
            new Claim(ClaimTypes.Role, usuario.Tipo.ToString()),
        };

        var token = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Audience,
            claims: claims,
            notBefore: now,
            expires: accessExpires,
            signingCredentials: credentials);

        var refresh = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64))
            .TrimEnd('=').Replace('+', '-').Replace('/', '_');

        return new TokenPair(
            new JwtSecurityTokenHandler().WriteToken(token),
            refresh,
            accessExpires,
            refreshExpires);
    }

    public static string HashRefreshToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(bytes);
    }
}
