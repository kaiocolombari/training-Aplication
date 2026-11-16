using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TreinoAPI.Services;

namespace TreinoAPI.Controllers;

[ApiController]
[Authorize(Roles = "ADMIN,PERSONAL")]
[Route("api/relatorios")]
public sealed class RelatoriosController : ControllerBase
{
    private readonly RelatoriosService _service;

    public RelatoriosController(RelatoriosService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> Obter([FromQuery] DateOnly? inicio, [FromQuery] DateOnly? fim)
    {
        if (inicio.HasValue && fim.HasValue && inicio > fim)
            return BadRequest(new { message = "A data inicial não pode ser posterior à data final." });
        if (inicio.HasValue && fim.HasValue && fim.Value.DayNumber - inicio.Value.DayNumber > 366)
            return BadRequest(new { message = "O período máximo de consulta é de 12 meses." });

        return Ok(await _service.ObterAsync(inicio, fim));
    }
}
