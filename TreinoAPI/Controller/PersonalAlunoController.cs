using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TreinoAPI.DTOs;
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
    public PersonalAlunoController(PersonalAlunoService service, OwnershipService ownership)
    {
        _service = service;
        _ownership = ownership;
    }

    [HttpGet("{personalId}/alunos")]
    public async Task<IActionResult> BuscarAlunos(Guid personalId)
    {
        await _ownership.EnsurePersonalAccessAsync(personalId);
        var alunos = await _service.BuscarAlunos(personalId);
        return Ok(alunos);
    }

    [Authorize(Roles = "ADMIN")]
    [HttpGet("aluno/{alunoId}")]
    public async Task<IActionResult> BuscarVinculosAluno(Guid alunoId)
    {
        var vinculos = await _service.BuscarVinculosAluno(alunoId);
        return Ok(vinculos);
    }

    [Authorize(Roles = "ADMIN")]
    [HttpPost]
    public async Task<IActionResult> VincularAluno([FromBody] VincularAlunoDTO dto)
    {
        await _ownership.EnsurePersonalAccessAsync(dto.PersonalId);
        var resultado = await _service.VincularAluno(dto);
        if (resultado is null) return NotFound();
        HttpContext.Items["AlunoIdAuditoria"] = resultado.AlunoId;
        return Ok(resultado);
    }

    [Authorize(Roles = "ADMIN")]
    [HttpPatch("{id}")]
    public async Task<IActionResult> AtualizarVinculo(Guid id, [FromBody] AtualizarPersonalAlunoDTO dto)
    {
        await _ownership.EnsureVinculoAccessAsync(id);
        var resultado = await _service.AtualizarVinculo(id, dto);
        if (resultado is not null)
            HttpContext.Items["AlunoIdAuditoria"] = resultado.AlunoId;
        return resultado is null ? NotFound("Vínculo não encontrado.") : Ok(resultado);
    }

    [Authorize(Roles = "ADMIN")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletarVinculo(Guid id, [FromBody] MotivoOperacaoDTO? dto)
    {
        await _ownership.EnsureVinculoAccessAsync(id);
        var alunoId = await _service.ObterAlunoIdPorVinculo(id);
        var removido = await _service.DeletarVinculo(id, dto);
        if (alunoId.HasValue)
            HttpContext.Items["AlunoIdAuditoria"] = alunoId.Value;
        return removido ? NoContent() : NotFound("Vínculo não encontrado.");
    }
}
