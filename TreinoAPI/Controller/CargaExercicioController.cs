using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TreinoAPI.DTOs.CargaExercicio;
using TreinoAPI.Security;
using TreinoAPI.Services;

namespace TreinoAPI.Controllers;

[ApiController]
[Authorize(Roles = "PERSONAL,ADMIN")]
[Route("api/carga-exercicio")]
public sealed class CargaExercicioController : ControllerBase
{
    private readonly CargaExercicioService _service;
    private readonly OwnershipService _ownership;

    public CargaExercicioController(CargaExercicioService service, OwnershipService ownership)
    {
        _service = service;
        _ownership = ownership;
    }

    [HttpPost("{testeCargaId:guid}")]
    public async Task<IActionResult> Criar(Guid testeCargaId, [FromBody] CriarCargaExercicioDTO dto)
    {
        await _ownership.EnsureTesteCargaAccessAsync(testeCargaId);
        var result = await _service.Criar(testeCargaId, dto);
        return CreatedAtAction(nameof(ObterPorId), new { id = result.Id }, result);
    }

    [HttpGet("teste-carga/{testeCargaId:guid}")]
    public async Task<IActionResult> ListarPorTesteCarga(Guid testeCargaId)
    {
        await _ownership.EnsureTesteCargaAccessAsync(testeCargaId);
        return Ok(await _service.ListarPorTesteCarga(testeCargaId));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> ObterPorId(Guid id)
    {
        await _ownership.EnsureCargaExercicioAccessAsync(id);
        var result = await _service.ObterPorId(id);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Atualizar(Guid id, [FromBody] AtualizarCargaExercicioDTO dto)
    {
        await _ownership.EnsureCargaExercicioAccessAsync(id);
        var result = await _service.Atualizar(id, dto);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Deletar(Guid id)
    {
        await _ownership.EnsureCargaExercicioAccessAsync(id);
        return await _service.Deletar(id) ? NoContent() : NotFound();
    }
}
