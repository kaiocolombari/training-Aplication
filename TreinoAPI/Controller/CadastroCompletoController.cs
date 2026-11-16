using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using TreinoAPI.Security;
using TreinoAPI.Services;

namespace TreinoAPI.Controllers;

[ApiController]
[Authorize(Roles = "PERSONAL,ADMIN")]
[Route("api/cadastros")]
public class CadastroCompletoController : ControllerBase
{
    private readonly CadastroCompletoService _service;
    private readonly SalvarFichaService _salvarService;
    private readonly OwnershipService _ownership;

    public CadastroCompletoController(CadastroCompletoService service, SalvarFichaService salvarService, OwnershipService ownership)
    {
        _service = service;
        _salvarService = salvarService;
        _ownership = ownership;
    }

    [HttpGet("alunos/{alunoId}")]
    public async Task<IActionResult> Obter(Guid alunoId)
    {
        await _ownership.EnsureAlunoAccessAsync(alunoId);
        var cadastro = await _service.ObterCadastro(alunoId);

        if (cadastro == null)
            return NotFound("Aluno não encontrado");

        return Ok(cadastro);
    }

    [HttpPut("alunos/{alunoId:guid}")]
    public async Task<IActionResult> Salvar(Guid alunoId, [FromBody] TreinoAPI.DTOs.CadastroCompleto.SalvarFichaDTO dto)
    {
        await _ownership.EnsureAlunoAccessAsync(alunoId);
        var cadastro = await _salvarService.SalvarAsync(alunoId, dto);
        return Ok(cadastro);
    }

    [HttpPut("alunos/{alunoId:guid}/autosave")]
    public async Task<IActionResult> AutoSalvar(Guid alunoId, [FromBody] TreinoAPI.DTOs.CadastroCompleto.SalvarFichaDTO dto)
    {
        await _ownership.EnsureAlunoAccessAsync(alunoId);
        await _salvarService.SalvarAsync(alunoId, dto, retornarCadastro: false);
        return NoContent();
    }
}
