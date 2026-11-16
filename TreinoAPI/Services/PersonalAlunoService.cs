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

    public async Task<PersonalAlunoDTO?> VincularAluno(VincularAlunoDTO dto)
    {
        var personal = await _context.Personais.AnyAsync(p => p.Id == dto.PersonalId && p.Usuario!.Ativo);
        if (!personal)
            throw DomainException.NotFound("Personal não encontrado.");

        var aluno = await _context.Alunos.AnyAsync(a => a.Id == dto.AlunoId && a.Usuario.Ativo);
        if (!aluno)
            throw DomainException.NotFound("Aluno não encontrado.");

        var existing = await _context.PersonalAlunos.FirstOrDefaultAsync(pa =>
            pa.PersonalId == dto.PersonalId && pa.AlunoId == dto.AlunoId);

        if (existing is not null)
        {
            if (existing.Ativo)
                throw DomainException.Conflict("Aluno já está vinculado a este Personal.");

            var activeCount = await _context.PersonalAlunos.CountAsync(pa =>
                pa.AlunoId == dto.AlunoId && pa.Ativo && pa.Personal.Usuario!.Ativo);
            if (activeCount >= 3)
                throw DomainException.Conflict("O aluno já possui o limite de 3 personais ativos.");

            existing.Ativo = true;
            await _context.SaveChangesAsync();
            await NotificarNovoVinculoAsync(dto.PersonalId, dto.AlunoId);
            return Mapear(existing);
        }

        var quantity = await _context.PersonalAlunos.CountAsync(pa =>
            pa.AlunoId == dto.AlunoId && pa.Ativo && pa.Personal.Usuario!.Ativo);
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
            var activeCount = await _context.PersonalAlunos.CountAsync(pa =>
                pa.AlunoId == vinculo.AlunoId && pa.Ativo && pa.Personal.Usuario!.Ativo);
            if (activeCount >= 3)
                throw DomainException.Conflict("O aluno já possui o limite de 3 personais ativos.");

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
                "Aluno removido da carteira",
                $"{vinculo.Aluno.NomeCompleto} foi removido da sua carteira. Motivo: {motivo}",
                "VINCULO_REMOVIDO",
                vinculo.AlunoId);
        }

        var outrosPersonais = await _context.PersonalAlunos.CountAsync(outro =>
            outro.AlunoId == vinculo.AlunoId && outro.Ativo && outro.Personal.Usuario!.Ativo);
        if (outrosPersonais == 0 && vinculo.Aluno.Usuario.Ativo)
        {
            var mensagem = $"Seu vínculo com {vinculo.Personal.Nome} foi encerrado. No momento você não possui nenhum personal ativo. Entre em contato com a administração para retomar seu acompanhamento. Motivo: {motivo}";
            await _comunicacao.NotificarUsuarioAsync(
                vinculo.Aluno.UsuarioId,
                "Você está sem acompanhamento",
                mensagem,
                "ALERTA_ACOMPANHAMENTO",
                vinculo.AlunoId);
            await _comunicacao.NotificarAdministradoresAsync(
                "Aluno sem personal ativo",
                $"{vinculo.Aluno.NomeCompleto} ficou sem nenhum personal ativo após a remoção do vínculo com {vinculo.Personal.Nome}. Motivo: {motivo}",
                "ALERTA_ACOMPANHAMENTO",
                vinculo.AlunoId);
        }

        await _auditoria.RegistrarOperacaoDetalhadaAsync(
            "DESVINCULACAO_ALUNO",
            "DELETE",
            $"/api/PersonalAluno/{id}",
            vinculo.AlunoId,
            $"Aluno {vinculo.Aluno.NomeCompleto} desvinculado do personal {vinculo.Personal.Nome}. Personais restantes: {outrosPersonais}. Motivo: {motivo}");

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
                "Novo aluno vinculado",
                $"{dados.NomeAluno} foi vinculado à sua equipe.",
                "SISTEMA",
                alunoId);
        }
    }
}
