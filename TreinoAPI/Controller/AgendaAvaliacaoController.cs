using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TreinoAPI.DTOs.Avaliacao;
using TreinoAPI.Security;
using TreinoAPI.Services;

namespace TreinoAPI.Controllers;

[ApiController]
[Authorize(Roles = "ADMIN,PERSONAL,ALUNO")]
public sealed class AgendaAvaliacaoController : ControllerBase
{
    private readonly AgendaAvaliacaoService _service;
    private readonly OwnershipService _ownership;

    public AgendaAvaliacaoController(AgendaAvaliacaoService service, OwnershipService ownership)
    {
        _service = service;
        _ownership = ownership;
    }

    [Authorize(Roles = "ALUNO")]
    [HttpGet("/api/avaliacoes/agenda")]
    public async Task<IActionResult> ListarDoAluno() => Ok(await _service.ListarDoAlunoAsync());

    [Authorize(Roles = "PERSONAL,ADMIN")]
    [HttpGet("/api/avaliacoes/solicitacoes/pendentes")]
    public async Task<IActionResult> ListarSolicitacoesPendentes() =>
        Ok(await _service.ListarSolicitacoesPendentesAsync());

    [Authorize(Roles = "PERSONAL,ADMIN")]
    [HttpGet("/api/alunos/{alunoId:guid}/avaliacoes/agenda")]
    public async Task<IActionResult> ListarPorAluno(Guid alunoId)
    {
        await _ownership.EnsureAlunoAccessAsync(alunoId);
        return Ok(await _service.ListarPorAlunoAsync(alunoId));
    }

    [Authorize(Roles = "ALUNO")]
    [HttpPost("/api/avaliacoes/solicitacoes")]
    public async Task<IActionResult> Solicitar([FromBody] SolicitarAvaliacaoDTO dto) =>
        Ok(await _service.SolicitarAsync(dto));

    [Authorize(Roles = "PERSONAL,ADMIN")]
    [HttpPost("/api/alunos/{alunoId:guid}/avaliacoes/agendamentos")]
    public async Task<IActionResult> Agendar(Guid alunoId, [FromBody] AgendarAvaliacaoDTO dto)
    {
        await _ownership.EnsureAlunoAccessAsync(alunoId);
        return Ok(await _service.AgendarAsync(alunoId, dto));
    }

    [Authorize(Roles = "PERSONAL,ADMIN")]
    [HttpPatch("/api/avaliacoes/solicitacoes/{id:guid}/recusar")]
    public async Task<IActionResult> Recusar(Guid id)
    {
        await _ownership.EnsureSolicitacaoAvaliacaoAccessAsync(id);
        await _service.RecusarAsync(id);
        return NoContent();
    }
}
