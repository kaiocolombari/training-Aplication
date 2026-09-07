using Microsoft.AspNetCore.Mvc;
using TreinoAPI.DTOs.DobraCutanea;
using TreinoAPI.Services;

namespace TreinoAPI.Controllers;

[ApiController]
[Route("api/dobras-cutaneas")]
public class DobraCutaneaController : ControllerBase
{
    private readonly DobraCutaneaService _service;

    public DobraCutaneaController(
        DobraCutaneaService service)
    {
        _service = service;
    }

    [HttpPost("/api/avaliacoes/{avaliacaoId}/dobras-cutaneas")]
    public async Task<IActionResult> Criar(
        Guid avaliacaoId,
        CriarDobraCutaneaDTO dto)
    {
        var resultado = await _service.Criar(
            avaliacaoId,
            dto);

        return Ok(resultado);
    }

    [HttpGet("/api/avaliacoes/{avaliacaoId}/dobras-cutaneas")]
    public async Task<IActionResult> ListarPorAvaliacao(
        Guid avaliacaoId)
    {
        var resultado = await _service.ListarPorAvaliacao(
            avaliacaoId);

        return Ok(resultado);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> ObterPorId(Guid id)
    {
        var resultado = await _service.ObterPorId(id);

        if (resultado == null)
            return NotFound("Dobra cutânea não encontrada");

        return Ok(resultado);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Atualizar(
        Guid id,
        AtualizarDobraCutaneaDTO dto)
    {
        var resultado = await _service.Atualizar(
            id,
            dto);

        if (resultado == null)
            return NotFound("Dobra cutânea não encontrada");

        return Ok(resultado);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Deletar(Guid id)
    {
        var sucesso = await _service.Deletar(id);

        if (!sucesso)
            return NotFound("Dobra cutânea não encontrada");

        return NoContent();
    }
}