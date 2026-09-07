using Microsoft.EntityFrameworkCore;
using TreinoAPI.Data;
using TreinoAPI.DTOs.Perimetro;
using TreinoAPI.Model;

namespace TreinoAPI.Services;

public class PerimetroService
{
    private readonly AppDbContext _context;

    public PerimetroService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PerimetroDTO> Criar(
        Guid avaliacaoId,
        CriarPerimetroDTO dto)
    {
        var avaliacao = await _context.Avaliacoes
            .FirstOrDefaultAsync(a => a.Id == avaliacaoId);

        if (avaliacao == null)
            throw new Exception("Avaliação não encontrada");

        var perimetro = new Perimetro
        {
            AvaliacaoId = avaliacaoId,

            Braco_D = dto.Braco_D,
            Braco_E = dto.Braco_E,

            Antebraco_D = dto.Antebraco_D,
            Antebraco_E = dto.Antebraco_E,

            Torax = dto.Torax,
            Cintura = dto.Cintura,
            Abdomen = dto.Abdomen,
            Quadril = dto.Quadril,

            Coxa_Sup_D = dto.Coxa_Sup_D,
            Coxa_Sup_E = dto.Coxa_Sup_E,

            Coxa_Med_D = dto.Coxa_Med_D,
            Coxa_Med_E = dto.Coxa_Med_E,

            Panturrilha_D = dto.Panturrilha_D,
            Panturrilha_E = dto.Panturrilha_E
        };

        _context.Perimetros.Add(perimetro);

        await _context.SaveChangesAsync();

        return MapearDTO(perimetro);
    }

    public async Task<PerimetroDTO?> ObterPorId(Guid id)
    {
        var perimetro = await _context.Perimetros
            .FirstOrDefaultAsync(p => p.Id == id);

        if (perimetro == null)
            return null;

        return MapearDTO(perimetro);
    }

    public async Task<PerimetroDTO?> ObterPorAvaliacao(Guid avaliacaoId)
    {
        var perimetro = await _context.Perimetros
            .FirstOrDefaultAsync(p => p.AvaliacaoId == avaliacaoId);

        if (perimetro == null)
            return null;

        return MapearDTO(perimetro);
    }

    public async Task<PerimetroDTO?> Atualizar(
        Guid id,
        AtualizarPerimetroDTO dto)
    {
        var perimetro = await _context.Perimetros
            .FirstOrDefaultAsync(p => p.Id == id);

        if (perimetro == null)
            return null;

        perimetro.Braco_D = dto.Braco_D;
        perimetro.Braco_E = dto.Braco_E;

        perimetro.Antebraco_D = dto.Antebraco_D;
        perimetro.Antebraco_E = dto.Antebraco_E;

        perimetro.Torax = dto.Torax;
        perimetro.Cintura = dto.Cintura;
        perimetro.Abdomen = dto.Abdomen;
        perimetro.Quadril = dto.Quadril;

        perimetro.Coxa_Sup_D = dto.Coxa_Sup_D;
        perimetro.Coxa_Sup_E = dto.Coxa_Sup_E;

        perimetro.Coxa_Med_D = dto.Coxa_Med_D;
        perimetro.Coxa_Med_E = dto.Coxa_Med_E;

        perimetro.Panturrilha_D = dto.Panturrilha_D;
        perimetro.Panturrilha_E = dto.Panturrilha_E;

        await _context.SaveChangesAsync();

        return MapearDTO(perimetro);
    }

    public async Task<bool> Deletar(Guid id)
    {
        var perimetro = await _context.Perimetros
            .FirstOrDefaultAsync(p => p.Id == id);

        if (perimetro == null)
            return false;

        _context.Perimetros.Remove(perimetro);

        await _context.SaveChangesAsync();

        return true;
    }

    private static PerimetroDTO MapearDTO(Perimetro perimetro)
    {
        return new PerimetroDTO
        {
            Id = perimetro.Id,
            AvaliacaoId = perimetro.AvaliacaoId,

            Braco_D = perimetro.Braco_D,
            Braco_E = perimetro.Braco_E,

            Antebraco_D = perimetro.Antebraco_D,
            Antebraco_E = perimetro.Antebraco_E,

            Torax = perimetro.Torax,
            Cintura = perimetro.Cintura,
            Abdomen = perimetro.Abdomen,
            Quadril = perimetro.Quadril,

            Coxa_Sup_D = perimetro.Coxa_Sup_D,
            Coxa_Sup_E = perimetro.Coxa_Sup_E,

            Coxa_Med_D = perimetro.Coxa_Med_D,
            Coxa_Med_E = perimetro.Coxa_Med_E,

            Panturrilha_D = perimetro.Panturrilha_D,
            Panturrilha_E = perimetro.Panturrilha_E
        };
    }
}