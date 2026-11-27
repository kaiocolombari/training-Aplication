using System.Net;
using System.Net.Mail;
using System.Diagnostics;
using MailKit;
using MailKit.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using MimeKit;
using MailKitSmtpClient = MailKit.Net.Smtp.SmtpClient;
using TreinoAPI.Configuration;
using TreinoAPI.Data;
using TreinoAPI.DTOs.Email;
using TreinoAPI.Security;

namespace TreinoAPI.Services;

public sealed class EmailService
{
    private readonly AppDbContext _db;
    private readonly CurrentUserService _current;
    private readonly OwnershipService _ownership;
    private readonly EmailOptions _options;
    private readonly ILogger<EmailService> _logger;

    public EmailService(
        AppDbContext db,
        CurrentUserService current,
        OwnershipService ownership,
        IOptions<EmailOptions> options,
        ILogger<EmailService> logger)
    {
        _db = db;
        _current = current;
        _ownership = ownership;
        _options = options.Value;
        _logger = logger;
    }

    public bool EstaConfigurado =>
        _options.Enabled &&
        !string.IsNullOrWhiteSpace(_options.Smtp.Host) &&
        _options.Smtp.Port is > 0 and <= 65535 &&
        !string.IsNullOrWhiteSpace(_options.Smtp.Username) &&
        !string.IsNullOrWhiteSpace(_options.Smtp.Password) &&
        MailAddress.TryCreate(_options.SenderEmail, out _) &&
        (string.IsNullOrWhiteSpace(_options.ReplyToEmail) || MailAddress.TryCreate(_options.ReplyToEmail, out _));

    public async Task<EmailStatusDTO> ObterStatusAsync(CancellationToken cancellationToken = default)
    {
        var cronometro = Stopwatch.StartNew();
        var pendencias = new List<string>();

        if (!_options.Enabled) pendencias.Add("Email__Enabled=true");
        if (string.IsNullOrWhiteSpace(_options.Smtp.Host)) pendencias.Add("Email__Smtp__Host");
        if (_options.Smtp.Port is < 1 or > 65535) pendencias.Add("Email__Smtp__Port");
        if (string.IsNullOrWhiteSpace(_options.Smtp.Username)) pendencias.Add("Email__Smtp__Username");
        if (string.IsNullOrWhiteSpace(_options.Smtp.Password)) pendencias.Add("Email__Smtp__Password");
        if (!MailAddress.TryCreate(_options.SenderEmail, out _)) pendencias.Add("Email__SenderEmail (endereço verificado pelo provedor)");
        if (!string.IsNullOrWhiteSpace(_options.ReplyToEmail) && !MailAddress.TryCreate(_options.ReplyToEmail, out _))
            pendencias.Add("Email__ReplyToEmail (endereço válido)");

        var smtpTemCredenciais =
            !string.IsNullOrWhiteSpace(_options.Smtp.Host) &&
            _options.Smtp.Port is > 0 and <= 65535 &&
            !string.IsNullOrWhiteSpace(_options.Smtp.Username) &&
            !string.IsNullOrWhiteSpace(_options.Smtp.Password);

        var status = new EmailStatusDTO
        {
            Configurado = EstaConfigurado,
            Biblioteca = "MailKit",
            VersaoBiblioteca = typeof(MailKitSmtpClient).Assembly.GetName().Version?.ToString() ?? "Versão indisponível",
            BibliotecaDisponivel = true,
            Servidor = string.IsNullOrWhiteSpace(_options.Smtp.Host) ? "Não configurado" : $"{_options.Smtp.Host}:{_options.Smtp.Port}",
            ConfiguracoesPendentes = pendencias.ToArray(),
            Marca = _options.BrandName,
            RemetenteNome = _options.SenderName,
            RemetenteEmail = _options.SenderEmail,
            LogoUrl = _options.LogoUrl,
            CorPrincipal = _options.PrimaryColor
        };

        if (!smtpTemCredenciais)
        {
            status.Estado = "CONFIGURACAO_INCOMPLETA";
            status.Mensagem = "A biblioteca MailKit está disponível, mas faltam host, porta ou credenciais SMTP. O teste de conexão não foi executado.";
            FinalizarVerificacao(status, cronometro);
            return status;
        }

        using var smtp = new MailKitSmtpClient
        {
            Timeout = Math.Clamp(_options.Smtp.TimeoutMs, 3000, 12000)
        };

        try
        {
            using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            timeout.CancelAfter(TimeSpan.FromSeconds(12));

            await smtp.ConnectAsync(
                _options.Smtp.Host,
                _options.Smtp.Port,
                ObterSegurancaSmtp(),
                timeout.Token);
            status.ServidorAcessivel = true;

            await smtp.AuthenticateAsync(_options.Smtp.Username, _options.Smtp.Password, timeout.Token);
            status.Autenticado = true;

            if (!_options.Enabled)
            {
                status.Estado = "AUTENTICADO_DESABILITADO";
                status.Mensagem = "O servidor SMTP está acessível e autenticou as credenciais, mas o envio está desativado. Defina Email__Enabled=true.";
            }
            else if (!MailAddress.TryCreate(_options.SenderEmail, out _))
            {
                status.Estado = "AUTENTICADO_INCOMPLETO";
                status.Mensagem = "O servidor SMTP conectou e autenticou. Falta configurar Email__SenderEmail com um endereço remetente verificado no provedor.";
            }
            else if (!string.IsNullOrWhiteSpace(_options.ReplyToEmail) && !MailAddress.TryCreate(_options.ReplyToEmail, out _))
            {
                status.Estado = "AUTENTICADO_INCOMPLETO";
                status.Mensagem = "O servidor SMTP autenticou, mas Email__ReplyToEmail não contém um endereço válido.";
            }
            else
            {
                status.Estado = "CONECTADO";
                status.Mensagem = "MailKit conectou ao servidor SMTP e autenticou as credenciais. O envio está pronto.";
            }
        }
        catch (MailKit.Security.AuthenticationException exception)
        {
            _logger.LogWarning(exception, "O servidor SMTP recusou a autenticação configurada para {Host}:{Port}.", _options.Smtp.Host, _options.Smtp.Port);
            status.Estado = "ERRO_AUTENTICACAO";
            status.Mensagem = "O servidor SMTP respondeu, mas recusou as credenciais. Confira usuário, senha e método de autenticação no provedor.";
        }
        catch (OperationCanceledException exception)
        {
            _logger.LogWarning(exception, "A verificação SMTP excedeu o tempo limite para {Host}:{Port}.", _options.Smtp.Host, _options.Smtp.Port);
            status.Estado = "TIMEOUT";
            status.Mensagem = "O servidor SMTP excedeu o limite de 12 segundos. Confira host, porta, SSL/TLS e disponibilidade do provedor.";
        }
        catch (Exception exception)
        {
            _logger.LogWarning(exception, "Falha ao verificar SMTP em {Host}:{Port}.", _options.Smtp.Host, _options.Smtp.Port);
            status.Estado = status.ServidorAcessivel ? "ERRO_AUTENTICACAO" : "ERRO_CONEXAO";
            status.Mensagem = status.ServidorAcessivel
                ? "A conexão foi aberta, mas não foi possível concluir a autenticação SMTP. Confira as credenciais e o método de segurança."
                : "Não foi possível conectar ao servidor SMTP. Confira host, porta, SSL/TLS e disponibilidade do provedor.";
        }
        finally
        {
            if (smtp.IsConnected)
            {
                try { await smtp.DisconnectAsync(true, CancellationToken.None); }
                catch (Exception exception) { _logger.LogDebug(exception, "Falha ao encerrar a conexão usada no teste SMTP."); }
            }
        }

        status.ProntoParaEnvio = status.Autenticado && EstaConfigurado;
        status.Configurado = EstaConfigurado;
        FinalizarVerificacao(status, cronometro);
        return status;
    }

    private SecureSocketOptions ObterSegurancaSmtp()
    {
        if (!_options.Smtp.EnableSsl) return SecureSocketOptions.None;
        return _options.Smtp.Port == 465
            ? SecureSocketOptions.SslOnConnect
            : SecureSocketOptions.StartTls;
    }

    private static void FinalizarVerificacao(EmailStatusDTO status, Stopwatch cronometro)
    {
        cronometro.Stop();
        status.VerificadoEm = DateTime.UtcNow;
        status.DuracaoMs = cronometro.ElapsedMilliseconds;
        status.ProntoParaEnvio = status.Autenticado && status.Configurado;
    }

    public async Task<List<EmailDestinatarioDTO>> ListarDestinatariosAsync(string tipo, string? busca)
    {
        tipo = tipo.Trim().ToUpperInvariant();
        if (tipo is not ("ALUNO" or "PERSONAL"))
            throw DomainException.BadRequest("Tipo de destinatário inválido.");

        if (_current.Role == "PERSONAL" && tipo != "ALUNO")
            throw DomainException.Forbidden("Personais só podem enviar e-mails aos próprios alunos.");

        var termo = busca?.Trim();
        if (termo?.Length > 100)
            throw DomainException.BadRequest("A busca deve ter no máximo 100 caracteres.");

        if (tipo == "ALUNO")
        {
            var consulta = _db.Usuarios.AsNoTracking()
                .Where(u => u.Tipo == TipoUsuario.ALUNO &&
                    u.Aluno != null &&
                    u.Aluno.StatusCadastro == StatusCadastroAluno.APROVADO &&
                    u.Email != "");

            if (_current.Role == "PERSONAL")
            {
                var idsAcessiveis = await _ownership.GetAccessibleAlunoIdsAsync();
                consulta = consulta.Where(u => u.Aluno != null && idsAcessiveis.Contains(u.Aluno.Id));
            }

            if (!string.IsNullOrWhiteSpace(termo))
                consulta = consulta.Where(u =>
                    (u.Aluno != null && u.Aluno.NomeCompleto.Contains(termo)) ||
                    u.Email.Contains(termo));

            return await consulta
                .OrderBy(u => u.Aluno!.NomeCompleto)
                .Take(500)
                .Select(u => new EmailDestinatarioDTO
                {
                    UsuarioId = u.Id,
                    Nome = u.Aluno!.NomeCompleto,
                    Email = u.Email,
                    Tipo = "ALUNO"
                })
                .ToListAsync();
        }

        if (_current.Role != "ADMIN")
            throw DomainException.Forbidden();

        var personais = _db.Usuarios.AsNoTracking()
            .Where(u => u.Tipo == TipoUsuario.PERSONAL && u.Personal != null && u.Email != "");

        if (!string.IsNullOrWhiteSpace(termo))
            personais = personais.Where(u =>
                (u.Personal != null && u.Personal.Nome.Contains(termo)) ||
                u.Email.Contains(termo));

        return await personais
            .OrderBy(u => u.Personal!.Nome)
            .Take(500)
            .Select(u => new EmailDestinatarioDTO
            {
                UsuarioId = u.Id,
                Nome = u.Personal!.Nome,
                Email = u.Email,
                Tipo = "PERSONAL"
            })
            .ToListAsync();
    }

    public async Task<EmailEnvioResultadoDTO> EnviarAsync(EnviarEmailDTO dto)
    {
        if (!EstaConfigurado)
            throw DomainException.Conflict("O serviço de e-mail ainda não está configurado.");

        var assunto = dto.Assunto?.Trim() ?? string.Empty;
        var mensagem = dto.Mensagem?.Trim() ?? string.Empty;
        var ids = (dto.DestinatariosIds ?? []).Distinct().ToArray();

        if (ids.Length is < 1 or > 100)
            throw DomainException.BadRequest("Selecione entre 1 e 100 destinatários por envio.");
        if (assunto.Length is < 3 or > 150)
            throw DomainException.BadRequest("O assunto deve conter entre 3 e 150 caracteres.");
        if (mensagem.Length is < 3 or > 12000)
            throw DomainException.BadRequest("A mensagem deve conter entre 3 e 12.000 caracteres.");

        var consulta = _db.Usuarios.AsNoTracking()
            .Where(u => ids.Contains(u.Id) &&
                (u.Tipo == TipoUsuario.PERSONAL ||
                 (u.Tipo == TipoUsuario.ALUNO && u.Aluno != null && u.Aluno.StatusCadastro == StatusCadastroAluno.APROVADO)));

        if (_current.Role == "PERSONAL")
        {
            var idsAcessiveis = await _ownership.GetAccessibleAlunoIdsAsync();
            if (ids.Any(id => !idsAcessiveis.Contains(id)))
                throw DomainException.Forbidden("Um ou mais destinatários não fazem parte dos alunos ativos disponíveis para a equipe.");

            consulta = consulta.Where(u => u.Tipo == TipoUsuario.ALUNO &&
                u.Aluno != null && idsAcessiveis.Contains(u.Aluno.Id));
        }

        var destinatarios = await consulta
            .Select(u => new
            {
                u.Id,
                u.Email,
                Nome = u.Aluno != null ? u.Aluno.NomeCompleto : u.Personal != null ? u.Personal.Nome : u.Email,
                Tipo = u.Tipo.ToString()
            })
            .ToListAsync();

        if (destinatarios.Count != ids.Length)
            throw DomainException.BadRequest("Um ou mais destinatários não existem, não estão aprovados ou não podem receber este envio.");

        var resultado = new EmailEnvioResultadoDTO { TotalDestinatarios = destinatarios.Count };
        var aparencia = EmailTemplateService.NormalizarAparencia(dto.Aparencia, _options);
        using var smtp = new MailKitSmtpClient
        {
            Timeout = Math.Clamp(_options.Smtp.TimeoutMs, 5000, 60000)
        };

        try
        {
            await smtp.ConnectAsync(_options.Smtp.Host, _options.Smtp.Port, ObterSegurancaSmtp());
            await smtp.AuthenticateAsync(_options.Smtp.Username, _options.Smtp.Password);
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Não foi possível conectar ou autenticar no servidor SMTP {Host}:{Port}.", _options.Smtp.Host, _options.Smtp.Port);
            if (smtp.IsConnected)
            {
                try { await smtp.DisconnectAsync(true); }
                catch { /* Preserva a falha original de conexão/autenticação. */ }
            }
            throw DomainException.ServiceUnavailable("Não foi possível conectar ou autenticar no servidor SMTP. A mensagem não foi enviada; verifique o status da Central de e-mails.");
        }

        foreach (var destinatario in destinatarios)
        {
            if (!MailAddress.TryCreate(destinatario.Email, out _))
            {
                resultado.Falhas++;
                resultado.Resultados.Add(new EmailDestinatarioResultadoDTO
                {
                    UsuarioId = destinatario.Id,
                    Nome = destinatario.Nome,
                    Sucesso = false,
                    Mensagem = "Endereço de e-mail inválido."
                });
                continue;
            }

            try
            {
                var assuntoPersonalizado = EmailTemplateService.Personalizar(assunto, destinatario.Nome);
                var mensagemPersonalizada = EmailTemplateService.Personalizar(mensagem, destinatario.Nome);
                var email = new MimeMessage();
                email.From.Add(new MailboxAddress(aparencia.NomeRemetente ?? _options.SenderName, _options.SenderEmail));
                email.To.Add(new MailboxAddress(destinatario.Nome, destinatario.Email));
                if (MailAddress.TryCreate(_options.ReplyToEmail, out var replyTo))
                    email.ReplyTo.Add(MailboxAddress.Parse(replyTo.Address));
                email.Subject = assuntoPersonalizado;
                email.Body = new BodyBuilder
                {
                    TextBody = EmailTemplateService.CriarTexto(_options, assuntoPersonalizado, mensagemPersonalizada, aparencia),
                    HtmlBody = EmailTemplateService.CriarHtml(_options, assuntoPersonalizado, mensagemPersonalizada, aparencia)
                }.ToMessageBody();

                await smtp.SendAsync(email);
                resultado.Enviados++;
                resultado.Resultados.Add(new EmailDestinatarioResultadoDTO
                {
                    UsuarioId = destinatario.Id,
                    Nome = destinatario.Nome,
                    Sucesso = true,
                    Mensagem = "E-mail enviado."
                });
            }
            catch (Exception exception)
            {
                _logger.LogWarning(exception, "Falha ao enviar e-mail para o usuário {UsuarioId}.", destinatario.Id);
                resultado.Falhas++;
                resultado.Resultados.Add(new EmailDestinatarioResultadoDTO
                {
                    UsuarioId = destinatario.Id,
                    Nome = destinatario.Nome,
                    Sucesso = false,
                    Mensagem = "Não foi possível enviar para este destinatário."
                });
            }
        }

        if (smtp.IsConnected)
        {
            try { await smtp.DisconnectAsync(true); }
            catch (Exception exception) { _logger.LogDebug(exception, "Falha ao encerrar a sessão SMTP após o envio."); }
        }

        return resultado;
    }
}
