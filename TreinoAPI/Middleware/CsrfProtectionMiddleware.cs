using Microsoft.AspNetCore.Antiforgery;

namespace TreinoAPI.Middleware;

public sealed class CsrfProtectionMiddleware(RequestDelegate next, ILogger<CsrfProtectionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context, IAntiforgery antiforgery)
    {
        var unsafeMethod = HttpMethods.IsPost(context.Request.Method)
            || HttpMethods.IsPut(context.Request.Method)
            || HttpMethods.IsPatch(context.Request.Method)
            || HttpMethods.IsDelete(context.Request.Method);

        if (unsafeMethod)
        {
            try
            {
                await antiforgery.ValidateRequestAsync(context);
            }
            catch (AntiforgeryValidationException exception)
            {
                logger.LogWarning(
                    "CSRF validation failed for {Method} {Path}. Origin={Origin}; CookiePresent={CookiePresent}; HeaderPresent={HeaderPresent}; Reason={Reason}",
                    context.Request.Method,
                    context.Request.Path,
                    context.Request.Headers.Origin.ToString(),
                    context.Request.Cookies.ContainsKey("treino_csrf"),
                    context.Request.Headers.ContainsKey("X-CSRF-TOKEN"),
                    exception.Message);

                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                await context.Response.WriteAsJsonAsync(new { message = "Token de segurança ausente ou inválido. Atualize a página e tente novamente." });
                return;
            }
        }

        await next(context);
    }
}
