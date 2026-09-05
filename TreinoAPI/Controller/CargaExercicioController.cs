using Microsoft.AspNetCore.Mvc;
using treinoAPI.DTOs.CargaExercicio;
using TreinoAPI.DTOs.CargaExercicio;
using TreinoAPI.Services;

namespace TreinoAPI.Controllers;

public class CargaExercicioController : ControllerBase
{
    private readonly CargaExercicioService _cargaExercicioService;

    public CargaExercicioController(CargaExercicioService cargaExercicioService)
    {
        _cargaExercicioService = cargaExercicioService;
    }

    [HttpPost("api/carga-exercicio/{testeCargaId}")]
    public async Task<IActionResult> Criar(
        Guid testeCargaId,
        CriarCargaExercicioDto dto)
    {
        var cargaExercicio = await _cargaExercicioService.Criar(testeCargaId, dto);

        return CreatedAtAction(
            nameof(ObterPorId),
            new { id = cargaExercicio.Id },
            cargaExercicio
        );
    }

    [HttpGet("api/carga-exercicio/teste-carga/{testeCargaId}")]
    public async Task<IActionResult> ListarPorTesteCarga(Guid testeCargaId)
    {
        var cargasExercicios = await _cargaExercicioService.ListarPorTesteCarga(testeCargaId);

        return Ok(cargasExercicios);
    }

    [HttpGet("api/carga-exercicio/{id}")]
    public async Task<IActionResult> ObterPorId(Guid id)
    {
        var cargaExercicio = await _cargaExercicioService.ObterPorId(id);

        if (cargaExercicio == null)
            return NotFound("Carga de exercício não encontrada");

        return Ok(cargaExercicio);
    }

    [HttpPut("api/carga-exercicio/{id}")]
    public async Task<IActionResult> Atualizar(
        Guid id,
        AtualizarCargaExercicioDto dto)
    {
        var cargaExercicio = await _cargaExercicioService.Atualizar(id, dto);

        if (cargaExercicio == null)
            return NotFound("Carga de exercício não encontrada");

        return Ok(cargaExercicio);
    }

    [HttpDelete("api/carga-exercicio/{id}")]
    public async Task<IActionResult> Deletar(Guid id)
    {
        var sucesso = await _cargaExercicioService.Deletar(id);

        if (!sucesso)
            return NotFound("Carga de exercício não encontrada");

        return NoContent();
    }
}