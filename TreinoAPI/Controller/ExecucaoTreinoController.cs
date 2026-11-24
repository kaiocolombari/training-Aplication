using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TreinoAPI.DTOs.Execucao;
using TreinoAPI.Security;
using TreinoAPI.Services;

namespace TreinoAPI.Controllers;

[ApiController]
[Authorize(Roles = "PERSONAL,ADMIN,ALUNO")]
[Route("api/treinos/{treinoId:guid}/execucoes")]
public sealed class ExecucaoTreinoController : ControllerBase
{
    private readonly ExecucaoTreinoService _service;
    private readonly OwnershipService _ownership;

    public ExecucaoTreinoController(ExecucaoTreinoService service, OwnershipService ownership)
    {
        _service = service;
        _ownership = ownership;
    }

    [HttpGet("atual")]
    public async Task<IActionResult> ObterAtual(Guid treinoId, [FromQuery] DateOnly? data)
    {
        await _ownership.EnsureTreinoAccessAsync(treinoId);
        var result = await _service.ObterAtualAsync(treinoId, data);
        return result is null ? NoContent() : Ok(result);
    }

    [HttpPut("atual")]
    public async Task<IActionResult> SalvarAtual(Guid treinoId, [FromBody] AtualizarExecucaoTreinoDTO dto)
    {
        await _ownership.EnsureTreinoAccessAsync(treinoId);
        return Ok(await _service.SalvarAtualAsync(treinoId, dto));
    }

    [HttpGet]
    public async Task<IActionResult> Listar(Guid treinoId)
    {
        await _ownership.EnsureTreinoAccessAsync(treinoId);
        return Ok(await _service.ListarAsync(treinoId));
    }

    [Authorize(Roles = "PERSONAL,ADMIN")]
    [HttpDelete("/api/execucoes-treino/{id:guid}")]
    public async Task<IActionResult> Deletar(Guid id)
    {
        await _ownership.EnsureExecucaoTreinoAccessAsync(id);
        return await _service.DeletarAsync(id) ? NoContent() : NotFound();
    }
}
