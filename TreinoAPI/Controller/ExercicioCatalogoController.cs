using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TreinoAPI.DTOs.Exercicio;
using TreinoAPI.Security;
using TreinoAPI.Services;

namespace TreinoAPI.Controllers;

[ApiController]
[Authorize(Roles = "ADMIN,PERSONAL,ALUNO")]
[Route("api/exercicios/catalogo")]
public sealed class ExercicioCatalogoController : ControllerBase
{
    private readonly ExercicioCatalogoService _service;

    public ExercicioCatalogoController(ExercicioCatalogoService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> Listar(
        [FromQuery] string? q,
        [FromQuery] int limite = 100,
        CancellationToken cancellationToken = default) =>
        Ok(await _service.ListarAsync(q, limite, cancellationToken));

    [HttpGet("buscar")]
    public async Task<IActionResult> Buscar([FromQuery] string q, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(q))
            return BadRequest(new { message = "Informe o nome do exercício para pesquisar." });
        return Ok(await _service.BuscarAsync(q, cancellationToken));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Obter(Guid id, CancellationToken cancellationToken)
    {
        var exercicio = await _service.ObterAsync(id, cancellationToken);
        return exercicio is null ? NotFound() : Ok(exercicio);
    }

    [Authorize(Roles = "ADMIN,PERSONAL")]
    [HttpPost]
    public async Task<IActionResult> Criar([FromBody] SalvarExercicioCatalogoDTO dto, CancellationToken cancellationToken)
    {
        var exercicio = await _service.CriarAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(Obter), new { id = exercicio.Id }, exercicio);
    }

    [Authorize(Roles = "ADMIN,PERSONAL")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Atualizar(Guid id, [FromBody] SalvarExercicioCatalogoDTO dto, CancellationToken cancellationToken)
    {
        var exercicio = await _service.AtualizarAsync(id, dto, cancellationToken);
        return exercicio is null ? NotFound() : Ok(exercicio);
    }

    [Authorize(Roles = "ADMIN,PERSONAL")]
    [HttpPost("{id:guid}/videos")]
    [EnableRateLimiting("exercise-video-upload")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(ExercicioCatalogoService.MaxUploadBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = ExercicioCatalogoService.MaxUploadBytes)]
    public async Task<IActionResult> AdicionarVideo(
        Guid id,
        [FromForm] CriarVideoExercicioForm form,
        CancellationToken cancellationToken)
    {
        var video = await _service.AdicionarVideoAsync(id, form, cancellationToken);
        return Ok(video);
    }

    [Authorize(Roles = "ADMIN,PERSONAL")]
    [HttpPost("{id:guid}/videos/{videoId:guid}/principal")]
    public async Task<IActionResult> DefinirVideoPrincipal(Guid id, Guid videoId, CancellationToken cancellationToken) =>
        await _service.DefinirVideoPrincipalAsync(id, videoId, cancellationToken) ? NoContent() : NotFound();

    [Authorize(Roles = "ADMIN,PERSONAL")]
    [HttpDelete("{id:guid}/videos/{videoId:guid}")]
    public async Task<IActionResult> ExcluirVideo(Guid id, Guid videoId, CancellationToken cancellationToken) =>
        await _service.ExcluirVideoAsync(id, videoId, cancellationToken) ? NoContent() : NotFound();

    [HttpGet("videos/{videoId:guid}/stream")]
    public async Task<IActionResult> TransmitirVideo(Guid videoId, CancellationToken cancellationToken)
    {
        var video = await _service.ObterVideoParaStreamAsync(videoId, cancellationToken);
        if (video?.ChaveArmazenamento is null)
            return NotFound();

        Response.Headers.CacheControl = "private, max-age=3600";
        return File(_service.AbrirVideo(video.ChaveArmazenamento), "video/mp4", enableRangeProcessing: true);
    }
}
