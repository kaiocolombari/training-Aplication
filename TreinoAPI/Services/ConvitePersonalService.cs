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
        var personal = await ObterPerfilPersonalAtualAsync(dto.NomePersonal, criarParaAdmin: true);
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
        if (current.Role is not ("PERSONAL" or "ADMIN")) throw DomainException.Forbidden();
        var personalId = await db.Personais.Where(p => p.UsuarioId == current.UsuarioId && p.Usuario!.Ativo)
            .Select(p => (Guid?)p.Id).FirstOrDefaultAsync();
        if (personalId is null)
        {
            if (current.Role == "ADMIN") return [];
            throw DomainException.Forbidden();
        }
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
        if (current.Role is not ("PERSONAL" or "ADMIN")) throw DomainException.Forbidden();
        var personalId = await db.Personais.Where(p => p.UsuarioId == current.UsuarioId && p.Usuario!.Ativo)
            .Select(p => (Guid?)p.Id).FirstOrDefaultAsync();
        if (personalId is null) throw DomainException.NotFound("Convite não encontrado.");
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

    private async Task<Personal> ObterPerfilPersonalAtualAsync(string? nomePersonal, bool criarParaAdmin)
    {
        if (current.Role is not ("PERSONAL" or "ADMIN")) throw DomainException.Forbidden();
        var usuario = await db.Usuarios.Include(u => u.Personal)
            .FirstOrDefaultAsync(u => u.Id == current.UsuarioId && u.Ativo)
            ?? throw DomainException.Forbidden();
        if (usuario.Personal is not null) return usuario.Personal;
        if (!criarParaAdmin || current.Role != "ADMIN" || usuario.Tipo != TipoUsuario.ADMIN)
            throw DomainException.Forbidden();

        var nome = nomePersonal?.Trim();
        if (string.IsNullOrWhiteSpace(nome))
            throw DomainException.BadRequest("Informe seu nome profissional para criar seu primeiro convite.");
        if (nome.Length > 160)
            throw DomainException.BadRequest("O nome profissional deve ter até 160 caracteres.");

        var perfil = new Personal
        {
            Id = Guid.NewGuid(),
            UsuarioId = usuario.Id,
            Nome = nome
        };
        db.Personais.Add(perfil);
        await db.SaveChangesAsync();
        return perfil;
    }

    public static string HashToken(string token) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
}
