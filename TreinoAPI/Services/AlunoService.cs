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

    public async Task<AlunoDTO> Criar(CriarAlunoDTO dto)
    {
        var email = dto.Email.Trim().ToLowerInvariant();
        if (await _context.Usuarios.AnyAsync(u => u.Email == email))
            throw DomainException.Conflict("Já existe uma conta cadastrada com este e-mail.");

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
            .Where(pa => pa.AlunoId == id && pa.Ativo)
            .ToListAsync();

        foreach (var vinculo in vinculos)
            vinculo.Ativo = false;

        aluno.Usuario.Ativo = false;
        var tokens = await _context.RefreshTokens
            .Where(token => token.UsuarioId == aluno.UsuarioId && token.RevogadoEm == null)
            .ToListAsync();
        foreach (var token in tokens)
            token.RevogadoEm = DateTime.UtcNow;

        var personaisNotificados = await _context.Personais.AsNoTracking()
            .Where(p => p.Usuario!.Ativo)
            .Select(p => new { p.UsuarioId, p.Nome })
            .ToListAsync();

        await _context.SaveChangesAsync();

        foreach (var personal in personaisNotificados)
        {
            await _comunicacao.NotificarUsuarioAsync(
                personal.UsuarioId,
                "Aluno desativado pela administração",
                $"{aluno.NomeCompleto} foi desativado pela administração. O histórico foi preservado. Motivo: {motivo}",
                "ALUNO_DESATIVADO",
                aluno.Id);
        }

        await _auditoria.RegistrarOperacaoDetalhadaAsync(
            "EXCLUSAO_ALUNO",
            "DELETE",
            $"/api/Aluno/{id}",
            id,
            $"Aluno {aluno.NomeCompleto} desativado. Personais da equipe notificados: {personaisNotificados.Count}. Motivo: {motivo}");

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
