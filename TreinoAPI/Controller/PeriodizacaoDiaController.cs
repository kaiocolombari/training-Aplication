using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using TreinoAPI.DTOs.Periodizacao;
using TreinoAPI.Security;
using TreinoAPI.Services;

namespace TreinoAPI.Controllers;

[ApiController]
[Authorize(Roles = "PERSONAL,ADMIN")]
[Route("api/periodizacao-dias")]
public class PeriodizacaoDiaController : ControllerBase
{
    private readonly PeriodizacaoDiaService _service;
    private readonly OwnershipService _ownership;

    public PeriodizacaoDiaController(
        PeriodizacaoDiaService service,
        OwnershipService ownership)
    {
        _service = service;
        _ownership = ownership;
    }

    [HttpPost("/api/periodizacao-semanas/{semanaId}/dias")]
    public async Task<IActionResult> Criar(
        Guid semanaId,
        PeriodizacaoDiaDTO dto)
    {
        await _ownership.EnsureSemanaAccessAsync(semanaId);
        var resultado = await _service.Criar(
            semanaId,
            dto);

        return Ok(resultado);
    }

    [HttpGet("/api/periodizacao-semanas/{semanaId}/dias")]
    public async Task<IActionResult> ListarPorSemana(
        Guid semanaId)
    {
        await _ownership.EnsureSemanaAccessAsync(semanaId);
        var resultado = await _service.ListarPorSemana(
            semanaId);

        return Ok(resultado);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> ObterPorId(Guid id)
    {
        await _ownership.EnsureDiaAccessAsync(id);
        var resultado = await _service.ObterPorId(id);

        if (resultado == null)
            return NotFound("Dia não encontrado");

        return Ok(resultado);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Atualizar(
        Guid id,
        PeriodizacaoDiaDTO dto)
    {
        await _ownership.EnsureDiaAccessAsync(id);
        var resultado = await _service.Atualizar(id, dto);

        if (resultado == null)
            return NotFound("Dia não encontrado");

        return Ok(resultado);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Deletar(Guid id)
    {
        await _ownership.EnsureDiaAccessAsync(id);
        var sucesso = await _service.Deletar(id);

        if (!sucesso)
            return NotFound("Dia não encontrado");

        return NoContent();
    }
}
