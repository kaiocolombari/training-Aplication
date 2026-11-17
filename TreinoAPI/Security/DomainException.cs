namespace TreinoAPI.Security;

public sealed class DomainException(string message, int statusCode) : Exception(message)
{
    public int StatusCode { get; } = statusCode;

    public static DomainException BadRequest(string message) => new(message, StatusCodes.Status400BadRequest);
    public static DomainException NotFound(string message) => new(message, StatusCodes.Status404NotFound);
    public static DomainException Conflict(string message) => new(message, StatusCodes.Status409Conflict);
    public static DomainException ServiceUnavailable(string message) => new(message, StatusCodes.Status503ServiceUnavailable);
    public static DomainException Forbidden(string message = "Você não tem permissão para acessar este recurso.") => new(message, StatusCodes.Status403Forbidden);
}
