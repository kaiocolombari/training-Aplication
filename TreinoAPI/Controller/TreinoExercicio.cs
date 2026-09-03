using Microsoft.AspNetCore.Mvc;
using TreinoAPI.DTOs.Exercicio;
using TreinoAPI.Services;

namespace TreinoAPI.Controllers;

[ApiController]
[Route("api/treinos/{treinoId}/exercicios")]
public class TreinoExercicioController : ControllerBase
{
    private readonly TreinoExercicioService _service;

    public TreinoExercicioController(TreinoExercicioService service)
    {
        _service = service;
    }

    [HttpPost]
    public async Task<IActionResult> Criar(
        Guid treinoId,
        CriarTreinoExercicioDTO dto)
    {
        var resultado = await _service.Criar(treinoId, dto);

        return CreatedAtAction(
            nameof(ObterPorId),
            new
            {
                treinoId,
                id = resultado.Id
            },
            resultado
        );
    }

    [HttpGet]
    public async Task<IActionResult> Listar(Guid treinoId)
    {
        var resultado = await _service.ListarPorTreino(treinoId);

        return Ok(resultado);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> ObterPorId(
        Guid treinoId,
        Guid id)
    {
        var resultado = await _service.ObterPorId(id);

        if (resultado == null)
            return NotFound("Exercício não encontrado");

        return Ok(resultado);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Atualizar(
        Guid treinoId,
        Guid id,
        AtualizarTreinoExercicioDTO dto)
    {
        var resultado = await _service.Atualizar(id, dto);

        return Ok(resultado);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Deletar(
        Guid treinoId,
        Guid id)
    {
        var sucesso = await _service.Deletar(id);

        if (!sucesso)
            return NotFound("Exercício não encontrado");

        return NoContent();
    }
}