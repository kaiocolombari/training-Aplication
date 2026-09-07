using Microsoft.AspNetCore.Mvc;
using TreinoAPI.DTOs.Perimetro;
using TreinoAPI.Services;

namespace TreinoAPI.Controllers;

[ApiController]
[Route("api/perimetros")]
public class PerimetroController : ControllerBase
{
    private readonly PerimetroService _service;

    public PerimetroController(PerimetroService service)
    {
        _service = service;
    }

    [HttpPost("/api/avaliacoes/{avaliacaoId}/perimetro")]
    public async Task<IActionResult> Criar(
        Guid avaliacaoId,
        CriarPerimetroDTO dto)
    {
        var resultado = await _service.Criar(
            avaliacaoId,
            dto);

        return Ok(resultado);
    }

    [HttpGet("/api/avaliacoes/{avaliacaoId}/perimetro")]
    public async Task<IActionResult> ObterPorAvaliacao(
        Guid avaliacaoId)
    {
        var resultado = await _service.ObterPorAvaliacao(
            avaliacaoId);

        if (resultado == null)
            return NotFound("Perímetro não encontrado");

        return Ok(resultado);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> ObterPorId(Guid id)
    {
        var resultado = await _service.ObterPorId(id);

        if (resultado == null)
            return NotFound("Perímetro não encontrado");

        return Ok(resultado);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Atualizar(
        Guid id,
        AtualizarPerimetroDTO dto)
    {
        var resultado = await _service.Atualizar(
            id,
            dto);

        if (resultado == null)
            return NotFound("Perímetro não encontrado");

        return Ok(resultado);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Deletar(Guid id)
    {
        var sucesso = await _service.Deletar(id);

        if (!sucesso)
            return NotFound("Perímetro não encontrado");

        return NoContent();
    }
}