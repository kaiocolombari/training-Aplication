using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TreinoAPI.DTOs.Email;
using TreinoAPI.Services;

namespace TreinoAPI.Controllers;

[ApiController]
[Authorize(Roles = "ADMIN,PERSONAL")]
[Route("api/emails")]
public sealed class EmailController : ControllerBase
{
    private readonly EmailService _service;

    public EmailController(EmailService service) => _service = service;

    [HttpGet("status")]
    public async Task<IActionResult> Status(CancellationToken cancellationToken) =>
        Ok(await _service.ObterStatusAsync(cancellationToken));

    [HttpGet("destinatarios")]
    public async Task<IActionResult> ListarDestinatarios(
        [FromQuery] string tipo = "ALUNO",
        [FromQuery] string? busca = null) =>
        Ok(await _service.ListarDestinatariosAsync(tipo, busca));

    [HttpPost("enviar")]
    [EnableRateLimiting("email-send")]
    public async Task<IActionResult> Enviar([FromBody] EnviarEmailDTO dto)
    {
        if (!_service.EstaConfigurado)
        {
            var status = await _service.ObterStatusAsync();
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new
            {
                message = status.Mensagem,
                status
            });
        }

        return Ok(await _service.EnviarAsync(dto));
    }
}
