using Microsoft.EntityFrameworkCore;
using TreinoAPI.Data;
using TreinoAPI.DTOs;
using TreinoAPI.DTOs.Aluno;
using TreinoAPI.Model;
using TreinoAPI.Security;

namespace TreinoAPI.Services;

public class AlunoService
{
    private readonly AppDbContext _context;
    private readonly PasswordService _passwords;
    private readonly ComunicacaoService _comunicacao;
    private readonly AuditoriaService _auditoria;

    public AlunoService(
        AppDbContext context,
        PasswordService passwords,
        ComunicacaoService comunicacao,
        AuditoriaService auditoria)
    {
        _context = context;
        _passwords = passwords;
        _comunicacao = comunicacao;
        _auditoria = auditoria;
    }

    public async Task<AlunoDTO> Criar(CriarAlunoDTO dto, Guid? personalId)
    {
        var email = dto.Email.Trim().ToLowerInvariant();
        if (await _context.Usuarios.AnyAsync(u => u.Email == email))
            throw DomainException.Conflict("Já existe uma conta cadastrada com este e-mail.");

        if (personalId.HasValue && !await _context.Personais.AnyAsync(p => p.Id == personalId.Value && p.Usuario!.Ativo))
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
            CriadoEm = DateTime.UtcNow,
            ConvidadoPorPersonalId = personalId
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
        var query = _context.Alunos.AsNoTracking()
            .Include(a => a.Usuario)
            .Where(a => a.Usuario.Ativo && a.StatusCadastro == StatusCadastroAluno.APROVADO)
            .AsQueryable();
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
                CriadoEm = a.CriadoEm,
                StatusCadastro = a.StatusCadastro.ToString(),
                ConvidadoPorPersonalNome = a.ConvidadoPorPersonal != null ? a.ConvidadoPorPersonal.Nome : null,
                PossuiFichaTecnica = a.Avaliacoes.Any(av => av.Ativo) ||
                    a.Treinos.Any(t => t.Ativo) || a.Anamneses.Any() ||
                    a.TestesCarga.Any() || a.Periodizacoes.Any()
            })
            .ToListAsync();
    }

    public async Task<AlunoDTO?> BuscarPorId(Guid id)
    {
        var aluno = await _context.Alunos
            .AsNoTracking()
            .Include(a => a.Usuario)
            .Include(a => a.ConvidadoPorPersonal)
            .Include(a => a.Avaliacoes.Where(av => av.Ativo))
            .Include(a => a.Treinos.Where(t => t.Ativo))
            .Include(a => a.Anamneses)
            .Include(a => a.TestesCarga)
            .Include(a => a.Periodizacoes)
            .FirstOrDefaultAsync(a => a.Id == id && a.Usuario.Ativo);

        return aluno is null ? null : Mapear(aluno, aluno.Usuario);
    }

    public async Task<AlunoDTO?> Atualizar(Guid id, AtualizarAlunoDTO dto)
    {
        var aluno = await _context.Alunos
            .Include(a => a.Usuario)
            .Include(a => a.ConvidadoPorPersonal)
            .Include(a => a.Avaliacoes.Where(av => av.Ativo))
            .Include(a => a.Treinos.Where(t => t.Ativo))
            .Include(a => a.Anamneses)
            .Include(a => a.TestesCarga)
            .Include(a => a.Periodizacoes)
            .FirstOrDefaultAsync(a => a.Id == id && a.Usuario.Ativo);

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

    public async Task<bool> Deletar(Guid id, MotivoOperacaoDTO? dto)
    {
        var motivo = MotivoOperacaoHelper.Formatar(dto);
        await using var transaction = await _context.Database.BeginTransactionAsync();

        var aluno = await _context.Alunos
            .Include(a => a.Usuario)
            .FirstOrDefaultAsync(a => a.Id == id && a.Usuario.Ativo);
        if (aluno?.Usuario is null)
            return false;

        var vinculos = await _context.PersonalAlunos
            .Include(pa => pa.Personal).ThenInclude(p => p.Usuario)
            .Where(pa => pa.AlunoId == id && pa.Ativo && pa.Personal.Usuario!.Ativo)
            .ToListAsync();

        foreach (var vinculo in vinculos)
            vinculo.Ativo = false;

        aluno.Usuario.Ativo = false;
        var tokens = await _context.RefreshTokens
            .Where(token => token.UsuarioId == aluno.UsuarioId && token.RevogadoEm == null)
            .ToListAsync();
        foreach (var token in tokens)
            token.RevogadoEm = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        foreach (var vinculo in vinculos)
        {
            await _comunicacao.NotificarUsuarioAsync(
                vinculo.Personal.UsuarioId,
                "Aluno removido da carteira",
                $"{aluno.NomeCompleto} foi removido da sua carteira pela administração. Motivo: {motivo}",
                "VINCULO_REMOVIDO",
                aluno.Id);
        }

        await _auditoria.RegistrarOperacaoDetalhadaAsync(
            "EXCLUSAO_ALUNO",
            "DELETE",
            $"/api/Aluno/{id}",
            id,
            $"Aluno {aluno.NomeCompleto} desativado. Personais notificados: {vinculos.Count}. Motivo: {motivo}");

        await transaction.CommitAsync();
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
        CriadoEm = aluno.CriadoEm,
        StatusCadastro = aluno.StatusCadastro.ToString(),
        ConvidadoPorPersonalNome = aluno.ConvidadoPorPersonal?.Nome,
        PossuiFichaTecnica = aluno.Avaliacoes.Any(av => av.Ativo) ||
            aluno.Treinos.Any(t => t.Ativo) || aluno.Anamneses.Any() ||
            aluno.TestesCarga.Any() || aluno.Periodizacoes.Any()
    };
}
