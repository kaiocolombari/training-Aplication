using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TreinoAPI.DTOs.AcompanhamentoPersonal;
using TreinoAPI.Services;

namespace TreinoAPI.Controllers;

[ApiController]
[Authorize(Roles = "PERSONAL,ADMIN")]
[Route("api/personal/acompanhamento")]
public sealed class AcompanhamentoPersonalController(AcompanhamentoPersonalService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> ObterPainel() => Ok(await service.ObterPainelAsync());

    [HttpPatch("execucoes/{id:guid}/revisao")]
    public async Task<IActionResult> RevisarExecucao(Guid id, [FromBody] RevisarExecucaoDTO dto)
    {
        await service.MarcarExecucaoRevisadaAsync(id, dto.Revisada);
        return NoContent();
    }
}
