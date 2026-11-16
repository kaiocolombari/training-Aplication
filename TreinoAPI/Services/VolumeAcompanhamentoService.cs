using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using TreinoAPI.Data;
using TreinoAPI.DTOs.VolumeAcompanhamento;
using TreinoAPI.Model;
using TreinoAPI.Security;

namespace TreinoAPI.Services;

public sealed class VolumeAcompanhamentoService
{
    private const int TotalMeses = 12;
    private const int MaximoSeries = 1000;
    private const int MaximoObservacao = 500;
    private readonly AppDbContext _db;

    public VolumeAcompanhamentoService(AppDbContext db) => _db = db;

    public async Task<List<VolumeCicloDTO>> ListarAsync(Guid alunoId)
    {
        var ciclos = await _db.TreinoVolumeCiclos
            .AsNoTracking()
            .Where(c => c.AlunoId == alunoId)
            .Include(c => c.Registros)
            .OrderByDescending(c => c.CriadoEm)
            .ToListAsync();

        var hoje = HojeBrasil();
        return ciclos.Select(c => Mapear(c, hoje)).ToList();
    }

    public async Task<VolumeCicloDTO> IniciarAsync(
        Guid alunoId,
        IniciarCicloVolumeDTO dto,
        Guid usuarioId)
    {
        if (dto.TreinoId == Guid.Empty)
            throw DomainException.BadRequest("Selecione um treino válido.");

        var treino = await _db.Treinos
            .AsNoTracking()
            .Include(t => t.TreinoExercicios)
            .FirstOrDefaultAsync(t => t.Id == dto.TreinoId && t.AlunoId == alunoId && t.Ativo);

        if (treino is null)
            throw DomainException.NotFound("Treino ativo não encontrado para este aluno.");

        var exercicios = treino.TreinoExercicios
            .OrderBy(e => e.Ordem ?? int.MaxValue)
            .Select(e => new VolumeExercicioSnapshotDTO
            {
                Exercicio = e.Exercicio,
                SeriesPlanejadas = Math.Max(0, e.Series ?? 0)
            })
            .ToList();

        var totalSeries = exercicios.Sum(e => e.SeriesPlanejadas);
        if (totalSeries <= 0 || totalSeries > MaximoSeries)
            throw DomainException.BadRequest("O treino precisa possuir entre 1 e 1000 séries planejadas para iniciar o acompanhamento.");

        var hoje = HojeBrasil();
        var dataInicio = dto.DataInicio ?? hoje;
        if (dataInicio > hoje || dataInicio < hoje.AddDays(-1))
            throw DomainException.BadRequest("A data de início deve corresponder à data atual.");

        var agora = DateTime.UtcNow;
        await using var transaction = await _db.Database.BeginTransactionAsync();

        var ciclosAbertos = await _db.TreinoVolumeCiclos
            .Where(c => c.TreinoId == treino.Id && c.EncerradoEm == null)
            .ToListAsync();
        foreach (var cicloAnterior in ciclosAbertos)
            cicloAnterior.EncerradoEm = agora;

        var ciclo = new TreinoVolumeCiclo
        {
            Id = Guid.NewGuid(),
            AlunoId = alunoId,
            TreinoId = treino.Id,
            TreinoNomeSnapshot = treino.Nome,
            ReferenciaSeries = totalSeries,
            DataInicio = dataInicio,
            ExerciciosSnapshotJson = JsonSerializer.Serialize(exercicios),
            CriadoEm = agora,
            CriadoPorUsuarioId = usuarioId
        };

        _db.TreinoVolumeCiclos.Add(ciclo);
        try
        {
            await _db.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch (DbUpdateException ex) when (
            ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            await transaction.RollbackAsync();
            throw DomainException.Conflict("Outro ciclo foi iniciado para este treino. Atualize a tela antes de tentar novamente.");
        }

        return Mapear(ciclo, hoje);
    }

    public async Task<VolumeCicloDTO> RegistrarAsync(
        Guid cicloId,
        RegistrarVolumeMensalDTO dto,
        Guid usuarioId)
    {
        if (dto.MesCiclo < 2 || dto.MesCiclo > TotalMeses)
            throw DomainException.BadRequest("O registro mensal deve corresponder aos meses 2 a 12. O mês 1 é a referência inicial.");
        if (dto.SeriesInformadas < 0 || dto.SeriesInformadas > MaximoSeries)
            throw DomainException.BadRequest("Informe uma quantidade entre 0 e 1000 séries.");
        if (dto.Observacao?.Length > MaximoObservacao)
            throw DomainException.BadRequest($"A observação deve ter no máximo {MaximoObservacao} caracteres.");

        var ciclo = await _db.TreinoVolumeCiclos
            .Include(c => c.Registros)
            .FirstOrDefaultAsync(c => c.Id == cicloId);
        if (ciclo is null)
            throw DomainException.NotFound("Ciclo de acompanhamento não encontrado.");
        if (ciclo.EncerradoEm.HasValue)
            throw DomainException.Conflict("Este ciclo foi encerrado quando um novo ciclo foi iniciado. O histórico permanece disponível para consulta.");

        var hoje = HojeBrasil();
        var fimMes = ciclo.DataInicio.AddMonths(dto.MesCiclo - 1).AddDays(-1);
        if (hoje < fimMes)
            throw DomainException.BadRequest("O registro só pode ser enviado após o fechamento do período mensal.");
        if (hoje >= ciclo.DataInicio.AddMonths(TotalMeses))
            throw DomainException.Conflict("O período de 12 meses deste ciclo já foi encerrado.");
        if (ciclo.Registros.Any(r => r.MesCiclo == dto.MesCiclo))
            throw DomainException.Conflict("Já existe um registro para este mês do acompanhamento.");

        ciclo.Registros.Add(new TreinoVolumeRegistroMensal
        {
            Id = Guid.NewGuid(),
            CicloId = ciclo.Id,
            MesCiclo = dto.MesCiclo,
            SeriesInformadas = dto.SeriesInformadas,
            Observacao = string.IsNullOrWhiteSpace(dto.Observacao) ? null : dto.Observacao.Trim(),
            RegistradoEm = DateTime.UtcNow,
            RegistradoPorUsuarioId = usuarioId
        });

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (
            ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            throw DomainException.Conflict("Já existe um registro para este mês do acompanhamento.");
        }
        return Mapear(ciclo, hoje);
    }

    private static VolumeCicloDTO Mapear(TreinoVolumeCiclo ciclo, DateOnly hoje)
    {
        var exercicios = JsonSerializer.Deserialize<List<VolumeExercicioSnapshotDTO>>(
            ciclo.ExerciciosSnapshotJson) ?? [];
        var registros = ciclo.Registros.ToDictionary(r => r.MesCiclo);
        var encerrado = ciclo.EncerradoEm.HasValue || hoje >= ciclo.DataInicio.AddMonths(TotalMeses);
        var meses = new List<VolumeMesDTO>(TotalMeses);
        int? seriesMesAnterior = null;

        for (var mes = 1; mes <= TotalMeses; mes++)
        {
            var inicio = mes == 1
                ? ciclo.DataInicio
                : ciclo.DataInicio.AddMonths(mes - 2);
            var fim = mes == 1
                ? ciclo.DataInicio
                : ciclo.DataInicio.AddMonths(mes - 1).AddDays(-1);
            var temRegistro = registros.TryGetValue(mes, out var registro);
            int? series = mes == 1
                ? ciclo.ReferenciaSeries
                : temRegistro ? registro!.SeriesInformadas : null;

            int? diferencaReferencia = series.HasValue ? series.Value - ciclo.ReferenciaSeries : null;
            decimal? variacaoReferencia = series.HasValue
                ? Percentual(diferencaReferencia!.Value, ciclo.ReferenciaSeries)
                : null;
            int? diferencaAnterior = series.HasValue && seriesMesAnterior.HasValue
                ? series.Value - seriesMesAnterior.Value
                : null;
            decimal? variacaoAnterior = diferencaAnterior.HasValue && seriesMesAnterior.GetValueOrDefault() > 0
                ? Percentual(diferencaAnterior.Value, seriesMesAnterior!.Value)
                : null;

            meses.Add(new VolumeMesDTO
            {
                MesCiclo = mes,
                Inicio = inicio,
                Fim = fim,
                Series = series,
                Origem = mes == 1 ? "REFERENCIA" : temRegistro ? "REGISTRO" : "SEM_REGISTRO",
                DiferencaReferencia = diferencaReferencia,
                VariacaoReferenciaPercentual = variacaoReferencia,
                ClassificacaoReferencia = mes == 1
                    ? "REFERENCIA"
                    : series.HasValue ? Classificar(series.Value, ciclo.ReferenciaSeries) : null,
                DiferencaMesAnterior = diferencaAnterior,
                VariacaoMesAnteriorPercentual = variacaoAnterior,
                ClassificacaoMesAnterior = diferencaAnterior.HasValue
                    ? Classificar(series!.Value, seriesMesAnterior!.Value)
                    : null,
                RegistradoEm = registro?.RegistradoEm,
                Observacao = registro?.Observacao,
                PodeRegistrar = mes > 1 && !encerrado && !temRegistro && hoje >= fim
            });

            seriesMesAnterior = series;
        }

        return new VolumeCicloDTO
        {
            Id = ciclo.Id,
            TreinoId = ciclo.TreinoId,
            TreinoNome = ciclo.TreinoNomeSnapshot,
            DataInicio = ciclo.DataInicio,
            ReferenciaSeries = ciclo.ReferenciaSeries,
            CriadoEm = ciclo.CriadoEm,
            EncerradoEm = ciclo.EncerradoEm,
            Encerrado = encerrado,
            Exercicios = exercicios,
            Meses = meses
        };
    }

    private static decimal Percentual(int diferenca, int referencia) =>
        Math.Round(diferenca / (decimal)referencia * 100m, 2, MidpointRounding.AwayFromZero);

    private static string Classificar(int atual, int referencia) => atual > referencia
        ? "EVOLUCAO"
        : atual < referencia ? "QUEDA" : "MANUTENCAO";

    private static DateOnly HojeBrasil() => DateOnly.FromDateTime(DateTime.UtcNow.AddHours(-3));
}
