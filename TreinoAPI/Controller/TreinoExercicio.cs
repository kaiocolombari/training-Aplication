using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TreinoAPI.DTOs.Exercicio;
using TreinoAPI.Security;
using TreinoAPI.Services;

namespace TreinoAPI.Controllers;

[ApiController]
[Authorize(Roles = "PERSONAL,ADMIN,ALUNO")]
[Route("api/treinos/{treinoId:guid}/exercicios")]
public sealed class TreinoExercicioController : ControllerBase
{
    private readonly TreinoExercicioService _service;
    private readonly OwnershipService _ownership;

    public TreinoExercicioController(TreinoExercicioService service, OwnershipService ownership)
    {
        _service = service;
        _ownership = ownership;
    }

    [Authorize(Roles = "PERSONAL,ADMIN")]
    [HttpPost]
    public async Task<IActionResult> Criar(Guid treinoId, [FromBody] CriarTreinoExercicioDTO dto)
    {
        await _ownership.EnsureTreinoAccessAsync(treinoId);
        var result = await _service.Criar(treinoId, dto);
        return CreatedAtAction(nameof(ObterPorId), new { treinoId, id = result.Id }, result);
    }

    [HttpGet]
    public async Task<IActionResult> Listar(Guid treinoId)
    {
        await _ownership.EnsureTreinoAccessAsync(treinoId);
        return Ok(await _service.ListarPorTreino(treinoId));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> ObterPorId(Guid treinoId, Guid id)
    {
        await _ownership.EnsureTreinoExercicioAccessAsync(treinoId, id);
        var result = await _service.ObterPorId(treinoId, id);
        return result is null ? NotFound() : Ok(result);
    }

    [Authorize(Roles = "PERSONAL,ADMIN")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Atualizar(Guid treinoId, Guid id, [FromBody] AtualizarTreinoExercicioDTO dto)
    {
        await _ownership.EnsureTreinoExercicioAccessAsync(treinoId, id);
        var result = await _service.Atualizar(treinoId, id, dto);
        return result is null ? NotFound() : Ok(result);
    }

    [Authorize(Roles = "PERSONAL,ADMIN")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Deletar(Guid treinoId, Guid id)
    {
        await _ownership.EnsureTreinoExercicioAccessAsync(treinoId, id);
        return await _service.Deletar(treinoId, id) ? NoContent() : NotFound();
    }
}
