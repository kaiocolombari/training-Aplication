using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TreinoAPI.DTOs.AnaliseEstatistica;
using TreinoAPI.Security;
using TreinoAPI.Services;

namespace TreinoAPI.Controllers;

[ApiController]
[Authorize(Roles = "ADMIN,PERSONAL")]
[Route("api/alunos/{alunoId:guid}/analises-estatisticas")]
public sealed class AnaliseEstatisticaController : ControllerBase
{
    private readonly AnaliseEstatisticaService _service;
    private readonly OwnershipService _ownership;
    private readonly CurrentUserService _current;

    public AnaliseEstatisticaController(
        AnaliseEstatisticaService service,
        OwnershipService ownership,
        CurrentUserService current)
    {
        _service = service;
        _ownership = ownership;
        _current = current;
    }

    [HttpGet]
    public async Task<IActionResult> Listar(Guid alunoId)
    {
        await _ownership.EnsureControleAvancadoAccessAsync();
        await _ownership.EnsureAlunoAccessAsync(alunoId);
        return Ok(await _service.ListarAsync(alunoId));
    }

    [HttpPost]
    public async Task<IActionResult> Criar(Guid alunoId, [FromBody] CriarAnaliseEstatisticaDTO dto)
    {
        await _ownership.EnsureControleAvancadoAccessAsync();
        await _ownership.EnsureAlunoAccessAsync(alunoId);
        var registro = await _service.CriarAsync(alunoId, _current.UsuarioId, dto);
        return CreatedAtAction(nameof(Listar), new { alunoId }, registro);
    }
}
