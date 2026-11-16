using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TreinoAPI.DTOs.PersonalAluno;
using TreinoAPI.Security;
using TreinoAPI.Services;

namespace TreinoAPI.Controllers;

[ApiController]
[Authorize(Roles = "PERSONAL,ADMIN")]
[Route("api/[controller]")]
public class PersonalAlunoController : ControllerBase
{
    private readonly PersonalAlunoService _service;
    private readonly OwnershipService _ownership;
    private readonly CurrentUserService _current;

    public PersonalAlunoController(PersonalAlunoService service, OwnershipService ownership, CurrentUserService current)
    {
        _service = service;
        _ownership = ownership;
        _current = current;
    }

    [HttpGet("{personalId}/alunos")]
    public async Task<IActionResult> BuscarAlunos(Guid personalId)
    {
        await _ownership.EnsurePersonalAccessAsync(personalId);
        var alunos = await _service.BuscarAlunos(personalId);
        return Ok(alunos);
    }

    [Authorize(Roles = "ADMIN")]
    [HttpPost]
    public async Task<IActionResult> VincularAluno([FromBody] VincularAlunoDTO dto)
    {
        await _ownership.EnsurePersonalAccessAsync(dto.PersonalId);
        var resultado = await _service.VincularAluno(dto);
        return resultado is null ? NotFound() : Ok(resultado);
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> AtualizarVinculo(Guid id, [FromBody] AtualizarPersonalAlunoDTO dto)
    {
        await _ownership.EnsureVinculoAccessAsync(id);
        // A professional may leave an assignment, but only an administrator can restore it.
        if (_current.Role == "PERSONAL" && dto.Ativo)
            return Forbid();

        var resultado = await _service.AtualizarVinculo(id, dto);
        return resultado is null ? NotFound("Vínculo não encontrado.") : Ok(resultado);
    }

    [Authorize(Roles = "ADMIN")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletarVinculo(Guid id)
    {
        await _ownership.EnsureVinculoAccessAsync(id);
        var removido = await _service.DeletarVinculo(id);
        return removido ? NoContent() : NotFound("Vínculo não encontrado.");
    }
}
