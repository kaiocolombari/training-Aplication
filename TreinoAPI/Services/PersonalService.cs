using Microsoft.EntityFrameworkCore;
using TreinoAPI.Data;
using TreinoAPI.DTOs.Personal;
using TreinoAPI.Model;
using TreinoAPI.Security;

namespace TreinoAPI.Services;

public class PersonalService
{
    private readonly AppDbContext _context;
    private readonly PasswordService _passwords;

    public PersonalService(AppDbContext context, PasswordService passwords)
    {
        _context = context;
        _passwords = passwords;
    }

    public async Task<PersonalDTO> Criar(CriarPersonalDTO dto)
    {
        var email = NormalizeEmail(dto.Email);
        if (await _context.Usuarios.AnyAsync(u => u.Email == email))
            throw DomainException.Conflict("Já existe uma conta cadastrada com este e-mail.");

        var usuario = new Usuario
        {
            Email = email,
            Telefone = dto.Telefone?.Trim(),
            Tipo = TipoUsuario.PERSONAL,
            CriadoEm = DateTime.UtcNow,
            SenhaHashed = _passwords.Hash(dto.Senha)
        };

        var personal = new Personal
        {
            Nome = dto.NomeCompleto.Trim(),
            Usuario = usuario
        };

        _context.Personais.Add(personal);
        await _context.SaveChangesAsync();

        return Mapear(personal, usuario);
    }

    public async Task<List<PersonalDTO>> Listar()
    {
        return await _context.Personais
            .AsNoTracking()
            .Include(p => p.Usuario)
            .Select(p => new PersonalDTO
            {
                Id = p.Id,
                UsuarioId = p.UsuarioId,
                NomeCompleto = p.Nome,
                Email = p.Usuario!.Email,
                Telefone = p.Usuario.Telefone
            })
            .ToListAsync();
    }

    public async Task<PersonalDTO?> BuscarPorId(Guid id)
    {
        var personal = await _context.Personais
            .AsNoTracking()
            .Include(p => p.Usuario)
            .FirstOrDefaultAsync(p => p.Id == id);

        return personal is null ? null : Mapear(personal, personal.Usuario!);
    }

    public async Task<PersonalDTO?> Atualizar(Guid id, AtualizarPersonalDTO dto)
    {
        var personal = await _context.Personais
            .Include(p => p.Usuario)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (personal is null || personal.Usuario is null)
            return null;

        if (dto.Nome is not null)
            personal.Nome = dto.Nome.Trim();

        if (dto.Email is not null)
        {
            var email = NormalizeEmail(dto.Email);
            var exists = await _context.Usuarios.AnyAsync(u => u.Id != personal.UsuarioId && u.Email == email);
            if (exists)
                throw DomainException.Conflict("Já existe uma conta cadastrada com este e-mail.");
            personal.Usuario.Email = email;
        }

        if (dto.Telefone is not null)
            personal.Usuario.Telefone = dto.Telefone.Trim();

        await _context.SaveChangesAsync();
        return Mapear(personal, personal.Usuario);
    }

    public async Task<bool> Deletar(Guid id)
    {
        var personal = await _context.Personais.FirstOrDefaultAsync(p => p.Id == id);
        if (personal is null)
            return false;

        _context.Personais.Remove(personal);
        await _context.SaveChangesAsync();
        return true;
    }

    private static PersonalDTO Mapear(Personal personal, Usuario usuario) => new()
    {
        Id = personal.Id,
        UsuarioId = personal.UsuarioId,
        NomeCompleto = personal.Nome,
        Email = usuario.Email,
        Telefone = usuario.Telefone
    };

    private static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();
}
