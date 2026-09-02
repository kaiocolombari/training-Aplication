
using Microsoft.EntityFrameworkCore;
using TreinoAPI.Data;
using TreinoAPI.DTOs.Usuario;
using TreinoAPI.Model;

namespace TreinoAPI.Services;

public class UsuarioService
{
    private readonly AppDbContext _context;

    public UsuarioService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<UsuarioDto> BuscarUsuarios(Guid Id)
    {
        return await _context.Usuarios
        .Where(u => u.Id == Id)
        .Select(u => new UsuarioDto
        {
            Id = u.Id,
            Email = u.Email,
            Telefone = u.Telefone,
            Tipo = u.TipoUsuario,
            CriadoEm = u.CriadoEm
        })
        .FirstOrDefaultAsync();
    }
}