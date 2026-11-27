using Microsoft.EntityFrameworkCore;
using TreinoAPI.Data;
using TreinoAPI.DTOs;
using TreinoAPI.DTOs.PersonalAluno;
using TreinoAPI.Model;
using TreinoAPI.Security;

namespace TreinoAPI.Services;

public class PersonalAlunoService
{
    private readonly AppDbContext _context;
    private readonly ComunicacaoService _comunicacao;
    private readonly AuditoriaService _auditoria;
    private readonly CurrentUserService _current;

    public PersonalAlunoService(
        AppDbContext context,
        ComunicacaoService comunicacao,
        AuditoriaService auditoria,
        CurrentUserService current)
    {
        _context = context;
        _comunicacao = comunicacao;
        _auditoria = auditoria;
        _current = current;
    }

    public async Task<List<PersonalAlunoDTO>> BuscarAlunos(Guid personalId)
    {
        return await _context.PersonalAlunos
            .AsNoTracking()
            .Where(pa => pa.PersonalId == personalId && pa.Ativo &&
                pa.Personal.Usuario!.Ativo && pa.Aluno.Usuario.Ativo)
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

    public async Task<List<PersonalAlunoVinculoDTO>> BuscarVinculosAluno(Guid alunoId)
    {
        return await _context.PersonalAlunos
            .AsNoTracking()
            .Where(pa => pa.AlunoId == alunoId && pa.Personal.Usuario!.Ativo)
            .OrderByDescending(pa => pa.Ativo)
            .ThenBy(pa => pa.CriadoEm)
            .Select(pa => new PersonalAlunoVinculoDTO
            {
                Id = pa.Id,
                PersonalId = pa.PersonalId,
                PersonalNome = pa.Personal.Nome,
                AlunoId = pa.AlunoId,
                Ativo = pa.Ativo,
                CriadoEm = pa.CriadoEm
            })
            .ToListAsync();
    }

    public Task<Guid?> ObterAlunoIdPorVinculo(Guid id) => _context.PersonalAlunos
        .AsNoTracking()
        .Where(pa => pa.Id == id)
        .Select(pa => (Guid?)pa.AlunoId)
        .FirstOrDefaultAsync();

    public async Task<PersonalAlunoDTO?> VincularAluno(VincularAlunoDTO dto)
    {
        var personal = await _context.Personais.AnyAsync(p => p.Id == dto.PersonalId && p.Usuario!.Ativo);
        if (!personal)
            throw DomainException.NotFound("Personal não encontrado.");

        var aluno = await _context.Alunos.FirstOrDefaultAsync(a => a.Id == dto.AlunoId && a.Usuario.Ativo);
        if (aluno is null) throw DomainException.NotFound("Aluno não encontrado.");

        var existing = await _context.PersonalAlunos.FirstOrDefaultAsync(pa =>
            pa.PersonalId == dto.PersonalId && pa.AlunoId == dto.AlunoId);

        if (existing is not null)
        {
            if (existing.Ativo)
                throw DomainException.Conflict("Aluno já está vinculado a este Personal.");

            existing.Ativo = true;
            aluno.ConvidadoPorPersonalId ??= dto.PersonalId;
            await _context.SaveChangesAsync();
            await NotificarNovoVinculoAsync(dto.PersonalId, dto.AlunoId);
            return Mapear(existing);
        }

        var vinculo = new PersonalAluno
        {
            PersonalId = dto.PersonalId,
            AlunoId = dto.AlunoId,
            Ativo = true,
            CriadoEm = DateTime.UtcNow
        };

        _context.PersonalAlunos.Add(vinculo);
        aluno.ConvidadoPorPersonalId ??= dto.PersonalId;
        await _context.SaveChangesAsync();
        await NotificarNovoVinculoAsync(dto.PersonalId, dto.AlunoId);
        return Mapear(vinculo);
    }

    public async Task<PersonalAlunoDTO?> AtualizarVinculo(Guid id, AtualizarPersonalAlunoDTO dto)
    {
        var vinculo = await _context.PersonalAlunos.FirstOrDefaultAsync(pa => pa.Id == id);
        if (vinculo is null)
            return null;

        if (!dto.Ativo)
        {
            var motivoPadrao = _current.Role == "PERSONAL"
                ? "SOLICITACAO_PERSONAL"
                : "ENCERRAMENTO_ADMINISTRATIVO";
            var removido = await DesvincularVinculo(id, new MotivoOperacaoDTO
            {
                Motivo = string.IsNullOrWhiteSpace(dto.Motivo) ? motivoPadrao : dto.Motivo,
                Detalhe = dto.Detalhe
            });
            if (!removido)
                return null;
            return Mapear(vinculo);
        }

        var jaEstavaAtivo = vinculo.Ativo;
        if (!jaEstavaAtivo)
        {
            var contasAtivas = await _context.PersonalAlunos.AnyAsync(pa => pa.Id == id &&
                pa.Personal.Usuario!.Ativo && pa.Aluno.Usuario.Ativo);
            if (!contasAtivas)
                throw DomainException.Conflict("Não é possível reativar um vínculo de conta desativada.");
        }

        vinculo.Ativo = dto.Ativo;
        await _context.SaveChangesAsync();
        if (!jaEstavaAtivo)
            await NotificarNovoVinculoAsync(vinculo.PersonalId, vinculo.AlunoId);
        return Mapear(vinculo);
    }

    public async Task<bool> DeletarVinculo(Guid id, MotivoOperacaoDTO? dto)
    {
        return await DesvincularVinculo(id, dto);
    }

    private async Task<bool> DesvincularVinculo(Guid id, MotivoOperacaoDTO? dto)
    {
        var motivoPadrao = _current.Role == "PERSONAL"
            ? "SOLICITACAO_PERSONAL"
            : "ENCERRAMENTO_ADMINISTRATIVO";
        var motivo = MotivoOperacaoHelper.Formatar(dto, motivoPadrao);
        await using var transaction = await _context.Database.BeginTransactionAsync();

        var vinculo = await _context.PersonalAlunos
            .Include(pa => pa.Personal).ThenInclude(p => p.Usuario)
            .Include(pa => pa.Aluno).ThenInclude(a => a.Usuario)
            .FirstOrDefaultAsync(pa => pa.Id == id);
        if (vinculo is null)
            return false;
        if (!vinculo.Ativo)
            return true;

        vinculo.Ativo = false;
        await _context.SaveChangesAsync();

        if (_current.Role != "PERSONAL" && vinculo.Personal.Usuario?.Ativo == true)
        {
            await _comunicacao.NotificarUsuarioAsync(
                vinculo.Personal.UsuarioId,
                "Registro de origem atualizado",
                $"A associação histórica de convite de {vinculo.Aluno.NomeCompleto} foi desativada. O acesso compartilhado da equipe ao aluno não é afetado. Motivo: {motivo}",
                "ORIGEM_CONVITE_ATUALIZADA",
                vinculo.AlunoId);
        }

        await _auditoria.RegistrarOperacaoDetalhadaAsync(
            "DESVINCULACAO_ALUNO",
            "DELETE",
            $"/api/PersonalAluno/{id}",
            vinculo.AlunoId,
            $"Associação histórica de convite entre o aluno {vinculo.Aluno.NomeCompleto} e o personal {vinculo.Personal.Nome} desativada. O acesso compartilhado da equipe permanece ativo. Motivo: {motivo}");

        await transaction.CommitAsync();
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

    private async Task NotificarNovoVinculoAsync(Guid personalId, Guid alunoId)
    {
        var dados = await _context.Personais
            .Where(p => p.Id == personalId && p.Usuario!.Ativo)
            .Select(p => new
            {
                p.UsuarioId,
                NomeAluno = _context.Alunos.Where(a => a.Id == alunoId && a.Usuario.Ativo)
                    .Select(a => a.NomeCompleto).FirstOrDefault()
            })
            .FirstOrDefaultAsync();

        if (dados?.NomeAluno is not null)
        {
            await _comunicacao.NotificarUsuarioAsync(
                dados.UsuarioId,
                "Origem de convite associada",
                $"O registro histórico de convite de {dados.NomeAluno} foi associado ao seu perfil. Isso não restringe o acesso dos demais profissionais da equipe.",
                "SISTEMA",
                alunoId);
        }
    }
}
