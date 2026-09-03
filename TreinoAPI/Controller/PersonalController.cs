
using Microsoft.AspNetCore.Mvc;
using TreinoAPI.DTOs.Personal;
using TreinoAPI.Services;

namespace TreinoAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PersonalController : ControllerBase
{
    private readonly PersonalService _service;

    public PersonalController(PersonalService service)
    {
        _service = service;
    }

    [HttpPost]
    public async Task<IActionResult> Criar(CriarPersonalDto dto)
    {
        var personal = await _service.Criar(dto);

        return CreatedAtAction(
            nameof(BuscarPorId),
            new { id = personal.Id },
            personal
        );
    }

    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        var personais = await _service.Listar();

        return Ok(personais);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> BuscarPorId(Guid id)
    {
        var personal = await _service.BuscarPorId(id);

        if (personal == null)
            return NotFound();

        return Ok(personal);
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> Atualizar(
        Guid id,
        AtualizarPersonalDTO dto)
    {
        var personal = await _service.Atualizar(id, dto);

        if (personal == null)
            return NotFound();

        return Ok(personal);
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