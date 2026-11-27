using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using TreinoAPI.Data;
using TreinoAPI.Model;
using TreinoAPI.Services;

namespace TreinoAPI.Security;

public static class ExercicioCatalogoSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        var db = services.GetRequiredService<AppDbContext>();
        var environment = services.GetRequiredService<IWebHostEnvironment>();
        var logger = services.GetRequiredService<ILoggerFactory>().CreateLogger("ExercicioCatalogoSeeder");
        var seedPath = Path.Combine(environment.ContentRootPath, "SeedData", "ExerciseCatalog", "exercise-catalog-seed.json");
        if (!File.Exists(seedPath))
            seedPath = Path.Combine(AppContext.BaseDirectory, "SeedData", "ExerciseCatalog", "exercise-catalog-seed.json");
        if (!File.Exists(seedPath))
            throw new FileNotFoundException("O arquivo de importação do catálogo de exercícios não foi publicado.", seedPath);

        var json = await File.ReadAllTextAsync(seedPath);
        var seed = JsonSerializer.Deserialize<SeedRoot>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        }) ?? throw new InvalidOperationException("O arquivo de importação do catálogo está vazio ou inválido.");

        var existingCodes = (await db.ExerciciosCatalogo
            .Where(exercicio => exercicio.CodigoFonte != null)
            .Select(exercicio => exercicio.CodigoFonte!)
            .ToListAsync()).ToHashSet(StringComparer.OrdinalIgnoreCase);

        var imported = 0;
        foreach (var item in seed.Exercises)
        {
            if (string.IsNullOrWhiteSpace(item.SourceKey) || string.IsNullOrWhiteSpace(item.Name) ||
                !existingCodes.Add(item.SourceKey))
                continue;

            var exercicio = new ExercicioCatalogo
            {
                Nome = item.Name.Trim(),
                NomeNormalizado = ExercicioCatalogoMatcher.Normalizar(item.Name),
                GrupoMuscular = item.MuscleGroup,
                Equipamento = item.Equipment is { Count: > 0 } ? string.Join(", ", item.Equipment) : null,
                Dificuldade = item.Difficulty,
                Descricao = item.Description,
                Instrucoes = item.Instructions,
                CodigoFonte = item.SourceKey,
                FonteDados = item.DataSource,
                LicencaDados = item.DataLicense
            };

            var synonyms = (item.Aliases ?? [])
                .Append(item.Name)
                .Select(name => name?.Trim() ?? string.Empty)
                .Where(name => name.Length is >= 2 and <= 160)
                .Where(name => ExercicioCatalogoMatcher.Normalizar(name) != exercicio.NomeNormalizado)
                .GroupBy(ExercicioCatalogoMatcher.Normalizar)
                .Select(group => group.First());
            foreach (var synonym in synonyms)
            {
                exercicio.Sinonimos.Add(new ExercicioSinonimo
                {
                    Nome = synonym,
                    NomeNormalizado = ExercicioCatalogoMatcher.Normalizar(synonym),
                    Origem = "IMPORTADO"
                });
            }

            if (!string.IsNullOrWhiteSpace(item.VideoUrl))
            {
                exercicio.Videos.Add(new VideoExercicio
                {
                    Titulo = item.VideoTitle?.Trim() is { Length: > 0 } title ? title : item.Name,
                    UrlExterna = item.VideoUrl,
                    TipoConteudo = "video/mp4",
                    Origem = "CC0",
                    Licenca = item.VideoLicense ?? "CC0-1.0",
                    Fonte = "https://github.com/namnq/workout-free-videos",
                    DuracaoSegundos = item.DurationSeconds,
                    Principal = true
                });
            }

            db.ExerciciosCatalogo.Add(exercicio);
            imported++;
        }

        if (imported > 0)
            await db.SaveChangesAsync();

        await VincularExerciciosLegadosAsync(db);
        logger.LogInformation("Catálogo de exercícios verificado. Novos registros importados: {Imported}", imported);
    }

    private static async Task VincularExerciciosLegadosAsync(AppDbContext db)
    {
        var catalogo = await db.ExerciciosCatalogo.AsNoTracking()
            .Where(exercicio => exercicio.Ativo)
            .Include(exercicio => exercicio.Sinonimos)
            .ToListAsync();
        var indice = new Dictionary<string, Guid?>(StringComparer.Ordinal);

        void AdicionarIndice(string nome, Guid id)
        {
            var normalizado = ExercicioCatalogoMatcher.Normalizar(nome);
            if (normalizado.Length == 0)
                return;
            if (indice.TryGetValue(normalizado, out var existente) && existente != id)
                indice[normalizado] = null;
            else
                indice[normalizado] = id;
        }

        foreach (var exercicio in catalogo)
        {
            AdicionarIndice(exercicio.Nome, exercicio.Id);
            foreach (var sinonimo in exercicio.Sinonimos)
                AdicionarIndice(sinonimo.Nome, exercicio.Id);
        }

        var legados = await db.TreinosExercicios
            .Where(exercicio => exercicio.ExercicioCatalogoId == null)
            .ToListAsync();
        var alterados = 0;
        foreach (var exercicio in legados)
        {
            var normalizado = ExercicioCatalogoMatcher.Normalizar(exercicio.Exercicio);
            if (indice.TryGetValue(normalizado, out var catalogoId) && catalogoId.HasValue)
            {
                exercicio.ExercicioCatalogoId = catalogoId.Value;
                alterados++;
            }
        }

        if (alterados > 0)
            await db.SaveChangesAsync();
    }

    private sealed class SeedRoot
    {
        public SeedRoot() { }
        public List<SeedExercise> Exercises { get; set; } = [];
    }

    private sealed class SeedExercise
    {
        public SeedExercise() { }
        public string? SourceKey { get; set; }
        public string? Name { get; set; }
        public List<string>? Aliases { get; set; }
        public string? MuscleGroup { get; set; }
        public List<string>? Equipment { get; set; }
        public string? Difficulty { get; set; }
        public string? Description { get; set; }
        public string? Instructions { get; set; }
        public string? DataSource { get; set; }
        public string? DataLicense { get; set; }
        public string? VideoUrl { get; set; }
        public string? VideoTitle { get; set; }
        public string? VideoLicense { get; set; }
        public double? DurationSeconds { get; set; }
    }
}
