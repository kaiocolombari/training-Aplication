using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TreinoAPI.DTOs.AdminExtras;
using TreinoAPI.Services;

namespace TreinoAPI.Controllers;

[ApiController]
[Route("api")]
public sealed class AdminExtrasController(AdminExtrasService service) : ControllerBase
{
    [Authorize(Roles = "ADMIN")]
    [HttpGet("indicadores-equipe")]
    public async Task<IActionResult> IndicadoresEquipe([FromQuery] DateOnly? inicio, [FromQuery] DateOnly? fim)
    {
        var dataFim = fim ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var dataInicio = inicio ?? dataFim.AddDays(-29);
        if (dataInicio > dataFim)
            return BadRequest(new { message = "A data inicial não pode ser posterior à data final." });
        if (dataFim.DayNumber - dataInicio.DayNumber > 366)
            return BadRequest(new { message = "O período máximo de consulta é de 12 meses." });
        return Ok(await service.ObterIndicadoresEquipeAsync(inicio, fim));
    }

    [Authorize(Roles = "ADMIN")]
    [HttpGet("admin/saude")]
    public async Task<IActionResult> SaudeSistema() => Ok(await service.ObterSaudeSistemaAsync());

    [Authorize(Roles = "ADMIN,PERSONAL")]
    [HttpGet("feedback")]
    public async Task<IActionResult> ListarFeedback() => Ok(await service.ListarFeedbackAsync(false));

    [Authorize(Roles = "ALUNO")]
    [HttpGet("feedback/meus")]
    public async Task<IActionResult> MeusFeedbacks() => Ok(await service.ListarFeedbackAsync(true));

    [Authorize(Roles = "ALUNO")]
    [HttpGet("feedback/personais")]
    public async Task<IActionResult> PersonaisDoAluno() => Ok(await service.ListarPersonaisDoAlunoAsync());

    [Authorize(Roles = "ALUNO")]
    [HttpPost("feedback")]
    public async Task<IActionResult> CriarFeedback([FromBody] FeedbackAlunoCriarDTO dto)
    {
        var feedback = await service.CriarFeedbackAsync(dto);
        HttpContext.Items["AlunoIdAuditoria"] = feedback.AlunoId;
        return Ok(feedback);
    }

    [Authorize(Roles = "ADMIN,PERSONAL")]
    [HttpPatch("feedback/{id:guid}")]
    public async Task<IActionResult> AtualizarFeedback(Guid id, [FromBody] FeedbackAlunoAtualizarDTO dto)
    {
        await service.AtualizarFeedbackAsync(id, dto);
        return NoContent();
    }

    [Authorize(Roles = "ADMIN,PERSONAL")]
    [HttpGet("tarefas")]
    public async Task<IActionResult> ListarTarefas([FromQuery] Guid? personalId, [FromQuery] string? status) =>
        Ok(await service.ListarTarefasAsync(personalId, status));

    [Authorize(Roles = "ADMIN,PERSONAL")]
    [HttpPost("tarefas")]
    public async Task<IActionResult> CriarTarefa([FromBody] TarefaPersonalCriarDTO dto)
    {
        var tarefa = await service.CriarTarefaAsync(dto);
        HttpContext.Items["AlunoIdAuditoria"] = tarefa.AlunoId;
        return Ok(tarefa);
    }

    [Authorize(Roles = "ADMIN,PERSONAL")]
    [HttpPut("tarefas/{id:guid}")]
    public async Task<IActionResult> AtualizarTarefa(Guid id, [FromBody] TarefaPersonalAtualizarDTO dto) =>
        Ok(await service.AtualizarTarefaAsync(id, dto));

    [Authorize(Roles = "ADMIN,PERSONAL")]
    [HttpGet("tarefas/configuracao")]
    public async Task<IActionResult> ObterConfiguracao([FromQuery] Guid? personalId) =>
        Ok(await service.ObterConfiguracaoAsync(personalId));

    [Authorize(Roles = "ADMIN,PERSONAL")]
    [HttpPut("tarefas/configuracao")]
    public async Task<IActionResult> SalvarConfiguracao([FromBody] ConfiguracaoAcompanhamentoDTO dto) =>
        Ok(await service.SalvarConfiguracaoAsync(dto));

    [Authorize(Roles = "ADMIN")]
    [HttpGet("tarefas/personais")]
    public async Task<IActionResult> ListarPersonais() => Ok(await service.ListarPersonaisAsync());

    [Authorize(Roles = "ADMIN,PERSONAL")]
    [HttpGet("tarefas/alunos")]
    public async Task<IActionResult> ListarAlunosDoPersonal([FromQuery] Guid? personalId) =>
        Ok(await service.ListarAlunosDoPersonalAsync(personalId));

    [Authorize(Roles = "ADMIN,PERSONAL")]
    [HttpGet("manutencao")]
    public async Task<IActionResult> ListarManutencao() => Ok(await service.ListarManutencaoAsync());

    [Authorize(Roles = "ADMIN,PERSONAL")]
    [HttpPost("manutencao")]
    public async Task<IActionResult> CriarManutencao([FromBody] RegistroManutencaoCriarDTO dto) =>
        Ok(await service.CriarManutencaoAsync(dto));

    [Authorize(Roles = "ADMIN")]
    [HttpGet("manutencao/responsaveis")]
    public async Task<IActionResult> ResponsaveisManutencao() => Ok(await service.ListarResponsaveisManutencaoAsync());

    [Authorize(Roles = "ADMIN")]
    [HttpPut("manutencao/{id:guid}")]
    public async Task<IActionResult> AtualizarManutencao(Guid id, [FromBody] RegistroManutencaoAtualizarDTO dto) =>
        Ok(await service.AtualizarManutencaoAsync(id, dto));
}
