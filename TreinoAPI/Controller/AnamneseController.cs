using Microsoft.AspNetCore.Mvc;
using TreinoAPI.DTOs.Anamnese;
using TreinoAPI.Services;

namespace TreinoAPI.Controllers;

[ApiController]
[Route("api/anamneses")]
public class AnamneseController : ControllerBase
{
    private readonly AnamneseService _service;

    public AnamneseController(AnamneseService service)
    {
        _service = service;
    }

    [HttpPost("{alunoId}")]
    public async Task<IActionResult> Criar(
        Guid alunoId,
        CriarAnamneseDTO dto)
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
        var resultado = await _service.BuscarPorId(id);

        if (resultado == null)
            return NotFound("Anamnese não encontrada");

        return Ok(resultado);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Atualizar(
        Guid id,
        AtualizarAnamneseDTO dto)
    {
        var resultado = await _service.Atualizar(id, dto);

        return Ok(resultado);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Deletar(Guid id)
    {
        var sucesso = await _service.Deletar(id);

        if (!sucesso)
            return NotFound("Anamnese não encontrada");

        return NoContent();
    }
}