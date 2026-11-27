namespace TreinoAPI.Services;

public sealed class ExercicioVideoStorage
{
    private readonly string _diretorio;

    public ExercicioVideoStorage(IWebHostEnvironment environment, IConfiguration configuration)
    {
        var configurado = configuration["EXERCISE_VIDEO_STORAGE_PATH"];
        if (string.IsNullOrWhiteSpace(configurado))
            configurado = Path.Combine("App_Data", "exercicios-videos");

        _diretorio = Path.GetFullPath(Path.IsPathRooted(configurado)
            ? configurado
            : Path.Combine(environment.ContentRootPath, configurado));

        var webRoot = Path.GetFullPath(environment.WebRootPath ?? Path.Combine(environment.ContentRootPath, "wwwroot"));
        var relativo = Path.GetRelativePath(webRoot, _diretorio);
        var dentroDeWebRoot = relativo == "." ||
            (!Path.IsPathRooted(relativo) && relativo != ".." &&
             !relativo.StartsWith($"..{Path.DirectorySeparatorChar}", StringComparison.Ordinal) &&
             !relativo.StartsWith($"..{Path.AltDirectorySeparatorChar}", StringComparison.Ordinal));
        if (dentroDeWebRoot)
        {
            throw new InvalidOperationException("O armazenamento de vídeos de exercícios deve ficar fora de wwwroot.");
        }

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
                128 * 1024,
                FileOptions.Asynchronous | FileOptions.SequentialScan);
            await arquivo.CopyToAsync(destino, cancellationToken);
            return chave;
        }
        catch
        {
            try { File.Delete(caminho); } catch { }
            throw;
        }
    }

    public Stream AbrirLeitura(string chave) => new FileStream(
        ObterCaminho(chave),
        FileMode.Open,
        FileAccess.Read,
        FileShare.Read | FileShare.Delete,
        128 * 1024,
        FileOptions.Asynchronous | FileOptions.SequentialScan);

    public void Excluir(string chave) => File.Delete(ObterCaminho(chave));

    private string ObterCaminho(string chave)
    {
        if (!Guid.TryParseExact(chave, "N", out _))
            throw new InvalidOperationException("Identificador interno de vídeo inválido.");
        return Path.Combine(_diretorio, $"{chave}.mp4");
    }
}
