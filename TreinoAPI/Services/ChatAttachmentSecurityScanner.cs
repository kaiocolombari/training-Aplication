using System.Diagnostics;
using System.ComponentModel;
using System.IO.Compression;
using System.Text;
using System.Text.RegularExpressions;
using System.Xml.Linq;
using TreinoAPI.Security;

namespace TreinoAPI.Services;

public sealed class ChatAttachmentSecurityScanner(IConfiguration configuration)
{
    public const long MaxFileBytes = 20L * 1024 * 1024;

    public async Task<(string MimeType, string Scanner)> VerificarAsync(
        string caminho,
        string nomeOriginal,
        CancellationToken cancellationToken)
    {
        var extensao = Path.GetExtension(nomeOriginal).ToLowerInvariant();
        var mime = extensao switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".webp" => "image/webp",
            ".pdf" => "application/pdf",
            ".txt" => "text/plain",
            ".mp4" => "video/mp4",
            ".mov" => "video/quicktime",
            ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            _ => throw DomainException.BadRequest("Tipo de arquivo não permitido. Envie imagem, vídeo MP4/MOV, PDF, TXT ou DOCX.")
        };

        await ValidarAssinaturaAsync(caminho, extensao, cancellationToken);
        var scanner = configuration["CHAT_ANTIVIRUS_COMMAND"];
        if (string.IsNullOrWhiteSpace(scanner))
            throw DomainException.ServiceUnavailable("O envio de arquivos está temporariamente indisponível: o antivírus do servidor não está configurado.");

        var arguments = configuration["CHAT_ANTIVIRUS_ARGUMENTS"] ?? "--no-summary \"{file}\"";
        var start = new ProcessStartInfo
        {
            FileName = scanner,
            UseShellExecute = false,
            RedirectStandardError = true,
            RedirectStandardOutput = true,
            CreateNoWindow = true
        };
        foreach (var argument in SepararArgumentos(arguments))
            start.ArgumentList.Add(argument.Replace("{file}", caminho, StringComparison.Ordinal));

        using var process = new Process { StartInfo = start };
        try
        {
            if (!process.Start())
                throw DomainException.ServiceUnavailable("Não foi possível iniciar o antivírus do servidor.");
            var outputTask = process.StandardOutput.ReadToEndAsync(cancellationToken);
            var errorTask = process.StandardError.ReadToEndAsync(cancellationToken);
            using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            timeout.CancelAfter(TimeSpan.FromSeconds(45));
            try
            {
                await process.WaitForExitAsync(timeout.Token);
            }
            catch (OperationCanceledException)
            {
                try { if (!process.HasExited) process.Kill(entireProcessTree: true); } catch { }
                if (cancellationToken.IsCancellationRequested) throw;
                throw DomainException.ServiceUnavailable("A verificação antivírus excedeu o tempo limite. O arquivo não foi enviado.");
            }

            var output = await outputTask;
            var error = await errorTask;
            if (process.ExitCode == 1)
                throw DomainException.BadRequest("O antivírus identificou conteúdo potencialmente malicioso. O arquivo foi rejeitado.");
            if (process.ExitCode != 0)
                throw DomainException.ServiceUnavailable($"O antivírus não conseguiu concluir a verificação. {Truncar(error + output)}");

            return (mime, Path.GetFileName(scanner));
        }
        catch (Win32Exception exception)
        {
            throw new DomainException($"Não foi possível executar o antivírus configurado: {exception.Message}", StatusCodes.Status503ServiceUnavailable);
        }
    }

    private static async Task ValidarAssinaturaAsync(string caminho, string extensao, CancellationToken cancellationToken)
    {
        await using var stream = File.OpenRead(caminho);
        var header = new byte[16];
        var read = await stream.ReadAsync(header, cancellationToken);
        var valid = extensao switch
        {
            ".jpg" or ".jpeg" => read >= 3 && header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF,
            ".png" => read >= 8 && header.AsSpan(0, 8).SequenceEqual(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 }),
            ".webp" => read >= 12 && Encoding.ASCII.GetString(header, 0, 4) == "RIFF" && Encoding.ASCII.GetString(header, 8, 4) == "WEBP",
            ".pdf" => read >= 5 && Encoding.ASCII.GetString(header, 0, 5) == "%PDF-",
            ".mp4" or ".mov" => read >= 12 && Encoding.ASCII.GetString(header, 4, 4) == "ftyp",
            ".docx" => read >= 4 && header[0] == 0x50 && header[1] == 0x4B && header[2] == 0x03 && header[3] == 0x04,
            ".txt" => await TextoValidoAsync(caminho, cancellationToken),
            _ => false
        };
        if (!valid)
            throw DomainException.BadRequest("A extensão do arquivo não corresponde ao conteúdo enviado.");

        if (extensao == ".docx") ValidarDocx(caminho);
    }

    private static async Task<bool> TextoValidoAsync(string caminho, CancellationToken cancellationToken)
    {
        var bytes = await File.ReadAllBytesAsync(caminho, cancellationToken);
        if (bytes.Contains((byte)0)) return false;
        try { _ = new UTF8Encoding(false, true).GetString(bytes); return true; }
        catch (DecoderFallbackException) { return false; }
    }

    private static void ValidarDocx(string caminho)
    {
        try
        {
            using var archive = ZipFile.OpenRead(caminho);
            if (archive.Entries.Count > 1000 || archive.Entries.Sum(entry => entry.Length) > 100L * 1024 * 1024 ||
                archive.GetEntry("[Content_Types].xml") is null || archive.GetEntry("word/document.xml") is null ||
                archive.Entries.Any(entry => entry.FullName.Contains("vbaProject", StringComparison.OrdinalIgnoreCase) ||
                    entry.FullName.EndsWith(".bin", StringComparison.OrdinalIgnoreCase) ||
                    entry.FullName.StartsWith("word/embeddings/", StringComparison.OrdinalIgnoreCase) ||
                    entry.FullName.StartsWith("word/activeX/", StringComparison.OrdinalIgnoreCase)))
                throw DomainException.BadRequest("O documento DOCX não possui uma estrutura válida ou contém componentes não permitidos.");

            foreach (var relationships in archive.Entries.Where(entry => entry.FullName.EndsWith(".rels", StringComparison.OrdinalIgnoreCase)))
            {
                using var stream = relationships.Open();
                var document = XDocument.Load(stream);
                var possuiDestinoExterno = document.Descendants().Attributes()
                    .Any(attribute => attribute.Name.LocalName == "TargetMode" &&
                        string.Equals(attribute.Value, "External", StringComparison.OrdinalIgnoreCase));
                if (possuiDestinoExterno)
                    throw DomainException.BadRequest("Documentos com referências externas não são permitidos.");
            }
        }
        catch (InvalidDataException)
        {
            throw DomainException.BadRequest("O arquivo DOCX está corrompido.");
        }
        catch (System.Xml.XmlException)
        {
            throw DomainException.BadRequest("O documento DOCX contém uma estrutura XML inválida.");
        }
    }

    private static IEnumerable<string> SepararArgumentos(string argumentos) =>
        Regex.Matches(argumentos, "(?:\\\"([^\\\"]*)\\\")|([^\\s]+)").Cast<Match>()
            .Select(match => match.Groups[1].Success ? match.Groups[1].Value : match.Groups[2].Value);

    private static string Truncar(string valor) => valor.Length > 300 ? valor[..300] : valor;
}
