using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using TreinoAPI.DTOs.Anamnese;
using TreinoAPI.Security;
using TreinoAPI.Services;

namespace TreinoAPI.Controllers;

[ApiController]
[Authorize(Roles = "PERSONAL,ADMIN")]
[Route("api/anamneses")]
public class AnamneseController : ControllerBase
{
    private readonly AnamneseService _service;
    private readonly OwnershipService _ownership;

    public AnamneseController(AnamneseService service, OwnershipService ownership)
    {
        _service = service;
        _ownership = ownership;
    }

    [HttpPost("{alunoId}")]
    public async Task<IActionResult> Criar(
        Guid alunoId,
        CriarAnamneseDTO dto)
    {
        await _ownership.EnsureAlunoAccessAsync(alunoId);
        var resultado = await _service.Criar(alunoId, dto);

        return CreatedAtAction(
            nameof(ObterPorId),
            new { id = resultado.Id },
            resultado
        );
    }

    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        var ids = await _ownership.GetAccessibleAlunoIdsAsync();
        var resultado = await _service.Listar(ids);

        return Ok(resultado);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> ObterPorId(Guid id)
    {
        await _ownership.EnsureAnamneseAccessAsync(id);
        var resultado = await _service.BuscarPorId(id);

        if (resultado == null)
            return NotFound("Anamnese não encontrada");

        return Ok(resultado);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Atualizar(
        Guid id,
        AtualizarAnamneseDTO dto)
    {
        await _ownership.EnsureAnamneseAccessAsync(id);
        var resultado = await _service.Atualizar(id, dto);
        return resultado ? NoContent() : NotFound("Anamnese não encontrada.");
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Deletar(Guid id)
    {
        await _ownership.EnsureAnamneseAccessAsync(id);
        var sucesso = await _service.Deletar(id);

        if (!sucesso)
            return NotFound("Anamnese não encontrada");

        return NoContent();
    }
}
