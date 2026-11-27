using Microsoft.EntityFrameworkCore;
using TreinoAPI.Data;
using TreinoAPI.DTOs.Exercicio;
using TreinoAPI.Model;
using TreinoAPI.Security;

namespace TreinoAPI.Services;

public sealed class ExercicioCatalogoService
{
    public const long MaxUploadBytes = 100L * 1024 * 1024;

    private readonly AppDbContext _context;
    private readonly ExercicioVideoStorage _storage;

    public ExercicioCatalogoService(AppDbContext context, ExercicioVideoStorage storage)
    {
        _context = context;
        _storage = storage;
    }

    public async Task<List<ExercicioCatalogoDTO>> ListarAsync(string? consulta, int limite, CancellationToken cancellationToken)
    {
        var exercicios = await ConsultarCatalogoAsync(cancellationToken);
        var resultado = string.IsNullOrWhiteSpace(consulta)
            ? exercicios.OrderBy(exercicio => exercicio.Nome, StringComparer.CurrentCultureIgnoreCase)
            : exercicios
                .Select(exercicio => new { Exercicio = exercicio, Pontuacao = ExercicioCatalogoMatcher.Pontuar(consulta, exercicio) })
                .Where(item => item.Pontuacao > 0.12)
                .OrderByDescending(item => item.Pontuacao)
                .ThenBy(item => item.Exercicio.Nome, StringComparer.CurrentCultureIgnoreCase)
                .Select(item => item.Exercicio);

        return resultado.Take(Math.Clamp(limite, 1, 500)).Select(MapearDTO).ToList();
    }

    public async Task<string> ObterVersaoAsync(CancellationToken cancellationToken)
    {
        var ativos = _context.ExerciciosCatalogo.Where(exercicio => exercicio.Ativo);
        var quantidade = await ativos.CountAsync(cancellationToken);
        var atualizadoEm = await ativos.MaxAsync(exercicio => (DateTime?)exercicio.AtualizadoEmUtc, cancellationToken);
        return $"{quantidade}:{atualizadoEm?.Ticks ?? 0}";
    }

    public async Task<List<ExercicioBuscaDTO>> BuscarAsync(string consulta, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(consulta))
            return [];

        var exercicios = await ConsultarCatalogoAsync(cancellationToken);
        return exercicios
            .Select(exercicio => new
            {
                Exercicio = exercicio,
                Pontuacao = ExercicioCatalogoMatcher.Pontuar(consulta, exercicio)
            })
            .Where(item => item.Pontuacao >= 0.25)
            .OrderByDescending(item => item.Pontuacao)
            .ThenBy(item => item.Exercicio.Nome, StringComparer.CurrentCultureIgnoreCase)
            .Take(8)
            .Select(item => new ExercicioBuscaDTO
            {
                Id = item.Exercicio.Id,
                Nome = item.Exercicio.Nome,
                GrupoMuscular = item.Exercicio.GrupoMuscular,
                Equipamento = item.Exercicio.Equipamento,
                Dificuldade = item.Exercicio.Dificuldade,
                Descricao = item.Exercicio.Descricao,
                Instrucoes = item.Exercicio.Instrucoes,
                Sinonimos = item.Exercicio.Sinonimos.Select(sinonimo => sinonimo.Nome).ToList(),
                Videos = item.Exercicio.Videos.Select(MapearVideoDTO).ToList(),
                Pontuacao = Math.Round(item.Pontuacao, 3),
                TipoCorrespondencia = item.Pontuacao >= 0.999 ? "EXATA" : "APROXIMADA"
            })
            .ToList();
    }

    public async Task<ExercicioCatalogo?> ResolverAutomaticamenteAsync(string nome, CancellationToken cancellationToken)
    {
        var resolvidos = await ResolverEmLoteAsync([nome], cancellationToken);
        var normalizado = ExercicioCatalogoMatcher.Normalizar(nome);
        if (!resolvidos.TryGetValue(normalizado, out var exercicioId) || !exercicioId.HasValue)
            return null;

        return await _context.ExerciciosCatalogo
            .Include(exercicio => exercicio.Sinonimos)
            .Include(exercicio => exercicio.Videos.Where(video => video.Ativo))
            .FirstOrDefaultAsync(exercicio => exercicio.Id == exercicioId.Value && exercicio.Ativo, cancellationToken);
    }

    public async Task<Dictionary<string, Guid?>> ResolverEmLoteAsync(IEnumerable<string> nomes, CancellationToken cancellationToken)
    {
        var consultas = nomes
            .Select(nome => new { Nome = nome, Normalizado = ExercicioCatalogoMatcher.Normalizar(nome) })
            .Where(item => item.Normalizado.Length > 0)
            .GroupBy(item => item.Normalizado, StringComparer.Ordinal)
            .Select(grupo => grupo.First())
            .ToList();
        if (consultas.Count == 0)
            return [];

        var catalogo = await ConsultarCatalogoAsync(cancellationToken);
        var resultado = new Dictionary<string, Guid?>(StringComparer.Ordinal);
        foreach (var consulta in consultas)
        {
            var candidatos = catalogo
                .Select(exercicio => new { Exercicio = exercicio, Pontuacao = ExercicioCatalogoMatcher.Pontuar(consulta.Nome, exercicio) })
                .Where(item => item.Pontuacao >= 0.25)
                .OrderByDescending(item => item.Pontuacao)
                .Take(2)
                .ToList();

            if (candidatos.Count == 0)
            {
                resultado[consulta.Normalizado] = null;
                continue;
            }

            var primeiro = candidatos[0];
            var segundo = candidatos.Count > 1 ? candidatos[1].Pontuacao : 0;
            var exato = primeiro.Pontuacao >= 0.999;
            var ambiguo = (exato && segundo >= 0.999) ||
                (!exato && (primeiro.Pontuacao < 0.90 || primeiro.Pontuacao - segundo < 0.10));
            resultado[consulta.Normalizado] = ambiguo ? null : primeiro.Exercicio.Id;
        }

        return resultado;
    }

    public async Task<ExercicioCatalogoDTO?> ObterAsync(Guid id, CancellationToken cancellationToken)
    {
        var exercicio = await _context.ExerciciosCatalogo.AsNoTracking()
            .Include(item => item.Sinonimos)
            .Include(item => item.Videos.Where(video => video.Ativo))
            .FirstOrDefaultAsync(item => item.Id == id && item.Ativo, cancellationToken);
        return exercicio is null ? null : MapearDTO(exercicio);
    }

    public async Task<ExercicioCatalogoDTO> CriarAsync(SalvarExercicioCatalogoDTO dto, CancellationToken cancellationToken)
    {
        var nome = dto.Nome.Trim();
        var normalizado = ExercicioCatalogoMatcher.Normalizar(nome);
        if (normalizado.Length < 2)
            throw DomainException.BadRequest("Informe um nome de exercício válido.");
        if (await _context.ExerciciosCatalogo.AnyAsync(item => item.Ativo &&
            (item.NomeNormalizado == normalizado || item.Sinonimos.Any(sinonimo => sinonimo.NomeNormalizado == normalizado)), cancellationToken))
            throw DomainException.Conflict("Já existe um exercício com esse nome no catálogo.");
        await ValidarSinonimosAsync(null, dto.Sinonimos, cancellationToken);

        var exercicio = new ExercicioCatalogo
        {
            Nome = nome,
            NomeNormalizado = normalizado,
            GrupoMuscular = Limpar(dto.GrupoMuscular),
            Equipamento = Limpar(dto.Equipamento),
            Dificuldade = Limpar(dto.Dificuldade),
            Descricao = Limpar(dto.Descricao),
            Instrucoes = Limpar(dto.Instrucoes),
            FonteDados = "Equipe"
        };
        AtualizarSinonimos(exercicio, dto.Sinonimos);
        _context.ExerciciosCatalogo.Add(exercicio);
        await _context.SaveChangesAsync(cancellationToken);
        return MapearDTO(exercicio);
    }

    public async Task<ExercicioCatalogoDTO?> AtualizarAsync(Guid id, SalvarExercicioCatalogoDTO dto, CancellationToken cancellationToken)
    {
        var exercicio = await _context.ExerciciosCatalogo
            .Include(item => item.Sinonimos)
            .Include(item => item.Videos.Where(video => video.Ativo))
            .FirstOrDefaultAsync(item => item.Id == id && item.Ativo, cancellationToken);
        if (exercicio is null)
            return null;

        var nome = dto.Nome.Trim();
        var normalizado = ExercicioCatalogoMatcher.Normalizar(nome);
        if (normalizado.Length < 2)
            throw DomainException.BadRequest("Informe um nome de exercício válido.");
        if (await _context.ExerciciosCatalogo.AnyAsync(item => item.Id != id && item.Ativo &&
            (item.NomeNormalizado == normalizado || item.Sinonimos.Any(sinonimo => sinonimo.NomeNormalizado == normalizado)), cancellationToken))
            throw DomainException.Conflict("Já existe outro exercício com esse nome no catálogo.");
        await ValidarSinonimosAsync(id, dto.Sinonimos, cancellationToken);

        exercicio.Nome = nome;
        exercicio.NomeNormalizado = normalizado;
        exercicio.GrupoMuscular = Limpar(dto.GrupoMuscular);
        exercicio.Equipamento = Limpar(dto.Equipamento);
        exercicio.Dificuldade = Limpar(dto.Dificuldade);
        exercicio.Descricao = Limpar(dto.Descricao);
        exercicio.Instrucoes = Limpar(dto.Instrucoes);
        exercicio.AtualizadoEmUtc = DateTime.UtcNow;
        AtualizarSinonimos(exercicio, dto.Sinonimos);
        await _context.SaveChangesAsync(cancellationToken);
        return MapearDTO(exercicio);
    }

    public async Task<VideoExercicioDTO> AdicionarVideoAsync(Guid exercicioId, CriarVideoExercicioForm form, CancellationToken cancellationToken)
    {
        var exercicio = await _context.ExerciciosCatalogo
            .Include(item => item.Videos.Where(video => video.Ativo))
            .FirstOrDefaultAsync(item => item.Id == exercicioId && item.Ativo, cancellationToken)
            ?? throw DomainException.NotFound("Exercício não encontrado.");

        var arquivo = form.Arquivo ?? throw DomainException.BadRequest("Selecione um arquivo MP4.");
        if (!form.ConfirmouDireitos)
            throw DomainException.BadRequest("Confirme que você possui os direitos ou autorização para utilizar este vídeo.");
        if (!string.Equals(Path.GetExtension(arquivo.FileName), ".mp4", StringComparison.OrdinalIgnoreCase))
            throw DomainException.BadRequest("Envie um arquivo com extensão .mp4.");
        if (arquivo.Length is <= 0 or > MaxUploadBytes)
            throw DomainException.BadRequest("O vídeo deve ter até 100 MB.");
        if (form.Licenca == "LICENCIADO" && string.IsNullOrWhiteSpace(form.Fonte))
            throw DomainException.BadRequest("Informe a origem ou autorização do vídeo licenciado.");

        await using (var assinatura = arquivo.OpenReadStream())
        {
            var cabecalho = new byte[12];
            var lidos = await assinatura.ReadAsync(cabecalho, cancellationToken);
            if (lidos < 12 || !cabecalho.AsSpan(4, 4).SequenceEqual("ftyp"u8))
                throw DomainException.BadRequest("O arquivo enviado não parece ser um vídeo MP4 válido.");
        }

        var chave = await _storage.SalvarAsync(arquivo, cancellationToken);
        var video = new VideoExercicio
        {
            ExercicioCatalogoId = exercicioId,
            Titulo = string.IsNullOrWhiteSpace(form.Titulo) ? Path.GetFileNameWithoutExtension(arquivo.FileName) : form.Titulo.Trim(),
            ChaveArmazenamento = chave,
            TipoConteudo = "video/mp4",
            Origem = "UPLOAD",
            Licenca = form.Licenca,
            Fonte = Limpar(form.Fonte),
            DuracaoSegundos = form.DuracaoSegundos,
            Principal = !exercicio.Videos.Any(item => item.Principal)
        };

        _context.VideosExercicios.Add(video);
        exercicio.AtualizadoEmUtc = DateTime.UtcNow;
        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch
        {
            try { _storage.Excluir(chave); } catch { }
            throw;
        }

        return MapearVideoDTO(video);
    }

    public async Task<bool> DefinirVideoPrincipalAsync(Guid exercicioId, Guid videoId, CancellationToken cancellationToken)
    {
        var exercicio = await _context.ExerciciosCatalogo.FirstOrDefaultAsync(item => item.Id == exercicioId && item.Ativo, cancellationToken);
        if (exercicio is null)
            return false;
        var videos = await _context.VideosExercicios
            .Where(video => video.ExercicioCatalogoId == exercicioId && video.Ativo)
            .ToListAsync(cancellationToken);
        if (!videos.Any(video => video.Id == videoId))
            return false;

        foreach (var video in videos)
            video.Principal = video.Id == videoId;
        exercicio.AtualizadoEmUtc = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ExcluirVideoAsync(Guid exercicioId, Guid videoId, CancellationToken cancellationToken)
    {
        var video = await _context.VideosExercicios
            .FirstOrDefaultAsync(item => item.Id == videoId && item.ExercicioCatalogoId == exercicioId && item.Ativo, cancellationToken);
        if (video is null)
            return false;

        video.Ativo = false;
        video.Principal = false;
        var exercicio = await _context.ExerciciosCatalogo.FirstOrDefaultAsync(item => item.Id == exercicioId, cancellationToken);
        if (exercicio is not null)
            exercicio.AtualizadoEmUtc = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);
        if (!string.IsNullOrWhiteSpace(video.ChaveArmazenamento))
        {
            try { _storage.Excluir(video.ChaveArmazenamento); } catch { }
        }

        var outro = await _context.VideosExercicios
            .Where(item => item.ExercicioCatalogoId == exercicioId && item.Ativo)
            .OrderBy(item => item.CriadoEmUtc)
            .FirstOrDefaultAsync(cancellationToken);
        if (outro is not null)
        {
            outro.Principal = true;
            if (exercicio is not null)
                exercicio.AtualizadoEmUtc = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);
        }
        return true;
    }

    public async Task<VideoExercicio?> ObterVideoParaStreamAsync(Guid videoId, CancellationToken cancellationToken) =>
        await _context.VideosExercicios.AsNoTracking()
            .FirstOrDefaultAsync(video => video.Id == videoId && video.Ativo && video.ChaveArmazenamento != null, cancellationToken);

    public Stream AbrirVideo(string chave) => _storage.AbrirLeitura(chave);

    private async Task<List<ExercicioCatalogo>> ConsultarCatalogoAsync(CancellationToken cancellationToken) =>
        await _context.ExerciciosCatalogo.AsNoTracking()
            .Where(exercicio => exercicio.Ativo)
            .Include(exercicio => exercicio.Sinonimos)
            .Include(exercicio => exercicio.Videos.Where(video => video.Ativo))
            .ToListAsync(cancellationToken);

    private static void AtualizarSinonimos(ExercicioCatalogo exercicio, IEnumerable<string>? nomes)
    {
        var canonico = exercicio.NomeNormalizado;
        var novos = (nomes ?? [])
            .Select(nome => nome?.Trim() ?? string.Empty)
            .Where(nome => nome.Length is >= 2 and <= 160)
            .Where(nome => ExercicioCatalogoMatcher.Normalizar(nome).Length > 0)
            .Where(nome => ExercicioCatalogoMatcher.Normalizar(nome) != canonico)
            .GroupBy(ExercicioCatalogoMatcher.Normalizar)
            .Select(grupo => grupo.First())
            .ToList();

        var chaves = novos.Select(ExercicioCatalogoMatcher.Normalizar).ToHashSet(StringComparer.Ordinal);
        var removidos = exercicio.Sinonimos.Where(sinonimo => !chaves.Contains(sinonimo.NomeNormalizado)).ToList();
        foreach (var removido in removidos)
            exercicio.Sinonimos.Remove(removido);

        var existentes = exercicio.Sinonimos.Select(sinonimo => sinonimo.NomeNormalizado).ToHashSet(StringComparer.Ordinal);
        foreach (var nome in novos)
        {
            var normalizado = ExercicioCatalogoMatcher.Normalizar(nome);
            if (existentes.Add(normalizado))
                exercicio.Sinonimos.Add(new ExercicioSinonimo { Nome = nome, NomeNormalizado = normalizado, Origem = "MANUAL" });
        }
    }

    private async Task ValidarSinonimosAsync(Guid? exercicioId, IEnumerable<string>? nomes, CancellationToken cancellationToken)
    {
        var normalizados = (nomes ?? [])
            .Select(ExercicioCatalogoMatcher.Normalizar)
            .Where(nome => nome.Length > 0)
            .Distinct(StringComparer.Ordinal)
            .ToArray();
        if (normalizados.Length == 0)
            return;

        var conflito = await _context.ExerciciosCatalogo
            .Where(item => item.Ativo && (!exercicioId.HasValue || item.Id != exercicioId.Value))
            .AnyAsync(item => normalizados.Contains(item.NomeNormalizado) ||
                item.Sinonimos.Any(sinonimo => normalizados.Contains(sinonimo.NomeNormalizado)), cancellationToken);
        if (conflito)
            throw DomainException.Conflict("Um ou mais sinônimos já estão associados a outro exercício. Remova a duplicidade para evitar uma identificação ambígua.");
    }

    private static string? Limpar(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static ExercicioCatalogoDTO MapearDTO(ExercicioCatalogo exercicio) => new()
    {
        Id = exercicio.Id,
        Nome = exercicio.Nome,
        GrupoMuscular = exercicio.GrupoMuscular,
        Equipamento = exercicio.Equipamento,
        Dificuldade = exercicio.Dificuldade,
        Descricao = exercicio.Descricao,
        Instrucoes = exercicio.Instrucoes,
        Sinonimos = exercicio.Sinonimos.Select(sinonimo => sinonimo.Nome).OrderBy(nome => nome).ToList(),
        Videos = exercicio.Videos.Where(video => video.Ativo).OrderByDescending(video => video.Principal).ThenBy(video => video.Titulo).Select(MapearVideoDTO).ToList()
    };

    private static VideoExercicioDTO MapearVideoDTO(VideoExercicio video) => new()
    {
        Id = video.Id,
        Titulo = video.Titulo,
        Url = video.UrlExterna ?? $"/api/exercicios/catalogo/videos/{video.Id}/stream",
        Origem = video.Origem,
        Licenca = video.Licenca,
        Fonte = video.Fonte,
        DuracaoSegundos = video.DuracaoSegundos,
        Principal = video.Principal
    };
}
