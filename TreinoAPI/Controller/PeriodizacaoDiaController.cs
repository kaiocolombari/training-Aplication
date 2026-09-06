using Microsoft.AspNetCore.Mvc;
using TreinoAPI.DTOs.Periodizacao;
using TreinoAPI.Services;

namespace TreinoAPI.Controllers;

[ApiController]
[Route("api/periodizacao-dias")]
public class PeriodizacaoDiaController : ControllerBase
{
    private readonly PeriodizacaoDiaService _service;

    public PeriodizacaoDiaController(
        PeriodizacaoDiaService service)
    {
        _service = service;
    }

    [HttpPost("/api/periodizacao-semanas/{semanaId}/dias")]
    public async Task<IActionResult> Criar(
        Guid semanaId,
        PeriodizacaoDiaDTO dto)
    {
        var resultado = await _service.Criar(
            semanaId,
            dto);

        return Ok(resultado);
    }

    [HttpGet("/api/periodizacao-semanas/{semanaId}/dias")]
    public async Task<IActionResult> ListarPorSemana(
        Guid semanaId)
    {
        var resultado = await _service.ListarPorSemana(
            semanaId);

        return Ok(resultado);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> ObterPorId(Guid id)
    {
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
        var resultado = await _service.Atualizar(id, dto);

        if (resultado == null)
            return NotFound("Dia não encontrado");

        return Ok(resultado);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Deletar(Guid id)
    {
        var sucesso = await _service.Deletar(id);

        if (!sucesso)
            return NotFound("Dia não encontrado");

        return NoContent();
    }
}