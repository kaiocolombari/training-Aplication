using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TreinoAPI.DTOs.VolumeSemanal;
using TreinoAPI.Security;
using TreinoAPI.Services;

namespace TreinoAPI.Controllers;

[ApiController]
[Authorize(Roles = "PERSONAL,ADMIN")]
[Route("api/volumes-semanais")]
public sealed class VolumeSemanalController : ControllerBase
{
    private readonly VolumeSemanalService _service;
    private readonly OwnershipService _ownership;

    public VolumeSemanalController(VolumeSemanalService service, OwnershipService ownership)
    {
        _service = service;
        _ownership = ownership;
    }

    [HttpPost("/api/periodizacao-semanas/{semanaId:guid}/volumes")]
    public async Task<IActionResult> Criar(Guid semanaId, [FromBody] CriarVolumeSemanalDTO dto)
    {
        await _ownership.EnsureSemanaAccessAsync(semanaId);
        return Ok(await _service.Criar(semanaId, dto));
    }

    [HttpGet("/api/periodizacao-semanas/{semanaId:guid}/volumes")]
    public async Task<IActionResult> ListarPorSemana(Guid semanaId)
    {
        await _ownership.EnsureSemanaAccessAsync(semanaId);
        return Ok(await _service.ListarPorSemana(semanaId));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> ObterPorId(Guid id)
    {
        await _ownership.EnsureVolumeAccessAsync(id);
        var result = await _service.ObterPorId(id);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Atualizar(Guid id, [FromBody] AtualizarVolumeSemanalDTO dto)
    {
        await _ownership.EnsureVolumeAccessAsync(id);
        var result = await _service.Atualizar(id, dto);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Deletar(Guid id)
    {
        await _ownership.EnsureVolumeAccessAsync(id);
        return await _service.Deletar(id) ? NoContent() : NotFound();
    }
}
