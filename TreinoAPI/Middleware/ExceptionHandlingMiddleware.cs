using Microsoft.EntityFrameworkCore;
using TreinoAPI.Security;

namespace TreinoAPI.Middleware;

public sealed class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (DomainException exception)
        {
            await WriteError(context, exception.StatusCode, exception.Message);
        }
        catch (DbUpdateException exception)
        {
            logger.LogWarning(exception, "Falha de integridade ao persistir dados.");
            await WriteError(context, StatusCodes.Status409Conflict, "Não foi possível concluir a operação por conflito com os dados existentes.");
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Erro não tratado na API.");
            await WriteError(context, StatusCodes.Status500InternalServerError, "Ocorreu um erro interno. Tente novamente mais tarde.");
        }
    }

    private static async Task WriteError(HttpContext context, int statusCode, string message)
    {
        if (context.Response.HasStarted)
            return;

        context.Response.Clear();
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/problem+json";
        await context.Response.WriteAsJsonAsync(new
        {
            type = "about:blank",
            title = statusCode switch
            {
                400 => "Requisição inválida",
                401 => "Não autenticado",
                403 => "Acesso negado",
                404 => "Não encontrado",
                409 => "Conflito",
                _ => "Erro interno"
            },
            status = statusCode,
            detail = message,
            traceId = context.TraceIdentifier
        });
    }
}
