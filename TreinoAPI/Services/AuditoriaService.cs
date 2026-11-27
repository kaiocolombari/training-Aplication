using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc.Controllers;
using System.Security.Claims;
using TreinoAPI.Data;
using TreinoAPI.DTOs.Auditoria;
using TreinoAPI.Model;

namespace TreinoAPI.Services;

public sealed class AuditoriaService
{
    private readonly AppDbContext _db;
    private readonly IHttpContextAccessor _httpContext;

    public AuditoriaService(AppDbContext db, IHttpContextAccessor httpContext)
    {
        _db = db;
        _httpContext = httpContext;
    }

    public async Task RegistrarOperacaoDetalhadaAsync(
        string acao,
        string metodo,
        string rota,
        Guid recursoId,
        string resumo,
        int statusCode = StatusCodes.Status204NoContent)
    {
        var context = _httpContext.HttpContext;
        var idClaim = context?.User.FindFirstValue(ClaimTypes.NameIdentifier);
        var usuarioId = Guid.TryParse(idClaim, out var id) ? id : (Guid?)null;
        var usuarioEmail = context?.User.FindFirstValue(ClaimTypes.Email) ?? "E-mail não disponível";
        var usuarioTipo = context?.User.FindFirstValue(ClaimTypes.Role) ?? "INDEFINIDO";
        var metodoNormalizado = metodo.ToUpperInvariant();

        _db.RegistrosAuditoria.Add(new RegistroAuditoria
        {
            Id = Guid.NewGuid(),
            UsuarioId = usuarioId,
            UsuarioEmail = Limitar(usuarioEmail, 256),
            UsuarioTipo = Limitar(usuarioTipo, 30),
            Acao = Limitar(acao, 30),
            MetodoHttp = Limitar(metodoNormalizado, 10),
            Rota = Limitar(rota, 300),
            RecursoId = recursoId.ToString(),
            Resumo = Limitar(resumo, 500),
            StatusCode = statusCode,
            Resultado = statusCode is >= 200 and < 400 ? "SUCESSO" : "FALHA",
            EnderecoIp = LimitarOpcional(context?.Connection.RemoteIpAddress?.ToString(), 64),
            UserAgent = LimitarOpcional(context?.Request.Headers.UserAgent.ToString(), 500),
            CriadoEm = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
    }

    public async Task<string?> ResolverRecursoAlunoAsync(HttpContext context)
    {
        if (context.Items.TryGetValue("AlunoIdAuditoria", out var alunoExplicito) &&
            Guid.TryParse(alunoExplicito?.ToString(), out var idExplicito))
            return idExplicito.ToString();

        if (TryGuidRoute(context, "alunoId", out var alunoId))
            return alunoId.ToString();

        var path = context.Request.Path.Value ?? string.Empty;

        if (TryGuidRoute(context, "destinatarioId", out var destinatarioId))
        {
            var alunoDestinatario = await _db.Alunos.AsNoTracking()
                .Where(a => a.UsuarioId == destinatarioId)
                .Select(a => (Guid?)a.Id)
                .FirstOrDefaultAsync();
            if (alunoDestinatario.HasValue) return alunoDestinatario.Value.ToString();
        }

        if (TryGuidRoute(context, "conversaId", out var conversaId))
        {
            var conversa = await _db.ConversasEquipe.AsNoTracking()
                .Where(c => c.Id == conversaId)
                .Select(c => new
                {
                    AlunoA = c.UsuarioA.Aluno == null ? (Guid?)null : c.UsuarioA.Aluno.Id,
                    AlunoB = c.UsuarioB.Aluno == null ? (Guid?)null : c.UsuarioB.Aluno.Id
                })
                .FirstOrDefaultAsync();
            var alunoConversa = conversa?.AlunoA ?? conversa?.AlunoB;
            if (alunoConversa.HasValue) return alunoConversa.Value.ToString();
        }

        if (TryGuidRoute(context, "treinoId", out var treinoId))
        {
            var owner = await _db.Treinos.AsNoTracking().Where(t => t.Id == treinoId)
                .Select(t => (Guid?)t.AlunoId).FirstOrDefaultAsync();
            if (owner.HasValue) return owner.Value.ToString();
        }

        if (TryGuidRoute(context, "avaliacaoId", out var avaliacaoId))
        {
            var owner = await _db.Avaliacoes.AsNoTracking().Where(a => a.Id == avaliacaoId)
                .Select(a => (Guid?)a.AlunoId).FirstOrDefaultAsync();
            if (owner.HasValue) return owner.Value.ToString();
        }

        if (TryGuidRoute(context, "testeCargaId", out var testeCargaId))
        {
            var owner = await _db.TestesCarga.AsNoTracking().Where(t => t.Id == testeCargaId)
                .Select(t => (Guid?)t.AlunoId).FirstOrDefaultAsync();
            if (owner.HasValue) return owner.Value.ToString();
        }

        if (TryGuidRoute(context, "periodizacaoId", out var periodizacaoId))
        {
            var owner = await _db.Periodizacoes.AsNoTracking().Where(p => p.Id == periodizacaoId)
                .Select(p => (Guid?)p.AlunoId).FirstOrDefaultAsync();
            if (owner.HasValue) return owner.Value.ToString();
        }

        if (TryGuidRoute(context, "semanaId", out var semanaId))
        {
            var owner = await _db.PeriodizacaoSemanas.AsNoTracking().Where(s => s.Id == semanaId)
                .Select(s => (Guid?)s.Periodizacao.AlunoId).FirstOrDefaultAsync();
            if (owner.HasValue) return owner.Value.ToString();
        }

        if (TryGuidRoute(context, "diaId", out var diaId))
        {
            var owner = await _db.PeriodizacaoDias.AsNoTracking().Where(d => d.Id == diaId)
                .Select(d => (Guid?)d.Semana.Periodizacao.AlunoId).FirstOrDefaultAsync();
            if (owner.HasValue) return owner.Value.ToString();
        }

        if (TryGuidRoute(context, "cicloId", out var cicloId))
        {
            var owner = await _db.TreinoVolumeCiclos.AsNoTracking().Where(c => c.Id == cicloId)
                .Select(c => (Guid?)c.AlunoId).FirstOrDefaultAsync();
            if (owner.HasValue) return owner.Value.ToString();
        }

        var controller = context.GetEndpoint()?.Metadata
            .GetMetadata<ControllerActionDescriptor>()?.ControllerName ?? string.Empty;

        if (string.Equals(context.User.FindFirstValue(ClaimTypes.Role), "ALUNO", StringComparison.OrdinalIgnoreCase) &&
            Guid.TryParse(context.User.FindFirstValue(ClaimTypes.NameIdentifier), out var usuarioAlunoId))
        {
            var alunoDoUsuario = await _db.Alunos.AsNoTracking()
                .Where(a => a.UsuarioId == usuarioAlunoId)
                .Select(a => (Guid?)a.Id)
                .FirstOrDefaultAsync();
            if (alunoDoUsuario.HasValue) return alunoDoUsuario.Value.ToString();
        }

        if (!TryGuidRoute(context, "id", out var recursoId))
            return null;

        Guid? alunoRecurso = controller switch
        {
            "Aluno" => recursoId,
            "Anamnese" => await _db.Anamnese.AsNoTracking().Where(x => x.Id == recursoId)
                .Select(x => (Guid?)x.AlunoId).FirstOrDefaultAsync(),
            "Avaliacao" => await _db.Avaliacoes.AsNoTracking().Where(x => x.Id == recursoId)
                .Select(x => (Guid?)x.AlunoId).FirstOrDefaultAsync(),
            "DobraCutanea" => await _db.DobrasCutaneas.AsNoTracking().Where(x => x.Id == recursoId)
                .Select(x => (Guid?)x.Avaliacao.AlunoId).FirstOrDefaultAsync(),
            "Perimetro" => await _db.Perimetros.AsNoTracking().Where(x => x.Id == recursoId)
                .Select(x => (Guid?)x.Avaliacao.AlunoId).FirstOrDefaultAsync(),
            "TesteCarga" => await _db.TestesCarga.AsNoTracking().Where(x => x.Id == recursoId)
                .Select(x => (Guid?)x.AlunoId).FirstOrDefaultAsync(),
            "CargaExercicio" => await _db.CargasExercicios.AsNoTracking().Where(x => x.Id == recursoId)
                .Select(x => (Guid?)x.TesteCarga.AlunoId).FirstOrDefaultAsync(),
            "Treino" => await _db.Treinos.AsNoTracking().Where(x => x.Id == recursoId)
                .Select(x => (Guid?)x.AlunoId).FirstOrDefaultAsync(),
            "TreinoExercicio" => await _db.TreinosExercicios.AsNoTracking().Where(x => x.Id == recursoId)
                .Select(x => (Guid?)x.Treino.AlunoId).FirstOrDefaultAsync(),
            "Periodizacao" => await _db.Periodizacoes.AsNoTracking().Where(x => x.Id == recursoId)
                .Select(x => (Guid?)x.AlunoId).FirstOrDefaultAsync(),
            "PeriodizacaoSemana" => await _db.PeriodizacaoSemanas.AsNoTracking().Where(x => x.Id == recursoId)
                .Select(x => (Guid?)x.Periodizacao.AlunoId).FirstOrDefaultAsync(),
            "PeriodizacaoDia" => await _db.PeriodizacaoDias.AsNoTracking().Where(x => x.Id == recursoId)
                .Select(x => (Guid?)x.Semana.Periodizacao.AlunoId).FirstOrDefaultAsync(),
            "TreinoDia" => await _db.DiaTreinos.AsNoTracking().Where(x => x.Id == recursoId)
                .Select(x => (Guid?)x.PeriodizacaoDia.Semana.Periodizacao.AlunoId).FirstOrDefaultAsync(),
            "VolumeSemanal" => await _db.VolumesSemanais.AsNoTracking().Where(x => x.Id == recursoId)
                .Select(x => (Guid?)x.PeriodizacaoSemana.Periodizacao.AlunoId).FirstOrDefaultAsync(),
            "ExecucaoTreino" or "AcompanhamentoPersonal" => await _db.ExecucoesTreino.AsNoTracking()
                .Where(x => x.Id == recursoId).Select(x => (Guid?)x.Treino.AlunoId).FirstOrDefaultAsync(),
            "PersonalAluno" => await _db.PersonalAlunos.AsNoTracking().Where(x => x.Id == recursoId)
                .Select(x => (Guid?)x.AlunoId).FirstOrDefaultAsync(),
            "AgendaAvaliacao" => await _db.SolicitacoesAvaliacoes.AsNoTracking().Where(x => x.Id == recursoId)
                .Select(x => (Guid?)x.AlunoId).FirstOrDefaultAsync(),
            "AdminExtras" when path.StartsWith("/api/tarefas", StringComparison.OrdinalIgnoreCase) =>
                await _db.TarefasPersonais.AsNoTracking().Where(x => x.Id == recursoId)
                    .Select(x => x.AlunoId).FirstOrDefaultAsync(),
            "AdminExtras" when path.StartsWith("/api/feedback", StringComparison.OrdinalIgnoreCase) =>
                await _db.FeedbacksAlunos.AsNoTracking().Where(x => x.Id == recursoId)
                    .Select(x => (Guid?)x.AlunoId).FirstOrDefaultAsync(),
            _ => null
        };

        return alunoRecurso?.ToString();
    }

    public async Task RegistrarAsync(
        Guid? usuarioId,
        string usuarioEmail,
        string usuarioTipo,
        string metodo,
        string rota,
        int statusCode,
        string? enderecoIp,
        string? userAgent,
        string? recursoId = null)
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
            RecursoId = LimitarOpcional(recursoId ?? ExtrairGuid(rota), 36),
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

    private static bool TryGuidRoute(HttpContext context, string key, out Guid value)
    {
        value = Guid.Empty;
        return context.Request.RouteValues.TryGetValue(key, out var raw) &&
            Guid.TryParse(raw?.ToString(), out value);
    }

    private static string Limitar(string valor, int maximo) =>
        valor.Length <= maximo ? valor : valor[..maximo];

    private static string? LimitarOpcional(string? valor, int maximo) =>
        string.IsNullOrEmpty(valor) ? null : valor.Length <= maximo ? valor : valor[..maximo];
}
