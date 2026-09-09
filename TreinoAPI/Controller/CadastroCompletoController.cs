using Microsoft.AspNetCore.Mvc;
using TreinoAPI.Services;

namespace TreinoAPI.Controllers;

[ApiController]
[Route("api/cadastros")]
public class CadastroCompletoController : ControllerBase
{
    private readonly CadastroCompletoService _service;

    public CadastroCompletoController(CadastroCompletoService service)
    {
        _service = service;
    }

    [HttpGet("alunos/{alunoId}")]
    public async Task<IActionResult> Obter(Guid alunoId)
    {
        var cadastro = await _service.Obter(alunoId);

        if (cadastro == null)
            return NotFound("Aluno não encontrado");

        return Ok(cadastro);
    }
}