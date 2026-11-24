using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TreinoAPI.DTOs.Comunicacao;
using TreinoAPI.Services;

namespace TreinoAPI.Controllers;

[ApiController]
[Authorize(Roles = "ADMIN,PERSONAL,ALUNO")]
[Route("api/comunicacao")]
public sealed class ComunicacaoController : ControllerBase
{
    private readonly ComunicacaoService _service;
    private readonly ChatAttachmentService _attachments;
    private readonly PushTokenService _pushTokens;
    private readonly ChatAlunoContextService _alunoContext;

    public ComunicacaoController(ComunicacaoService service, ChatAttachmentService attachments, PushTokenService pushTokens, ChatAlunoContextService alunoContext)
    {
        _service = service;
        _attachments = attachments;
        _pushTokens = pushTokens;
        _alunoContext = alunoContext;
    }

    [Authorize(Roles = "ADMIN,PERSONAL")]
    [HttpGet("equipe")]
    public async Task<IActionResult> ListarEquipe() =>
        Ok(await _service.ListarEquipeAsync());

    [Authorize(Roles = "ADMIN,PERSONAL")]
    [HttpGet("conversas")]
    public async Task<IActionResult> ListarConversas() =>
        Ok(await _service.ListarConversasAsync());

    [Authorize(Roles = "ADMIN,PERSONAL")]
    [HttpGet("conversas/alunos")]
    public async Task<IActionResult> ListarConversasAlunos() =>
        Ok(await _service.ListarConversasAlunosAsync());

    [Authorize(Roles = "ADMIN,PERSONAL")]
    [HttpGet("conversas/alunos/resumo")]
    public async Task<IActionResult> ListarResumoChatsAlunos() =>
        Ok(await _service.ListarResumoChatsAlunosAsync());

    [Authorize(Roles = "ALUNO")]
    [HttpGet("conversas/personais")]
    public async Task<IActionResult> ListarConversasPersonaisAluno() =>
        Ok(await _service.ListarConversasPersonaisAlunoAsync());

    [Authorize(Roles = "ADMIN,PERSONAL,ALUNO")]
    [HttpGet("conversas/{conversaId:guid}/mensagens")]
    public async Task<IActionResult> ListarMensagens(Guid conversaId) =>
        Ok(await _service.ListarMensagensAsync(conversaId));

    [Authorize(Roles = "ADMIN,PERSONAL,ALUNO")]
    [HttpPost("conversas/para/{destinatarioId:guid}")]
    public async Task<IActionResult> ObterOuCriarConversa(Guid destinatarioId) =>
        Ok(new { conversaId = await _service.ObterOuCriarConversaAsync(destinatarioId) });

    [Authorize(Roles = "ADMIN,PERSONAL,ALUNO")]
    [HttpPost("mensagens/para/{destinatarioId:guid}")]
    public async Task<IActionResult> EnviarMensagem(
        Guid destinatarioId,
        [FromBody] EnviarMensagemEquipeDTO dto)
    {
        var conversaId = await _service.EnviarMensagemAsync(destinatarioId, dto);
        return Ok(new { conversaId });
    }

    [Authorize(Roles = "ADMIN,PERSONAL,ALUNO")]
    [HttpPost("conversas/{conversaId:guid}/anexos")]
    [EnableRateLimiting("chat-files-upload")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(22L * 1024 * 1024)]
    [RequestFormLimits(MultipartBodyLengthLimit = 22L * 1024 * 1024)]
    public async Task<IActionResult> EnviarAnexo(
        Guid conversaId,
        [FromForm] IFormFile arquivo,
        [FromForm] string? legenda,
        CancellationToken cancellationToken)
    {
        var mensagemId = await _attachments.EnviarAsync(conversaId, arquivo, legenda, cancellationToken);
        return Ok(new { mensagemId });
    }

    [Authorize(Roles = "ADMIN,PERSONAL,ALUNO")]
    [HttpGet("anexos/{anexoId:guid}")]
    public async Task<IActionResult> BaixarAnexo(Guid anexoId, CancellationToken cancellationToken)
    {
        var arquivo = await _attachments.AbrirAsync(anexoId, cancellationToken);
        Response.Headers.CacheControl = "private, no-store";
        Response.Headers.XContentTypeOptions = "nosniff";
        return File(arquivo.Conteudo, "application/octet-stream", arquivo.NomeOriginal, enableRangeProcessing: true);
    }

    [HttpPost("push-token")]
    public async Task<IActionResult> RegistrarPushToken([FromBody] RegistrarTokenPushDTO dto, CancellationToken cancellationToken)
    {
        await _pushTokens.RegistrarAsync(dto, cancellationToken);
        return NoContent();
    }

    [HttpDelete("push-token")]
    public async Task<IActionResult> RemoverPushToken([FromBody] RegistrarTokenPushDTO dto, CancellationToken cancellationToken)
    {
        await _pushTokens.RemoverAsync(dto.Token, cancellationToken);
        return NoContent();
    }

    [Authorize(Roles = "ADMIN,PERSONAL")]
    [HttpGet("alunos/{alunoId:guid}/contexto-chat")]
    public async Task<IActionResult> ObterContextoChatAluno(Guid alunoId, CancellationToken cancellationToken) =>
        Ok(await _alunoContext.ObterAsync(alunoId, cancellationToken));

    [Authorize(Roles = "ADMIN,PERSONAL")]
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
