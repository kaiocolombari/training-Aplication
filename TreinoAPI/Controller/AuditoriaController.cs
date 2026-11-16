using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TreinoAPI.Services;

namespace TreinoAPI.Controllers;

[ApiController]
[Authorize(Roles = "ADMIN")]
[Route("api/auditoria")]
public sealed class AuditoriaController : ControllerBase
{
    private readonly AuditoriaService _service;

    public AuditoriaController(AuditoriaService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> Listar(
        [FromQuery] string? busca,
        [FromQuery] string? usuarioTipo,
        [FromQuery] DateOnly? inicio,
        [FromQuery] DateOnly? fim,
        [FromQuery] int pagina = 1,
        [FromQuery] int limite = 30)
    {
        if (inicio.HasValue && fim.HasValue && inicio > fim)
            return BadRequest(new { message = "A data inicial não pode ser posterior à data final." });

        return Ok(await _service.ListarAsync(busca, usuarioTipo, inicio, fim, pagina, limite));
    }
}
