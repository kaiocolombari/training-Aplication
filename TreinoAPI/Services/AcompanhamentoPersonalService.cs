using Microsoft.EntityFrameworkCore;
using TreinoAPI.Data;
using TreinoAPI.DTOs.AcompanhamentoPersonal;
using TreinoAPI.Model;
using TreinoAPI.Security;

namespace TreinoAPI.Services;

public sealed class AcompanhamentoPersonalService
{
    private readonly AppDbContext _db;
    private readonly CurrentUserService _current;
    private readonly OwnershipService _ownership;

    public AcompanhamentoPersonalService(
        AppDbContext db,
        CurrentUserService current,
        OwnershipService ownership)
    {
        _db = db;
        _current = current;
        _ownership = ownership;
    }

    public async Task<AcompanhamentoPersonalDTO> ObterPainelAsync()
    {
        var agora = DateTime.UtcNow;
        var hoje = DateOnly.FromDateTime(agora);
        var inicioSemana = hoje.AddDays(-6);
        var personalId = _current.Role == "PERSONAL"
            ? await _ownership.GetCurrentPersonalIdAsync()
            : (Guid?)null;

        var alunosQuery = _db.Alunos.AsNoTracking()
            .Where(a => a.Usuario.Ativo);
        if (personalId.HasValue)
        {
            var idsVinculados = _db.PersonalAlunos.AsNoTracking()
                .Where(pa => pa.PersonalId == personalId.Value && pa.Ativo &&
                    pa.Personal.Usuario!.Ativo && pa.Aluno.Usuario.Ativo)
                .Select(pa => pa.AlunoId);
            alunosQuery = alunosQuery.Where(a => idsVinculados.Contains(a.Id));
        }

        var alunos = await alunosQuery
            .Select(a => new
            {
                a.Id,
                a.NomeCompleto,
                Email = a.Usuario.Email,
                PossuiFichaTecnica = a.Anamneses.Any() || a.Avaliacoes.Any(),
                TreinosAtivos = a.Treinos.Count(t => t.Ativo)
            })
            .OrderBy(a => a.NomeCompleto)
            .ToListAsync();
        var alunoIds = alunos.Select(a => a.Id).ToArray();

        var sessoes = await _db.ExecucoesTreino.AsNoTracking()
            .Where(e => alunoIds.Contains(e.Treino.AlunoId) && e.Fim.HasValue)
            .Include(e => e.Treino).ThenInclude(t => t.Aluno)
            .Include(e => e.Exercicios).ThenInclude(ex => ex.Series)
            .OrderByDescending(e => e.Fim)
            .Take(250)
            .ToListAsync();

        var sessoesRecentes = sessoes
            .Where(e => e.Data >= inicioSemana)
            .ToList();
        var sessoesSemRevisao = sessoes
            .Where(e => !e.RevisadaEm.HasValue)
            .ToList();

        var solicitacoesQuery = _db.SolicitacoesAvaliacoes.AsNoTracking()
            .Where(s => alunoIds.Contains(s.AlunoId) && s.Status == "PENDENTE");
        var solicitacoes = await solicitacoesQuery
            .OrderByDescending(s => s.Urgente)
            .ThenBy(s => s.DataDesejada)
            .Take(100)
            .Select(s => new
            {
                s.Id, s.AlunoId, NomeAluno = s.Aluno.NomeCompleto,
                s.Motivo, s.Urgente, s.CriadaEm, s.DataDesejada
            })
            .ToListAsync();

        var feedbackQuery = _db.FeedbacksAlunos.AsNoTracking()
            .Where(f => alunoIds.Contains(f.AlunoId) && f.Status == "NOVO");
        if (personalId.HasValue)
            feedbackQuery = feedbackQuery.Where(f => f.PersonalId == personalId.Value || f.PersonalId == null);
        var feedbacks = await feedbackQuery
            .OrderByDescending(f => f.CriadoEm)
            .Take(100)
            .Select(f => new
            {
                f.Id, f.AlunoId, NomeAluno = f.Aluno.NomeCompleto,
                f.Categoria, f.Nota, f.Comentario, f.CriadoEm
            })
            .ToListAsync();

        var tarefasQuery = _db.TarefasPersonais.AsNoTracking()
            .Where(t => t.Status != "CONCLUIDA" && t.Status != "CANCELADA" &&
                t.DataLimite.HasValue && t.DataLimite < agora);
        if (personalId.HasValue)
            tarefasQuery = tarefasQuery.Where(t => t.PersonalId == personalId.Value);
        var tarefasAtrasadas = await tarefasQuery
            .OrderBy(t => t.DataLimite)
            .Take(100)
            .Select(t => new
            {
                t.Id, t.AlunoId, NomeAluno = t.Aluno != null ? t.Aluno.NomeCompleto : null,
                t.Titulo, t.Prioridade, t.CriadaEm, t.DataLimite
            })
            .ToListAsync();

        var execucoesDto = sessoes.Take(60).Select(MapearExecucao).ToList();
        var alertasDor = execucoesDto.Sum(e => e.RelatosDor);
        var alunosDto = alunos.Select(aluno =>
        {
            var sessoesAluno = sessoes.Where(e => e.Treino.AlunoId == aluno.Id).ToList();
            var semanaAluno = sessoesAluno.Count(e => e.Data >= inicioSemana);
            return new AlunoAcompanhamentoDTO
            {
                AlunoId = aluno.Id,
                NomeCompleto = aluno.NomeCompleto,
                Email = aluno.Email,
                PossuiFichaTecnica = aluno.PossuiFichaTecnica,
                TreinosAtivos = aluno.TreinosAtivos,
                SessoesNosUltimos7Dias = semanaAluno,
                EnviosAguardandoRevisao = sessoesAluno.Count(e => !e.RevisadaEm.HasValue),
                AlertasDeDor = sessoesAluno.Sum(e => e.Exercicios.Count(ex => ex.StatusDor == "pain" || ex.StatusDor == "discomfort")),
                UltimaExecucaoEm = sessoesAluno.Select(e => e.Fim).FirstOrDefault()
            };
        }).ToList();

        var pendencias = new List<PendenciaAcompanhamentoDTO>();
        pendencias.AddRange(sessoesSemRevisao.Take(100).Select(e => new PendenciaAcompanhamentoDTO
        {
            Tipo = "TREINO_RECEBIDO",
            Titulo = $"Revisar treino: {e.Treino.Nome}",
            Descricao = $"{e.Treino.Aluno.NomeCompleto} enviou uma sessão com {e.Exercicios.Count} exercícios.",
            Prioridade = e.Exercicios.Any(ex => ex.StatusDor == "pain") ? "URGENTE" :
                e.Exercicios.Any(ex => ex.StatusDor == "discomfort") ? "ALTA" : "NORMAL",
            AlunoId = e.Treino.AlunoId,
            NomeAluno = e.Treino.Aluno.NomeCompleto,
            ReferenciaId = e.Id,
            CriadaEm = e.Fim ?? e.AtualizadoEm
        }));
        pendencias.AddRange(solicitacoes.Select(s => new PendenciaAcompanhamentoDTO
        {
            Tipo = "AVALIACAO",
            Titulo = s.Urgente ? "Solicitação urgente de avaliação" : "Avaliação solicitada",
            Descricao = string.IsNullOrWhiteSpace(s.Motivo) ? $"Data desejada: {s.DataDesejada:dd/MM/yyyy}" : s.Motivo!,
            Prioridade = s.Urgente ? "URGENTE" : "NORMAL",
            AlunoId = s.AlunoId,
            NomeAluno = s.NomeAluno,
            ReferenciaId = s.Id,
            CriadaEm = s.CriadaEm,
            DataLimite = s.DataDesejada.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc)
        }));
        pendencias.AddRange(feedbacks.Select(f => new PendenciaAcompanhamentoDTO
        {
            Tipo = "FEEDBACK",
            Titulo = $"Novo feedback · {f.Categoria}",
            Descricao = $"Nota {f.Nota}/5 · {f.Comentario}",
            Prioridade = f.Nota <= 2 ? "ALTA" : "NORMAL",
            AlunoId = f.AlunoId,
            NomeAluno = f.NomeAluno,
            ReferenciaId = f.Id,
            CriadaEm = f.CriadoEm
        }));
        pendencias.AddRange(tarefasAtrasadas.Select(t => new PendenciaAcompanhamentoDTO
        {
            Tipo = "TAREFA_ATRASADA",
            Titulo = t.Titulo,
            Descricao = "Tarefa com prazo vencido.",
            Prioridade = t.Prioridade,
            AlunoId = t.AlunoId,
            NomeAluno = t.NomeAluno,
            ReferenciaId = t.Id,
            CriadaEm = t.CriadaEm,
            DataLimite = t.DataLimite
        }));

        return new AcompanhamentoPersonalDTO
        {
            GeradoEm = agora,
            AlunosAtivos = alunos.Count,
            SessoesNosUltimos7Dias = sessoesRecentes.Count,
            EnviosAguardandoRevisao = sessoesSemRevisao.Count,
            AlertasDeDor = alertasDor,
            SolicitacoesAvaliacaoPendentes = solicitacoes.Count,
            FeedbacksNovos = feedbacks.Count,
            TarefasAtrasadas = tarefasAtrasadas.Count,
            Alunos = alunosDto,
            ExecucoesRecentes = execucoesDto,
            Pendencias = pendencias
                .OrderByDescending(p => p.Prioridade == "URGENTE")
                .ThenByDescending(p => p.Prioridade == "ALTA")
                .ThenByDescending(p => p.CriadaEm)
                .Take(150)
                .ToList()
        };
    }

    public async Task MarcarExecucaoRevisadaAsync(Guid execucaoId, bool revisada)
    {
        var execucao = await _db.ExecucoesTreino
            .Include(e => e.Treino)
            .FirstOrDefaultAsync(e => e.Id == execucaoId)
            ?? throw DomainException.NotFound("Execução não encontrada.");

        await _ownership.EnsureAlunoAccessAsync(execucao.Treino.AlunoId);
        execucao.RevisadaEm = revisada ? DateTime.UtcNow : null;
        execucao.RevisadaPorUsuarioId = revisada ? _current.UsuarioId : null;
        execucao.AtualizadoEm = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    private static ExecucaoRecebidaDTO MapearExecucao(ExecucaoTreino execucao)
    {
        var series = execucao.Exercicios.SelectMany(e => e.Series).ToList();
        var concluidas = series.Count(s => s.Concluida);
        var alertas = execucao.Exercicios
            .Where(e => e.StatusDor == "pain" || e.StatusDor == "discomfort")
            .Select(e => e.StatusDor == "pain" ? $"Dor relatada em {e.Nome}" : $"Desconforto relatado em {e.Nome}")
            .ToList();
        var feedbacks = execucao.Exercicios
            .Where(e => !string.IsNullOrWhiteSpace(e.Feedback))
            .Select(e => $"{e.Nome}: {e.Feedback!.Trim()}")
            .ToList();
        return new ExecucaoRecebidaDTO
        {
            Id = execucao.Id,
            AlunoId = execucao.Treino.AlunoId,
            NomeAluno = execucao.Treino.Aluno.NomeCompleto,
            TreinoId = execucao.TreinoId,
            NomeTreino = execucao.Treino.Nome,
            Data = execucao.Data,
            Inicio = execucao.Inicio,
            Fim = execucao.Fim,
            DuracaoSegundos = execucao.DuracaoSegundos,
            DuracaoPlanejadaCardioSegundos = execucao.DuracaoPlanejadaCardioSegundos,
            DuracaoRealCardioSegundos = execucao.DuracaoRealCardioSegundos,
            TipoTreino = execucao.TipoTreino,
            SeriesConcluidas = concluidas,
            SeriesTotais = series.Count,
            AdesaoPercentual = execucao.TipoTreino == "cardio"
                ? execucao.DuracaoPlanejadaCardioSegundos is > 0 && execucao.DuracaoRealCardioSegundos.HasValue
                    ? Math.Round(execucao.DuracaoRealCardioSegundos.Value * 100d / execucao.DuracaoPlanejadaCardioSegundos.Value, 1)
                    : null
                : series.Count > 0 ? Math.Round(concluidas * 100d / series.Count, 1) : null,
            Tonelagem = concluidas > 0 ? Math.Round(execucao.Exercicios.Sum(e => e.Tonelagem), 2) : null,
            RelatosDor = alertas.Count,
            Alertas = alertas,
            Feedbacks = feedbacks,
            RevisadaEm = execucao.RevisadaEm
        };
    }
}
