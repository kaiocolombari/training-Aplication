using Microsoft.EntityFrameworkCore;
using TreinoAPI.Data;
using TreinoAPI.DTOs.Auth;

namespace TreinoAPI.Services;

public class AuthService
{
    private readonly AppDbContext _context;

    public AuthService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<LoginRespostaDTO?> Login(LoginDTO dto)
    {
        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.Email == dto.Email);

        if (usuario == null)
            return null;

        // verificação da senha

        return new LoginRespostaDTO
        {
            UsuarioId = usuario.Id,
            Tipo = usuario.Tipo.ToString()
        };
    }
}