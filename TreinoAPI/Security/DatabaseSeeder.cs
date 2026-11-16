using Microsoft.EntityFrameworkCore;
using TreinoAPI.Data;
using TreinoAPI.Model;

namespace TreinoAPI.Security;

public static class DatabaseSeeder
{
    private static readonly string[] MuscleGroups =
    [
        "Antebraço", "Bíceps", "Tríceps", "Costas (Upper)", "Costas (Lower)",
        "Lombar", "Clavicular", "Esterocostal", "Deltoide Anterior",
        "Deltoide Lateral", "Deltoide Posterior", "Vastos", "Reto Femoral",
        "Posteriores", "Glúteo Máximo", "Glúteo Médio", "Glúteo Mínimo",
        "Adutores", "Panturrilhas", "Abdômen"
    ];

    public static async Task SeedAsync(IServiceProvider services)
    {
        var db = services.GetRequiredService<AppDbContext>();
        var existing = await db.GruposMusculares.Select(g => g.Nome).ToListAsync();
        var normalized = existing.ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (var name in MuscleGroups.Where(name => !normalized.Contains(name)))
            db.GruposMusculares.Add(new GrupoMuscular { Nome = name });

        await db.SaveChangesAsync();
    }
}
