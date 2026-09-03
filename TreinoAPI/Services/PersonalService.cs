
using Microsoft.EntityFrameworkCore;
using TreinoAPI.Data;
using TreinoAPI.DTOs.Personal;
using TreinoAPI.Model;

namespace TreinoAPI.Services;

public class PersonalService
{
    private readonly AppDbContext _context;

    public PersonalService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PersonalDTO> Criar(CriarPersonalDto dto)
    {
        var usuario = new Usuario
        {
            Email = dto.Email,
            Telefone = dto.Telefone,
            Tipo = TipoUsuario.PERSONAL,
            CriadoEm = DateTime.UtcNow,

            // temporário
            SenhaHashed = dto.Senha
        };

        var personal = new Personal
        {
            Nome = dto.NomeCompleto,
            Usuario = usuario
        };

        _context.Usuarios.Add(usuario);
        _context.Personais.Add(personal);

        await _context.SaveChangesAsync();

        return new PersonalDTO
        {
            Id = personal.Id,
            UsuarioId = usuario.Id,
            NomeCompleto = personal.Nome,
            Email = usuario.Email,
            Telefone = usuario.Telefone,
        };
    }

    public async Task<List<PersonalDTO>> Listar()
    {
        return await _context.Personais
        .Include(p => p.Usuario)
        .Select(p => new PersonalDTO
        {
            Id = p.Id,
            UsuarioId = p.UsuarioId,
            NomeCompleto = p.Nome,
            Email = p.Usuario.Email,
            Telefone = p.Usuario.Telefone,

        })
        .ToListAsync();
    }

    public async Task<PersonalDTO?> BuscarPorId(Guid id)
    {
        var personal = await _context.Personais
            .Include(p => p.Usuario)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (personal == null)
            return null;

        return new PersonalDTO
        {
            Id = personal.Id,
            UsuarioId = personal.Id,
            NomeCompleto = personal.Nome,
            Email = personal.Usuario.Email,
            Telefone = personal.Usuario.Telefone,
        };
    }

    public async Task<PersonalDTO> Atualizar(Guid id, AtualizarPersonalDTO dto)
    {
        var personal = await _context.Personais
        .Include(p => p.Usuario)
        .FirstOrDefaultAsync(p => p.Id == id);

        if (personal == null)
            throw new Exception("Personal não encontrado");
        if (dto.Nome != null)
            personal.Nome = dto.Nome;

        if (dto.Email != null)
            personal.Usuario.Email = dto.Email;

        if (dto.Telefone != null)
            personal.Usuario.Telefone = dto.Telefone;

        await _context.SaveChangesAsync();

        return new PersonalDTO
        {
            Id = personal.Id,
            UsuarioId = personal.UsuarioId,
            NomeCompleto = personal.Nome,
            Email = personal.Usuario.Email,
            Telefone = personal.Usuario.Telefone
        };
    }

    public async Task<bool> Deletar(Guid id)
    {
        var personal = await _context.Personais
            .FirstOrDefaultAsync(p => p.Id == id);

        if (personal == null)
            return false;

        _context.Personais.Remove(personal);

        await _context.SaveChangesAsync();

        return true;
    }
}