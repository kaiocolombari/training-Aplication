using Microsoft.EntityFrameworkCore;
using TreinoAPI.Data;
using TreinoAPI.DTOs.Periodizacao;
using TreinoAPI.Model;

namespace TreinoAPI.Services;

public class PeriodizacaoSemanaService
{
    private readonly AppDbContext _context;

    public PeriodizacaoSemanaService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PeriodizacaoSemanaDTO> Criar(
        Guid periodizacaoId,
        PeriodizacaoSemanaDTO dto)
    {
        var periodizacao = await _context.Periodizacoes
            .FirstOrDefaultAsync(p => p.Id == periodizacaoId);

        if (periodizacao == null)
            throw new Exception("Periodização não encontrada");

        var semana = new PeriodizacaoSemana
        {
            PeriodizacaoId = periodizacaoId,
            Numero = dto.Numero
        };

        _context.PeriodizacaoSemanas.Add(semana);

        await _context.SaveChangesAsync();

        return new PeriodizacaoSemanaDTO
        {
            Id = semana.Id,
            PeriodizacaoId = semana.PeriodizacaoId,
            Numero = semana.Numero
        };
    }

    public async Task<List<PeriodizacaoSemanaDTO>> ListarPorPeriodizacao(
        Guid periodizacaoId)
    {
        return await _context.PeriodizacaoSemanas
            .Where(s => s.PeriodizacaoId == periodizacaoId)
            .OrderBy(s => s.Numero)
            .Select(s => new PeriodizacaoSemanaDTO
            {
                Id = s.Id,
                PeriodizacaoId = s.PeriodizacaoId,
                Numero = s.Numero
            })
            .ToListAsync();
    }

    public async Task<PeriodizacaoSemanaDTO?> ObterPorId(Guid id)
    {
        return await _context.PeriodizacaoSemanas
            .Where(s => s.Id == id)
            .Select(s => new PeriodizacaoSemanaDTO
            {
                Id = s.Id,
                PeriodizacaoId = s.PeriodizacaoId,
                Numero = s.Numero
            })
            .FirstOrDefaultAsync();
    }

    public async Task<PeriodizacaoSemanaDTO?> Atualizar(
        Guid id,
        PeriodizacaoSemanaDTO dto)
    {
        var semana = await _context.PeriodizacaoSemanas
            .FirstOrDefaultAsync(s => s.Id == id);

        if (semana == null)
            return null;

        semana.Numero = dto.Numero;

        await _context.SaveChangesAsync();

        return new PeriodizacaoSemanaDTO
        {
            Id = semana.Id,
            PeriodizacaoId = semana.PeriodizacaoId,
            Numero = semana.Numero
        };
    }

    public async Task<bool> Deletar(Guid id)
    {
        var semana = await _context.PeriodizacaoSemanas
            .FirstOrDefaultAsync(s => s.Id == id);

        if (semana == null)
            return false;

        _context.PeriodizacaoSemanas.Remove(semana);

        await _context.SaveChangesAsync();

        return true;
    }
}