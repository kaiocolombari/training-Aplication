using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using TreinoAPI.DTOs.Perimetro;
using TreinoAPI.Security;
using TreinoAPI.Services;

namespace TreinoAPI.Controllers;

[ApiController]
[Authorize(Roles = "PERSONAL,ADMIN")]
[Route("api/perimetros")]
public class PerimetroController : ControllerBase
{
    private readonly PerimetroService _service;
    private readonly OwnershipService _ownership;

    public PerimetroController(PerimetroService service, OwnershipService ownership)
    {
        _service = service;
        _ownership = ownership;
    }

    [HttpPost("/api/avaliacoes/{avaliacaoId}/perimetro")]
    public async Task<IActionResult> Criar(
        Guid avaliacaoId,
        CriarPerimetroDTO dto)
    {
        await _ownership.EnsureAvaliacaoAccessAsync(avaliacaoId);
        var resultado = await _service.Criar(
            avaliacaoId,
            dto);

        return Ok(resultado);
    }

    [HttpGet("/api/avaliacoes/{avaliacaoId}/perimetro")]
    public async Task<IActionResult> ObterPorAvaliacao(
        Guid avaliacaoId)
    {
        await _ownership.EnsureAvaliacaoAccessAsync(avaliacaoId);
        var resultado = await _service.ObterPorAvaliacao(
            avaliacaoId);

        if (resultado == null)
            return NotFound("Perímetro não encontrado");

        return Ok(resultado);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> ObterPorId(Guid id)
    {
        await _ownership.EnsurePerimetroAccessAsync(id);
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
        await _ownership.EnsurePerimetroAccessAsync(id);
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
        await _ownership.EnsurePerimetroAccessAsync(id);
        var sucesso = await _service.Deletar(id);

        if (!sucesso)
            return NotFound("Perímetro não encontrado");

        return NoContent();
    }
}
