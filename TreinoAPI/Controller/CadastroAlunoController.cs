using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TreinoAPI.DTOs.CadastroAluno;
using TreinoAPI.Services;

namespace TreinoAPI.Controllers;

[ApiController]
[Route("api/cadastro-aluno")]
public sealed class CadastroAlunoController : ControllerBase
{
    private readonly CadastroAlunoService _service;

    public CadastroAlunoController(CadastroAlunoService service) => _service = service;

    [Authorize(Roles = "ALUNO")]
    [HttpPost("respostas")]
    public async Task<IActionResult> EnviarRespostas([FromBody] EnviarRespostasCadastroDTO dto)
    {
        await _service.EnviarRespostasAsync(dto);
        return NoContent();
    }

    [Authorize(Roles = "PERSONAL,ADMIN")]
    [HttpGet("solicitacoes")]
    public async Task<IActionResult> ListarSolicitacoes()
    {
        return Ok(await _service.ListarPendentesAsync());
    }

    [Authorize(Roles = "PERSONAL,ADMIN")]
    [HttpPost("{alunoId:guid}/aprovar")]
    public async Task<IActionResult> Aprovar(Guid alunoId, [FromBody] AprovarCadastroDTO dto)
    {
        await _service.AprovarAsync(alunoId, dto.PersonalId);
        return NoContent();
    }
}
