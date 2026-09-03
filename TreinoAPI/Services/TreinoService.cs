using Microsoft.EntityFrameworkCore;
using TreinoAPI.Data;
using TreinoAPI.DTOs.Treino;
using TreinoAPI.Model;

namespace TreinoAPI.Services;

public class TreinoService
{
    private readonly AppDbContext _context;

    public TreinoService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<TreinoDTO> Criar(Guid alunoId, CriarTreinoDTO dto)
    {
        var treino = new Treino
        {
            AlunoId = alunoId,
            Nome = dto.Nome,
            CriadoEm = DateTime.UtcNow
        };

        _context.Treinos.Add(treino);
        await _context.SaveChangesAsync();

        return new TreinoDTO
        {
            Id = treino.Id,
            AlunoId = treino.AlunoId,
            Nome = treino.Nome,
            CriadoEm = treino.CriadoEm
        };
    }

    public async Task<List<TreinoDTO>> Listar()
    {
        return await _context.Treinos
            .Include(t => t.Aluno)
            .Select(t => new TreinoDTO
            {
                Id = t.Id,
                AlunoId = t.AlunoId,
                Nome = t.Nome,
                CriadoEm = t.CriadoEm
            }).ToListAsync();
    }

    public async Task<TreinoDTO?> ObterPorId(Guid id)
    {
        var treino = await _context.Treinos
            .Include(t => t.Aluno)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (treino == null)
        {
            return null;
        }

        return new TreinoDTO
        {
            Id = treino.Id,
            AlunoId = treino.AlunoId,
            Nome = treino.Nome,
            CriadoEm = treino.CriadoEm
        };
    }

    public async Task<bool> Atualizar(Guid id, AtualizarTreinoDTO dto)
    {
        var treino = await _context.Treinos.FindAsync(id);

        if (treino == null)
        {
            return false;
        }

        treino.Nome = dto.Nome;

        _context.Treinos.Update(treino);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> Deletar(Guid id)
    {
        var treino = await _context.Treinos.FindAsync(id);

        if (treino == null)
        {
            return false;
        }

        _context.Treinos.Remove(treino);
        await _context.SaveChangesAsync();

        return true;
    }
}