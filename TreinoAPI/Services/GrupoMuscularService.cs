using Microsoft.EntityFrameworkCore;
using TreinoAPI.Data;
using TreinoAPI.DTOs.GrupoMuscular;
using TreinoAPI.Model;

namespace TreinoAPI.Services;

public class GrupoMuscularService
{
    private readonly AppDbContext _context;

    public GrupoMuscularService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<GrupoMuscularDTO> Criar(
        CriarGrupoMuscularDTO dto)
    {
        var grupo = new GrupoMuscular
        {
            Nome = dto.Nome
        };

        _context.GruposMusculares.Add(grupo);

        await _context.SaveChangesAsync();

        return MapearDTO(grupo);
    }

    public async Task<List<GrupoMuscularDTO>> Listar()
    {
        return await _context.GruposMusculares
            .Select(g => new GrupoMuscularDTO
            {
                Id = g.Id,
                Nome = g.Nome
            })
            .ToListAsync();
    }

    public async Task<GrupoMuscularDTO?> ObterPorId(Guid id)
    {
        var grupo = await _context.GruposMusculares
            .FirstOrDefaultAsync(g => g.Id == id);

        if (grupo == null)
            return null;

        return MapearDTO(grupo);
    }

    public async Task<GrupoMuscularDTO?> Atualizar(
        Guid id,
        AtualizarGrupoMuscularDTO dto)
    {
        var grupo = await _context.GruposMusculares
            .FirstOrDefaultAsync(g => g.Id == id);

        if (grupo == null)
            return null;

        grupo.Nome = dto.Nome;

        await _context.SaveChangesAsync();

        return MapearDTO(grupo);
    }

    public async Task<bool> Deletar(Guid id)
    {
        var grupo = await _context.GruposMusculares
            .FirstOrDefaultAsync(g => g.Id == id);

        if (grupo == null)
            return false;

        _context.GruposMusculares.Remove(grupo);

        await _context.SaveChangesAsync();

        return true;
    }

    private static GrupoMuscularDTO MapearDTO(
        GrupoMuscular grupo)
    {
        return new GrupoMuscularDTO
        {
            Id = grupo.Id,
            Nome = grupo.Nome
        };
    }
}