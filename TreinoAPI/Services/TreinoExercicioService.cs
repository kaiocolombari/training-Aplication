using Microsoft.EntityFrameworkCore;
using TreinoAPI.Data;
using TreinoAPI.DTOs.Exercicio;
using TreinoAPI.Model;

namespace TreinoAPI.Services;

public class TreinoExercicioService
{
    private readonly AppDbContext _context;

    public TreinoExercicioService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<TreinoExercicioDTO>> ListarPorTreino(Guid treinoId)
    {
        var treinoExercicios = await _context.TreinosExercicios
            .Where(te => te.TreinoId == treinoId)
            .Include(te => te.Variacoes)
            .OrderBy(te => te.Ordem)
            .ToListAsync();

        return treinoExercicios.Select(MapearDTO).ToList();
    }

    public async Task<TreinoExercicioDTO?> ObterPorId(Guid treinoId, Guid id)
    {
        var treinoExercicio = await _context.TreinosExercicios
            .Include(te => te.Variacoes)
            .FirstOrDefaultAsync(te => te.TreinoId == treinoId && te.Id == id);

        if (treinoExercicio == null)
            return null;

        return MapearDTO(treinoExercicio);
    }

    public async Task<TreinoExercicioDTO> Criar(
        Guid treinoId,
        CriarTreinoExercicioDTO dto)
    {
        var treino = await _context.Treinos
            .FirstOrDefaultAsync(t => t.Id == treinoId);

        if (treino == null)
            throw new Exception("Treino não encontrado");

        var treinoExercicio = new TreinoExercicio
        {
            TreinoId = treinoId,
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
            .FirstOrDefaultAsync(te => te.TreinoId == treinoId && te.Id == id);

        if (treinoExercicio == null)
            return null;

        treinoExercicio.Exercicio = dto.Exercicio;
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
            .FirstOrDefaultAsync(te => te.TreinoId == treinoId && te.Id == id);

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
