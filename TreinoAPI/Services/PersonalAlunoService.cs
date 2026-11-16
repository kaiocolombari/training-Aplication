using Microsoft.EntityFrameworkCore;
using TreinoAPI.Data;
using TreinoAPI.DTOs.PersonalAluno;
using TreinoAPI.Model;
using TreinoAPI.Security;

namespace TreinoAPI.Services;

public class PersonalAlunoService
{
    private readonly AppDbContext _context;

    public PersonalAlunoService(AppDbContext context) => _context = context;

    public async Task<List<PersonalAlunoDTO>> BuscarAlunos(Guid personalId)
    {
        return await _context.PersonalAlunos
            .AsNoTracking()
            .Where(pa => pa.PersonalId == personalId && pa.Ativo)
            .OrderBy(pa => pa.CriadoEm)
            .Select(pa => new PersonalAlunoDTO
            {
                Id = pa.Id,
                PersonalId = pa.PersonalId,
                AlunoId = pa.AlunoId,
                Ativo = pa.Ativo,
                CriadoEm = pa.CriadoEm
            })
            .ToListAsync();
    }

    public async Task<PersonalAlunoDTO?> VincularAluno(VincularAlunoDTO dto)
    {
        var personal = await _context.Personais.AnyAsync(p => p.Id == dto.PersonalId);
        if (!personal)
            throw DomainException.NotFound("Personal não encontrado.");

        var aluno = await _context.Alunos.AnyAsync(a => a.Id == dto.AlunoId);
        if (!aluno)
            throw DomainException.NotFound("Aluno não encontrado.");

        var existing = await _context.PersonalAlunos.FirstOrDefaultAsync(pa =>
            pa.PersonalId == dto.PersonalId && pa.AlunoId == dto.AlunoId);

        if (existing is not null)
        {
            if (existing.Ativo)
                throw DomainException.Conflict("Aluno já está vinculado a este Personal.");

            var activeCount = await _context.PersonalAlunos.CountAsync(pa => pa.AlunoId == dto.AlunoId && pa.Ativo);
            if (activeCount >= 3)
                throw DomainException.Conflict("O aluno já possui o limite de 3 personais ativos.");

            existing.Ativo = true;
            await _context.SaveChangesAsync();
            return Mapear(existing);
        }

        var quantity = await _context.PersonalAlunos.CountAsync(pa => pa.AlunoId == dto.AlunoId && pa.Ativo);
        if (quantity >= 3)
            throw DomainException.Conflict("O aluno já possui o limite de 3 personais ativos.");

        var vinculo = new PersonalAluno
        {
            PersonalId = dto.PersonalId,
            AlunoId = dto.AlunoId,
            Ativo = true,
            CriadoEm = DateTime.UtcNow
        };

        _context.PersonalAlunos.Add(vinculo);
        await _context.SaveChangesAsync();
        return Mapear(vinculo);
    }

    public async Task<PersonalAlunoDTO?> AtualizarVinculo(Guid id, AtualizarPersonalAlunoDTO dto)
    {
        var vinculo = await _context.PersonalAlunos.FirstOrDefaultAsync(pa => pa.Id == id);
        if (vinculo is null)
            return null;

        if (dto.Ativo && !vinculo.Ativo)
        {
            var activeCount = await _context.PersonalAlunos.CountAsync(pa => pa.AlunoId == vinculo.AlunoId && pa.Ativo);
            if (activeCount >= 3)
                throw DomainException.Conflict("O aluno já possui o limite de 3 personais ativos.");
        }

        vinculo.Ativo = dto.Ativo;
        await _context.SaveChangesAsync();
        return Mapear(vinculo);
    }

    public async Task<bool> DeletarVinculo(Guid id)
    {
        var vinculo = await _context.PersonalAlunos.FirstOrDefaultAsync(pa => pa.Id == id);
        if (vinculo is null)
            return false;

        _context.PersonalAlunos.Remove(vinculo);
        await _context.SaveChangesAsync();
        return true;
    }

    private static PersonalAlunoDTO Mapear(PersonalAluno vinculo) => new()
    {
        Id = vinculo.Id,
        PersonalId = vinculo.PersonalId,
        AlunoId = vinculo.AlunoId,
        Ativo = vinculo.Ativo,
        CriadoEm = vinculo.CriadoEm
    };
}
