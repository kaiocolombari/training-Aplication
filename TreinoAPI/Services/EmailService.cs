using System.Net;
using System.Net.Mail;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
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

    public EmailStatusDTO ObterStatus() => new()
    {
        Configurado = EstaConfigurado,
        Marca = _options.BrandName,
        RemetenteNome = _options.SenderName,
        RemetenteEmail = _options.SenderEmail,
        CorPrincipal = _options.PrimaryColor,
        Mensagem = EstaConfigurado
            ? "O serviço de e-mail está configurado e pronto para envio."
            : "O envio ainda não está habilitado. Configure o remetente em appsettings.json e os dados SMTP no arquivo .env."
    };

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
                throw DomainException.Forbidden("Um ou mais destinatários não pertencem aos seus alunos vinculados.");

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
        using var smtp = new SmtpClient(_options.Smtp.Host, _options.Smtp.Port)
        {
            EnableSsl = _options.Smtp.EnableSsl,
            UseDefaultCredentials = false,
            Credentials = new NetworkCredential(_options.Smtp.Username, _options.Smtp.Password),
            DeliveryMethod = SmtpDeliveryMethod.Network,
            Timeout = Math.Clamp(_options.Smtp.TimeoutMs, 5000, 60000)
        };

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
                using var email = new MailMessage
                {
                    From = new MailAddress(_options.SenderEmail, _options.SenderName, Encoding.UTF8),
                    Subject = assuntoPersonalizado,
                    SubjectEncoding = Encoding.UTF8,
                    BodyEncoding = Encoding.UTF8,
                    Priority = MailPriority.Normal
                };

                email.To.Add(new MailAddress(destinatario.Email, destinatario.Nome, Encoding.UTF8));
                if (MailAddress.TryCreate(_options.ReplyToEmail, out var replyTo))
                    email.ReplyToList.Add(replyTo);

                var html = EmailTemplateService.CriarHtml(_options, assuntoPersonalizado, mensagemPersonalizada);
                var texto = EmailTemplateService.CriarTexto(_options, assuntoPersonalizado, mensagemPersonalizada);
                email.AlternateViews.Add(AlternateView.CreateAlternateViewFromString(texto, Encoding.UTF8, "text/plain"));
                email.AlternateViews.Add(AlternateView.CreateAlternateViewFromString(html, Encoding.UTF8, "text/html"));

                await smtp.SendMailAsync(email);
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

        return resultado;
    }
}
