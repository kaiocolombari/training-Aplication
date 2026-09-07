using Microsoft.EntityFrameworkCore;
using TreinoAPI.Data;
using TreinoAPI.DTOs.DobraCutanea;
using TreinoAPI.Model;

namespace TreinoAPI.Services;

public class DobraCutaneaService
{
    private readonly AppDbContext _context;

    public DobraCutaneaService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<DobraCutaneaDTO> Criar(
        Guid avaliacaoId,
        CriarDobraCutaneaDTO dto)
    {
        var avaliacao = await _context.Avaliacoes
            .FirstOrDefaultAsync(a => a.Id == avaliacaoId);

        if (avaliacao == null)
            throw new Exception("Avaliação não encontrada");

        var dobra = new DobraCutanea
        {
            AvaliacaoId = avaliacaoId,
            Medida = dto.Medida,

            Triceps = dto.Triceps,
            Subescapular = dto.Subescapular,
            Biceps = dto.Biceps,
            Iliaca = dto.Iliaca,
            Supraespinhal = dto.Supraespinhal,
            Abdominal = dto.Abdominal,
            CoxaMedia = dto.CoxaMedia,
            Panturrilha = dto.Panturrilha
        };

        _context.DobrasCutaneas.Add(dobra);

        await _context.SaveChangesAsync();

        return MapearDTO(dobra);
    }

    public async Task<List<DobraCutaneaDTO>> ListarPorAvaliacao(
        Guid avaliacaoId)
    {
        return await _context.DobrasCutaneas
            .Where(d => d.AvaliacaoId == avaliacaoId)
            .OrderBy(d => d.Medida)
            .Select(d => new DobraCutaneaDTO
            {
                Id = d.Id,
                AvaliacaoId = d.AvaliacaoId,
                Medida = d.Medida,

                Triceps = d.Triceps,
                Subescapular = d.Subescapular,
                Biceps = d.Biceps,
                Iliaca = d.Iliaca,
                Supraespinhal = d.Supraespinhal,
                Abdominal = d.Abdominal,
                CoxaMedia = d.CoxaMedia,
                Panturrilha = d.Panturrilha
            })
            .ToListAsync();
    }

    public async Task<DobraCutaneaDTO?> ObterPorId(Guid id)
    {
        var dobra = await _context.DobrasCutaneas
            .FirstOrDefaultAsync(d => d.Id == id);

        if (dobra == null)
            return null;

        return MapearDTO(dobra);
    }

    public async Task<DobraCutaneaDTO?> Atualizar(
        Guid id,
        AtualizarDobraCutaneaDTO dto)
    {
        var dobra = await _context.DobrasCutaneas
            .FirstOrDefaultAsync(d => d.Id == id);

        if (dobra == null)
            return null;

        dobra.Medida = dto.Medida;

        dobra.Triceps = dto.Triceps;
        dobra.Subescapular = dto.Subescapular;
        dobra.Biceps = dto.Biceps;
        dobra.Iliaca = dto.Iliaca;
        dobra.Supraespinhal = dto.Supraespinhal;
        dobra.Abdominal = dto.Abdominal;
        dobra.CoxaMedia = dto.CoxaMedia;
        dobra.Panturrilha = dto.Panturrilha;

        await _context.SaveChangesAsync();

        return MapearDTO(dobra);
    }

    public async Task<bool> Deletar(Guid id)
    {
        var dobra = await _context.DobrasCutaneas
            .FirstOrDefaultAsync(d => d.Id == id);

        if (dobra == null)
            return false;

        _context.DobrasCutaneas.Remove(dobra);

        await _context.SaveChangesAsync();

        return true;
    }

    private static DobraCutaneaDTO MapearDTO(
        DobraCutanea dobra)
    {
        return new DobraCutaneaDTO
        {
            Id = dobra.Id,
            AvaliacaoId = dobra.AvaliacaoId,
            Medida = dobra.Medida,

            Triceps = dobra.Triceps,
            Subescapular = dobra.Subescapular,
            Biceps = dobra.Biceps,
            Iliaca = dobra.Iliaca,
            Supraespinhal = dobra.Supraespinhal,
            Abdominal = dobra.Abdominal,
            CoxaMedia = dobra.CoxaMedia,
            Panturrilha = dobra.Panturrilha
        };
    }
}