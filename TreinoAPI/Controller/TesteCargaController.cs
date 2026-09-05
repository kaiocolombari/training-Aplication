
using Microsoft.AspNetCore.Mvc;
using TreinoAPI.Data;
using TreinoAPI.DTOs.TesteCarga;
using TreinoAPI.Services;

namespace TreinoAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TesteCargaController : ControllerBase
{
    private readonly TesteCargaService _service;

    public TesteCargaController(TesteCargaService service)
    {
        _service = service;
    }

    [HttpPost("{alunoId}")]
    public async Task<IActionResult> Criar(
        Guid alunoId,
        CriarTesteCargaDTO dto)
    {
        var testeCarga = await _service.Criar(alunoId, dto);

        return CreatedAtAction(
            nameof(ObterPorId),
            new { id = testeCarga.Id },
            testeCarga
        );
    }

    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        var testesCarga = await _service.Listar();

        return Ok(testesCarga);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> ObterPorId(Guid id)
    {
        var testeCarga = await _service.ObterPorId(id);

        if (testeCarga == null)
            return NotFound("Teste de carga não encontrado");

        return Ok(testeCarga);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Atualizar(Guid id, AtualizarTesteCargaDTO dto)
    {
        var testeCarga = await _service.Atualizar(id, dto);

        if (testeCarga == null)
            return NotFound("Teste de carga não encontrado");

        return Ok(testeCarga);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Deletar(Guid id)
    {
        var sucesso = await _service.Deletar(id);

        if (!sucesso)
            return NotFound("Teste de carga não encontrado");

        return NoContent();
    }
}