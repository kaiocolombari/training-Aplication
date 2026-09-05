using Microsoft.EntityFrameworkCore;
using TreinoAPI.Data;
using TreinoAPI.DTOs.TesteCarga;
using TreinoAPI.Model;

namespace TreinoAPI.Services;

public class TesteCargaService
{
    private readonly AppDbContext _context;

    public TesteCargaService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<TesteCargaDTO> Criar(
        Guid alunoId,
        CriarTesteCargaDTO dto)
    {
        var aluno = await _context.Alunos
            .FirstOrDefaultAsync(a => a.Id == alunoId);

        if (aluno == null)
            throw new Exception("Aluno não encontrado");

        var testeCarga = new TesteCarga
        {
            AlunoId = alunoId,
            Numero = dto.Numero,
            RealizadaEm = dto.RealizadaEm
        };

        _context.TestesCarga.Add(testeCarga);

        await _context.SaveChangesAsync();

        return new TesteCargaDTO
        {
            Id = testeCarga.Id,
            AlunoId = testeCarga.AlunoId,
            Numero = testeCarga.Numero,
            RealizadaEm = testeCarga.RealizadaEm
        };
    }

    public async Task<List<TesteCargaDTO>> Listar()
    {
        return await _context.TestesCarga
            .Select(t => new TesteCargaDTO
            {
                Id = t.Id,
                AlunoId = t.AlunoId,
                Numero = t.Numero,
                RealizadaEm = t.RealizadaEm
            })
            .ToListAsync();
    }

    public async Task<TesteCargaDTO?> ObterPorId(Guid id)
    {
        var testeCarga = await _context.TestesCarga
            .FirstOrDefaultAsync(t => t.Id == id);

        if (testeCarga == null)
            return null;

        return new TesteCargaDTO
        {
            Id = testeCarga.Id,
            AlunoId = testeCarga.AlunoId,
            Numero = testeCarga.Numero,
            RealizadaEm = testeCarga.RealizadaEm
        };
    }

    public async Task<TesteCargaDTO?> Atualizar(
        Guid id,
        AtualizarTesteCargaDTO dto)
    {
        var testeCarga = await _context.TestesCarga
            .FirstOrDefaultAsync(t => t.Id == id);

        if (testeCarga == null)
            return null;

        testeCarga.Numero = dto.Numero;

        await _context.SaveChangesAsync();

        return new TesteCargaDTO
        {
            Id = testeCarga.Id,
            AlunoId = testeCarga.AlunoId,
            Numero = testeCarga.Numero,
            RealizadaEm = testeCarga.RealizadaEm
        };
    }

    public async Task<bool> Deletar(Guid id)
    {
        var testeCarga = await _context.TestesCarga
            .FirstOrDefaultAsync(t => t.Id == id);

        if (testeCarga == null)
            return false;

        _context.TestesCarga.Remove(testeCarga);

        await _context.SaveChangesAsync();

        return true;
    }
}