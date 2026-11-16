using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TreinoAPI.DTOs.TreinoDia;
using TreinoAPI.Security;
using TreinoAPI.Services;

namespace TreinoAPI.Controllers;

[ApiController]
[Authorize(Roles = "PERSONAL,ADMIN")]
[Route("api/treinos-dias")]
public sealed class TreinoDiaController : ControllerBase
{
    private readonly TreinoDiaService _service;
    private readonly OwnershipService _ownership;

    public TreinoDiaController(TreinoDiaService service, OwnershipService ownership)
    {
        _service = service;
        _ownership = ownership;
    }

    [HttpPost("/api/periodizacao-dias/{diaId:guid}/treinos")]
    public async Task<IActionResult> Criar(Guid diaId, [FromBody] CriarTreinoDiaDTO dto)
    {
        await _ownership.EnsureDiaAccessAsync(diaId);
        var result = await _service.Criar(diaId, dto);
        return Ok(result);
    }

    [HttpGet("/api/periodizacao-dias/{diaId:guid}/treinos")]
    public async Task<IActionResult> ListarPorDia(Guid diaId)
    {
        await _ownership.EnsureDiaAccessAsync(diaId);
        return Ok(await _service.ListarPorDia(diaId));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> ObterPorId(Guid id)
    {
        await _ownership.EnsureTreinoDiaAccessAsync(id);
        var result = await _service.ObterPorId(id);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Atualizar(Guid id, [FromBody] AtualizarTreinoDiaDTO dto)
    {
        await _ownership.EnsureTreinoDiaAccessAsync(id);
        var result = await _service.Atualizar(id, dto);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Deletar(Guid id)
    {
        await _ownership.EnsureTreinoDiaAccessAsync(id);
        return await _service.Deletar(id) ? NoContent() : NotFound();
    }
}
