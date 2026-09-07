using Microsoft.AspNetCore.Mvc;
using TreinoAPI.DTOs.GrupoMuscular;
using TreinoAPI.Services;

namespace TreinoAPI.Controllers;

[ApiController]
[Route("api/grupos-musculares")]
public class GrupoMuscularController : ControllerBase
{
    private readonly GrupoMuscularService _service;

    public GrupoMuscularController(
        GrupoMuscularService service)
    {
        _service = service;
    }

    [HttpPost]
    public async Task<IActionResult> Criar(
        CriarGrupoMuscularDTO dto)
    {
        var resultado = await _service.Criar(dto);

        return Ok(resultado);
    }

    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        var resultado = await _service.Listar();

        return Ok(resultado);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> ObterPorId(Guid id)
    {
        var resultado = await _service.ObterPorId(id);

        if (resultado == null)
            return NotFound("Grupo muscular não encontrado");

        return Ok(resultado);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Atualizar(
        Guid id,
        AtualizarGrupoMuscularDTO dto)
    {
        var resultado = await _service.Atualizar(id, dto);

        if (resultado == null)
            return NotFound("Grupo muscular não encontrado");

        return Ok(resultado);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Deletar(Guid id)
    {
        var sucesso = await _service.Deletar(id);

        if (!sucesso)
            return NotFound("Grupo muscular não encontrado");

        return NoContent();
    }
}