using Microsoft.AspNetCore.Mvc;
using TreinoAPI.DTOs.Auth;
using TreinoAPI.Services;

namespace TreinoAPI.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AuthService _service;

    public AuthController(AuthService service)
    {
        _service = service;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDTO dto)
    {
        var resultado = await _service.Login(dto);

        if (resultado == null)
            return Unauthorized("Email ou senha inválidos");

        return Ok(resultado);
    }
}