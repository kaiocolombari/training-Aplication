using Microsoft.AspNetCore.Mvc;
using TreinoAPI.DTOs.TreinoDia;
using TreinoAPI.Services;

namespace TreinoAPI.Controllers;

[ApiController]
[Route("api/treinos-dias")]
public class TreinoDiaController : ControllerBase
{
    private readonly TreinoDiaService _service;

    public TreinoDiaController(TreinoDiaService service)
    {
        _service = service;
    }

    [HttpPost("/api/periodizacao-dias/{diaId}/treinos")]
    public async Task<IActionResult> Criar(
        Guid diaId,
        CriarTreinoDiaDTO dto)
    {
        var resultado = await _service.Criar(diaId, dto);

        return Ok(resultado);
    }

    [HttpGet("/api/periodizacao-dias/{diaId}/treinos")]
    public async Task<IActionResult> ListarPorDia(Guid diaId)
    {
        var resultado = await _service.ListarPorDia(diaId);

        return Ok(resultado);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> ObterPorId(Guid id)
    {
        var resultado = await _service.ObterPorId(id);

        if (resultado == null)
            return NotFound("Treino do dia não encontrado");

        return Ok(resultado);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Atualizar(
        Guid id,
        AtualizarTreinoDiaDTO dto)
    {
        var resultado = await _service.Atualizar(id, dto);

        if (resultado == null)
            return NotFound("Treino do dia não encontrado");

        return Ok(resultado);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Deletar(Guid id)
    {
        var sucesso = await _service.Deletar(id);

        if (!sucesso)
            return NotFound("Treino do dia não encontrado");

        return NoContent();
    }
}