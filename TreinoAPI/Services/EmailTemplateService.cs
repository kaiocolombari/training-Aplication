using System.Net;
using System.Text.RegularExpressions;
using TreinoAPI.Configuration;
using TreinoAPI.DTOs.Email;

namespace TreinoAPI.Services;

public static partial class EmailTemplateService
{
    public static string Personalizar(string conteudo, string nome)
    {
        var primeiroNome = nome.Split(' ', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault() ?? nome;
        return conteudo
            .Replace("{{nome}}", nome, StringComparison.OrdinalIgnoreCase)
            .Replace("{{primeiro_nome}}", primeiroNome, StringComparison.OrdinalIgnoreCase);
    }

    public static EmailAparenciaDTO NormalizarAparencia(EmailAparenciaDTO? aparencia, EmailOptions options)
    {
        aparencia ??= new EmailAparenciaDTO { CorPrincipal = options.PrimaryColor };
        var marca = string.IsNullOrWhiteSpace(aparencia.Marca) ? options.BrandName : aparencia.Marca.Trim();
        var rodape = string.IsNullOrWhiteSpace(aparencia.TextoRodape)
            ? $"Esta mensagem foi enviada pela equipe {marca} para o endereço de e-mail cadastrado na plataforma."
            : aparencia.TextoRodape.Trim();
        var nomeRemetente = string.IsNullOrWhiteSpace(aparencia.NomeRemetente)
            ? options.SenderName
            : aparencia.NomeRemetente;

        return new EmailAparenciaDTO
        {
            NomeRemetente = Limitar(new string(nomeRemetente.Where(caractere => !char.IsControl(caractere)).ToArray()), 80),
            Marca = Limitar(marca, 80),
            LogoUrl = LogoSeguro(aparencia.LogoUrl) ? aparencia.LogoUrl!.Trim() : LogoSeguro(options.LogoUrl) ? options.LogoUrl : string.Empty,
            TextoRodape = Limitar(rodape, 300),
            CorPrincipal = CorOuPadrao(aparencia.CorPrincipal, options.PrimaryColor, "#5558D9"),
            CorFundo = CorOuPadrao(aparencia.CorFundo, "#F4F5F8", "#F4F5F8"),
            CorCartao = CorOuPadrao(aparencia.CorCartao, "#FFFFFF", "#FFFFFF"),
            CorCabecalho = CorOuPadrao(aparencia.CorCabecalho, "#FFFFFF", "#FFFFFF"),
            CorTexto = CorOuPadrao(aparencia.CorTexto, "#20232B", "#20232B"),
            CorTextoSecundario = CorOuPadrao(aparencia.CorTextoSecundario, "#505664", "#505664"),
            CorBorda = CorOuPadrao(aparencia.CorBorda, "#E7E9EF", "#E7E9EF"),
            CorRodape = CorOuPadrao(aparencia.CorRodape, "#F8F9FB", "#F8F9FB"),
            CorTextoRodape = CorOuPadrao(aparencia.CorTextoRodape, "#858B98", "#858B98")
        };
    }

    public static string CriarHtml(EmailOptions options, string assunto, string mensagem, EmailAparenciaDTO? aparencia = null)
    {
        var visual = NormalizarAparencia(aparencia, options);
        var marca = WebUtility.HtmlEncode(visual.Marca);
        var assuntoSeguro = WebUtility.HtmlEncode(assunto);
        var mensagemSegura = WebUtility.HtmlEncode(mensagem)
            .Replace("\r\n", "\n", StringComparison.Ordinal)
            .Replace("\n", "<br />", StringComparison.Ordinal);
        var rodape = WebUtility.HtmlEncode(visual.TextoRodape);
        var logo = LogoSeguro(visual.LogoUrl)
            ? $"<img src=\"{WebUtility.HtmlEncode(visual.LogoUrl)}\" alt=\"{marca}\" width=\"132\" style=\"display:block;max-width:132px;max-height:42px;border:0;\" />"
            : $"<span style=\"display:inline-block;color:{visual.CorPrincipal};font-size:17px;font-weight:700;letter-spacing:1.2px;\">{marca}</span>";

        return $"""
        <!doctype html>
        <html lang="pt-BR">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta name="color-scheme" content="light">
          <title>{assuntoSeguro}</title>
        </head>
        <body style="margin:0;padding:0;background-color:{visual.CorFundo};font-family:Arial,Helvetica,sans-serif;color:{visual.CorTexto};">
          <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Uma comunicação da equipe {marca}.</div>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:{visual.CorFundo};padding:32px 12px;">
            <tr>
              <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:100%;max-width:600px;background:{visual.CorCartao};border:1px solid {visual.CorBorda};border-radius:14px;overflow:hidden;">
                  <tr>
                    <td style="height:5px;background:{visual.CorPrincipal};font-size:0;line-height:0;">&nbsp;</td>
                  </tr>
                  <tr>
                    <td style="padding:26px 32px;background:{visual.CorCabecalho};">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td align="left" valign="middle">{logo}</td>
                          <td align="right" valign="middle" style="font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:{visual.CorTextoSecundario};">COMUNICAÇÃO OFICIAL</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 32px 34px;background:{visual.CorCartao};">
                      <p style="margin:0 0 10px;font-size:10px;line-height:16px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:{visual.CorPrincipal};">MENSAGEM DA EQUIPE</p>
                      <h1 style="margin:0 0 22px;font-size:24px;line-height:1.3;font-weight:700;letter-spacing:-.5px;color:{visual.CorTexto};">{assuntoSeguro}</h1>
                      <div style="font-size:15px;line-height:1.85;color:{visual.CorTextoSecundario};overflow-wrap:anywhere;">{mensagemSegura}</div>
                      <div style="height:1px;background:{visual.CorBorda};margin:30px 0 20px;"></div>
                      <p style="margin:0;font-size:12px;line-height:1.7;color:{visual.CorTextoRodape};">{rodape}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:20px 32px;background:{visual.CorRodape};border-top:1px solid {visual.CorBorda};">
                      <p style="margin:0;font-size:11px;line-height:1.6;color:{visual.CorTextoRodape};">© {DateTime.UtcNow.Year} {marca}. Todos os direitos reservados.</p>
                      <p style="margin:5px 0 0;font-size:10px;line-height:1.6;color:{visual.CorTextoRodape};">Este é um e-mail automático. Para responder, utilize o endereço de resposta informado pela equipe.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
        """;
    }

    public static string CriarTexto(EmailOptions options, string assunto, string mensagem, EmailAparenciaDTO? aparencia = null)
    {
        var visual = NormalizarAparencia(aparencia, options);
        return $"{visual.Marca}\n\n{assunto}\n\n{mensagem}\n\n{visual.TextoRodape}";
    }

    private static string CorOuPadrao(string? valor, string? alternativa, string padrao)
    {
        if (CorHexValida(valor)) return valor!;
        if (CorHexValida(alternativa)) return alternativa!;
        return padrao;
    }

    private static string Limitar(string? valor, int maximo)
    {
        var texto = valor?.Trim() ?? string.Empty;
        return texto.Length <= maximo ? texto : texto[..maximo];
    }

    private static bool CorHexValida(string? cor) =>
        !string.IsNullOrWhiteSpace(cor) && HexColorRegex().IsMatch(cor);

    private static bool LogoSeguro(string? url) =>
        Uri.TryCreate(url, UriKind.Absolute, out var uri) && uri.Scheme == Uri.UriSchemeHttps;

    [GeneratedRegex("^#[0-9A-Fa-f]{6}$")]
    private static partial Regex HexColorRegex();
}
