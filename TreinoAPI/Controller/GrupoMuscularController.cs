using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TreinoAPI.DTOs.GrupoMuscular;
using TreinoAPI.Services;

namespace TreinoAPI.Controllers;

[ApiController]
[Authorize(Roles = "PERSONAL,ADMIN")]
[Route("api/grupos-musculares")]
public sealed class GrupoMuscularController : ControllerBase
{
    private readonly GrupoMuscularService _service;

    public GrupoMuscularController(GrupoMuscularService service) => _service = service;

    [Authorize(Roles = "ADMIN")]
    [HttpPost]
    public async Task<IActionResult> Criar([FromBody] CriarGrupoMuscularDTO dto) =>
        Ok(await _service.Criar(dto));

    [HttpGet]
    public async Task<IActionResult> Listar() => Ok(await _service.Listar());

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> ObterPorId(Guid id)
    {
        var result = await _service.ObterPorId(id);
        return result is null ? NotFound() : Ok(result);
    }

    [Authorize(Roles = "ADMIN")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Atualizar(Guid id, [FromBody] AtualizarGrupoMuscularDTO dto)
    {
        var result = await _service.Atualizar(id, dto);
        return result is null ? NotFound() : Ok(result);
    }

    [Authorize(Roles = "ADMIN")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Deletar(Guid id) =>
        await _service.Deletar(id) ? NoContent() : NotFound();
}
