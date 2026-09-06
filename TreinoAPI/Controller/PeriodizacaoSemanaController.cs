using Microsoft.AspNetCore.Mvc;
using TreinoAPI.DTOs.Periodizacao;
using TreinoAPI.Services;

namespace TreinoAPI.Controllers;

[ApiController]
[Route("api/periodizacao-semanas")]
public class PeriodizacaoSemanaController : ControllerBase
{
    private readonly PeriodizacaoSemanaService _service;

    public PeriodizacaoSemanaController(
        PeriodizacaoSemanaService service)
    {
        _service = service;
    }

    [HttpPost("/api/periodizacoes/{periodizacaoId}/semanas")]
    public async Task<IActionResult> Criar(
        Guid periodizacaoId,
        PeriodizacaoSemanaDTO dto)
    {
        var resultado = await _service.Criar(
            periodizacaoId,
            dto);

        return Ok(resultado);
    }

    [HttpGet("/api/periodizacoes/{periodizacaoId}/semanas")]
    public async Task<IActionResult> ListarPorPeriodizacao(
        Guid periodizacaoId)
    {
        var resultado = await _service.ListarPorPeriodizacao(
            periodizacaoId);

        return Ok(resultado);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> ObterPorId(Guid id)
    {
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
        var resultado = await _service.Atualizar(id, dto);

        if (resultado == null)
            return NotFound("Semana não encontrada");

        return Ok(resultado);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Deletar(Guid id)
    {
        var sucesso = await _service.Deletar(id);

        if (!sucesso)
            return NotFound("Semana não encontrada");

        return NoContent();
    }
}