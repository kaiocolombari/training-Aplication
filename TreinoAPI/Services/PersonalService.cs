using Microsoft.EntityFrameworkCore;
using TreinoAPI.Data;
using TreinoAPI.DTOs;
using TreinoAPI.DTOs.Personal;
using TreinoAPI.Model;
using TreinoAPI.Security;

namespace TreinoAPI.Services;

public class PersonalService
{
    private readonly AppDbContext _context;
    private readonly PasswordService _passwords;
    private readonly ComunicacaoService _comunicacao;
    private readonly AuditoriaService _auditoria;

    public PersonalService(
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

    public async Task<PersonalDTO> Criar(CriarPersonalDTO dto)
    {
        var email = NormalizeEmail(dto.Email);
        if (await _context.Usuarios.AnyAsync(u => u.Email == email))
            throw DomainException.Conflict("Já existe uma conta cadastrada com este e-mail.");

        var usuario = new Usuario
        {
            Email = email,
            Telefone = dto.Telefone?.Trim(),
            Tipo = TipoUsuario.PERSONAL,
            CriadoEm = DateTime.UtcNow,
            SenhaHashed = _passwords.Hash(dto.Senha)
        };

        var personal = new Personal
        {
            Nome = dto.NomeCompleto.Trim(),
            Usuario = usuario
        };

        _context.Personais.Add(personal);
        await _context.SaveChangesAsync();

        return Mapear(personal, usuario);
    }

    public async Task<List<PersonalDTO>> Listar()
    {
        return await _context.Personais
            .AsNoTracking()
            .Include(p => p.Usuario)
            .Where(p => p.Usuario!.Ativo)
            .Select(p => new PersonalDTO
            {
                Id = p.Id,
                UsuarioId = p.UsuarioId,
                NomeCompleto = p.Nome,
                Email = p.Usuario!.Email,
                Telefone = p.Usuario.Telefone
            })
            .ToListAsync();
    }

    public async Task<PersonalDTO?> BuscarPorId(Guid id)
    {
        var personal = await _context.Personais
            .AsNoTracking()
            .Include(p => p.Usuario)
            .FirstOrDefaultAsync(p => p.Id == id && p.Usuario!.Ativo);

        return personal is null ? null : Mapear(personal, personal.Usuario!);
    }

    public async Task<PersonalDTO?> Atualizar(Guid id, AtualizarPersonalDTO dto)
    {
        var personal = await _context.Personais
            .Include(p => p.Usuario)
            .FirstOrDefaultAsync(p => p.Id == id && p.Usuario!.Ativo);

        if (personal is null || personal.Usuario is null)
            return null;

        if (dto.Nome is not null)
            personal.Nome = dto.Nome.Trim();

        if (dto.Email is not null)
        {
            var email = NormalizeEmail(dto.Email);
            var exists = await _context.Usuarios.AnyAsync(u => u.Id != personal.UsuarioId && u.Email == email);
            if (exists)
                throw DomainException.Conflict("Já existe uma conta cadastrada com este e-mail.");
            personal.Usuario.Email = email;
        }

        if (dto.Telefone is not null)
            personal.Usuario.Telefone = dto.Telefone.Trim();

        await _context.SaveChangesAsync();
        return Mapear(personal, personal.Usuario);
    }

    public async Task<PersonalExclusaoResumoDTO> ObterResumoExclusao(Guid id)
    {
        var personal = await _context.Personais.AsNoTracking()
            .Include(p => p.Usuario)
            .FirstOrDefaultAsync(p => p.Id == id && p.Usuario!.Ativo)
            ?? throw DomainException.NotFound("Personal não encontrado.");

        var alunos = await _context.PersonalAlunos.AsNoTracking()
            .Where(pa => pa.PersonalId == id && pa.Ativo && pa.Aluno.Usuario.Ativo)
            .OrderBy(pa => pa.Aluno.NomeCompleto)
            .Select(pa => new AlunoAfetadoExclusaoDTO
            {
                Id = pa.AlunoId,
                NomeCompleto = pa.Aluno.NomeCompleto,
                Email = pa.Aluno.Usuario.Email,
                OutrosPersonaisAtivos = _context.PersonalAlunos.Count(outro =>
                    outro.AlunoId == pa.AlunoId && outro.Ativo && outro.PersonalId != id &&
                    outro.Personal.Usuario!.Ativo)
            })
            .ToListAsync();

        return new PersonalExclusaoResumoDTO
        {
            Id = personal.Id,
            NomeCompleto = personal.Nome,
            Email = personal.Usuario!.Email,
            TotalAlunos = alunos.Count,
            AlunosQueFicaraoSemPersonal = alunos.Count(aluno => aluno.OutrosPersonaisAtivos == 0),
            Alunos = alunos
        };
    }

    public async Task<bool> Deletar(Guid id, MotivoOperacaoDTO? dto)
    {
        var motivo = MotivoOperacaoHelper.Formatar(dto);
        await using var transaction = await _context.Database.BeginTransactionAsync();

        var personal = await _context.Personais
            .Include(p => p.Usuario)
            .FirstOrDefaultAsync(p => p.Id == id && p.Usuario!.Ativo);
        if (personal?.Usuario is null)
            return false;

        var vinculos = await _context.PersonalAlunos
            .Include(pa => pa.Aluno).ThenInclude(a => a.Usuario)
            .Where(pa => pa.PersonalId == id && pa.Ativo && pa.Aluno.Usuario.Ativo)
            .ToListAsync();

        foreach (var vinculo in vinculos)
            vinculo.Ativo = false;

        personal.Usuario.Ativo = false;
        var tokens = await _context.RefreshTokens
            .Where(token => token.UsuarioId == personal.UsuarioId && token.RevogadoEm == null)
            .ToListAsync();
        foreach (var token in tokens)
            token.RevogadoEm = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        foreach (var vinculo in vinculos)
        {
            var outrosPersonais = await _context.PersonalAlunos.CountAsync(outro =>
                outro.AlunoId == vinculo.AlunoId && outro.Ativo && outro.Personal.Usuario!.Ativo);

            if (outrosPersonais == 0)
            {
                var mensagem = $"O personal {personal.Nome} foi removido da equipe. No momento você não possui nenhum personal ativo. Entre em contato com a administração para retomar seu acompanhamento. Motivo: {motivo}";
                await _comunicacao.NotificarUsuarioAsync(
                    vinculo.Aluno.UsuarioId,
                    "Você está sem acompanhamento",
                    mensagem,
                    "ALERTA_ACOMPANHAMENTO",
                    vinculo.AlunoId);
                await _comunicacao.NotificarAdministradoresAsync(
                    "Aluno sem personal ativo",
                    $"{vinculo.Aluno.NomeCompleto} ficou sem nenhum personal ativo após a desativação de {personal.Nome}. Motivo: {motivo}",
                    "ALERTA_ACOMPANHAMENTO",
                    vinculo.AlunoId);
            }
            else
            {
                await _comunicacao.NotificarUsuarioAsync(
                    vinculo.Aluno.UsuarioId,
                    "Personal removido da equipe",
                    $"O personal {personal.Nome} foi removido da sua equipe. Você ainda possui {outrosPersonais} personal(is) ativo(s).",
                    "VINCULO_REMOVIDO",
                    vinculo.AlunoId);
            }
        }

        var nomes = string.Join(", ", vinculos.Select(vinculo => vinculo.Aluno.NomeCompleto).Take(8));
        if (vinculos.Count > 8)
            nomes += $" e mais {vinculos.Count - 8}";
        var resumo = $"Personal {personal.Nome} desativado. Alunos afetados: {vinculos.Count}. Lista: {nomes}. Motivo: {motivo}";
        await _auditoria.RegistrarOperacaoDetalhadaAsync(
            "EXCLUSAO_PERSONAL", "DELETE", $"/api/Personal/{id}", id, resumo);

        await transaction.CommitAsync();
        return true;
    }

    private static PersonalDTO Mapear(Personal personal, Usuario usuario) => new()
    {
        Id = personal.Id,
        UsuarioId = personal.UsuarioId,
        NomeCompleto = personal.Nome,
        Email = usuario.Email,
        Telefone = usuario.Telefone
    };

    private static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();
}
