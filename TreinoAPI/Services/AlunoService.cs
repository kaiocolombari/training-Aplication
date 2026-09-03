using Microsoft.EntityFrameworkCore;
using TreinoAPI.Data;
using TreinoAPI.DTOs.Aluno;
using TreinoAPI.Model;

namespace TreinoAPI.Services;

public class AlunoService
{
    private readonly AppDbContext _context;

    public AlunoService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<AlunoDto> Criar(CriarAlunoDTO dto)
    {
        var usuario = new Usuario
        {
            Email = dto.Email,
            Telefone = dto.Telefone,
            Tipo = TipoUsuario.ALUNO,
            CriadoEm = DateTime.UtcNow,

            // aplicar funções de hash depois
            SenhaHashed = dto.Senha
        };

        var aluno = new Aluno
        {
            NomeCompleto = dto.NomeCompleto,
            Genero = dto.Genero,
            DataNascimento = dto.DataNascimento,
            Etnia = dto.Etnia,

            Usuario = usuario
        };

        var vinculo = new PersonalAluno
        {
            PersonalId = dto.PersonalId,
            Aluno = aluno
        };

        _context.Usuarios.Add(usuario);
        _context.Alunos.Add(aluno);
        _context.PersonalAlunos.Add(vinculo);

        await _context.SaveChangesAsync();

        return new AlunoDto
        {
            Id = aluno.Id,
            NomeCompleto = aluno.NomeCompleto,
            Etnia = aluno.Etnia,
            DataNascimento = aluno.DataNascimento,
            Genero = aluno.Genero
        };
    }

    public async Task<List<AlunoDto>> Listar()
    {
        return await _context.Alunos
        .Include(a => a.Usuario)
        .Select(a => new AlunoDto
        {
            Id = a.Id,
            NomeCompleto = a.NomeCompleto,
            Etnia = a.Etnia,
            Genero = a.Genero
        })
        .ToListAsync();
    }

    public async Task<AlunoDto?> BuscarPorId(Guid id)
    {
        var aluno = await _context.Alunos
            .Include(a => a.Usuario)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (aluno == null)
        {
            return null;
        }

        return new AlunoDto
        {
            Id = aluno.Id,
            NomeCompleto = aluno.NomeCompleto,
            Etnia = aluno.Etnia,
            Genero = aluno.Genero
        };
    }

    public async Task<AlunoDto> Atualizar(Guid id, AtualizarAlunoDto dto)
    {
        var aluno = await _context.Alunos
            .Include(a => a.Usuario)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (aluno == null)
        {
            throw new Exception("Aluno não encontrado");
        }

        aluno.NomeCompleto = dto.NomeCompleto;
        aluno.Genero = dto.Genero;
        aluno.DataNascimento = dto.DataNascimento;
        aluno.Etnia = dto.Etnia;

        await _context.SaveChangesAsync();

        return new AlunoDto
        {
            Id = aluno.Id,
            NomeCompleto = aluno.NomeCompleto,
            Etnia = aluno.Etnia,
            Genero = aluno.Genero
        };
    }

    public async Task<bool> Deletar(Guid id)
    {
        var aluno = await _context.Alunos.FindAsync(id);

        if (aluno == null)
        {
            return false;
        }

        _context.Alunos.Remove(aluno);
        await _context.SaveChangesAsync();

        return true;
    }


}