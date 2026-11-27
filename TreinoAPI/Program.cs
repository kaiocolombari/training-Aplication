using System.Security.Claims;
using System.Net;
using System.Text;
using System.Threading.RateLimiting;
using DotNetEnv;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using TreinoAPI.Data;
using TreinoAPI.Configuration;
using TreinoAPI.Middleware;
using TreinoAPI.Hubs;
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

if (accessMinutes is < 1 or > 60)
    throw new InvalidOperationException("Auth:AccessTokenMinutes deve estar entre 1 e 60 minutos.");
if (refreshDays is < 1 or > 90)
    throw new InvalidOperationException("Auth:RefreshTokenDays deve estar entre 1 e 90 dias.");

builder.Services.Configure<AuthOptions>(options =>
{
    options.Secret = jwtSecret;
    options.Issuer = issuer;
    options.Audience = audience;
    options.AccessTokenMinutes = accessMinutes;
    options.RefreshTokenDays = refreshDays;
});

builder.Services.Configure<EmailOptions>(builder.Configuration.GetSection("Email"));
builder.Services.Configure<InviteOptions>(builder.Configuration.GetSection("Invites"));
var turnstileEnabled = builder.Configuration.GetValue<bool?>("Turnstile:Enabled") ?? !builder.Environment.IsDevelopment();
var turnstileSiteKey = builder.Configuration["TURNSTILE_SITE_KEY"] ?? builder.Configuration["Turnstile:SiteKey"];
var turnstileSecretKey = builder.Configuration["TURNSTILE_SECRET_KEY"] ?? builder.Configuration["Turnstile:SecretKey"];
if (!builder.Environment.IsDevelopment() &&
    (!turnstileEnabled || string.IsNullOrWhiteSpace(turnstileSiteKey) || string.IsNullOrWhiteSpace(turnstileSecretKey) ||
     string.IsNullOrWhiteSpace(builder.Configuration["TURNSTILE_EXPECTED_HOSTNAME"] ?? builder.Configuration["Turnstile:ExpectedHostname"])))
    throw new InvalidOperationException("Configure TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY e TURNSTILE_EXPECTED_HOSTNAME para habilitar cadastro protegido em produção.");
builder.Services.Configure<TurnstileOptions>(options =>
{
    options.Enabled = turnstileEnabled;
    options.SiteKey = turnstileSiteKey ?? string.Empty;
    options.SecretKey = turnstileSecretKey ?? string.Empty;
    options.ExpectedHostname = builder.Configuration["TURNSTILE_EXPECTED_HOSTNAME"] ?? builder.Configuration["Turnstile:ExpectedHostname"];
});

builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));
builder.Services.AddControllers();
builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    var defaultResponseFactory = options.InvalidModelStateResponseFactory;
    options.InvalidModelStateResponseFactory = context =>
    {
        if (context.HttpContext.Request.Path.StartsWithSegments("/api/auth/mobile/login"))
        {
            var logger = context.HttpContext.RequestServices
                .GetRequiredService<ILoggerFactory>()
                .CreateLogger("MobileLoginValidation");
            var errors = context.ModelState
                .Where(entry => entry.Value?.Errors.Count > 0)
                .SelectMany(entry => entry.Value!.Errors.Select(error =>
                    string.IsNullOrWhiteSpace(error.ErrorMessage) ? "Invalid value" : error.ErrorMessage));

            logger.LogWarning(
                "Mobile login model validation failed. ContentType={ContentType}; ContentLength={ContentLength}; Fields={Fields}; Errors={Errors}",
                context.HttpContext.Request.ContentType,
                context.HttpContext.Request.ContentLength,
                context.ModelState.Where(entry => entry.Value?.Errors.Count > 0).Select(entry => entry.Key),
                errors);
        }

        return defaultResponseFactory(context);
    };
});
builder.Services.AddSignalR();
builder.Services.AddSingleton<ChatPresenceTracker>();
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
builder.Services.AddScoped<ConvitePersonalService>();
builder.Services.AddHttpClient<TurnstileService>();
builder.Services.AddScoped<ComunicacaoService>();
builder.Services.AddSingleton<ArquivoEquipeStorage>();
builder.Services.AddSingleton<ChatAttachmentStorage>();
builder.Services.AddSingleton<ChatAttachmentSecurityScanner>();
builder.Services.AddScoped<ArquivoEquipeService>();
builder.Services.AddScoped<ChatAttachmentService>();
builder.Services.AddScoped<PushTokenService>();
builder.Services.AddScoped<ChatAlunoContextService>();
builder.Services.AddHttpClient<ExpoPushService>();
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
builder.Services.AddScoped<AgendaAvaliacaoService>();
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
builder.Services.AddScoped<AcompanhamentoPersonalService>();
builder.Services.AddScoped<VolumeAcompanhamentoService>();
builder.Services.AddScoped<VolumeSemanalService>();
builder.Services.AddScoped<GrupoMuscularService>();
builder.Services.AddScoped<DobraCutaneaService>();
builder.Services.AddHostedService<ArquivoEquipeRetentionWorker>();
builder.Services.AddHostedService<ChatRetentionWorker>();

builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "X-CSRF-TOKEN";
    options.Cookie.Name = "treino_csrf";
    options.Cookie.HttpOnly = true;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    options.Cookie.SameSite = SameSiteMode.None;
    options.Cookie.Path = "/";
});

var configuredOrigins = builder.Configuration["FRONTEND_ORIGINS"];
if (string.IsNullOrWhiteSpace(configuredOrigins))
{
    if (!builder.Environment.IsDevelopment())
        throw new InvalidOperationException("Configure FRONTEND_ORIGINS com as origens HTTPS autorizadas do frontend.");

    configuredOrigins = "http://localhost:5173";
}

var allowedHosts = builder.Configuration["AllowedHosts"];
if (!builder.Environment.IsDevelopment() &&
    (string.IsNullOrWhiteSpace(allowedHosts) || allowedHosts.Split(';', StringSplitOptions.TrimEntries).Contains("*")))
{
    throw new InvalidOperationException("Configure AllowedHosts com os hosts publicos da API; wildcard nao e permitido em producao.");
}

var forwardedHeadersEnabled = builder.Configuration.GetValue<bool>("FORWARDED_HEADERS_ENABLED");
var trustedProxyValues = (builder.Configuration["FORWARDED_TRUSTED_PROXIES"] ?? string.Empty)
    .Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
var trustedProxyAddresses = forwardedHeadersEnabled
    ? trustedProxyValues.Select(value =>
    {
        if (!IPAddress.TryParse(value, out var address))
            throw new InvalidOperationException("FORWARDED_TRUSTED_PROXIES deve conter enderecos IP validos separados por ponto e virgula.");
        return address;
    }).ToArray()
    : [];
if (forwardedHeadersEnabled && trustedProxyAddresses.Length == 0)
    throw new InvalidOperationException("Informe FORWARDED_TRUSTED_PROXIES antes de habilitar os cabecalhos encaminhados.");
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.ForwardLimit = 1;
    foreach (var address in trustedProxyAddresses)
        options.KnownProxies.Add(address);
});

var origins = configuredOrigins
    .Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
if (origins.Length == 0 || origins.Any(origin =>
    !Uri.TryCreate(origin, UriKind.Absolute, out var uri) ||
    !string.IsNullOrEmpty(uri.UserInfo) || uri.AbsolutePath != "/" ||
    !string.IsNullOrEmpty(uri.Query) || !string.IsNullOrEmpty(uri.Fragment) ||
    (!builder.Environment.IsDevelopment() && uri.Scheme != Uri.UriSchemeHttps)))
{
    throw new InvalidOperationException(
        builder.Environment.IsDevelopment()
            ? "FRONTEND_ORIGINS deve conter origens válidas separadas por ponto e vírgula."
            : "FRONTEND_ORIGINS deve conter apenas origens HTTPS válidas, sem caminhos ou parâmetros.");
}

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
    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.ContentType = "application/problem+json";
        await context.HttpContext.Response.WriteAsJsonAsync(new
        {
            type = "about:blank",
            title = "Limite de tentativas atingido",
            status = StatusCodes.Status429TooManyRequests,
            detail = "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente."
        }, cancellationToken);
    };
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
    options.AddPolicy("onboarding", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(10),
                QueueLimit = 0,
                AutoReplenishment = true
            }));
    options.AddPolicy("invites", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 12,
                Window = TimeSpan.FromHours(1),
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
    options.AddPolicy("chat-files-upload", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? context.Connection.RemoteIpAddress?.ToString()
                ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 8,
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
                var authorization = context.Request.Headers.Authorization.ToString();
                if (authorization.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                {
                    context.Token = authorization["Bearer ".Length..].Trim();
                    return Task.CompletedTask;
                }

                if (context.Request.Cookies.TryGetValue("treino_access", out var token))
                    context.Token = token;
                if (context.HttpContext.Request.Path.StartsWithSegments("/hubs/chat") &&
                    context.Request.Query.TryGetValue("access_token", out var hubToken))
                    context.Token = hubToken;
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

if (forwardedHeadersEnabled)
    app.UseForwardedHeaders();

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

// O app mobile em desenvolvimento acessa a API pela rede local via HTTP.
// Redirecionar para HTTPS com certificado de desenvolvimento não confiável
// no dispositivo físico impede o fetch de concluir a requisição.
if (!app.Environment.IsDevelopment())
    app.UseHttpsRedirection();
app.UseWebSockets(new WebSocketOptions { KeepAliveInterval = TimeSpan.FromSeconds(30) });
app.Use(async (context, next) =>
{
    if (context.Request.Path.StartsWithSegments("/hubs/chat") && context.WebSockets.IsWebSocketRequest)
    {
        var tokenExplicito = context.Request.Query.ContainsKey("access_token") ||
            context.Request.Headers.Authorization.ToString().StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase);
        var origin = context.Request.Headers.Origin.ToString();
        var origemInvalida = !string.IsNullOrWhiteSpace(origin) &&
            !origins.Contains(origin, StringComparer.OrdinalIgnoreCase);
        var clienteSemOrigemNemToken = string.IsNullOrWhiteSpace(origin) && !tokenExplicito;
        if (origemInvalida || clienteSemOrigemNemToken)
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return;
        }
    }
    await next();
});
app.UseCors("Frontend");
app.UseAuthentication();
// A validação antiforgery precisa enxergar os claims do usuário autenticado,
// pois o request token é vinculado à identidade que recebeu o token em /api/auth/csrf.
app.UseMiddleware<CsrfProtectionMiddleware>();
app.UseRateLimiter();
app.UseAuthorization();
app.MapControllers();
app.MapHub<ChatHub>("/hubs/chat").RequireAuthorization();
app.MapGet("/health/live", () => Results.Ok(new { status = "ok" })).AllowAnonymous();
app.MapGet("/health/ready", async (
    AppDbContext db,
    ILogger<Program> logger,
    CancellationToken cancellationToken) =>
{
    try
    {
        if (await db.Database.CanConnectAsync(cancellationToken))
            return Results.Ok(new { status = "ready" });
    }
    catch (Exception exception)
    {
        logger.LogWarning(exception, "A verificação de prontidão não conseguiu acessar o PostgreSQL.");
    }

    return Results.Problem(
        statusCode: StatusCodes.Status503ServiceUnavailable,
        title: "Serviço indisponível",
        detail: "Uma dependência necessária não está disponível.");
}).AllowAnonymous();

app.Run();

public partial class Program;
