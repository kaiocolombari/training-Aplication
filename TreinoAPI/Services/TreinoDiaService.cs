using Microsoft.EntityFrameworkCore;
using TreinoAPI.Data;
using TreinoAPI.DTOs.TreinoDia;
using TreinoAPI.Model;

namespace TreinoAPI.Services;

public class TreinoDiaService
{
    private readonly AppDbContext _context;

    public TreinoDiaService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<TreinoDiaDTO> Criar(
        Guid diaId,
        CriarTreinoDiaDTO dto)
    {
        var dia = await _context.PeriodizacaoDias
            .FirstOrDefaultAsync(d => d.Id == diaId);

        if (dia == null)
            throw new Exception("Dia não encontrado");

        var treino = await _context.Treinos
            .FirstOrDefaultAsync(t => t.Id == dto.TreinoId);

        if (treino == null)
            throw new Exception("Treino não encontrado");

        var treinoDia = new DiaTreino
        {
            DiaId = diaId,
            TreinoId = dto.TreinoId,
            Ordem = dto.Ordem
        };

        _context.DiaTreinos.Add(treinoDia);

        await _context.SaveChangesAsync();

        return new TreinoDiaDTO
        {
            Id = treinoDia.Id,
            DiaId = treinoDia.DiaId,
            TreinoId = treinoDia.TreinoId,
            Ordem = treinoDia.Ordem
        };
    }

    public async Task<List<TreinoDiaDTO>> ListarPorDia(Guid diaId)
    {
        return await _context.DiaTreinos
            .Where(td => td.DiaId == diaId)
            .OrderBy(td => td.Ordem)
            .Select(td => new TreinoDiaDTO
            {
                Id = td.Id,
                DiaId = td.DiaId,
                TreinoId = td.TreinoId,
                Ordem = td.Ordem
            })
            .ToListAsync();
    }

    public async Task<TreinoDiaDTO?> ObterPorId(Guid id)
    {
        return await _context.DiaTreinos
            .Where(td => td.Id == id)
            .Select(td => new TreinoDiaDTO
            {
                Id = td.Id,
                DiaId = td.DiaId,
                TreinoId = td.TreinoId,
                Ordem = td.Ordem
            })
            .FirstOrDefaultAsync();
    }

    public async Task<TreinoDiaDTO?> Atualizar(
        Guid id,
        AtualizarTreinoDiaDTO dto)
    {
        var treinoDia = await _context.DiaTreinos
            .FirstOrDefaultAsync(td => td.Id == id);

        if (treinoDia == null)
            return null;

        var treino = await _context.Treinos
            .FirstOrDefaultAsync(t => t.Id == dto.TreinoId);

        if (treino == null)
            throw new Exception("Treino não encontrado");

        treinoDia.TreinoId = dto.TreinoId;
        treinoDia.Ordem = dto.Ordem;

        await _context.SaveChangesAsync();

        return new TreinoDiaDTO
        {
            Id = treinoDia.Id,
            DiaId = treinoDia.DiaId,
            TreinoId = treinoDia.TreinoId,
            Ordem = treinoDia.Ordem
        };
    }

    public async Task<bool> Deletar(Guid id)
    {
        var treinoDia = await _context.DiaTreinos
            .FirstOrDefaultAsync(td => td.Id == id);

        if (treinoDia == null)
            return false;

        _context.DiaTreinos.Remove(treinoDia);

        await _context.SaveChangesAsync();

        return true;
    }
}