using Microsoft.EntityFrameworkCore;
using TreinoAPI.Data;
using TreinoAPI.Model;

namespace TreinoAPI.Security;

public static class AdminSeeder
{
    public static async Task SeedAsync(IServiceProvider services, IConfiguration configuration)
    {
        var email = configuration["ADMIN_EMAIL"]?.Trim().ToLowerInvariant();
        var password = configuration["ADMIN_PASSWORD"];

        var db = services.GetRequiredService<AppDbContext>();
        if (await db.Usuarios.AnyAsync(u => u.Tipo == TipoUsuario.ADMIN))
            return;

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
            throw new InvalidOperationException("Configure ADMIN_EMAIL e ADMIN_PASSWORD para criar o primeiro administrador.");

        if (password.Length < 12)
            throw new InvalidOperationException("ADMIN_PASSWORD deve possuir pelo menos 12 caracteres.");

        if (await db.Usuarios.AnyAsync(u => u.Email == email))
            throw new InvalidOperationException("ADMIN_EMAIL já pertence a uma conta que não é administradora.");

        var passwords = services.GetRequiredService<PasswordService>();
        db.Usuarios.Add(new Usuario
        {
            Email = email,
            SenhaHashed = passwords.Hash(password),
            Tipo = TipoUsuario.ADMIN,
            CriadoEm = DateTime.UtcNow
        });
        await db.SaveChangesAsync();
    }
}
