using Microsoft.EntityFrameworkCore;
using TreinoAPI.Data;
using TreinoAPI.DTOs.Exercicio;
using TreinoAPI.Model;
using TreinoAPI.Security;

namespace TreinoAPI.Services;

public class TreinoExercicioService
{
    private readonly AppDbContext _context;
    private readonly ExercicioCatalogoService _catalogo;

    public TreinoExercicioService(AppDbContext context, ExercicioCatalogoService catalogo)
    {
        _context = context;
        _catalogo = catalogo;
    }

    public async Task<List<TreinoExercicioDTO>> ListarPorTreino(Guid treinoId)
    {
        var treinoExercicios = await _context.TreinosExercicios
            .Where(te => te.TreinoId == treinoId && te.Treino.Ativo)
            .Include(te => te.Variacoes)
            .Include(te => te.ExercicioCatalogo!)
                .ThenInclude(exercicio => exercicio.Videos.Where(video => video.Ativo))
            .OrderBy(te => te.Ordem)
            .ToListAsync();

        return treinoExercicios.Select(MapearDTO).ToList();
    }

    public async Task<TreinoExercicioDTO?> ObterPorId(Guid treinoId, Guid id)
    {
        var treinoExercicio = await _context.TreinosExercicios
            .Include(te => te.Variacoes)
            .Include(te => te.ExercicioCatalogo!)
                .ThenInclude(exercicio => exercicio.Videos.Where(video => video.Ativo))
            .FirstOrDefaultAsync(te => te.TreinoId == treinoId && te.Id == id && te.Treino.Ativo);

        if (treinoExercicio == null)
            return null;

        return MapearDTO(treinoExercicio);
    }

    public async Task<TreinoExercicioDTO> Criar(
        Guid treinoId,
        CriarTreinoExercicioDTO dto)
    {
        var treino = await _context.Treinos
            .FirstOrDefaultAsync(t => t.Id == treinoId && t.Ativo);

        if (treino == null)
            throw DomainException.NotFound("Treino não encontrado.");

        var catalogo = dto.ExercicioCatalogoId.HasValue
            ? await _context.ExerciciosCatalogo
                .Include(exercicio => exercicio.Sinonimos)
                .Include(exercicio => exercicio.Videos.Where(video => video.Ativo))
                .FirstOrDefaultAsync(exercicio => exercicio.Id == dto.ExercicioCatalogoId.Value && exercicio.Ativo)
            : await _catalogo.ResolverAutomaticamenteAsync(dto.Exercicio, CancellationToken.None);
        if (dto.ExercicioCatalogoId.HasValue && catalogo is null)
            throw DomainException.NotFound("O exercício selecionado não existe mais no catálogo.");

        var treinoExercicio = new TreinoExercicio
        {
            TreinoId = treinoId,
            ExercicioCatalogoId = catalogo?.Id,
            ExercicioCatalogo = catalogo,
            Exercicio = dto.Exercicio,
            Ordem = dto.Ordem,
            Series = dto.Series,
            Repeticoes = dto.Repeticoes,
            Intervalo = dto.Intervalo,
            Carga = dto.Carga,
            RiRMAX = dto.RirMax,
            Observacoes = dto.Observacoes,
            Variacoes = (dto.Variacoes ?? new List<TreinoExercicioVariacaoInputDTO>())
                .Select((variacao, indice) => MapearVariacao(variacao, indice))
                .ToList()
        };

        _context.TreinosExercicios.Add(treinoExercicio);

        await _context.SaveChangesAsync();

        return MapearDTO(treinoExercicio);
    }

    public async Task<TreinoExercicioDTO?> Atualizar(
        Guid treinoId,
        Guid id,
        AtualizarTreinoExercicioDTO dto)
    {
        var treinoExercicio = await _context.TreinosExercicios
            .Include(te => te.Variacoes)
            .FirstOrDefaultAsync(te => te.TreinoId == treinoId && te.Id == id && te.Treino.Ativo);

        if (treinoExercicio == null)
            return null;

        treinoExercicio.Exercicio = dto.Exercicio;
        var catalogo = dto.ExercicioCatalogoId.HasValue
            ? await _context.ExerciciosCatalogo
                .Include(exercicio => exercicio.Sinonimos)
                .Include(exercicio => exercicio.Videos.Where(video => video.Ativo))
                .FirstOrDefaultAsync(exercicio => exercicio.Id == dto.ExercicioCatalogoId.Value && exercicio.Ativo)
            : await _catalogo.ResolverAutomaticamenteAsync(dto.Exercicio, CancellationToken.None);
        if (dto.ExercicioCatalogoId.HasValue && catalogo is null)
            throw DomainException.NotFound("O exercício selecionado não existe mais no catálogo.");
        treinoExercicio.ExercicioCatalogoId = catalogo?.Id;
        treinoExercicio.ExercicioCatalogo = catalogo;
        treinoExercicio.Ordem = dto.Ordem;
        treinoExercicio.Series = dto.Series;
        treinoExercicio.Repeticoes = dto.Repeticoes;
        treinoExercicio.Intervalo = dto.Intervalo;
        treinoExercicio.Carga = dto.Carga;
        treinoExercicio.RiRMAX = dto.RirMax;
        treinoExercicio.Observacoes = dto.Observacoes;

        if (dto.Variacoes is not null)
        {
            var idsRecebidos = dto.Variacoes
                .Where(v => v.Id.HasValue)
                .Select(v => v.Id!.Value)
                .ToHashSet();

            var removidas = treinoExercicio.Variacoes
                .Where(v => !idsRecebidos.Contains(v.Id))
                .ToList();

            _context.TreinoExercicioVariacoes.RemoveRange(removidas);
            foreach (var removida in removidas)
                treinoExercicio.Variacoes.Remove(removida);

            for (var indice = 0; indice < dto.Variacoes.Count; indice++)
            {
                var variacaoDto = dto.Variacoes[indice];
                var variacaoExistente = variacaoDto.Id.HasValue
                    ? treinoExercicio.Variacoes.FirstOrDefault(v => v.Id == variacaoDto.Id.Value)
                    : null;

                if (variacaoExistente is null)
                {
                    treinoExercicio.Variacoes.Add(MapearVariacao(variacaoDto, indice));
                    continue;
                }

                AtualizarVariacao(variacaoExistente, variacaoDto, indice);
            }
        }

        await _context.SaveChangesAsync();

        return MapearDTO(treinoExercicio);
    }

    public async Task<bool> Deletar(Guid treinoId, Guid id)
    {
        var treinoExercicio = await _context.TreinosExercicios
            .FirstOrDefaultAsync(te => te.TreinoId == treinoId && te.Id == id && te.Treino.Ativo);

        if (treinoExercicio == null)
            return false;

        _context.TreinosExercicios.Remove(treinoExercicio);
        await _context.SaveChangesAsync();

        return true;
    }

    private static TreinoExercicioDTO MapearDTO(TreinoExercicio exercicio)
    {
        return new TreinoExercicioDTO
        {
            Id = exercicio.Id,
            TreinoId = exercicio.TreinoId,
            Exercicio = exercicio.Exercicio,
            ExercicioCatalogoId = exercicio.ExercicioCatalogoId,
            VideoUrl = ObterVideoUrl(exercicio.ExercicioCatalogo),
            VideoTitulo = exercicio.ExercicioCatalogo?.Videos
                .Where(video => video.Ativo)
                .OrderByDescending(video => video.Principal)
                .Select(video => video.Titulo)
                .FirstOrDefault(),
            Ordem = exercicio.Ordem,
            Series = exercicio.Series,
            Repeticoes = exercicio.Repeticoes,
            Intervalo = exercicio.Intervalo,
            Carga = exercicio.Carga,
            RirMax = exercicio.RiRMAX,
            Observacoes = exercicio.Observacoes,
            Variacoes = exercicio.Variacoes
                .OrderBy(v => v.Ordem)
                .Select(v => new TreinoExercicioVariacaoDTO
                {
                    Id = v.Id,
                    Exercicio = v.Exercicio,
                    Ordem = v.Ordem,
                    Series = v.Series,
                    Repeticoes = v.Repeticoes,
                    Intervalo = v.Intervalo,
                    Carga = v.Carga,
                    RirMax = v.RiRMAX,
                    Observacoes = v.Observacoes
                })
                .ToList()
        };
    }

    private static string? ObterVideoUrl(ExercicioCatalogo? exercicio)
    {
        var video = exercicio?.Videos
            .Where(item => item.Ativo)
            .OrderByDescending(item => item.Principal)
            .ThenBy(item => item.Titulo)
            .FirstOrDefault();
        return video is null
            ? null
            : video.UrlExterna ?? $"/api/exercicios/catalogo/videos/{video.Id}/stream";
    }

    private static TreinoExercicioVariacao MapearVariacao(
        TreinoExercicioVariacaoInputDTO dto,
        int indice)
    {
        return new TreinoExercicioVariacao
        {
            Exercicio = dto.Exercicio,
            Ordem = dto.Ordem ?? indice,
            Series = dto.Series,
            Repeticoes = dto.Repeticoes,
            Intervalo = dto.Intervalo,
            Carga = dto.Carga,
            RiRMAX = dto.RirMax,
            Observacoes = dto.Observacoes
        };
    }

    private static void AtualizarVariacao(
        TreinoExercicioVariacao variacao,
        TreinoExercicioVariacaoInputDTO dto,
        int indice)
    {
        variacao.Exercicio = dto.Exercicio;
        variacao.Ordem = dto.Ordem ?? indice;
        variacao.Series = dto.Series;
        variacao.Repeticoes = dto.Repeticoes;
        variacao.Intervalo = dto.Intervalo;
        variacao.Carga = dto.Carga;
        variacao.RiRMAX = dto.RirMax;
        variacao.Observacoes = dto.Observacoes;
    }
}
