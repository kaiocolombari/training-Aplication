using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using TreinoAPI.Data;
using TreinoAPI.DTOs.ArquivoEquipe;
using TreinoAPI.Model;
using TreinoAPI.Security;

namespace TreinoAPI.Services;

public sealed class ArquivoEquipeService
{
    public const long MaxUploadBytes = 50L * 1024 * 1024;
    public const long MaxRequestBytes = 55L * 1024 * 1024;
    public const long MaxFileBytes = 25L * 1024 * 1024;
    public const int MaxFilesPerRequest = 20;
    public const int MaxFilesPerPost = 100;

    private readonly AppDbContext _db;
    private readonly CurrentUserService _current;
    private readonly ArquivoEquipeStorage _storage;

    public ArquivoEquipeService(AppDbContext db, CurrentUserService current, ArquivoEquipeStorage storage)
    {
        _db = db;
        _current = current;
        _storage = storage;
    }

    public async Task<List<ArquivoEquipeDTO>> ListarAsync(CancellationToken cancellationToken = default)
    {
        var agora = DateTime.UtcNow;
        return await _db.ArquivosEquipe
            .AsNoTracking()
            .Where(item => item.ExpiraEm > agora)
            .OrderBy(item => item.ExpiraEm)
            .Select(item => new ArquivoEquipeDTO
            {
                Id = item.Id,
                Nome = item.Nome,
                Descricao = item.Descricao,
                PrazoRetencao = item.PrazoRetencao,
                CriadoPorNome = item.CriadoPorUsuario.Personal != null
                    ? item.CriadoPorUsuario.Personal.Nome
                    : item.CriadoPorUsuario.Email,
                CriadoEm = item.CriadoEm,
                ExpiraEm = item.ExpiraEm,
                AvisoExpiracaoEnviadoEm = item.AvisoExpiracaoEnviadoEm,
                Arquivos = item.Arquivos
                    .OrderBy(arquivo => arquivo.EnviadoEm)
                    .Select(arquivo => new ArquivoEquipeAnexoDTO
                    {
                        Id = arquivo.Id,
                        NomeOriginal = arquivo.NomeOriginal,
                        TamanhoBytes = arquivo.TamanhoBytes,
                        EnviadoEm = arquivo.EnviadoEm
                    })
                    .ToList()
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<Guid> CriarAsync(CriarArquivoEquipeForm form, CancellationToken cancellationToken = default)
    {
        ExigirAdministrador();
        var nome = ValidarNomePublicacao(form.Nome);
        var descricao = ValidarDescricao(form.Descricao);
        var prazo = NormalizarPrazo(form.PrazoRetencao);
        var arquivos = ValidarArquivos(form.Arquivos, 0, exigirArquivo: true);
        var agora = DateTime.UtcNow;
        var chavesSalvas = new List<string>();

        try
        {
            var entidade = new ArquivoEquipe
            {
                Id = Guid.NewGuid(),
                Nome = nome,
                Descricao = descricao,
                PrazoRetencao = prazo,
                CriadoPorUsuarioId = _current.UsuarioId,
                CriadoEm = agora,
                ExpiraEm = CalcularExpiracao(prazo, agora)
            };

            var anexos = await SalvarAnexosAsync(entidade.Id, arquivos, agora, chavesSalvas, cancellationToken);
            foreach (var anexo in anexos)
                entidade.Arquivos.Add(anexo);

            _db.ArquivosEquipe.Add(entidade);
            await _db.SaveChangesAsync(cancellationToken);
            return entidade.Id;
        }
        catch
        {
            ExcluirArquivosSalvos(chavesSalvas);
            throw;
        }
    }

    public async Task AtualizarAsync(Guid id, AtualizarArquivoEquipeForm form, CancellationToken cancellationToken = default)
    {
        ExigirAdministrador();
        var nome = ValidarNomePublicacao(form.Nome);
        var descricao = ValidarDescricao(form.Descricao);
        var entidade = await _db.ArquivosEquipe
            .Include(item => item.Arquivos)
            .FirstOrDefaultAsync(item => item.Id == id && item.ExpiraEm > DateTime.UtcNow, cancellationToken);

        if (entidade is null)
            throw DomainException.NotFound("Publicação não encontrada ou já expirada.");

        var arquivos = ValidarArquivos(form.Arquivos, entidade.Arquivos.Count, exigirArquivo: false);
        var chavesSalvas = new List<string>();

        try
        {
            var agora = DateTime.UtcNow;
            var novosAnexos = await SalvarAnexosAsync(entidade.Id, arquivos, agora, chavesSalvas, cancellationToken);
            entidade.Nome = nome;
            entidade.Descricao = descricao;
            foreach (var anexo in novosAnexos)
                entidade.Arquivos.Add(anexo);

            await _db.SaveChangesAsync(cancellationToken);
        }
        catch
        {
            ExcluirArquivosSalvos(chavesSalvas);
            throw;
        }
    }

    public async Task ExcluirAsync(Guid id, CancellationToken cancellationToken = default)
    {
        ExigirAdministrador();
        var entidade = await _db.ArquivosEquipe
            .Include(item => item.Arquivos)
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);

        if (entidade is null)
            throw DomainException.NotFound("Publicação não encontrada.");

        foreach (var anexo in entidade.Arquivos)
            _storage.Excluir(anexo.NomeArmazenado);

        _db.ArquivosEquipe.Remove(entidade);
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task<ArquivoEquipeDownload> AbrirArquivoAsync(Guid publicacaoId, Guid arquivoId, CancellationToken cancellationToken = default)
    {
        var agora = DateTime.UtcNow;
        var arquivo = await _db.ArquivosEquipeAnexos
            .AsNoTracking()
            .Where(item => item.Id == arquivoId &&
                item.ArquivoEquipeId == publicacaoId &&
                item.ArquivoEquipe.ExpiraEm > agora)
            .Select(item => new { item.NomeOriginal, item.NomeArmazenado })
            .FirstOrDefaultAsync(cancellationToken);

        if (arquivo is null)
            throw DomainException.NotFound("Arquivo não encontrado ou já expirado.");

        try
        {
            return new ArquivoEquipeDownload(_storage.AbrirLeitura(arquivo.NomeArmazenado), arquivo.NomeOriginal);
        }
        catch (FileNotFoundException)
        {
            throw DomainException.NotFound("O arquivo não está mais disponível no armazenamento.");
        }
    }

    private void ExigirAdministrador()
    {
        if (_current.Role != "ADMIN")
            throw DomainException.Forbidden("Somente administradores podem publicar, editar ou excluir arquivos da equipe.");
    }

    private static string ValidarNomePublicacao(string? valor)
    {
        var nome = valor?.Trim() ?? string.Empty;
        if (nome.Length is < 2 or > 120)
            throw DomainException.BadRequest("O nome da publicação deve ter entre 2 e 120 caracteres.");
        return nome;
    }

    private static string ValidarDescricao(string? valor)
    {
        var descricao = valor?.Trim() ?? string.Empty;
        if (descricao.Length > 2000)
            throw DomainException.BadRequest("A descrição deve ter no máximo 2.000 caracteres.");
        return descricao;
    }

    private static string NormalizarPrazo(string? valor)
    {
        var prazo = valor?.Trim().ToUpperInvariant();
        return prazo is "24H" or "7D" or "1M" or "6M" or "1A"
            ? prazo
            : throw DomainException.BadRequest("Prazo de retenção inválido.");
    }

    private static DateTime CalcularExpiracao(string prazo, DateTime agora) => prazo switch
    {
        "24H" => agora.AddHours(24),
        "7D" => agora.AddDays(7),
        "1M" => agora.AddMonths(1),
        "6M" => agora.AddMonths(6),
        "1A" => agora.AddYears(1),
        _ => throw DomainException.BadRequest("Prazo de retenção inválido.")
    };

    private static List<IFormFile> ValidarArquivos(List<IFormFile>? recebidos, int arquivosExistentes, bool exigirArquivo)
    {
        var arquivos = recebidos ?? [];
        if (exigirArquivo && arquivos.Count == 0)
            throw DomainException.BadRequest("Selecione pelo menos um arquivo para publicar.");
        if (arquivos.Count > MaxFilesPerRequest)
            throw DomainException.BadRequest($"Envie no máximo {MaxFilesPerRequest} arquivos por vez.");
        if (arquivosExistentes + arquivos.Count > MaxFilesPerPost)
            throw DomainException.BadRequest($"Uma publicação pode conter no máximo {MaxFilesPerPost} arquivos.");
        if (arquivos.Any(arquivo => arquivo.Length <= 0))
            throw DomainException.BadRequest("Arquivos vazios não podem ser enviados.");
        if (arquivos.Any(arquivo => arquivo.Length > MaxFileBytes))
            throw DomainException.BadRequest("Cada arquivo pode ter no máximo 25 MB.");
        if (arquivos.Sum(arquivo => arquivo.Length) > MaxUploadBytes)
            throw DomainException.BadRequest("O envio pode somar no máximo 50 MB por vez.");
        if (arquivos.Any(arquivo => string.IsNullOrWhiteSpace(NormalizarNomeArquivo(arquivo.FileName))))
            throw DomainException.BadRequest("Um dos arquivos possui nome inválido.");

        return arquivos;
    }

    private async Task<List<ArquivoEquipeAnexo>> SalvarAnexosAsync(
        Guid publicacaoId,
        List<IFormFile> arquivos,
        DateTime agora,
        List<string> chavesSalvas,
        CancellationToken cancellationToken)
    {
        var anexos = new List<ArquivoEquipeAnexo>(arquivos.Count);
        foreach (var arquivo in arquivos)
        {
            var chave = await _storage.SalvarAsync(arquivo, cancellationToken);
            chavesSalvas.Add(chave);
            anexos.Add(new ArquivoEquipeAnexo
            {
                Id = Guid.NewGuid(),
                ArquivoEquipeId = publicacaoId,
                NomeOriginal = NormalizarNomeArquivo(arquivo.FileName),
                NomeArmazenado = chave,
                TipoConteudo = "application/octet-stream",
                TamanhoBytes = arquivo.Length,
                EnviadoEm = agora
            });
        }

        return anexos;
    }

    private static string NormalizarNomeArquivo(string? nome)
    {
        var nomeSeguro = Path.GetFileName((nome ?? string.Empty).Replace('\\', '/'));
        nomeSeguro = new string(nomeSeguro.Where(caractere => !char.IsControl(caractere)).ToArray()).Trim();
        if (nomeSeguro is "." or "..")
            return string.Empty;
        return nomeSeguro.Length > 255 ? nomeSeguro[..255] : nomeSeguro;
    }

    private void ExcluirArquivosSalvos(IEnumerable<string> chaves)
    {
        foreach (var chave in chaves)
        {
            try
            {
                _storage.Excluir(chave);
            }
            catch
            {
                // O worker de retenção também tenta remover anexos órfãos após a expiração.
            }
        }
    }
}

public sealed record ArquivoEquipeDownload(Stream Conteudo, string NomeOriginal);
