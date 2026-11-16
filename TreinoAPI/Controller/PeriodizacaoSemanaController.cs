using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using TreinoAPI.DTOs.Periodizacao;
using TreinoAPI.Security;
using TreinoAPI.Services;

namespace TreinoAPI.Controllers;

[ApiController]
[Authorize(Roles = "PERSONAL,ADMIN")]
[Route("api/periodizacao-semanas")]
public class PeriodizacaoSemanaController : ControllerBase
{
    private readonly PeriodizacaoSemanaService _service;
    private readonly OwnershipService _ownership;

    public PeriodizacaoSemanaController(
        PeriodizacaoSemanaService service,
        OwnershipService ownership)
    {
        _service = service;
        _ownership = ownership;
    }

    [HttpPost("/api/periodizacoes/{periodizacaoId}/semanas")]
    public async Task<IActionResult> Criar(
        Guid periodizacaoId,
        PeriodizacaoSemanaDTO dto)
    {
        await _ownership.EnsurePeriodizacaoAccessAsync(periodizacaoId);
        var resultado = await _service.Criar(
            periodizacaoId,
            dto);

        return Ok(resultado);
    }

    [HttpGet("/api/periodizacoes/{periodizacaoId}/semanas")]
    public async Task<IActionResult> ListarPorPeriodizacao(
        Guid periodizacaoId)
    {
        await _ownership.EnsurePeriodizacaoAccessAsync(periodizacaoId);
        var resultado = await _service.ListarPorPeriodizacao(
            periodizacaoId);

        return Ok(resultado);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> ObterPorId(Guid id)
    {
        await _ownership.EnsureSemanaAccessAsync(id);
        var resultado = await _service.ObterPorId(id);

        if (resultado == null)
            return NotFound("Semana não encontrada");

        return Ok(resultado);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Atualizar(
        Guid id,
        PeriodizacaoSemanaDTO dto)
    {
        await _ownership.EnsureSemanaAccessAsync(id);
        var resultado = await _service.Atualizar(id, dto);

        if (resultado == null)
            return NotFound("Semana não encontrada");

        return Ok(resultado);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Deletar(Guid id)
    {
        await _ownership.EnsureSemanaAccessAsync(id);
        var sucesso = await _service.Deletar(id);

        if (!sucesso)
            return NotFound("Semana não encontrada");

        return NoContent();
    }
}
