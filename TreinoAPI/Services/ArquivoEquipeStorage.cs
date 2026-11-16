using Microsoft.AspNetCore.Http;

namespace TreinoAPI.Services;

public sealed class ArquivoEquipeStorage
{
    private readonly string _diretorio;

    public ArquivoEquipeStorage(IWebHostEnvironment environment, IConfiguration configuration)
    {
        var configurado = configuration["TEAM_FILES_STORAGE_PATH"];
        if (string.IsNullOrWhiteSpace(configurado))
            configurado = Path.Combine("App_Data", "arquivos-equipe");

        _diretorio = Path.GetFullPath(Path.IsPathRooted(configurado)
            ? configurado
            : Path.Combine(environment.ContentRootPath, configurado));

        var webRoot = Path.GetFullPath(environment.WebRootPath ?? Path.Combine(environment.ContentRootPath, "wwwroot"));
        if (EstaDentroDe(webRoot, _diretorio))
            throw new InvalidOperationException("O armazenamento de arquivos da equipe deve ficar fora de wwwroot.");

        Directory.CreateDirectory(_diretorio);
    }

    public async Task<string> SalvarAsync(IFormFile arquivo, CancellationToken cancellationToken)
    {
        var chave = Guid.NewGuid().ToString("N");
        var caminho = ObterCaminho(chave);

        try
        {
            await using var destino = new FileStream(
                caminho,
                FileMode.CreateNew,
                FileAccess.Write,
                FileShare.None,
                64 * 1024,
                FileOptions.Asynchronous | FileOptions.SequentialScan);
            await arquivo.CopyToAsync(destino, cancellationToken);
            return chave;
        }
        catch
        {
            try
            {
                File.Delete(caminho);
            }
            catch
            {
                // Preserva a exceção original do upload.
            }
            throw;
        }
    }

    public Stream AbrirLeitura(string chave) => new FileStream(
        ObterCaminho(chave),
        FileMode.Open,
        FileAccess.Read,
        FileShare.Read,
        64 * 1024,
        FileOptions.Asynchronous | FileOptions.SequentialScan);

    public void Excluir(string chave)
    {
        var caminho = ObterCaminho(chave);
        File.Delete(caminho);
    }

    public bool VerificarEscrita()
    {
        var caminho = Path.Combine(_diretorio, $"health-{Guid.NewGuid():N}.tmp");
        try
        {
            using (new FileStream(caminho, FileMode.CreateNew, FileAccess.Write, FileShare.None)) { }
            File.Delete(caminho);
            return true;
        }
        catch
        {
            try { if (File.Exists(caminho)) File.Delete(caminho); } catch { }
            return false;
        }
    }

    private string ObterCaminho(string chave)
    {
        if (!Guid.TryParseExact(chave, "N", out _))
            throw new InvalidOperationException("Identificador interno de arquivo inválido.");

        return Path.Combine(_diretorio, chave);
    }

    private static bool EstaDentroDe(string diretorioPai, string caminho)
    {
        var relativo = Path.GetRelativePath(diretorioPai, caminho);
        return relativo == "." ||
            (!Path.IsPathRooted(relativo) && relativo != ".." &&
             !relativo.StartsWith($"..{Path.DirectorySeparatorChar}", StringComparison.Ordinal) &&
             !relativo.StartsWith($"..{Path.AltDirectorySeparatorChar}", StringComparison.Ordinal));
    }
}
