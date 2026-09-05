using Microsoft.EntityFrameworkCore;
using treinoAPI.DTOs.CargaExercicio;
using TreinoAPI.Data;
using TreinoAPI.DTOs.CargaExercicio;
using TreinoAPI.Model;

namespace TreinoAPI.Services;

public class CargaExercicioService
{
    private readonly AppDbContext _context;

    public CargaExercicioService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<CargaExercicioDTO> Criar(
        Guid testeCargaId,
        CriarCargaExercicioDto dto)
    {
        var testeCarga = await _context.TestesCarga
            .FirstOrDefaultAsync(t => t.Id == testeCargaId);

        if (testeCarga == null)
            throw new Exception("Teste de carga não encontrado");

        var cargaExercicio = new CargaExercicio
        {
            TesteCargaId = testeCargaId,
            Exercicio = dto.Exercicio,
            Repeticoes = dto.Repeticoes,
            Carga = dto.Carga
        };

        _context.CargasExercicios.Add(cargaExercicio);

        await _context.SaveChangesAsync();

        return new CargaExercicioDTO
        {
            Id = cargaExercicio.Id,
            TesteCargaId = cargaExercicio.TesteCargaId,
            Exercicio = cargaExercicio.Exercicio,
            Repeticoes = cargaExercicio.Repeticoes,
            Carga = cargaExercicio.Carga
        };
    }

    public async Task<List<CargaExercicioDTO>> ListarPorTesteCarga(
        Guid testeCargaId)
    {
        return await _context.CargasExercicios
            .Where(c => c.TesteCargaId == testeCargaId)
            .Select(c => new CargaExercicioDTO
            {
                Id = c.Id,
                TesteCargaId = c.TesteCargaId,
                Exercicio = c.Exercicio,
                Repeticoes = c.Repeticoes,
                Carga = c.Carga
            })
            .ToListAsync();
    }

    public async Task<CargaExercicioDTO?> ObterPorId(Guid id)
    {
        var cargaExercicio = await _context.CargasExercicios
            .FirstOrDefaultAsync(c => c.Id == id);

        if (cargaExercicio == null)
            return null;

        return new CargaExercicioDTO
        {
            Id = cargaExercicio.Id,
            TesteCargaId = cargaExercicio.TesteCargaId,
            Exercicio = cargaExercicio.Exercicio,
            Repeticoes = cargaExercicio.Repeticoes,
            Carga = cargaExercicio.Carga
        };
    }

    public async Task<CargaExercicioDTO?> Atualizar(
        Guid id,
        AtualizarCargaExercicioDto dto)
    {
        var cargaExercicio = await _context.CargasExercicios
            .FirstOrDefaultAsync(c => c.Id == id);

        if (cargaExercicio == null)
            return null;

        cargaExercicio.Exercicio = dto.Exercicio;
        cargaExercicio.Repeticoes = dto.Repeticoes;
        cargaExercicio.Carga = dto.Carga;

        await _context.SaveChangesAsync();

        return new CargaExercicioDTO
        {
            Id = cargaExercicio.Id,
            TesteCargaId = cargaExercicio.TesteCargaId,
            Exercicio = cargaExercicio.Exercicio,
            Repeticoes = cargaExercicio.Repeticoes,
            Carga = cargaExercicio.Carga
        };
    }

    public async Task<bool> Deletar(Guid id)
    {
        var cargaExercicio = await _context.CargasExercicios
            .FirstOrDefaultAsync(c => c.Id == id);

        if (cargaExercicio == null)
            return false;

        _context.CargasExercicios.Remove(cargaExercicio);

        await _context.SaveChangesAsync();

        return true;
    }
}