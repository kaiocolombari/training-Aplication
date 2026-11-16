using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TreinoAPI.DTOs.VolumeAcompanhamento;
using TreinoAPI.Security;
using TreinoAPI.Services;

namespace TreinoAPI.Controllers;

[ApiController]
[Authorize]
public sealed class VolumeAcompanhamentoController : ControllerBase
{
    private readonly VolumeAcompanhamentoService _service;
    private readonly OwnershipService _ownership;
    private readonly CurrentUserService _current;

    public VolumeAcompanhamentoController(
        VolumeAcompanhamentoService service,
        OwnershipService ownership,
        CurrentUserService current)
    {
        _service = service;
        _ownership = ownership;
        _current = current;
    }

    [HttpGet("api/alunos/{alunoId:guid}/volume-ciclos")]
    [Authorize(Roles = "ADMIN,PERSONAL,ALUNO")]
    public async Task<IActionResult> Listar(Guid alunoId)
    {
        await _ownership.EnsureAlunoAccessAsync(alunoId);
        return Ok(await _service.ListarAsync(alunoId));
    }

    [HttpPost("api/alunos/{alunoId:guid}/volume-ciclos")]
    [Authorize(Roles = "ADMIN,PERSONAL")]
    public async Task<IActionResult> Iniciar(Guid alunoId, [FromBody] IniciarCicloVolumeDTO dto)
    {
        await _ownership.EnsureAlunoAccessAsync(alunoId);
        var ciclo = await _service.IniciarAsync(alunoId, dto, _current.UsuarioId);
        return CreatedAtAction(nameof(Listar), new { alunoId }, ciclo);
    }

    [HttpPost("api/volume-ciclos/{cicloId:guid}/registros")]
    [Authorize(Roles = "ALUNO")]
    public async Task<IActionResult> Registrar(Guid cicloId, [FromBody] RegistrarVolumeMensalDTO dto)
    {
        await _ownership.EnsureVolumeCicloAccessAsync(cicloId);
        return Ok(await _service.RegistrarAsync(cicloId, dto, _current.UsuarioId));
    }
}
