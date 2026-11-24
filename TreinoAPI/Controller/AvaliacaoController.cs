using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TreinoAPI.DTOs.Avaliacao;
using TreinoAPI.Security;
using TreinoAPI.Services;

namespace TreinoAPI.Controllers;

[ApiController]
[Authorize(Roles = "PERSONAL,ADMIN,ALUNO")]
public sealed class AvaliacaoController : ControllerBase
{
    private readonly AvaliacaoService _service;
    private readonly OwnershipService _ownership;

    public AvaliacaoController(AvaliacaoService service, OwnershipService ownership)
    {
        _service = service;
        _ownership = ownership;
    }

    [Authorize(Roles = "PERSONAL,ADMIN")]
    [HttpPost("/api/alunos/{alunoId:guid}/avaliacoes")]
    public async Task<IActionResult> Criar(Guid alunoId, [FromBody] CriarAvaliacaoDTO dto)
    {
        await _ownership.EnsureAlunoAccessAsync(alunoId);
        var result = await _service.Criar(alunoId, dto);
        return CreatedAtAction(nameof(ObterPorId), new { id = result.Id }, result);
    }

    [HttpGet("/api/alunos/{alunoId:guid}/avaliacoes")]
    public async Task<IActionResult> ListarPorAluno(Guid alunoId)
    {
        await _ownership.EnsureAlunoAccessAsync(alunoId);
        return Ok(await _service.ListarPorAluno(alunoId));
    }

    [HttpGet("/api/avaliacoes/{id:guid}")]
    public async Task<IActionResult> ObterPorId(Guid id)
    {
        await _ownership.EnsureAvaliacaoAccessAsync(id);
        var result = await _service.ObterPorId(id);
        return result is null ? NotFound() : Ok(result);
    }

    [Authorize(Roles = "PERSONAL,ADMIN")]
    [HttpPut("/api/avaliacoes/{id:guid}")]
    public async Task<IActionResult> Atualizar(Guid id, [FromBody] AtualizarAvaliacaoDTO dto)
    {
        await _ownership.EnsureAvaliacaoAccessAsync(id);
        var result = await _service.Atualizar(id, dto);
        return result is null ? NotFound() : Ok(result);
    }

    [Authorize(Roles = "PERSONAL,ADMIN")]
    [HttpDelete("/api/avaliacoes/{id:guid}")]
    public async Task<IActionResult> Deletar(Guid id)
    {
        await _ownership.EnsureAvaliacaoAccessAsync(id);
        return await _service.Deletar(id) ? NoContent() : NotFound();
    }

    [HttpGet("/api/avaliacoes/{id:guid}/historico")]
    public async Task<IActionResult> ListarHistorico(Guid id)
    {
        await _ownership.EnsureAvaliacaoAccessAsync(id);
        return Ok(await _service.ListarHistorico(id));
    }
}
