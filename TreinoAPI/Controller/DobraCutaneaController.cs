using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using TreinoAPI.DTOs.DobraCutanea;
using TreinoAPI.Security;
using TreinoAPI.Services;

namespace TreinoAPI.Controllers;

[ApiController]
[Authorize(Roles = "PERSONAL,ADMIN")]
[Route("api/dobras-cutaneas")]
public class DobraCutaneaController : ControllerBase
{
    private readonly DobraCutaneaService _service;
    private readonly OwnershipService _ownership;

    public DobraCutaneaController(
        DobraCutaneaService service,
        OwnershipService ownership)
    {
        _service = service;
        _ownership = ownership;
    }

    [HttpPost("/api/avaliacoes/{avaliacaoId}/dobras-cutaneas")]
    public async Task<IActionResult> Criar(
        Guid avaliacaoId,
        CriarDobraCutaneaDTO dto)
    {
        await _ownership.EnsureAvaliacaoAccessAsync(avaliacaoId);
        var resultado = await _service.Criar(
            avaliacaoId,
            dto);

        return Ok(resultado);
    }

    [HttpGet("/api/avaliacoes/{avaliacaoId}/dobras-cutaneas")]
    public async Task<IActionResult> ListarPorAvaliacao(
        Guid avaliacaoId)
    {
        await _ownership.EnsureAvaliacaoAccessAsync(avaliacaoId);
        var resultado = await _service.ListarPorAvaliacao(
            avaliacaoId);

        return Ok(resultado);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> ObterPorId(Guid id)
    {
        await _ownership.EnsureDobraAccessAsync(id);
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
        await _ownership.EnsureDobraAccessAsync(id);
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
        await _ownership.EnsureDobraAccessAsync(id);
        var sucesso = await _service.Deletar(id);

        if (!sucesso)
            return NotFound("Dobra cutânea não encontrada");

        return NoContent();
    }
}
