using Microsoft.AspNetCore.Http;

namespace TreinoAPI.Services;

public sealed class ChatAttachmentStorage
{
    private readonly string _directory;

    public ChatAttachmentStorage(IWebHostEnvironment environment, IConfiguration configuration)
    {
        var configured = configuration["CHAT_FILES_STORAGE_PATH"];
        if (string.IsNullOrWhiteSpace(configured))
            configured = Path.Combine("App_Data", "chat-anexos");

        _directory = Path.GetFullPath(Path.IsPathRooted(configured)
            ? configured
            : Path.Combine(environment.ContentRootPath, configured));
        var webRoot = Path.GetFullPath(environment.WebRootPath ?? Path.Combine(environment.ContentRootPath, "wwwroot"));
        var relative = Path.GetRelativePath(webRoot, _directory);
        if (relative == "." || (!Path.IsPathRooted(relative) && relative != ".." &&
            !relative.StartsWith($"..{Path.DirectorySeparatorChar}", StringComparison.Ordinal) &&
            !relative.StartsWith($"..{Path.AltDirectorySeparatorChar}", StringComparison.Ordinal)))
            throw new InvalidOperationException("O armazenamento de anexos do chat deve ficar fora de wwwroot.");

        Directory.CreateDirectory(_directory);
    }

    public async Task<string> SalvarTemporarioAsync(IFormFile arquivo, CancellationToken cancellationToken)
    {
        var chave = Guid.NewGuid().ToString("N");
        var caminho = ObterCaminho(chave, temporario: true);
        try
        {
            await using var destino = new FileStream(caminho, FileMode.CreateNew, FileAccess.Write, FileShare.None,
                64 * 1024, FileOptions.Asynchronous | FileOptions.SequentialScan);
            await arquivo.CopyToAsync(destino, cancellationToken);
            return chave;
        }
        catch
        {
            try { if (File.Exists(caminho)) File.Delete(caminho); } catch { }
            throw;
        }
    }

    public string Promover(string chaveTemporaria, Guid id)
    {
        var chave = id.ToString("N");
        File.Move(ObterCaminho(chaveTemporaria, temporario: true), ObterCaminho(chave));
        return chave;
    }

    public Stream AbrirLeitura(string chave) => new FileStream(
        ObterCaminho(chave), FileMode.Open, FileAccess.Read, FileShare.Read,
        64 * 1024, FileOptions.Asynchronous | FileOptions.SequentialScan);

    public void Excluir(string chave)
    {
        var caminho = ObterCaminho(chave);
        if (File.Exists(caminho)) File.Delete(caminho);
    }

    public void ExcluirTemporario(string chave)
    {
        var caminho = ObterCaminho(chave, temporario: true);
        if (File.Exists(caminho)) File.Delete(caminho);
    }

    public string ObterCaminhoTemporario(string chave) => ObterCaminho(chave, temporario: true);

    private string ObterCaminho(string chave, bool temporario = false)
    {
        if (!Guid.TryParseExact(chave, "N", out _))
            throw new InvalidOperationException("Identificador interno de arquivo inválido.");
        return Path.Combine(_directory, chave + (temporario ? ".pending" : string.Empty));
    }
}
