using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TreinoAPI.DTOs.Auth;
using TreinoAPI.Security;
using TreinoAPI.Services;

namespace TreinoAPI.Controllers;

[ApiController]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
[Route("api/auth")]
public sealed class AuthController : ControllerBase
{
    private const string AccessCookie = "treino_access";
    private const string RefreshCookie = "treino_refresh";
    private readonly AuthService _service;
    private readonly IAntiforgery _antiforgery;
    private readonly CurrentUserService _currentUser;

    public AuthController(
        AuthService service,
        IAntiforgery antiforgery,
        CurrentUserService currentUser)
    {
        _service = service;
        _antiforgery = antiforgery;
        _currentUser = currentUser;
    }

    [AllowAnonymous]
    [HttpGet("csrf")]
    public IActionResult Csrf()
    {
        var tokens = _antiforgery.GetAndStoreTokens(HttpContext);
        return Ok(new { requestToken = tokens.RequestToken });
    }

    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDTO dto)
    {
        var session = await _service.LoginAsync(dto);
        if (session is null)
            return Unauthorized(new { message = "E-mail ou senha inválidos." });

        SetCookies(session.Tokens);
        return Ok(session.Usuario);
    }

    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    [HttpPost("register")]
    public async Task<IActionResult> Registrar([FromBody] RegistrarAlunoDTO dto)
    {
        var session = await _service.RegistrarAlunoAsync(dto);
        SetCookies(session.Tokens);
        return Created("/api/auth/me", session.Usuario);
    }

    // Native clients keep bearer tokens in the platform secure storage instead of relying on cookies.
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    [HttpPost("mobile/login")]
    public async Task<IActionResult> MobileLogin([FromBody] LoginDTO dto)
    {
        var session = await _service.LoginAsync(dto);
        if (session is not null) Response.Headers.CacheControl = "no-store";
        return session is null
            ? Unauthorized(new { message = "E-mail ou senha inválidos." })
            : Ok(MobileAuthResponseDTO.From(session));
    }

    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    [HttpPost("mobile/register")]
    public async Task<IActionResult> MobileRegister([FromBody] RegistrarAlunoDTO dto)
    {
        var session = await _service.RegistrarAlunoAsync(dto);
        Response.Headers.CacheControl = "no-store";
        return Created("/api/auth/me", MobileAuthResponseDTO.From(session));
    }

    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    [HttpPost("mobile/refresh")]
    public async Task<IActionResult> MobileRefresh([FromBody] MobileRefreshDTO dto)
    {
        var session = await _service.RenovarAsync(dto.RefreshToken);
        if (session is not null) Response.Headers.CacheControl = "no-store";
        return session is null
            ? Unauthorized(new { message = "Sua sessão expirou. Entre novamente." })
            : Ok(MobileAuthResponseDTO.From(session));
    }

    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    [HttpPost("mobile/logout")]
    public async Task<IActionResult> MobileLogout([FromBody] MobileRefreshDTO dto)
    {
        await _service.RevogarAsync(dto.RefreshToken);
        return NoContent();
    }

    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh()
    {
        var session = await _service.RenovarAsync(Request.Cookies[RefreshCookie]);
        if (session is null)
        {
            ClearCookies();
            return Unauthorized(new { message = "Sua sessão expirou. Entre novamente." });
        }

        SetCookies(session.Tokens);
        return Ok(session.Usuario);
    }

    [AllowAnonymous]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await _service.RevogarAsync(Request.Cookies[RefreshCookie]);
        ClearCookies();
        return NoContent();
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var session = await _service.ObterSessaoAsync(_currentUser.UsuarioId);
        return session is null ? Unauthorized() : Ok(session);
    }

    private void SetCookies(TokenPair tokens)
    {
        Response.Cookies.Append(AccessCookie, tokens.AccessToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.None,
            Path = "/",
            Expires = tokens.AccessExpiresAt
        });

        Response.Cookies.Append(RefreshCookie, tokens.RefreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.None,
            Path = "/api/auth",
            Expires = tokens.RefreshExpiresAt
        });
    }

    private void ClearCookies()
    {
        Response.Cookies.Delete(AccessCookie, new CookieOptions { Path = "/", Secure = true, SameSite = SameSiteMode.None });
        Response.Cookies.Delete(RefreshCookie, new CookieOptions { Path = "/api/auth", Secure = true, SameSite = SameSiteMode.None });
    }
}
