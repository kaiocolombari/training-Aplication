using Microsoft.EntityFrameworkCore;
using TreinoAPI.Data;
using TreinoAPI.DTOs.Anamnese;
using TreinoAPI.Model;

namespace TreinoAPI.Services;

public class AnamneseService
{
    private readonly AppDbContext _context;

    public AnamneseService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<AnamneseDTO> Criar(Guid alunoId, CriarAnamneseDTO dto)
    {
        var anamnese = new Anamnese
        {
            AlunoId = alunoId,
            Tipo = dto.Tipo,
            Objetivo = dto.Objetivo,
            Observacoes = dto.Observacoes,
            CriadoEm = DateTime.UtcNow
        };

        _context.Anamnese.Add(anamnese);
        await _context.SaveChangesAsync();

        return new AnamneseDTO
        {
            Id = anamnese.Id,
            AlunoId = anamnese.AlunoId,
            Tipo = anamnese.Tipo,
            Objetivo = anamnese.Objetivo,
            Observacoes = anamnese.Observacoes,
            CriadoEm = anamnese.CriadoEm
        };
    }

    public async Task<List<AnamneseDTO>> Listar()
    {
        return await _context.Anamnese
        .Include(a => a.Aluno)
        .Select(a => new AnamneseDTO
        {
            Id = a.Id,
            AlunoId = a.AlunoId,
            Tipo = a.Tipo,
            Objetivo = a.Objetivo,
            Observacoes = a.Observacoes,
            CriadoEm = a.CriadoEm
        }).ToListAsync();
    }

    public async Task<AnamneseDTO?> BuscarPorId(Guid id)
    {
        var anamnese = await _context.Anamnese
            .Include(a => a.Aluno)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (anamnese == null)
        {
            return null;
        }

        return new AnamneseDTO
        {
            Id = anamnese.Id,
            AlunoId = anamnese.AlunoId,
            Tipo = anamnese.Tipo,
            Objetivo = anamnese.Objetivo,
            Observacoes = anamnese.Observacoes,
            CriadoEm = anamnese.CriadoEm
        };
    }

    public async Task<bool> Atualizar(Guid id, AtualizarAnamneseDTO dto)
    {
        var anamnese = await _context.Anamnese.FindAsync(id);

        if (anamnese == null)
        {
            return false;
        }

        anamnese.Tipo = dto.Tipo;
        anamnese.Objetivo = dto.Objetivo;
        anamnese.Observacoes = dto.Observacoes;
        await _context.SaveChangesAsync();
        return true;
        
    }

    public async Task<bool> Deletar(Guid id)
    {
        var anamnese = await _context.Anamnese.FindAsync(id);

        if (anamnese == null)
        {
            return false;
        }

        _context.Anamnese.Remove(anamnese);
        await _context.SaveChangesAsync();
        return true;
    }
}