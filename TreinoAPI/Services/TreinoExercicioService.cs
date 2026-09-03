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
            .ToListAsync();

        return treinoExercicios.Select(te => new TreinoExercicioDTO
        {
            Id = te.Id,
            TreinoId = te.TreinoId,
            Exercicio = te.Exercicio,
            Ordem = te.Ordem ?? 0,
            Series = te.Series ?? 0,
            Repeticoes = te.Repeticoes ?? 0,
            Intervalo = te.Intervalo ?? 0,
            Carga = te.Carga ?? 0,
            RiRMAX = te.RiRMAX ?? 0,
            Observacoes = te.Observacoes ?? string.Empty
        }).ToList();
    }

    public async Task<TreinoExercicioDTO> ObterPorId(Guid treinoId)
    {
        var treinoExercicio = await _context.TreinosExercicios
            .FirstOrDefaultAsync(te => te.TreinoId == treinoId);

        if (treinoExercicio == null)
            throw new Exception("Treino Exercicio não encontrado");

        return new TreinoExercicioDTO
        {
            Id = treinoExercicio.Id,
            TreinoId = treinoExercicio.TreinoId,
            Exercicio = treinoExercicio.Exercicio,
            Ordem = treinoExercicio.Ordem ?? 0,
            Series = treinoExercicio.Series ?? 0,
            Repeticoes = treinoExercicio.Repeticoes ?? 0,
            Intervalo = treinoExercicio.Intervalo ?? 0,
            Carga = treinoExercicio.Carga ?? 0,
            RiRMAX = treinoExercicio.RiRMAX ?? 0,
            Observacoes = treinoExercicio.Observacoes ?? string.Empty
        };
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
            RiRMAX = dto.RiRMAX,
            Observacoes = dto.Observacoes
        };

        _context.TreinosExercicios.Add(treinoExercicio);

        await _context.SaveChangesAsync();

        return new TreinoExercicioDTO
        {
            Id = treinoExercicio.Id,
            TreinoId = treinoExercicio.TreinoId,
            Exercicio = treinoExercicio.Exercicio,
            Ordem = treinoExercicio.Ordem,
            Series = treinoExercicio.Series ?? 0,
            Repeticoes = treinoExercicio.Repeticoes ?? 0,
            Intervalo = treinoExercicio.Intervalo ?? 0,
            Carga = treinoExercicio.Carga ?? 0,
            RiRMAX = treinoExercicio.RiRMAX ?? 0,
            Observacoes = treinoExercicio.Observacoes ?? string.Empty
        };
    }

    public async Task<TreinoExercicioDTO> Atualizar(
        Guid treinoId,
        AtualizarTreinoExercicioDTO dto)
    {
        var treinoExercicio = await _context.TreinosExercicios
            .FirstOrDefaultAsync(te => te.TreinoId == treinoId);

        if (treinoExercicio == null)
            throw new Exception("Treino Exercicio não encontrado");

        treinoExercicio.Exercicio = dto.Exercicio;
        treinoExercicio.Ordem = dto.Ordem;
        treinoExercicio.Series = dto.Series;
        treinoExercicio.Repeticoes = dto.Repeticoes;
        treinoExercicio.Intervalo = dto.Intervalo;
        treinoExercicio.Carga = dto.Carga;
        treinoExercicio.RiRMAX = dto.RiRMAX;
        treinoExercicio.Observacoes = dto.Observacoes;

        await _context.SaveChangesAsync();

        return new TreinoExercicioDTO
        {
            Id = treinoExercicio.Id,
            TreinoId = treinoExercicio.TreinoId,
            Exercicio = treinoExercicio.Exercicio,
            Ordem = treinoExercicio.Ordem ?? 0,
            Series = treinoExercicio.Series ?? 0,
            Repeticoes = treinoExercicio.Repeticoes ?? 0,
            Intervalo = treinoExercicio.Intervalo ?? 0,
            Carga = treinoExercicio.Carga ?? 0,
            RiRMAX = treinoExercicio.RiRMAX ?? 0,
            Observacoes = treinoExercicio.Observacoes ?? string.Empty
        };
    }

    public async Task<bool> Deletar(Guid treinoId)
    {
        var treinoExercicio = await _context.TreinosExercicios
            .FirstOrDefaultAsync(te => te.TreinoId == treinoId);

        if (treinoExercicio == null)
            throw new Exception("Treino Exercicio não encontrado");

        _context.TreinosExercicios.Remove(treinoExercicio);
        await _context.SaveChangesAsync();

        return true;
    }
}