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

    public async Task RegistrarAsync(Avaliacao avaliacao, string acao, string resumo, object? snapshot)
    {
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
            DadosJson = snapshot is null ? null : JsonSerializer.Serialize(snapshot)
        });
    }
}
