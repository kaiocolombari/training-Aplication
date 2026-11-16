using TreinoAPI.DTOs.Auth;

namespace TreinoAPI.Security;

public sealed record AuthSessionResult(TokenPair Tokens, UsuarioSessaoDTO Usuario);
