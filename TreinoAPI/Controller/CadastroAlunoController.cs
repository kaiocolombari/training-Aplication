using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TreinoAPI.DTOs.CadastroAluno;
using TreinoAPI.Services;
using TreinoAPI.Security;

namespace TreinoAPI.Controllers;

[ApiController]
[Route("api/cadastro-aluno")]
public sealed class CadastroAlunoController : ControllerBase
{
    private readonly CadastroAlunoService _service;
    private readonly TurnstileService _turnstile;

    public CadastroAlunoController(CadastroAlunoService service, TurnstileService turnstile)
    {
        _service = service;
        _turnstile = turnstile;
    }

    [Authorize(Roles = "ALUNO")]
    [EnableRateLimiting("onboarding")]
    [RequestSizeLimit(32 * 1024)]
    [HttpPost("respostas")]
    public async Task<IActionResult> EnviarRespostas([FromBody] EnviarRespostasCadastroDTO dto)
    {
        if (!string.IsNullOrWhiteSpace(dto.Website))
            return BadRequest(new { message = "Não foi possível enviar o formulário." });
        await _turnstile.ValidarAsync(dto.CaptchaToken, "student_form", HttpContext.RequestAborted);
        await _service.EnviarRespostasAsync(dto);
        return NoContent();
    }

    [Authorize(Roles = "PERSONAL,ADMIN")]
    [HttpGet("solicitacoes")]
    public async Task<IActionResult> ListarSolicitacoes()
    {
        return Ok(await _service.ListarPendentesAsync());
    }

    [Authorize(Roles = "PERSONAL,ADMIN")]
    [HttpGet("solicitacoes/resumo")]
    public async Task<IActionResult> ResumoSolicitacoes()
    {
        return Ok(await _service.ObterResumoPendentesAsync());
    }

    [Authorize(Roles = "PERSONAL,ADMIN")]
    [HttpPost("{alunoId:guid}/aprovar")]
    public async Task<IActionResult> Aprovar(Guid alunoId, [FromBody] AprovarCadastroDTO dto)
    {
        await _service.AprovarAsync(alunoId, dto.Observacao);
        return NoContent();
    }

    [Authorize(Roles = "PERSONAL,ADMIN")]
    [HttpPost("{alunoId:guid}/reprovar")]
    public async Task<IActionResult> Reprovar(Guid alunoId, [FromBody] ReprovarCadastroDTO dto)
    {
        await _service.ReprovarAsync(alunoId, dto.Observacao);
        return NoContent();
    }
}
