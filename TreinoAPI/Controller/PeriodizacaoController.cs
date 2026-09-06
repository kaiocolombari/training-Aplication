using Microsoft.AspNetCore.Mvc;
using TreinoAPI.DTOs.Periodizacao;
using TreinoAPI.Services;

namespace TreinoAPI.Controllers;



[ApiController]
[Route("api/periodizacoes")]
public class PeriodizacaoController : ControllerBase
{
    private readonly PeriodizacaoService _service;

    public PeriodizacaoController(PeriodizacaoService service)
    {
        _service = service;
    }

    [HttpPost("/api/alunos/{alunoId}/periodizacoes")]
    public async Task<IActionResult> Criar(
        Guid alunoId,
        PeriodizacaoDTO dto)
    {
        var resultado = await _service.Criar(alunoId, dto);

        return Ok(resultado);
    }

    [HttpGet("/api/alunos/{alunoId}/periodizacoes")]
    public async Task<IActionResult> ListarPorAluno(Guid alunoId)
    {
        var resultado = await _service.ListarPorAluno(alunoId);

        return Ok(resultado);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> ObterPorId(Guid id)
    {
        var resultado = await _service.ObterPorId(id);

        if (resultado == null)
            return NotFound("Periodização não encontrada");

        return Ok(resultado);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Atualizar(
        Guid id,
        PeriodizacaoDTO dto)
    {
        var resultado = await _service.Atualizar(id, dto);

        if (resultado == null)
            return NotFound("Periodização não encontrada");

        return Ok(resultado);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Deletar(Guid id)
    {
        var sucesso = await _service.Deletar(id);

        if (!sucesso)
            return NotFound("Periodização não encontrada");

        return NoContent();
    }
}
