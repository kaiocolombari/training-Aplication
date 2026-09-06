using Microsoft.EntityFrameworkCore;
using TreinoAPI.Data;
using TreinoAPI.DTOs.Periodizacao;
using TreinoAPI.Model;

namespace TreinoAPI.Services;

public class PeriodizacaoDiaService
{
    private readonly AppDbContext _context;

    public PeriodizacaoDiaService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PeriodizacaoDiaDTO> Criar(
        Guid semanaId,
        PeriodizacaoDiaDTO dto)
    {
        var semana = await _context.PeriodizacaoSemanas
            .FirstOrDefaultAsync(s => s.Id == semanaId);

        if (semana == null)
            throw new Exception("Semana não encontrada");

        var dia = new PeriodizacaoDia
        {
            SemanaId = semanaId,
            Data = dto.Data,
            DiaSemana = dto.DiaSemana
        };

        _context.PeriodizacaoDias.Add(dia);

        await _context.SaveChangesAsync();

        return new PeriodizacaoDiaDTO
        {
            Id = dia.Id,
            SemanaId = dia.SemanaId,
            Data = dia.Data,
            DiaSemana = dia.DiaSemana
        };
    }

    public async Task<List<PeriodizacaoDiaDTO>> ListarPorSemana(
        Guid semanaId)
    {
        return await _context.PeriodizacaoDias
            .Where(d => d.SemanaId == semanaId)
            .OrderBy(d => d.Data)
            .Select(d => new PeriodizacaoDiaDTO
            {
                Id = d.Id,
                SemanaId = d.SemanaId,
                Data = d.Data,
                DiaSemana = d.DiaSemana
            })
            .ToListAsync();
    }

    public async Task<PeriodizacaoDiaDTO?> ObterPorId(Guid id)
    {
        return await _context.PeriodizacaoDias
            .Where(d => d.Id == id)
            .Select(d => new PeriodizacaoDiaDTO
            {
                Id = d.Id,
                SemanaId = d.SemanaId,
                Data = d.Data,
                DiaSemana = d.DiaSemana
            })
            .FirstOrDefaultAsync();
    }

    public async Task<PeriodizacaoDiaDTO?> Atualizar(
        Guid id,
        PeriodizacaoDiaDTO dto)
    {
        var dia = await _context.PeriodizacaoDias
            .FirstOrDefaultAsync(d => d.Id == id);

        if (dia == null)
            return null;

        dia.Data = dto.Data;
        dia.DiaSemana = dto.DiaSemana;

        await _context.SaveChangesAsync();

        return new PeriodizacaoDiaDTO
        {
            Id = dia.Id,
            SemanaId = dia.SemanaId,
            Data = dia.Data,
            DiaSemana = dia.DiaSemana
        };
    }

    public async Task<bool> Deletar(Guid id)
    {
        var dia = await _context.PeriodizacaoDias
            .FirstOrDefaultAsync(d => d.Id == id);

        if (dia == null)
            return false;

        _context.PeriodizacaoDias.Remove(dia);

        await _context.SaveChangesAsync();

        return true;
    }
}