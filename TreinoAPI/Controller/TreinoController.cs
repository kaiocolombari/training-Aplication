using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TreinoAPI.DTOs.Treino;
using TreinoAPI.Security;
using TreinoAPI.Services;

namespace TreinoAPI.Controllers;

[ApiController]
[Authorize(Roles = "PERSONAL,ADMIN,ALUNO")]
[Route("api/treinos")]
public sealed class TreinoController : ControllerBase
{
    private readonly TreinoService _service;
    private readonly OwnershipService _ownership;

    public TreinoController(TreinoService service, OwnershipService ownership)
    {
        _service = service;
        _ownership = ownership;
    }

    [Authorize(Roles = "PERSONAL,ADMIN")]
    [HttpPost("{alunoId:guid}")]
    public async Task<IActionResult> Criar(Guid alunoId, [FromBody] CriarTreinoDTO dto)
    {
        await _ownership.EnsureAlunoAccessAsync(alunoId);
        var result = await _service.Criar(alunoId, dto);
        return CreatedAtAction(nameof(ObterPorId), new { id = result.Id }, result);
    }

    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        var ids = await _ownership.GetAccessibleAlunoIdsAsync();
        return Ok(await _service.Listar(ids));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> ObterPorId(Guid id)
    {
        await _ownership.EnsureTreinoAccessAsync(id);
        var result = await _service.ObterPorId(id);
        return result is null ? NotFound() : Ok(result);
    }

    [Authorize(Roles = "PERSONAL,ADMIN")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Atualizar(Guid id, [FromBody] AtualizarTreinoDTO dto)
    {
        await _ownership.EnsureTreinoAccessAsync(id);
        return await _service.Atualizar(id, dto) ? NoContent() : NotFound();
    }

    [Authorize(Roles = "PERSONAL,ADMIN")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Deletar(Guid id)
    {
        await _ownership.EnsureTreinoAccessAsync(id);
        return await _service.Deletar(id) ? NoContent() : NotFound();
    }
}
