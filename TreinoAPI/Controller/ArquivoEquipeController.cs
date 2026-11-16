using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TreinoAPI.DTOs.ArquivoEquipe;
using TreinoAPI.Services;

namespace TreinoAPI.Controllers;

[ApiController]
[Authorize(Roles = "ADMIN,PERSONAL")]
[Route("api/arquivos-equipe")]
public sealed class ArquivoEquipeController : ControllerBase
{
    private readonly ArquivoEquipeService _service;

    public ArquivoEquipeController(ArquivoEquipeService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> Listar(CancellationToken cancellationToken) =>
        Ok(await _service.ListarAsync(cancellationToken));

    [Authorize(Roles = "ADMIN")]
    [HttpPost]
    [EnableRateLimiting("team-files-upload")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(ArquivoEquipeService.MaxRequestBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = ArquivoEquipeService.MaxRequestBytes)]
    public async Task<IActionResult> Criar(
        [FromForm] CriarArquivoEquipeForm form,
        CancellationToken cancellationToken)
    {
        var id = await _service.CriarAsync(form, cancellationToken);
        return Ok(new { id });
    }

    [Authorize(Roles = "ADMIN")]
    [HttpPut("{id:guid}")]
    [EnableRateLimiting("team-files-upload")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(ArquivoEquipeService.MaxRequestBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = ArquivoEquipeService.MaxRequestBytes)]
    public async Task<IActionResult> Atualizar(
        Guid id,
        [FromForm] AtualizarArquivoEquipeForm form,
        CancellationToken cancellationToken)
    {
        await _service.AtualizarAsync(id, form, cancellationToken);
        return NoContent();
    }

    [Authorize(Roles = "ADMIN")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Excluir(Guid id, CancellationToken cancellationToken)
    {
        await _service.ExcluirAsync(id, cancellationToken);
        return NoContent();
    }

    [HttpGet("{publicacaoId:guid}/arquivos/{arquivoId:guid}")]
    public async Task<IActionResult> Baixar(
        Guid publicacaoId,
        Guid arquivoId,
        CancellationToken cancellationToken)
    {
        var arquivo = await _service.AbrirArquivoAsync(publicacaoId, arquivoId, cancellationToken);
        Response.Headers.CacheControl = "private, no-store";
        return File(arquivo.Conteudo, "application/octet-stream", arquivo.NomeOriginal, enableRangeProcessing: true);
    }
}
