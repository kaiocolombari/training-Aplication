using Microsoft.EntityFrameworkCore;
using TreinoAPI.Data;

namespace TreinoAPI.Security;

public sealed class OwnershipService
{
    private readonly AppDbContext _db;
    private readonly CurrentUserService _current;

    public OwnershipService(AppDbContext db, CurrentUserService current)
    {
        _db = db;
        _current = current;
    }

    public async Task<List<Guid>> GetAccessibleAlunoIdsAsync()
    {
        if (_current.Role == "ADMIN")
            return await _db.Alunos.AsNoTracking().Select(a => a.Id).ToListAsync();

        if (_current.Role == "PERSONAL")
            return await _db.PersonalAlunos.AsNoTracking()
                .Where(pa => pa.Personal.UsuarioId == _current.UsuarioId && pa.Ativo)
                .Select(pa => pa.AlunoId).Distinct().ToListAsync();

        if (_current.Role == "ALUNO")
            return await _db.Alunos.AsNoTracking()
                .Where(a => a.UsuarioId == _current.UsuarioId)
                .Select(a => a.Id).ToListAsync();

        throw DomainException.Forbidden();
    }

    public async Task<Guid> GetCurrentPersonalIdAsync()
    {
        var id = await _db.Personais.AsNoTracking()
            .Where(p => p.UsuarioId == _current.UsuarioId)
            .Select(p => (Guid?)p.Id)
            .FirstOrDefaultAsync();
        return id ?? throw DomainException.Forbidden();
    }

    public async Task EnsureAlunoAccessAsync(Guid alunoId)
    {
        if (_current.Role == "ADMIN")
            return;

        var allowed = _current.Role switch
        {
            "PERSONAL" => await _db.PersonalAlunos.AnyAsync(pa =>
                pa.AlunoId == alunoId && pa.Personal.UsuarioId == _current.UsuarioId && pa.Ativo),
            "ALUNO" => await _db.Alunos.AnyAsync(a => a.Id == alunoId && a.UsuarioId == _current.UsuarioId),
            _ => false
        };

        if (!allowed)
            throw DomainException.NotFound("Aluno não encontrado.");
    }

    public async Task EnsurePersonalAccessAsync(Guid personalId)
    {
        if (_current.Role == "ADMIN")
            return;

        if (_current.Role != "PERSONAL" ||
            !await _db.Personais.AnyAsync(p => p.Id == personalId && p.UsuarioId == _current.UsuarioId))
            throw DomainException.NotFound("Personal não encontrado.");
    }

    public async Task EnsureAnamneseAccessAsync(Guid id)
    {
        var alunoId = await _db.Anamnese.Where(x => x.Id == id).Select(x => (Guid?)x.AlunoId).FirstOrDefaultAsync();
        await EnsureAlunoAccessAsync(alunoId ?? throw DomainException.NotFound("Anamnese não encontrada."));
    }

    public async Task EnsureAvaliacaoAccessAsync(Guid id)
    {
        var alunoId = await _db.Avaliacoes.Where(x => x.Id == id).Select(x => (Guid?)x.AlunoId).FirstOrDefaultAsync();
        await EnsureAlunoAccessAsync(alunoId ?? throw DomainException.NotFound("Avaliação não encontrada."));
    }

    public async Task EnsureDobraAccessAsync(Guid id)
    {
        var alunoId = await _db.DobrasCutaneas.Where(x => x.Id == id)
            .Select(x => (Guid?)x.Avaliacao.AlunoId).FirstOrDefaultAsync();
        await EnsureAlunoAccessAsync(alunoId ?? throw DomainException.NotFound("Dobra cutânea não encontrada."));
    }

    public async Task EnsurePerimetroAccessAsync(Guid id)
    {
        var alunoId = await _db.Perimetros.Where(x => x.Id == id)
            .Select(x => (Guid?)x.Avaliacao.AlunoId).FirstOrDefaultAsync();
        await EnsureAlunoAccessAsync(alunoId ?? throw DomainException.NotFound("Perímetro não encontrado."));
    }

    public async Task EnsureTesteCargaAccessAsync(Guid id)
    {
        var alunoId = await _db.TestesCarga.Where(x => x.Id == id).Select(x => (Guid?)x.AlunoId).FirstOrDefaultAsync();
        await EnsureAlunoAccessAsync(alunoId ?? throw DomainException.NotFound("Teste de carga não encontrado."));
    }

    public async Task EnsureCargaExercicioAccessAsync(Guid id)
    {
        var alunoId = await _db.CargasExercicios.Where(x => x.Id == id)
            .Select(x => (Guid?)x.TesteCarga.AlunoId).FirstOrDefaultAsync();
        await EnsureAlunoAccessAsync(alunoId ?? throw DomainException.NotFound("Carga de exercício não encontrada."));
    }

    public async Task EnsureTreinoAccessAsync(Guid id)
    {
        var alunoId = await _db.Treinos.Where(x => x.Id == id).Select(x => (Guid?)x.AlunoId).FirstOrDefaultAsync();
        await EnsureAlunoAccessAsync(alunoId ?? throw DomainException.NotFound("Treino não encontrado."));
    }

    public async Task EnsureTreinoExercicioAccessAsync(Guid treinoId, Guid id)
    {
        var alunoId = await _db.TreinosExercicios
            .Where(x => x.Id == id && x.TreinoId == treinoId)
            .Select(x => (Guid?)x.Treino.AlunoId).FirstOrDefaultAsync();
        await EnsureAlunoAccessAsync(alunoId ?? throw DomainException.NotFound("Exercício não encontrado."));
    }

    public async Task EnsurePeriodizacaoAccessAsync(Guid id)
    {
        var alunoId = await _db.Periodizacoes.Where(x => x.Id == id).Select(x => (Guid?)x.AlunoId).FirstOrDefaultAsync();
        await EnsureAlunoAccessAsync(alunoId ?? throw DomainException.NotFound("Periodização não encontrada."));
    }

    public async Task EnsureSemanaAccessAsync(Guid id)
    {
        var alunoId = await _db.PeriodizacaoSemanas.Where(x => x.Id == id)
            .Select(x => (Guid?)x.Periodizacao.AlunoId).FirstOrDefaultAsync();
        await EnsureAlunoAccessAsync(alunoId ?? throw DomainException.NotFound("Semana não encontrada."));
    }

    public async Task EnsureDiaAccessAsync(Guid id)
    {
        var alunoId = await _db.PeriodizacaoDias.Where(x => x.Id == id)
            .Select(x => (Guid?)x.Semana.Periodizacao.AlunoId).FirstOrDefaultAsync();
        await EnsureAlunoAccessAsync(alunoId ?? throw DomainException.NotFound("Dia da periodização não encontrado."));
    }

    public async Task EnsureTreinoDiaAccessAsync(Guid id)
    {
        var ownership = await _db.DiaTreinos.Where(x => x.Id == id)
            .Select(x => new { PeriodizacaoAlunoId = x.PeriodizacaoDia.Semana.Periodizacao.AlunoId, TreinoAlunoId = x.Treino.AlunoId })
            .FirstOrDefaultAsync();
        if (ownership is null || ownership.PeriodizacaoAlunoId != ownership.TreinoAlunoId)
            throw DomainException.NotFound("Treino associado ao dia não encontrado.");
        await EnsureAlunoAccessAsync(ownership.PeriodizacaoAlunoId);
    }

    public async Task EnsureVolumeAccessAsync(Guid id)
    {
        var alunoId = await _db.VolumesSemanais.Where(x => x.Id == id)
            .Select(x => (Guid?)x.PeriodizacaoSemana.Periodizacao.AlunoId).FirstOrDefaultAsync();
        await EnsureAlunoAccessAsync(alunoId ?? throw DomainException.NotFound("Volume semanal não encontrado."));
    }

    public async Task EnsureExecucaoTreinoAccessAsync(Guid id)
    {
        var alunoId = await _db.ExecucoesTreino.Where(x => x.Id == id)
            .Select(x => (Guid?)x.Treino.AlunoId).FirstOrDefaultAsync();
        await EnsureAlunoAccessAsync(alunoId ?? throw DomainException.NotFound("Execução de treino não encontrada."));
    }

    public async Task EnsureVinculoAccessAsync(Guid id)
    {
        if (_current.Role == "ADMIN")
            return;

        var allowed = _current.Role == "PERSONAL" && await _db.PersonalAlunos.AnyAsync(pa =>
            pa.Id == id && pa.Personal.UsuarioId == _current.UsuarioId);
        if (!allowed)
            throw DomainException.NotFound("Vínculo não encontrado.");
    }
}
