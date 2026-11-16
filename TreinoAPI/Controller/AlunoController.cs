using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using TreinoAPI.DTOs.Aluno;
using TreinoAPI.Services;
using TreinoAPI.Security;
namespace TreinoAPI.Controllers;

[ApiController]
[Authorize(Roles = "PERSONAL,ADMIN")]
[Route("api/[controller]")]
public class AlunoController : ControllerBase
{
    private readonly AlunoService _service;
    private readonly OwnershipService _ownership;
    private readonly CurrentUserService _current;

    public AlunoController(AlunoService service, OwnershipService ownership, CurrentUserService current)
    {
        _service = service;
        _ownership = ownership;
        _current = current;
    }

    [HttpPost]
    public async Task<IActionResult> Criar(CriarAlunoDTO dto)
    {
        var personalId = _current.Role == "PERSONAL"
            ? await _ownership.GetCurrentPersonalIdAsync()
            : dto.PersonalId;
        var aluno = await _service.Criar(dto, personalId);

        return CreatedAtAction(
            nameof(BuscarPorId),
            new { id = aluno.Id },
            aluno
        );
    }

    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        var ids = await _ownership.GetAccessibleAlunoIdsAsync();
        var alunos = await _service.Listar(ids);

        return Ok(alunos);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> BuscarPorId(Guid id)
    {
        await _ownership.EnsureAlunoAccessAsync(id);
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
        await _ownership.EnsureAlunoAccessAsync(id);
        var aluno = await _service.Atualizar(id, dto);

        if (aluno == null)
            return NotFound();

        return Ok(aluno);
    }

    [Authorize(Roles = "ADMIN")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Deletar(Guid id)
    {
        await _ownership.EnsureAlunoAccessAsync(id);
        var deletado = await _service.Deletar(id);

        if (!deletado)
            return NotFound();

        return NoContent();
    }
}
