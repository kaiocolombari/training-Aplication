using Microsoft.EntityFrameworkCore;
using TreinoAPI.Data;
using TreinoAPI.DTOs.VolumeSemanal;
using TreinoAPI.Model;

namespace TreinoAPI.Services;

public class VolumeSemanalService
{
    private readonly AppDbContext _context;

    public VolumeSemanalService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<VolumeSemanalDTO> Criar(
        Guid semanaId,
        CriarVolumeSemanalDTO dto)
    {
        var semana = await _context.PeriodizacaoSemanas
            .FirstOrDefaultAsync(s => s.Id == semanaId);

        if (semana == null)
            throw new Exception("Semana não encontrada");

        var grupo = await _context.GruposMusculares
            .FirstOrDefaultAsync(g => g.Id == dto.GrupoMuscularId);

        if (grupo == null)
            throw new Exception("Grupo muscular não encontrado");

        var volumeExistente = await _context.VolumesSemanais
            .FirstOrDefaultAsync(v =>
                v.PeriodizacaoSemanaId == semanaId &&
                v.GrupoMuscularId == dto.GrupoMuscularId);

        if (volumeExistente != null)
            throw new Exception(
                "Esse grupo muscular já possui volume nessa semana");

        var volume = new VolumeSemanal
        {
            PeriodizacaoSemanaId = semanaId,
            GrupoMuscularId = dto.GrupoMuscularId,
            Series = dto.Series
        };

        _context.VolumesSemanais.Add(volume);

        await _context.SaveChangesAsync();

        return MapearDTO(volume);
    }

    public async Task<List<VolumeSemanalDTO>> ListarPorSemana(
        Guid semanaId)
    {
        return await _context.VolumesSemanais
            .Where(v => v.PeriodizacaoSemanaId == semanaId)
            .Select(v => new VolumeSemanalDTO
            {
                Id = v.Id,
                PeriodizacaoSemanaId = v.PeriodizacaoSemanaId,
                GrupoMuscularId = v.GrupoMuscularId,
                Series = v.Series
            })
            .ToListAsync();
    }

    public async Task<VolumeSemanalDTO?> ObterPorId(Guid id)
    {
        var volume = await _context.VolumesSemanais
            .FirstOrDefaultAsync(v => v.Id == id);

        if (volume == null)
            return null;

        return MapearDTO(volume);
    }

    public async Task<VolumeSemanalDTO?> Atualizar(
        Guid id,
        AtualizarVolumeSemanalDTO dto)
    {
        var volume = await _context.VolumesSemanais
            .FirstOrDefaultAsync(v => v.Id == id);

        if (volume == null)
            return null;

        var grupo = await _context.GruposMusculares
            .FirstOrDefaultAsync(g => g.Id == dto.GrupoMuscularId);

        if (grupo == null)
            throw new Exception("Grupo muscular não encontrado");

        var outroVolume = await _context.VolumesSemanais
            .FirstOrDefaultAsync(v =>
                v.Id != id &&
                v.PeriodizacaoSemanaId == volume.PeriodizacaoSemanaId &&
                v.GrupoMuscularId == dto.GrupoMuscularId);

        if (outroVolume != null)
            throw new Exception(
                "Esse grupo muscular já possui volume nessa semana");

        volume.GrupoMuscularId = dto.GrupoMuscularId;
        volume.Series = dto.Series;

        await _context.SaveChangesAsync();

        return MapearDTO(volume);
    }

    public async Task<bool> Deletar(Guid id)
    {
        var volume = await _context.VolumesSemanais
            .FirstOrDefaultAsync(v => v.Id == id);

        if (volume == null)
            return false;

        _context.VolumesSemanais.Remove(volume);

        await _context.SaveChangesAsync();

        return true;
    }

    private static VolumeSemanalDTO MapearDTO(
        VolumeSemanal volume)
    {
        return new VolumeSemanalDTO
        {
            Id = volume.Id,
            PeriodizacaoSemanaId = volume.PeriodizacaoSemanaId,
            GrupoMuscularId = volume.GrupoMuscularId,
            Series = volume.Series
        };
    }
}