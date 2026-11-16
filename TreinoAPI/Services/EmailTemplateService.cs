using System.Net;
using System.Text.RegularExpressions;
using TreinoAPI.Configuration;

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

    public static string CriarHtml(EmailOptions options, string assunto, string mensagem)
    {
        var marca = WebUtility.HtmlEncode(options.BrandName);
        var assuntoSeguro = WebUtility.HtmlEncode(assunto);
        var mensagemSegura = WebUtility.HtmlEncode(mensagem)
            .Replace("\r\n", "\n", StringComparison.Ordinal)
            .Replace("\n", "<br />", StringComparison.Ordinal);
        var cor = CorHexValida(options.PrimaryColor) ? options.PrimaryColor : "#5558D9";
        var logo = LogoSeguro(options.LogoUrl)
            ? $"<img src=\"{WebUtility.HtmlEncode(options.LogoUrl)}\" alt=\"{marca}\" width=\"112\" style=\"display:block;max-width:112px;max-height:36px;border:0;\" />"
            : $"<span style=\"display:inline-block;color:#ffffff;font-size:17px;font-weight:700;letter-spacing:1.4px;\">{marca}</span>";

        return $"""
        <!doctype html>
        <html lang="pt-BR">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta name="color-scheme" content="light">
          <title>{assuntoSeguro}</title>
        </head>
        <body style="margin:0;padding:0;background-color:#f4f5f8;font-family:Arial,Helvetica,sans-serif;color:#20232b;">
          <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Uma comunicação da equipe {marca}.</div>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f4f5f8;padding:32px 12px;">
            <tr>
              <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #e7e9ef;border-radius:14px;overflow:hidden;">
                  <tr>
                    <td style="height:5px;background:{cor};font-size:0;line-height:0;">&nbsp;</td>
                  </tr>
                  <tr>
                    <td style="padding:26px 32px;background:#ffffff;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td align="left" valign="middle">{logo}</td>
                          <td align="right" valign="middle" style="font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:#9297a4;">COMUNICAÇÃO OFICIAL</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 32px 34px;">
                      <p style="margin:0 0 10px;font-size:10px;line-height:16px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:{cor};">MENSAGEM DA EQUIPE</p>
                      <h1 style="margin:0 0 22px;font-size:24px;line-height:1.3;font-weight:700;letter-spacing:-.5px;color:#20232b;">{assuntoSeguro}</h1>
                      <div style="font-size:15px;line-height:1.85;color:#505664;overflow-wrap:anywhere;">{mensagemSegura}</div>
                      <div style="height:1px;background:#eceef2;margin:30px 0 20px;"></div>
                      <p style="margin:0;font-size:12px;line-height:1.7;color:#777e8c;">Esta mensagem foi enviada pela equipe <strong style="color:#333946;">{marca}</strong> para o endereço de e-mail cadastrado na plataforma.</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:20px 32px;background:#f8f9fb;border-top:1px solid #eceef2;">
                      <p style="margin:0;font-size:11px;line-height:1.6;color:#858b98;">© {DateTime.UtcNow.Year} {marca}. Todos os direitos reservados.</p>
                      <p style="margin:5px 0 0;font-size:10px;line-height:1.6;color:#a0a5af;">Este é um e-mail automático. Para responder, utilize o endereço de resposta informado pela equipe.</p>
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

    public static string CriarTexto(EmailOptions options, string assunto, string mensagem) =>
        $"{options.BrandName}\n\n{assunto}\n\n{mensagem}\n\nEsta mensagem foi enviada pela equipe {options.BrandName} para o endereço de e-mail cadastrado na plataforma.";

    private static bool CorHexValida(string? cor) =>
        !string.IsNullOrWhiteSpace(cor) && HexColorRegex().IsMatch(cor);

    private static bool LogoSeguro(string? url) =>
        Uri.TryCreate(url, UriKind.Absolute, out var uri) && uri.Scheme == Uri.UriSchemeHttps;

    [GeneratedRegex("^#[0-9A-Fa-f]{6}$")]
    private static partial Regex HexColorRegex();
}
