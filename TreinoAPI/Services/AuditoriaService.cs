using Microsoft.EntityFrameworkCore;
using TreinoAPI.Data;
using TreinoAPI.DTOs.Auditoria;
using TreinoAPI.Model;

namespace TreinoAPI.Services;

public sealed class AuditoriaService
{
    private readonly AppDbContext _db;

    public AuditoriaService(AppDbContext db) => _db = db;

    public async Task RegistrarAsync(
        Guid? usuarioId,
        string usuarioEmail,
        string usuarioTipo,
        string metodo,
        string rota,
        int statusCode,
        string? enderecoIp,
        string? userAgent)
    {
        var metodoNormalizado = metodo.ToUpperInvariant();
        var acao = rota switch
        {
            "/api/auth/login" => "LOGIN",
            "/api/auth/register" => "CADASTRO",
            "/api/auth/logout" => "LOGOUT",
            _ => metodoNormalizado switch
            {
                "POST" => "CRIACAO/ACAO",
                "PUT" or "PATCH" => "ATUALIZACAO",
                "DELETE" => "EXCLUSAO",
                _ => "ACESSO"
            }
        };

        _db.RegistrosAuditoria.Add(new RegistroAuditoria
        {
            Id = Guid.NewGuid(),
            UsuarioId = usuarioId,
            UsuarioEmail = Limitar(usuarioEmail, 256),
            UsuarioTipo = Limitar(usuarioTipo, 30),
            Acao = acao,
            MetodoHttp = Limitar(metodoNormalizado, 10),
            Rota = Limitar(rota, 300),
            RecursoId = LimitarOpcional(ExtrairGuid(rota), 36),
            Resumo = Limitar($"{metodoNormalizado} {rota}", 500),
            StatusCode = statusCode,
            Resultado = statusCode is >= 200 and < 400 ? "SUCESSO" : "FALHA",
            EnderecoIp = LimitarOpcional(enderecoIp, 64),
            UserAgent = LimitarOpcional(userAgent, 500),
            CriadoEm = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
    }

    public async Task<ResultadoAuditoriaDTO> ListarAsync(
        string? busca,
        string? usuarioTipo,
        DateOnly? inicio,
        DateOnly? fim,
        int pagina,
        int limite)
    {
        pagina = Math.Max(1, pagina);
        limite = Math.Clamp(limite, 10, 100);
        var query = _db.RegistrosAuditoria.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(busca))
        {
            var termo = busca.Trim();
            query = query.Where(item => item.UsuarioEmail.Contains(termo) ||
                item.Acao.Contains(termo) || item.Rota.Contains(termo) ||
                item.Resumo.Contains(termo) || (item.RecursoId != null && item.RecursoId.Contains(termo)));
        }

        if (!string.IsNullOrWhiteSpace(usuarioTipo))
            query = query.Where(item => item.UsuarioTipo == usuarioTipo);

        if (inicio.HasValue)
        {
            var dataInicio = inicio.Value.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            query = query.Where(item => item.CriadoEm >= dataInicio);
        }

        if (fim.HasValue)
        {
            var diaSeguinte = fim.Value.AddDays(1).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            query = query.Where(item => item.CriadoEm < diaSeguinte);
        }

        var total = await query.CountAsync();
        var registros = await query
            .OrderByDescending(item => item.CriadoEm)
            .Skip((pagina - 1) * limite)
            .Take(limite)
            .Select(item => new RegistroAuditoriaDTO
            {
                Id = item.Id,
                UsuarioId = item.UsuarioId,
                UsuarioEmail = item.UsuarioEmail,
                UsuarioTipo = item.UsuarioTipo,
                Acao = item.Acao,
                MetodoHttp = item.MetodoHttp,
                Rota = item.Rota,
                RecursoId = item.RecursoId,
                Resumo = item.Resumo,
                StatusCode = item.StatusCode,
                Resultado = item.Resultado,
                EnderecoIp = item.EnderecoIp,
                UserAgent = item.UserAgent,
                CriadoEm = item.CriadoEm
            })
            .ToListAsync();

        return new ResultadoAuditoriaDTO
        {
            Registros = registros,
            Pagina = pagina,
            Limite = limite,
            Total = total,
            TotalPaginas = (int)Math.Ceiling(total / (double)limite)
        };
    }

    private static string? ExtrairGuid(string rota)
    {
        var segmento = rota.Split('/', StringSplitOptions.RemoveEmptyEntries)
            .LastOrDefault(item => Guid.TryParse(item, out _));
        return segmento;
    }

    private static string Limitar(string valor, int maximo) =>
        valor.Length <= maximo ? valor : valor[..maximo];

    private static string? LimitarOpcional(string? valor, int maximo) =>
        string.IsNullOrEmpty(valor) ? null : valor.Length <= maximo ? valor : valor[..maximo];
}
