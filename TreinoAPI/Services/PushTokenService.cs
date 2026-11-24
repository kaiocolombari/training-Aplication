using Microsoft.EntityFrameworkCore;
using TreinoAPI.Data;
using TreinoAPI.DTOs.Comunicacao;
using TreinoAPI.Model;
using TreinoAPI.Security;

namespace TreinoAPI.Services;

public sealed class PushTokenService(AppDbContext db, CurrentUserService current)
{
    public async Task RegistrarAsync(RegistrarTokenPushDTO dto, CancellationToken cancellationToken)
    {
        var token = dto.Token.Trim();
        var plataforma = dto.Plataforma.Trim().ToUpperInvariant();
        if (!(token.StartsWith("ExponentPushToken[", StringComparison.Ordinal) ||
              token.StartsWith("ExpoPushToken[", StringComparison.Ordinal)) || !token.EndsWith(']'))
            throw DomainException.BadRequest("Token Expo Push inválido.");
        if (plataforma is not ("ANDROID" or "IOS"))
            throw DomainException.BadRequest("Plataforma de push inválida.");

        var existente = await db.TokensPushUsuarios.FirstOrDefaultAsync(item => item.Token == token, cancellationToken);
        if (existente is null)
        {
            db.TokensPushUsuarios.Add(new TokenPushUsuario
            {
                Id = Guid.NewGuid(),
                UsuarioId = current.UsuarioId,
                Token = token,
                Plataforma = plataforma,
                AtualizadoEm = DateTime.UtcNow
            });
        }
        else
        {
            existente.UsuarioId = current.UsuarioId;
            existente.Plataforma = plataforma;
            existente.AtualizadoEm = DateTime.UtcNow;
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task RemoverAsync(string token, CancellationToken cancellationToken)
    {
        var existente = await db.TokensPushUsuarios.FirstOrDefaultAsync(
            item => item.Token == token && item.UsuarioId == current.UsuarioId, cancellationToken);
        if (existente is null) return;
        db.TokensPushUsuarios.Remove(existente);
        await db.SaveChangesAsync(cancellationToken);
    }
}
