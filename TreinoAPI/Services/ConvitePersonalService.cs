using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using TreinoAPI.Data;
using TreinoAPI.DTOs.Convite;
using TreinoAPI.Model;
using TreinoAPI.Security;

namespace TreinoAPI.Services;

public sealed class ConvitePersonalService(AppDbContext db, CurrentUserService current, Microsoft.Extensions.Options.IOptions<TreinoAPI.Configuration.InviteOptions> options)
{
    public async Task<ConviteCriadoDTO> CriarAsync(CriarConviteDTO dto)
    {
        if (current.Role != "PERSONAL") throw DomainException.Forbidden();
        var personal = await db.Personais.FirstOrDefaultAsync(p => p.UsuarioId == current.UsuarioId && p.Usuario!.Ativo)
            ?? throw DomainException.Forbidden();
        var apelido = string.IsNullOrWhiteSpace(dto.Apelido) ? "Convite" : dto.Apelido.Trim();
        if (apelido.Length > 80) throw DomainException.BadRequest("O nome do convite deve ter até 80 caracteres.");

        var token = WebEncoders.Base64UrlEncode(RandomNumberGenerator.GetBytes(32));
        var agora = DateTime.UtcNow;
        var convite = new ConvitePersonal
        {
            Id = Guid.NewGuid(), PersonalId = personal.Id, CriadoPorUsuarioId = current.UsuarioId,
            TokenHash = HashToken(token), Apelido = apelido, CriadoEm = agora,
            ExpiraEm = agora.AddDays(Math.Clamp(options.Value.ValidityDays, 1, 90))
        };
        db.ConvitesPersonais.Add(convite);
        await db.SaveChangesAsync();
        return new ConviteCriadoDTO
        {
            Id = convite.Id, Token = token, Apelido = apelido,
            CriadoEm = convite.CriadoEm, ExpiraEm = convite.ExpiraEm, Utilizacoes = 0
        };
    }

    public async Task<List<ConviteResumoDTO>> ListarMeusAsync()
    {
        if (current.Role != "PERSONAL") throw DomainException.Forbidden();
        var personalId = await db.Personais.Where(p => p.UsuarioId == current.UsuarioId && p.Usuario!.Ativo)
            .Select(p => (Guid?)p.Id).FirstOrDefaultAsync() ?? throw DomainException.Forbidden();
        return await db.ConvitesPersonais.AsNoTracking().Where(c => c.PersonalId == personalId)
            .OrderByDescending(c => c.CriadoEm)
            .Select(c => new ConviteResumoDTO
            {
                Id = c.Id, Apelido = c.Apelido ?? "Convite", CriadoEm = c.CriadoEm,
                ExpiraEm = c.ExpiraEm, RevogadoEm = c.RevogadoEm, Utilizacoes = c.Utilizacoes,
                Ativo = c.RevogadoEm == null && c.ExpiraEm > DateTime.UtcNow
            }).ToListAsync();
    }

    public async Task RevogarAsync(Guid id)
    {
        if (current.Role != "PERSONAL") throw DomainException.Forbidden();
        var personalId = await db.Personais.Where(p => p.UsuarioId == current.UsuarioId && p.Usuario!.Ativo)
            .Select(p => (Guid?)p.Id).FirstOrDefaultAsync() ?? throw DomainException.Forbidden();
        var convite = await db.ConvitesPersonais.FirstOrDefaultAsync(c => c.Id == id && c.PersonalId == personalId)
            ?? throw DomainException.NotFound("Convite não encontrado.");
        convite.RevogadoEm ??= DateTime.UtcNow;
        await db.SaveChangesAsync();
    }

    public async Task<ConvitePublicoDTO> ValidarPublicoAsync(string? token)
    {
        if (string.IsNullOrWhiteSpace(token) || token.Length > 256)
            return new ConvitePublicoDTO();
        var hash = HashToken(token);
        var convite = await db.ConvitesPersonais.AsNoTracking()
            .Where(c => c.TokenHash == hash && c.RevogadoEm == null && c.ExpiraEm > DateTime.UtcNow && c.Personal.Usuario!.Ativo)
            .Select(c => new { c.Apelido, c.Personal.Nome })
            .FirstOrDefaultAsync();
        return convite is null
            ? new ConvitePublicoDTO()
            : new ConvitePublicoDTO { Valido = true, PersonalNome = convite.Nome, Apelido = convite.Apelido ?? "Convite" };
    }

    public async Task<List<ConvitesPersonalResumoDTO>> ObterResumoEquipeAsync()
    {
        if (current.Role != "ADMIN") throw DomainException.Forbidden();
        var personais = await db.Personais.AsNoTracking().Include(p => p.Usuario)
            .OrderBy(p => p.Nome).ToListAsync();
        var resultado = new List<ConvitesPersonalResumoDTO>(personais.Count);
        foreach (var personal in personais)
        {
            var convidados = await db.Alunos.AsNoTracking()
                .Where(a => a.ConvidadoPorPersonalId == personal.Id && a.Usuario.Ativo)
                .OrderByDescending(a => a.CriadoEm)
                .Select(a => new ConvidadoResumoDTO
                {
                    AlunoId = a.Id, Nome = a.NomeCompleto, Email = a.Usuario.Email,
                    StatusCadastro = a.StatusCadastro.ToString(), CriadoEm = a.CriadoEm,
                    ConviteApelido = a.ConvitePersonal != null ? a.ConvitePersonal.Apelido : null
                }).ToListAsync();
            resultado.Add(new ConvitesPersonalResumoDTO
            {
                PersonalId = personal.Id,
                PersonalNome = string.IsNullOrWhiteSpace(personal.Nome) ? personal.Usuario?.Email ?? "Personal" : personal.Nome,
                ConvitesCriados = await db.ConvitesPersonais.CountAsync(c => c.PersonalId == personal.Id),
                PessoasRegistradas = convidados.Count,
                CadastrosPendentes = convidados.Count(a => a.StatusCadastro == "PENDENTE"),
                CadastrosAprovados = convidados.Count(a => a.StatusCadastro == "APROVADO"),
                CadastrosReprovados = convidados.Count(a => a.StatusCadastro == "REPROVADO"),
                Convidados = convidados
            });
        }
        return resultado;
    }

    public static string HashToken(string token) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
}
