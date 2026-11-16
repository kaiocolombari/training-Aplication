using Microsoft.EntityFrameworkCore;
using TreinoAPI.Data;
using TreinoAPI.DTOs.Aluno;
using TreinoAPI.Model;
using TreinoAPI.Security;

namespace TreinoAPI.Services;

public class AlunoService
{
    private readonly AppDbContext _context;
    private readonly PasswordService _passwords;

    public AlunoService(AppDbContext context, PasswordService passwords)
    {
        _context = context;
        _passwords = passwords;
    }

    public async Task<AlunoDTO> Criar(CriarAlunoDTO dto, Guid? personalId)
    {
        var email = dto.Email.Trim().ToLowerInvariant();
        if (await _context.Usuarios.AnyAsync(u => u.Email == email))
            throw DomainException.Conflict("Já existe uma conta cadastrada com este e-mail.");

        if (personalId.HasValue && !await _context.Personais.AnyAsync(p => p.Id == personalId.Value))
            throw DomainException.NotFound("Personal não encontrado.");

        var usuario = new Usuario
        {
            Email = email,
            Telefone = dto.Telefone?.Trim(),
            SenhaHashed = _passwords.Hash(dto.Senha),
            Tipo = TipoUsuario.ALUNO,
            CriadoEm = DateTime.UtcNow
        };

        var aluno = new Aluno
        {
            NomeCompleto = dto.NomeCompleto.Trim(),
            Genero = dto.Genero,
            DataNascimento = dto.DataNascimento,
            Etnia = dto.Etnia,
            Massa = dto.Massa,
            Estatura = dto.Estatura,
            Femur = dto.Femur,
            Tibia = dto.Tibia,
            Una = dto.Una,
            Umero = dto.Umero,
            FcRepouso = dto.FcRepouso,
            FcReserva = dto.FcReserva,
            Glicose = dto.Glicose,
            Triglicerideos = dto.Triglicerideos,
            Ldl = dto.Ldl,
            Hdl = dto.Hdl,
            Sistolica = dto.Sistolica,
            Diastolica = dto.Diastolica,
            Usuario = usuario,
            CriadoEm = DateTime.UtcNow
        };

        _context.Alunos.Add(aluno);
        if (personalId.HasValue)
        {
            _context.PersonalAlunos.Add(new PersonalAluno
            {
                PersonalId = personalId.Value,
                Aluno = aluno,
                Ativo = true,
                CriadoEm = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();
        return Mapear(aluno, usuario);
    }

    public async Task<List<AlunoDTO>> Listar(IEnumerable<Guid>? alunoIds = null)
    {
        var query = _context.Alunos.AsNoTracking().Include(a => a.Usuario).AsQueryable();
        if (alunoIds is not null)
        {
            var ids = alunoIds.Distinct().ToArray();
            query = query.Where(a => ids.Contains(a.Id));
        }

        return await query
            .OrderBy(a => a.NomeCompleto)
            .Select(a => new AlunoDTO
            {
                Id = a.Id,
                NomeCompleto = a.NomeCompleto,
                Email = a.Usuario.Email,
                Telefone = a.Usuario.Telefone,
                Genero = a.Genero,
                DataNascimento = a.DataNascimento,
                Etnia = a.Etnia,
                CriadoEm = a.CriadoEm
            })
            .ToListAsync();
    }

    public async Task<AlunoDTO?> BuscarPorId(Guid id)
    {
        var aluno = await _context.Alunos
            .AsNoTracking()
            .Include(a => a.Usuario)
            .FirstOrDefaultAsync(a => a.Id == id);

        return aluno is null ? null : Mapear(aluno, aluno.Usuario);
    }

    public async Task<AlunoDTO?> Atualizar(Guid id, AtualizarAlunoDTO dto)
    {
        var aluno = await _context.Alunos
            .Include(a => a.Usuario)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (aluno is null)
            return null;

        aluno.NomeCompleto = dto.NomeCompleto.Trim();
        aluno.Genero = dto.Genero;
        aluno.DataNascimento = dto.DataNascimento;
        aluno.Etnia = dto.Etnia;
        aluno.Massa = dto.Massa;
        aluno.Estatura = dto.Estatura;
        aluno.Femur = dto.Femur;
        aluno.Tibia = dto.Tibia;
        aluno.Una = dto.Una;
        aluno.Umero = dto.Umero;
        aluno.FcRepouso = dto.FcRepouso;
        aluno.FcReserva = dto.FcReserva;
        aluno.Glicose = dto.Glicose;
        aluno.Triglicerideos = dto.Triglicerideos;
        aluno.Ldl = dto.Ldl;
        aluno.Hdl = dto.Hdl;
        aluno.Sistolica = dto.Sistolica;
        aluno.Diastolica = dto.Diastolica;

        await _context.SaveChangesAsync();
        return Mapear(aluno, aluno.Usuario);
    }

    public async Task<bool> Deletar(Guid id)
    {
        var aluno = await _context.Alunos.FindAsync(id);
        if (aluno is null)
            return false;

        _context.Alunos.Remove(aluno);
        await _context.SaveChangesAsync();
        return true;
    }

    private static AlunoDTO Mapear(Aluno aluno, Usuario usuario) => new()
    {
        Id = aluno.Id,
        NomeCompleto = aluno.NomeCompleto,
        Email = usuario.Email,
        Telefone = usuario.Telefone,
        Genero = aluno.Genero,
        DataNascimento = aluno.DataNascimento,
        Etnia = aluno.Etnia,
        CriadoEm = aluno.CriadoEm
    };
}
