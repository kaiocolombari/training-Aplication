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
}