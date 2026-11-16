using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TreinoAPI.DTOs.Comunicacao;
using TreinoAPI.Services;

namespace TreinoAPI.Controllers;

[ApiController]
[Authorize(Roles = "ADMIN,PERSONAL")]
[Route("api/comunicacao")]
public sealed class ComunicacaoController : ControllerBase
{
    private readonly ComunicacaoService _service;

    public ComunicacaoController(ComunicacaoService service) => _service = service;

    [HttpGet("equipe")]
    public async Task<IActionResult> ListarEquipe() =>
        Ok(await _service.ListarEquipeAsync());

    [HttpGet("conversas")]
    public async Task<IActionResult> ListarConversas() =>
        Ok(await _service.ListarConversasAsync());

    [HttpGet("conversas/{conversaId:guid}/mensagens")]
    public async Task<IActionResult> ListarMensagens(Guid conversaId) =>
        Ok(await _service.ListarMensagensAsync(conversaId));

    [HttpPost("mensagens/para/{destinatarioId:guid}")]
    public async Task<IActionResult> EnviarMensagem(
        Guid destinatarioId,
        [FromBody] EnviarMensagemEquipeDTO dto)
    {
        var conversaId = await _service.EnviarMensagemAsync(destinatarioId, dto);
        return Ok(new { conversaId });
    }

    [HttpGet("avisos")]
    public async Task<IActionResult> ListarAvisos() =>
        Ok(await _service.ListarAvisosAsync());

    [Authorize(Roles = "ADMIN")]
    [HttpPost("avisos")]
    public async Task<IActionResult> PublicarAviso([FromBody] CriarAvisoGlobalDTO dto)
    {
        await _service.PublicarAvisoAsync(dto);
        return NoContent();
    }

    [HttpGet("notificacoes")]
    public async Task<IActionResult> ListarNotificacoes() =>
        Ok(await _service.ListarNotificacoesAsync());

    [HttpPatch("notificacoes/{notificacaoId:guid}/lida")]
    public async Task<IActionResult> MarcarLida(Guid notificacaoId)
    {
        await _service.MarcarNotificacaoLidaAsync(notificacaoId);
        return NoContent();
    }

    [HttpPost("notificacoes/lidas")]
    public async Task<IActionResult> MarcarTodasLidas()
    {
        await _service.MarcarTodasNotificacoesLidasAsync();
        return NoContent();
    }

    [HttpPost("notificacoes/mural-lidas")]
    public async Task<IActionResult> MarcarAvisosLidos()
    {
        await _service.MarcarAvisosLidosAsync();
        return NoContent();
    }

    [Authorize(Roles = "ADMIN")]
    [HttpPost("alertas")]
    public async Task<IActionResult> CriarAlerta([FromBody] CriarAlertaDTO dto)
    {
        await _service.CriarAlertaAsync(dto);
        return NoContent();
    }
}
