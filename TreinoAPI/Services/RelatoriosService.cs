using Microsoft.EntityFrameworkCore;
using TreinoAPI.Data;
using TreinoAPI.DTOs.Relatorios;
using TreinoAPI.Model;
using TreinoAPI.Security;

namespace TreinoAPI.Services;

public sealed class RelatoriosService
{
    private readonly AppDbContext _db;
    private readonly OwnershipService _ownership;

    public RelatoriosService(AppDbContext db, OwnershipService ownership)
    {
        _db = db;
        _ownership = ownership;
    }

    public async Task<RelatorioGeralDTO> ObterAsync(DateOnly? inicio, DateOnly? fim)
    {
        var hoje = DateOnly.FromDateTime(DateTime.UtcNow);
        var dataFim = fim ?? hoje;
        var dataInicio = inicio ?? dataFim.AddDays(-29);
        var inicioUtc = dataInicio.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var fimUtc = dataFim.AddDays(1).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var alunoIds = await _ownership.GetAccessibleAlunoIdsAsync();
        var alunoIdsAprovados = await _db.Alunos.AsNoTracking()
            .Where(a => alunoIds.Contains(a.Id) && a.StatusCadastro == StatusCadastroAluno.APROVADO)
            .Select(a => a.Id)
            .ToArrayAsync();
        var alunos = _db.Alunos.AsNoTracking().Where(a => alunoIdsAprovados.Contains(a.Id));

        var totalAlunos = await alunos.CountAsync();
        var semFicha = await alunos.CountAsync(a =>
            !a.Avaliacoes.Any(av => av.Ativo) &&
            !a.Treinos.Any(t => t.Ativo) &&
            !a.Anamneses.Any() &&
            !a.TestesCarga.Any() &&
            !a.Periodizacoes.Any());
        var pendentes = _db.Alunos.Where(a => a.StatusCadastro == StatusCadastroAluno.PENDENTE);
        var totalPendentes = await pendentes.CountAsync();
        var aguardandoFormulario = await pendentes.CountAsync(a => a.SolicitacaoCadastro == null);
        var treinosAtivos = await _db.Treinos.CountAsync(t => alunoIdsAprovados.Contains(t.AlunoId) && t.Ativo);
        var avaliacoesAtivas = await _db.Avaliacoes.CountAsync(a => alunoIdsAprovados.Contains(a.AlunoId) && a.Ativo);
        var alunosNovos = await alunos.CountAsync(a => a.CriadoEm >= inicioUtc && a.CriadoEm < fimUtc);
        var execucoesPeriodo = await _db.ExecucoesTreino.CountAsync(e =>
            alunoIdsAprovados.Contains(e.Treino.AlunoId) && e.Data >= dataInicio && e.Data <= dataFim);

        var primeiroMes = new DateOnly(hoje.Year, hoje.Month, 1).AddMonths(-5);
        var ultimoMesExclusive = new DateOnly(hoje.Year, hoje.Month, 1).AddMonths(1);
        var primeiroMesUtc = primeiroMes.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var ultimoMesUtc = ultimoMesExclusive.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);

        var alunosMensais = await alunos
            .Where(a => a.CriadoEm >= primeiroMesUtc && a.CriadoEm < ultimoMesUtc)
            .GroupBy(a => new { a.CriadoEm.Year, a.CriadoEm.Month })
            .Select(g => new { g.Key.Year, g.Key.Month, Total = g.Count() })
            .ToListAsync();
        var avaliacoesMensais = await _db.Avaliacoes.AsNoTracking()
            .Where(a => alunoIdsAprovados.Contains(a.AlunoId) && a.Ativo && a.CriadaEm >= primeiroMesUtc && a.CriadaEm < ultimoMesUtc)
            .GroupBy(a => new { a.CriadaEm.Year, a.CriadaEm.Month })
            .Select(g => new { g.Key.Year, g.Key.Month, Total = g.Count() })
            .ToListAsync();
        var treinosMensais = await _db.Treinos.AsNoTracking()
            .Where(t => alunoIdsAprovados.Contains(t.AlunoId) && t.Ativo && t.CriadoEm >= primeiroMesUtc && t.CriadoEm < ultimoMesUtc)
            .GroupBy(t => new { t.CriadoEm.Year, t.CriadoEm.Month })
            .Select(g => new { g.Key.Year, g.Key.Month, Total = g.Count() })
            .ToListAsync();
        var execucoesMensais = await _db.ExecucoesTreino.AsNoTracking()
            .Where(e => alunoIdsAprovados.Contains(e.Treino.AlunoId) && e.Data >= primeiroMes && e.Data < ultimoMesExclusive)
            .GroupBy(e => new { e.Data.Year, e.Data.Month })
            .Select(g => new { g.Key.Year, g.Key.Month, Total = g.Count() })
            .ToListAsync();

        var evolucao = Enumerable.Range(0, 6).Select(indice => primeiroMes.AddMonths(indice)).Select(mes =>
        {
            int Contar<T>(IEnumerable<T> itens, Func<T, int> ano, Func<T, int> numeroMes, Func<T, int> total) =>
                itens.Where(item => ano(item) == mes.Year && numeroMes(item) == mes.Month).Select(total).FirstOrDefault();

            return new RelatorioMensalDTO
            {
                Mes = mes.ToDateTime(TimeOnly.MinValue).ToString("MMM/yy", System.Globalization.CultureInfo.GetCultureInfo("pt-BR")),
                AlunosNovos = Contar(alunosMensais, item => item.Year, item => item.Month, item => item.Total),
                AvaliacoesCriadas = Contar(avaliacoesMensais, item => item.Year, item => item.Month, item => item.Total),
                TreinosCriados = Contar(treinosMensais, item => item.Year, item => item.Month, item => item.Total),
                Execucoes = Contar(execucoesMensais, item => item.Year, item => item.Month, item => item.Total)
            };
        }).ToList();

        return new RelatorioGeralDTO
        {
            Inicio = dataInicio,
            Fim = dataFim,
            TotalAlunos = totalAlunos,
            CadastrosEmAnalise = totalPendentes,
            CadastrosAguardandoFormulario = aguardandoFormulario,
            AlunosSemFichaTecnica = semFicha,
            AlunosComFichaTecnica = totalAlunos - semFicha,
            TreinosAtivos = treinosAtivos,
            AvaliacoesAtivas = avaliacoesAtivas,
            AlunosNovosNoPeriodo = alunosNovos,
            ExecucoesNoPeriodo = execucoesPeriodo,
            EvolucaoMensal = evolucao
        };
    }
}
