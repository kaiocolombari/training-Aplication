
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using TreinoAPI.Data;
using TreinoAPI.DTOs.TesteCarga;
using TreinoAPI.Security;
using TreinoAPI.Services;

namespace TreinoAPI.Controllers;

[ApiController]
[Authorize(Roles = "PERSONAL,ADMIN")]
[Route("api/[controller]")]
public class TesteCargaController : ControllerBase
{
    private readonly TesteCargaService _service;
    private readonly OwnershipService _ownership;

    public TesteCargaController(TesteCargaService service, OwnershipService ownership)
    {
        _service = service;
        _ownership = ownership;
    }

    [HttpPost("{alunoId}")]
    public async Task<IActionResult> Criar(
        Guid alunoId,
        CriarTesteCargaDTO dto)
    {
        await _ownership.EnsureAlunoAccessAsync(alunoId);
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
        var ids = await _ownership.GetAccessibleAlunoIdsAsync();
        var testesCarga = await _service.Listar(ids);

        return Ok(testesCarga);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> ObterPorId(Guid id)
    {
        await _ownership.EnsureTesteCargaAccessAsync(id);
        var testeCarga = await _service.ObterPorId(id);

        if (testeCarga == null)
            return NotFound("Teste de carga não encontrado");

        return Ok(testeCarga);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Atualizar(Guid id, AtualizarTesteCargaDTO dto)
    {
        await _ownership.EnsureTesteCargaAccessAsync(id);
        var testeCarga = await _service.Atualizar(id, dto);

        if (testeCarga == null)
            return NotFound("Teste de carga não encontrado");

        return Ok(testeCarga);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Deletar(Guid id)
    {
        await _ownership.EnsureTesteCargaAccessAsync(id);
        var sucesso = await _service.Deletar(id);

        if (!sucesso)
            return NotFound("Teste de carga não encontrado");

        return NoContent();
    }
}
