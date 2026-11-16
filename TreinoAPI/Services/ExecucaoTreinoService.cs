using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using TreinoAPI.Data;
using TreinoAPI.DTOs.Execucao;
using TreinoAPI.Model;
using TreinoAPI.Security;

namespace TreinoAPI.Services;

public sealed class ExecucaoTreinoService
{
    private const double EstimuloMaximo = 16.5;
    private readonly AppDbContext _db;

    public ExecucaoTreinoService(AppDbContext db) => _db = db;

    public async Task<ExecucaoTreinoDTO> SalvarAtualAsync(Guid treinoId, AtualizarExecucaoTreinoDTO dto)
    {
        var treino = await _db.Treinos
            .Include(t => t.TreinoExercicios)
            .FirstOrDefaultAsync(t => t.Id == treinoId);

        if (treino is null)
            throw DomainException.NotFound("Treino não encontrado.");
        if (!treino.Ativo)
            throw DomainException.Conflict("Não é possível registrar execução em um treino arquivado.");

        var data = dto.Data ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var session = await _db.ExecucoesTreino
            .Include(e => e.Exercicios)
                .ThenInclude(e => e.Series)
            .FirstOrDefaultAsync(e => e.TreinoId == treinoId && e.Data == data);

        if (session is null)
        {
            session = new ExecucaoTreino
            {
                TreinoId = treinoId,
                Data = data,
                CriadoEm = DateTime.UtcNow,
                AtualizadoEm = DateTime.UtcNow
            };
            _db.ExecucoesTreino.Add(session);
        }
        else
        {
            session.AtualizadoEm = DateTime.UtcNow;
        }

        var exercisesById = treino.TreinoExercicios.ToDictionary(e => e.Id);
        var duplicateIds = dto.Exercicios
            .GroupBy(e => e.TreinoExercicioId)
            .Any(g => g.Count() > 1);
        if (duplicateIds)
            throw DomainException.BadRequest("Um exercício não pode aparecer duas vezes na mesma execução.");

        foreach (var input in dto.Exercicios)
        {
            if (!exercisesById.TryGetValue(input.TreinoExercicioId, out var prescribedExercise))
                throw DomainException.BadRequest("Um dos exercícios informados não pertence a este treino.");

            var exercise = session.Exercicios.FirstOrDefault(e =>
                e.TreinoExercicioId == prescribedExercise.Id);
            if (exercise is null)
            {
                exercise = new ExecucaoExercicio
                {
                    TreinoExercicioId = prescribedExercise.Id,
                    Nome = prescribedExercise.Exercicio
                };
                session.Exercicios.Add(exercise);
            }
            else
            {
                _db.ExecucoesSerie.RemoveRange(exercise.Series);
                exercise.Series.Clear();
            }

            exercise.Series = input.Series
                .OrderBy(s => s.Numero)
                .Select(MapearSerie)
                .ToList();

            CalcularResultado(exercise);
        }

        await _db.SaveChangesAsync();
        return Mapear(session);
    }

    public async Task<ExecucaoTreinoDTO?> ObterAtualAsync(Guid treinoId, DateOnly? data)
    {
        var date = data ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var session = await _db.ExecucoesTreino
            .AsNoTracking()
            .Include(e => e.Exercicios)
                .ThenInclude(e => e.Series)
            .FirstOrDefaultAsync(e => e.TreinoId == treinoId && e.Data == date);

        return session is null ? null : Mapear(session);
    }

    public async Task<List<ExecucaoTreinoDTO>> ListarAsync(Guid treinoId)
    {
        var sessions = await _db.ExecucoesTreino
            .AsNoTracking()
            .Where(e => e.TreinoId == treinoId)
            .Include(e => e.Exercicios)
                .ThenInclude(e => e.Series)
            .OrderByDescending(e => e.Data)
            .ToListAsync();

        return sessions.Select(Mapear).ToList();
    }

    public async Task<bool> DeletarAsync(Guid id)
    {
        var session = await _db.ExecucoesTreino.FirstOrDefaultAsync(e => e.Id == id);
        if (session is null)
            return false;

        _db.ExecucoesTreino.Remove(session);
        await _db.SaveChangesAsync();
        return true;
    }

    private static ExecucaoSerie MapearSerie(ExecucaoSerieInputDTO dto) => new()
    {
        Numero = dto.Numero,
        Carga = dto.Carga,
        Repeticoes = dto.Repeticoes,
        Rir = dto.Rir,
        Descanso = dto.Descanso,
        Velocidade = dto.Velocidade,
        Rpe = dto.Rpe,
        ClusterAtivo = dto.ClusterAtivo,
        ClusterBlocosJson = JsonSerializer.Serialize(dto.ClusterBlocos),
        DropSet = dto.DropSet,
        RestPause = dto.RestPause,
        Falha = dto.Falha
    };

    private static void CalcularResultado(ExecucaoExercicio exercise)
    {
        var valid = exercise.Series
            .Where(s => s.Repeticoes > 0 && s.Rir.HasValue)
            .ToList();

        exercise.HardSets = valid.Count(s => s.Rir.HasValue && s.Rir.Value <= 3);
        exercise.Tonelagem = exercise.Series.Sum(s => s.Carga * s.Repeticoes);

        var stimuli = valid.Select(s =>
        {
            var factor = s.Repeticoes <= 5 ? 1.1
                : s.Repeticoes <= 10 ? 1.0
                : s.Repeticoes <= 15 ? 0.9
                : s.Repeticoes <= 20 ? 0.7
                : 0.5;
            return s.Repeticoes * ((5 - s.Rir!.Value) / 5) * factor;
        }).ToList();

        exercise.Estimulo = stimuli.Sum();
        exercise.Intensidade = stimuli.Count == 0
            ? 0
            : Math.Clamp(stimuli.Average() / EstimuloMaximo * 100, 0, 100);
    }

    private static ExecucaoTreinoDTO Mapear(ExecucaoTreino session) => new()
    {
        Id = session.Id,
        TreinoId = session.TreinoId,
        Data = session.Data,
        Exercicios = session.Exercicios
            .OrderBy(e => e.Nome)
            .Select(e => new ExecucaoExercicioDTO
            {
                Id = e.Id,
                TreinoExercicioId = e.TreinoExercicioId,
                Nome = e.Nome,
                HardSets = e.HardSets,
                Intensidade = e.Intensidade,
                Tonelagem = e.Tonelagem,
                Estimulo = e.Estimulo,
                Series = e.Series.OrderBy(s => s.Numero).Select(s => new ExecucaoSerieDTO
                {
                    Id = s.Id,
                    Numero = s.Numero,
                    Carga = s.Carga,
                    Repeticoes = s.Repeticoes,
                    Rir = s.Rir,
                    Descanso = s.Descanso,
                    Velocidade = s.Velocidade,
                    Rpe = s.Rpe,
                    ClusterAtivo = s.ClusterAtivo,
                    ClusterBlocos = string.IsNullOrWhiteSpace(s.ClusterBlocosJson)
                        ? []
                        : JsonSerializer.Deserialize<List<int>>(s.ClusterBlocosJson) ?? [],
                    DropSet = s.DropSet,
                    RestPause = s.RestPause,
                    Falha = s.Falha
                }).ToList()
            }).ToList()
    };
}
