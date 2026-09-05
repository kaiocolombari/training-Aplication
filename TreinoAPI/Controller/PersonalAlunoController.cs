using Microsoft.AspNetCore.Mvc;
using TreinoAPI.DTOs.PersonalAluno;
using TreinoAPI.Services;


namespace TreinoAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PersonalAlunoController : ControllerBase
{
    private readonly PersonalAlunoService _service;

    public PersonalAlunoController(PersonalAlunoService service)
    {
        _service = service;
    }

    [HttpGet("{personalId}/alunos")]
    public async Task<IActionResult> BuscarAlunos(Guid personalId)
    {
        var alunos = await _service.BuscarAlunos(personalId);
        return Ok(alunos);
    }

    [HttpPost]
    public async Task<IActionResult> VincularAluno(
        VincularAlunoDTO dto
    )
    {
        var resultado = await _service.VincularAluno(dto);
        return Ok(resultado);
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> AtualizarVinculo(
        Guid id,
        AtualizarPersonalAlunoDTO dto)
    {
        var resultado = await _service.AtualizarVinculo(id, dto);

        if (resultado == null)
        {
            return NotFound("Vinculo não encontrado");
        }
        return Ok(resultado);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletarVinculo(Guid id)
    {
        var removido = await _service.DeletarVinculo(id);

        if (!removido)
            return NotFound("Vínculo não encontrado.");

        return NoContent();
    }

}