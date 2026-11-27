using System.Security.Claims;
using TreinoAPI.Services;

namespace TreinoAPI.Middleware;

public sealed class AuditoriaMiddleware
{
    private static readonly HashSet<string> MetodosAuditaveis = ["POST", "PUT", "PATCH", "DELETE"];
    private readonly RequestDelegate _next;

    public AuditoriaMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(
        HttpContext context,
        AuditoriaService auditoria,
        ILogger<AuditoriaMiddleware> logger)
    {
        await _next(context);

        if (!MetodosAuditaveis.Contains(context.Request.Method) ||
            !context.Request.Path.StartsWithSegments("/api") ||
            context.Request.Path.StartsWithSegments("/api/auditoria") ||
            context.Request.Path.StartsWithSegments("/api/auth/register/invite"))
            return;

        var exclusaoComAuditoriaDetalhada =
            HttpMethods.IsDelete(context.Request.Method) &&
            context.Response.StatusCode is >= 200 and < 300 &&
            (context.Request.Path.StartsWithSegments("/api/Personal") ||
             context.Request.Path.StartsWithSegments("/api/Aluno") ||
             context.Request.Path.StartsWithSegments("/api/PersonalAluno"));
        if (exclusaoComAuditoriaDetalhada)
            return;

        var usuarioIdClaim = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(usuarioIdClaim, out var usuarioId))
            return;

        try
        {
            await auditoria.RegistrarAsync(
                usuarioId,
                context.User.FindFirstValue(ClaimTypes.Email) ?? "E-mail não disponível",
                context.User.FindFirstValue(ClaimTypes.Role) ?? "INDEFINIDO",
                context.Request.Method,
                context.Request.Path.Value ?? "/api",
                context.Response.StatusCode,
                context.Connection.RemoteIpAddress?.ToString(),
                context.Request.Headers.UserAgent.ToString(),
                await auditoria.ResolverRecursoAlunoAsync(context));
        }
        catch (Exception exception)
        {
            // Falhas na trilha não devem transformar uma operação de negócio concluída em erro para o usuário.
            logger.LogError(exception, "Não foi possível registrar a auditoria da rota {Rota}.", context.Request.Path);
        }
    }
}
