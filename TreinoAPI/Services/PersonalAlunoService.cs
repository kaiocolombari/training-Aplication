using TreinoAPI.Data;
using Microsoft.EntityFrameworkCore;
using TreinoAPI.DTOs.PersonalAluno;
using TreinoAPI.Model;
using TreinoAPI.DTOs.Aluno;


namespace TreinoAPI.Services;

public class PersonalAlunoService
{
    private readonly AppDbContext _context;

    public PersonalAlunoService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<PersonalAlunoDto>> BuscarAlunos(Guid personalId)
    {
        return await _context.PersonalAlunos
        .Where(pa => pa.PersonalId == personalId && pa.Ativo)
        .Select(pa => new PersonalAlunoDto
        {
            Id = pa.Id,
            PersonalId = pa.PersonalId,
            AlunoId = pa.AlunoId,
            Ativo = pa.Ativo,
            CriadoEm = pa.CriadoEm
        })
        .ToListAsync();
    }

    public async Task<PersonalAlunoDto?> VincularAluno(VincularAlunoDto dto)
    {
        var personal = await _context.Personais
        .FirstOrDefaultAsync(p => p.Id == dto.PersonalId);

        if (personal == null)
            throw new Exception("Personal não encontrado.");

        var aluno = await _context.Alunos
            .FirstOrDefaultAsync(a => a.Id == dto.AlunoId);

        if (aluno == null)
            throw new Exception("Aluno não encontrado.");

        var vinculoExistente = await _context.PersonalAlunos.FirstOrDefaultAsync(pa =>
            pa.PersonalId == dto.PersonalId
            && pa.AlunoId == dto.AlunoId);

        if (vinculoExistente != null)
            throw new Exception("Aluno já está vinculado a este Personal.");

        var quantidadePersonais = await _context.PersonalAlunos.CountAsync(pa => pa.AlunoId == dto.AlunoId && pa.Ativo);

        if (quantidadePersonais >= 4)
            throw new Exception("O aluno já possui o limite de 3 personais.");

        var vinculo = new PersonalAluno
        {
            PersonalId = dto.PersonalId,
            AlunoId = dto.AlunoId,
            Ativo = true
        };

        _context.PersonalAlunos.Add(vinculo);

        await _context.SaveChangesAsync();

        return new PersonalAlunoDto
        {
            Id = vinculo.Id,
            PersonalId = vinculo.PersonalId,
            AlunoId = vinculo.AlunoId,
            Ativo = vinculo.Ativo,
            CriadoEm = vinculo.CriadoEm
        };
    }

    public async Task<PersonalAlunoDto?> AtualizarVinculo(Guid id, AtualizarPersonalAlunoDto dto)
    {
        var vinculo = await _context.PersonalAlunos.FirstOrDefaultAsync(pa => pa.Id == id);

        if (vinculo == null)
            return null;

        vinculo.Ativo = dto.Ativo;

        await _context.SaveChangesAsync();

        return new PersonalAlunoDto
        {
            Id = vinculo.Id,
            PersonalId = vinculo.PersonalId,
            AlunoId = vinculo.AlunoId,
            Ativo = vinculo.Ativo,
            CriadoEm = vinculo.CriadoEm
        };
    }
    public async Task<bool> DeletarVinculo(Guid id)
    {
        var vinculo = await _context.PersonalAlunos
        .FirstOrDefaultAsync(pa => pa.Id == id);

        if (vinculo == null)
            return false;

        _context.PersonalAlunos.Remove(vinculo);

        await _context.SaveChangesAsync();

        return true;
    }
}

