using Microsoft.EntityFrameworkCore;
using TreinoAPI.Data;
using TreinoAPI.DTOs.Periodizacao;
using TreinoAPI.Model;

namespace TreinoAPI.Services;

public class PeriodizacaoService
{
    private readonly AppDbContext _context;

    public PeriodizacaoService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PeriodizacaoDTO> Criar(
        Guid alunoId,
        PeriodizacaoDTO dto)
    {
        var aluno = await _context.Alunos
            .FirstOrDefaultAsync(a => a.Id == alunoId);

        if (aluno == null)
            throw new Exception("Aluno não encontrado");

        var periodizacao = new Periodizacao
        {
            AlunoId = alunoId,
            Nome = dto.Nome,
            DataInicio = dto.DataInicio
        };

        _context.Periodizacoes.Add(periodizacao);

        await _context.SaveChangesAsync();

        return new PeriodizacaoDTO
        {
            Id = periodizacao.Id,
            AlunoId = periodizacao.AlunoId,
            Nome = periodizacao.Nome,
            DataInicio = periodizacao.DataInicio
        };
    }

    public async Task<List<PeriodizacaoDTO>> ListarPorAluno(Guid alunoId)
    {
        return await _context.Periodizacoes
            .Where(p => p.AlunoId == alunoId)
            .Select(p => new PeriodizacaoDTO
            {
                Id = p.Id,
                AlunoId = p.AlunoId,
                Nome = p.Nome,
                DataInicio = p.DataInicio
            })
            .ToListAsync();
    }

    public async Task<PeriodizacaoDTO?> ObterPorId(Guid id)
    {
        return await _context.Periodizacoes
            .Where(p => p.Id == id)
            .Select(p => new PeriodizacaoDTO
            {
                Id = p.Id,
                AlunoId = p.AlunoId,
                Nome = p.Nome,
                DataInicio = p.DataInicio
            })
            .FirstOrDefaultAsync();
    }

    public async Task<PeriodizacaoDTO?> Atualizar(
        Guid id,
        PeriodizacaoDTO dto)
    {
        var periodizacao = await _context.Periodizacoes
            .FirstOrDefaultAsync(p => p.Id == id);

        if (periodizacao == null)
            return null;

        periodizacao.Nome = dto.Nome;
        periodizacao.DataInicio = dto.DataInicio;

        await _context.SaveChangesAsync();

        return new PeriodizacaoDTO
        {
            Id = periodizacao.Id,
            AlunoId = periodizacao.AlunoId,
            Nome = periodizacao.Nome,
            DataInicio = periodizacao.DataInicio
        };
    }

    public async Task<bool> Deletar(Guid id)
    {
        var periodizacao = await _context.Periodizacoes
            .FirstOrDefaultAsync(p => p.Id == id);

        if (periodizacao == null)
            return false;

        _context.Periodizacoes.Remove(periodizacao);

        await _context.SaveChangesAsync();

        return true;
    }
}