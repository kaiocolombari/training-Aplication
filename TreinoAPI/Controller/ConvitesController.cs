using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using TreinoAPI.DTOs.Convite;
using TreinoAPI.Services;

namespace TreinoAPI.Controllers;

[ApiController]
[Route("api/convites")]
public sealed class ConvitesController(ConvitePersonalService service) : ControllerBase
{
    [AllowAnonymous]
    [EnableRateLimiting("onboarding")]
    [RequestSizeLimit(8 * 1024)]
    [HttpPost("validar")]
    public async Task<IActionResult> Validar([FromBody] ValidarConviteDTO dto) =>
        Ok(await service.ValidarPublicoAsync(dto.Token));

    [Authorize(Roles = "PERSONAL,ADMIN")]
    [EnableRateLimiting("invites")]
    [HttpPost]
    public async Task<IActionResult> Criar([FromBody] CriarConviteDTO dto) =>
        Ok(await service.CriarAsync(dto));

    [Authorize(Roles = "PERSONAL,ADMIN")]
    [HttpGet("meus")]
    public async Task<IActionResult> Meus() => Ok(await service.ListarMeusAsync());

    [Authorize(Roles = "PERSONAL,ADMIN")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Revogar(Guid id)
    {
        await service.RevogarAsync(id);
        return NoContent();
    }

    [Authorize(Roles = "ADMIN")]
    [HttpGet("equipe")]
    public async Task<IActionResult> Equipe() => Ok(await service.ObterResumoEquipeAsync());
}
