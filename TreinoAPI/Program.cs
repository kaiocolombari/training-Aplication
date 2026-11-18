using System.Security.Claims;
using System.Text;
using System.Threading.RateLimiting;
using DotNetEnv;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using TreinoAPI.Data;
using TreinoAPI.Configuration;
using TreinoAPI.Middleware;
using TreinoAPI.Security;
using TreinoAPI.Services;

var builder = WebApplication.CreateBuilder(args);
var envPath = Path.Combine(builder.Environment.ContentRootPath, ".env");
if (File.Exists(envPath))
    Env.Load(envPath);

builder.Configuration.AddEnvironmentVariables();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? builder.Configuration["DB_CONNECTION_STRING"];

if (string.IsNullOrWhiteSpace(connectionString))
{
    var host = builder.Configuration["DB_HOST"];
    var port = builder.Configuration["DB_PORT"];
    var database = builder.Configuration["DB_NAME"];
    var user = builder.Configuration["DB_USER"];
    var password = builder.Configuration["DB_PASSWORD"];

    if (new[] { host, port, database, user, password }.Any(string.IsNullOrWhiteSpace))
        throw new InvalidOperationException("Configure DB_CONNECTION_STRING ou todas as variáveis DB_HOST, DB_PORT, DB_NAME, DB_USER e DB_PASSWORD.");

    connectionString = $"Host={host};Port={port};Database={database};Username={user};Password={password};";
}

var jwtSecret = builder.Configuration["AUTH_JWT_SECRET"];
if (string.IsNullOrWhiteSpace(jwtSecret) || Encoding.UTF8.GetByteCount(jwtSecret) < 32)
    throw new InvalidOperationException("AUTH_JWT_SECRET deve conter pelo menos 32 bytes aleatórios.");

var issuer = builder.Configuration["Auth:Issuer"] ?? "TreinoAPI";
var audience = builder.Configuration["Auth:Audience"] ?? "TreinoWeb";
var accessMinutes = builder.Configuration.GetValue("Auth:AccessTokenMinutes", 15);
var refreshDays = builder.Configuration.GetValue("Auth:RefreshTokenDays", 7);

builder.Services.Configure<AuthOptions>(options =>
{
    options.Secret = jwtSecret;
    options.Issuer = issuer;
    options.Audience = audience;
    options.AccessTokenMinutes = accessMinutes;
    options.RefreshTokenDays = refreshDays;
});

builder.Services.Configure<EmailOptions>(builder.Configuration.GetSection("Email"));

builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddProblemDetails();

builder.Services.AddHttpContextAccessor();
builder.Services.AddSingleton<PasswordService>();
builder.Services.AddScoped<TokenService>();
builder.Services.AddScoped<CurrentUserService>();
builder.Services.AddScoped<OwnershipService>();

builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<CadastroAlunoService>();
builder.Services.AddScoped<ComunicacaoService>();
builder.Services.AddSingleton<ArquivoEquipeStorage>();
builder.Services.AddScoped<ArquivoEquipeService>();
builder.Services.AddScoped<EmailService>();
builder.Services.AddScoped<AuditoriaService>();
builder.Services.AddScoped<RelatoriosService>();
builder.Services.AddScoped<AnaliseEstatisticaService>();
builder.Services.AddScoped<AdminExtrasService>();
builder.Services.AddScoped<AlunoService>();
builder.Services.AddScoped<PersonalService>();
builder.Services.AddScoped<PersonalAlunoService>();
builder.Services.AddScoped<AnamneseService>();
builder.Services.AddScoped<AvaliacaoAuditService>();
builder.Services.AddScoped<AvaliacaoService>();
builder.Services.AddScoped<CadastroCompletoService>();
builder.Services.AddScoped<SalvarFichaService>();
builder.Services.AddScoped<TreinoService>();
builder.Services.AddScoped<CargaExercicioService>();
builder.Services.AddScoped<TesteCargaService>();
builder.Services.AddScoped<PeriodizacaoService>();
builder.Services.AddScoped<PeriodizacaoDiaService>();
builder.Services.AddScoped<PeriodizacaoSemanaService>();
builder.Services.AddScoped<PerimetroService>();
builder.Services.AddScoped<TreinoDiaService>();
builder.Services.AddScoped<TreinoExercicioService>();
builder.Services.AddScoped<ExecucaoTreinoService>();
builder.Services.AddScoped<VolumeAcompanhamentoService>();
builder.Services.AddScoped<VolumeSemanalService>();
builder.Services.AddScoped<GrupoMuscularService>();
builder.Services.AddScoped<DobraCutaneaService>();
builder.Services.AddHostedService<ArquivoEquipeRetentionWorker>();

builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "X-CSRF-TOKEN";
    options.Cookie.Name = "treino_csrf";
    options.Cookie.HttpOnly = true;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    options.Cookie.SameSite = SameSiteMode.None;
    options.Cookie.Path = "/";
});

var origins = (builder.Configuration["FRONTEND_ORIGINS"] ?? "http://localhost:5173")
    .Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
        policy.WithOrigins(origins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());
});

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("auth", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 8,
                Window = TimeSpan.FromMinutes(5),
                QueueLimit = 0,
                AutoReplenishment = true
            }));
    options.AddPolicy("email-send", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? context.Connection.RemoteIpAddress?.ToString()
                ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 4,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true
            }));
    options.AddPolicy("team-files-upload", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? context.Connection.RemoteIpAddress?.ToString()
                ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(5),
                QueueLimit = 0,
                AutoReplenishment = true
            }));
});

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateIssuer = true,
            ValidIssuer = issuer,
            ValidateAudience = true,
            ValidAudience = audience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30),
            NameClaimType = ClaimTypes.NameIdentifier,
            RoleClaimType = ClaimTypes.Role
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                if (context.Request.Cookies.TryGetValue("treino_access", out var token))
                    context.Token = token;
                return Task.CompletedTask;
            },
            OnTokenValidated = async context =>
            {
                var usuarioIdClaim = context.Principal?.FindFirstValue(ClaimTypes.NameIdentifier);
                if (!Guid.TryParse(usuarioIdClaim, out var usuarioId))
                {
                    context.Fail("Token sem identificador de usuário válido.");
                    return;
                }

                var db = context.HttpContext.RequestServices.GetRequiredService<AppDbContext>();
                var contaAtiva = await db.Usuarios.AsNoTracking()
                    .AnyAsync(usuario => usuario.Id == usuarioId && usuario.Ativo);
                if (!contaAtiva)
                    context.Fail("Esta conta foi desativada.");
            }
        };
    });

builder.Services.AddAuthorization(options =>
{
    // Protege por padrão todas as rotas. Somente endpoints marcados AllowAnonymous são públicos.
    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
});

var app = builder.Build();

app.UseMiddleware<AuditoriaMiddleware>();
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseMiddleware<SecurityHeadersMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();

    // Ambiente local: aplica migrations pendentes antes de iniciar o sistema.
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
}

// Seeds são idempotentes e também precisam existir em ambientes já migrados.
using (var scope = app.Services.CreateScope())
{
    await DatabaseSeeder.SeedAsync(scope.ServiceProvider);
    await AdminSeeder.SeedAsync(scope.ServiceProvider, app.Configuration);
}

if (!app.Environment.IsDevelopment())
    app.UseHsts();

app.UseHttpsRedirection();
app.UseCors("Frontend");
app.UseAuthentication();
// A validação antiforgery precisa enxergar os claims do usuário autenticado,
// pois o request token é vinculado à identidade que recebeu o token em /api/auth/csrf.
app.UseMiddleware<CsrfProtectionMiddleware>();
app.UseRateLimiter();
app.UseAuthorization();
app.MapControllers();

app.Run();

public partial class Program;
