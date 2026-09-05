using Microsoft.AspNetCore.Mvc;
using TreinoAPI.DTOs.Aluno;
using TreinoAPI.Services;
namespace TreinoAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AlunoController : ControllerBase
{
    private readonly AlunoService _service;

    public AlunoController(AlunoService service)
    {
        _service = service;
    }

    [HttpPost]
    public async Task<IActionResult> Criar(CriarAlunoDTO dto)
    {
        var aluno = await _service.Criar(dto);

        return CreatedAtAction(
            nameof(BuscarPorId),
            new { id = aluno.Id },
            aluno
        );
    }

    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        var alunos = await _service.Listar();

        return Ok(alunos);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> BuscarPorId(Guid id)
    {
        var aluno = await _service.BuscarPorId(id);

        if (aluno == null)
        {
            return NotFound();
        }

        return Ok(aluno);
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> Atualizar(
        Guid id,
        AtualizarAlunoDTO dto)
    {
        var aluno = await _service.Atualizar(id, dto);

        if (aluno == null)
            return NotFound();

        return Ok(aluno);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Deletar(Guid id)
    {
        var deletado = await _service.Deletar(id);

        if (!deletado)
            return NotFound();

        return NoContent();
    }
}