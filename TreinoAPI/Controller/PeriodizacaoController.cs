using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using TreinoAPI.DTOs.Periodizacao;
using TreinoAPI.Security;
using TreinoAPI.Services;

namespace TreinoAPI.Controllers;



[ApiController]
[Authorize(Roles = "PERSONAL,ADMIN")]
[Route("api/periodizacoes")]
public class PeriodizacaoController : ControllerBase
{
    private readonly PeriodizacaoService _service;
    private readonly OwnershipService _ownership;

    public PeriodizacaoController(PeriodizacaoService service, OwnershipService ownership)
    {
        _service = service;
        _ownership = ownership;
    }

    [HttpPost("/api/alunos/{alunoId}/periodizacoes")]
    public async Task<IActionResult> Criar(
        Guid alunoId,
        PeriodizacaoDTO dto)
    {
        await _ownership.EnsureAlunoAccessAsync(alunoId);
        var resultado = await _service.Criar(alunoId, dto);

        return Ok(resultado);
    }

    [HttpGet("/api/alunos/{alunoId}/periodizacoes")]
    public async Task<IActionResult> ListarPorAluno(Guid alunoId)
    {
        await _ownership.EnsureAlunoAccessAsync(alunoId);
        var resultado = await _service.ListarPorAluno(alunoId);

        return Ok(resultado);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> ObterPorId(Guid id)
    {
        await _ownership.EnsurePeriodizacaoAccessAsync(id);
        var resultado = await _service.ObterPorId(id);

        if (resultado == null)
            return NotFound("Periodização não encontrada");

        return Ok(resultado);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Atualizar(
        Guid id,
        PeriodizacaoDTO dto)
    {
        await _ownership.EnsurePeriodizacaoAccessAsync(id);
        var resultado = await _service.Atualizar(id, dto);

        if (resultado == null)
            return NotFound("Periodização não encontrada");

        return Ok(resultado);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Deletar(Guid id)
    {
        await _ownership.EnsurePeriodizacaoAccessAsync(id);
        var sucesso = await _service.Deletar(id);

        if (!sucesso)
            return NotFound("Periodização não encontrada");

        return NoContent();
    }
}
