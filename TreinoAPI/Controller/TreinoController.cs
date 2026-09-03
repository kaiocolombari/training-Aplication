using Microsoft.AspNetCore.Mvc;
using TreinoAPI.DTOs.Treino;
using TreinoAPI.Services;

namespace TreinoAPI.Controllers;

[ApiController]
[Route("api/treinos")]
public class TreinoController : ControllerBase
{
    private readonly TreinoService _service;

    public TreinoController(TreinoService service)
    {
        _service = service;
    }

    [HttpPost("{alunoId}")]
    public async Task<IActionResult> Criar(
        Guid alunoId,
        CriarTreinoDTO dto)
    {
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
        var resultado = await _service.Listar();

        return Ok(resultado);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> ObterPorId(Guid id)
    {
        var resultado = await _service.ObterPorId(id);

        if (resultado == null)
            return NotFound("Treino não encontrado");

        return Ok(resultado);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Atualizar(
        Guid id,
        AtualizarTreinoDTO dto)
    {
        var resultado = await _service.Atualizar(id, dto);

        return Ok(resultado);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Deletar(Guid id)
    {
        var sucesso = await _service.Deletar(id);

        if (!sucesso)
            return NotFound("Treino não encontrado");

        return NoContent();
    }
}