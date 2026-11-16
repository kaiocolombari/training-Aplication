using DotNetEnv;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace TreinoAPI.Data;

public sealed class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var envPath = Path.Combine(Directory.GetCurrentDirectory(), ".env");
        if (!File.Exists(envPath))
        {
            var projectEnvPath = Path.Combine(Directory.GetCurrentDirectory(), "TreinoAPI", ".env");
            if (File.Exists(projectEnvPath))
                envPath = projectEnvPath;
        }

        if (File.Exists(envPath))
            Env.Load(envPath);

        var connectionString = Environment.GetEnvironmentVariable("DB_CONNECTION_STRING");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            var host = Environment.GetEnvironmentVariable("DB_HOST");
            var port = Environment.GetEnvironmentVariable("DB_PORT") ?? "5432";
            var database = Environment.GetEnvironmentVariable("DB_NAME");
            var user = Environment.GetEnvironmentVariable("DB_USER");
            var password = Environment.GetEnvironmentVariable("DB_PASSWORD");

            if (new[] { host, database, user, password }.Any(string.IsNullOrWhiteSpace))
                throw new InvalidOperationException("Configure DB_CONNECTION_STRING ou DB_HOST, DB_NAME, DB_USER e DB_PASSWORD no ambiente ou em TreinoAPI/.env.");

            connectionString = $"Host={host};Port={port};Database={database};Username={user};Password={password};";
        }

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        return new AppDbContext(options);
    }
}
