using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using TreinoAPI.Data;
using TreinoAPI.Model;
using TreinoAPI.Security;

namespace TreinoAPI.Services;

public sealed class AvaliacaoAuditService
{
    private readonly AppDbContext _db;
    private readonly CurrentUserService _currentUser;

    public AvaliacaoAuditService(AppDbContext db, CurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<bool> RegistrarAsync(Avaliacao avaliacao, string acao, string resumo, object? snapshot)
    {
        var dadosJson = snapshot is null ? null : JsonSerializer.Serialize(snapshot);
        if (dadosJson is not null)
        {
            var ultimoSnapshot = await _db.AvaliacoesHistorico
                .AsNoTracking()
                .Where(item => item.AvaliacaoId == avaliacao.Id)
                .OrderByDescending(item => item.CriadoEm)
                .Select(item => item.DadosJson)
                .FirstOrDefaultAsync();

            if (string.Equals(ultimoSnapshot, dadosJson, StringComparison.Ordinal))
                return false;
        }

        var usuarioId = _currentUser.UsuarioId;
        var ator = usuarioId == Guid.Empty
            ? null
            : await _db.Usuarios.AsNoTracking()
                .Where(usuario => usuario.Id == usuarioId)
                .Select(usuario => new { usuario.Email, usuario.Tipo })
                .FirstOrDefaultAsync();

        _db.AvaliacoesHistorico.Add(new AvaliacaoHistorico
        {
            AvaliacaoId = avaliacao.Id,
            UsuarioId = usuarioId == Guid.Empty ? null : usuarioId,
            UsuarioEmail = ator?.Email ?? "Usuário não identificado",
            UsuarioTipo = ator?.Tipo.ToString() ?? _currentUser.Role,
            Acao = acao,
            Resumo = resumo,
            CriadoEm = DateTime.UtcNow,
            DadosJson = dadosJson
        });

        return true;
    }
}
