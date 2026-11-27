using Microsoft.EntityFrameworkCore;
using TreinoAPI.Data;
using TreinoAPI.DTOs.Comunicacao;
using TreinoAPI.Security;

namespace TreinoAPI.Services;

public sealed class ChatAlunoContextService(AppDbContext db, CurrentUserService current)
{
    public async Task<AlunoChatContextoDTO> ObterAsync(Guid alunoId, CancellationToken cancellationToken)
    {
        if (current.Role is not ("ADMIN" or "PERSONAL")) throw DomainException.Forbidden();
        var aluno = await db.Alunos.AsNoTracking()
            .Where(a => a.Id == alunoId && a.Usuario.Ativo)
            .Select(a => new { a.Id, a.NomeCompleto, StatusCadastro = a.StatusCadastro.ToString() })
            .FirstOrDefaultAsync(cancellationToken);
        if (aluno is null) throw DomainException.NotFound("Aluno não encontrado.");

        if (current.Role == "PERSONAL" && !await db.Personais.AnyAsync(p =>
            p.UsuarioId == current.UsuarioId && p.Usuario!.Ativo, cancellationToken))
            throw DomainException.Forbidden();

        var avaliacoesRegistros = await db.Avaliacoes.AsNoTracking()
            .Where(a => a.AlunoId == alunoId && a.Ativo)
            .Include(a => a.CriadaPorUsuario).ThenInclude(u => u!.Personal)
            .Include(a => a.AtualizadaPorUsuario).ThenInclude(u => u!.Personal)
            .Include(a => a.Perimetro)
            .Include(a => a.DobrasCutaneas)
            .OrderByDescending(a => a.RealizadaEm).Take(8)
            .ToListAsync(cancellationToken);
        var avaliacoes = avaliacoesRegistros.Select(a => new AvaliacaoChatDTO
            {
                Id = a.Id,
                Numero = a.Numero,
                Idade = a.Idade,
                RealizadaEm = a.RealizadaEm,
                Peso = a.Peso,
                Altura = a.Altura,
                PercentualGordura = a.PercentualGordura,
                Objetivo = a.Objetivo,
                Observacoes = a.Observacoes,
                CriadaPorNome = a.CriadaPorUsuario == null ? null : a.CriadaPorUsuario.Personal != null
                    ? a.CriadaPorUsuario.Personal.Nome : a.CriadaPorUsuario.Email,
                AtualizadaPorNome = a.AtualizadaPorUsuario == null ? null : a.AtualizadaPorUsuario.Personal != null
                    ? a.AtualizadaPorUsuario.Personal.Nome : a.AtualizadaPorUsuario.Email,
                AtualizadaEm = a.AtualizadaEm,
                Perimetros = a.Perimetro == null ? [] : new List<MedidaChatDTO>
                {
                    new() { Nome = "Braço direito", Valor = a.Perimetro.Braco_D },
                    new() { Nome = "Braço esquerdo", Valor = a.Perimetro.Braco_E },
                    new() { Nome = "Antebraço direito", Valor = a.Perimetro.Antebraco_D },
                    new() { Nome = "Antebraço esquerdo", Valor = a.Perimetro.Antebraco_E },
                    new() { Nome = "Tórax", Valor = a.Perimetro.Torax },
                    new() { Nome = "Cintura", Valor = a.Perimetro.Cintura },
                    new() { Nome = "Abdômen", Valor = a.Perimetro.Abdomen },
                    new() { Nome = "Quadril", Valor = a.Perimetro.Quadril },
                    new() { Nome = "Coxa superior direita", Valor = a.Perimetro.Coxa_Sup_D },
                    new() { Nome = "Coxa superior esquerda", Valor = a.Perimetro.Coxa_Sup_E },
                    new() { Nome = "Panturrilha direita", Valor = a.Perimetro.Panturrilha_D },
                    new() { Nome = "Panturrilha esquerda", Valor = a.Perimetro.Panturrilha_E }
                }.Where(m => m.Valor.HasValue).ToList(),
                DobrasCutaneas = a.DobrasCutaneas.SelectMany(d => new List<MedidaChatDTO>
                {
                    new() { Nome = $"Tríceps (medida {d.Medida})", Valor = d.Triceps },
                    new() { Nome = $"Subescapular (medida {d.Medida})", Valor = d.Subescapular },
                    new() { Nome = $"Bíceps (medida {d.Medida})", Valor = d.Biceps },
                    new() { Nome = $"Ilíaca (medida {d.Medida})", Valor = d.Iliaca },
                    new() { Nome = $"Supraespinhal (medida {d.Medida})", Valor = d.Supraespinhal },
                    new() { Nome = $"Abdominal (medida {d.Medida})", Valor = d.Abdominal },
                    new() { Nome = $"Coxa média (medida {d.Medida})", Valor = d.CoxaMedia },
                    new() { Nome = $"Panturrilha (medida {d.Medida})", Valor = d.Panturrilha }
                }).Where(m => m.Valor.HasValue).ToList()
            }).ToList();
        var ultimaAnamnese = await db.Anamnese.AsNoTracking()
            .Where(a => a.AlunoId == alunoId).OrderByDescending(a => a.CriadoEm)
            .Select(a => new AnamneseChatDTO
            {
                Tipo = a.Tipo,
                Objetivo = a.Objetivo,
                Observacoes = a.Observacoes,
                CriadoEm = a.CriadoEm
            }).FirstOrDefaultAsync(cancellationToken);

        var historico = await db.AvaliacoesHistorico.AsNoTracking()
            .Where(h => h.Avaliacao.AlunoId == alunoId)
            .OrderByDescending(h => h.CriadoEm).Take(20)
            .Select(h => new HistoricoAvaliacaoChatDTO
            {
                Id = h.Id,
                NumeroAvaliacao = h.Avaliacao.Numero,
                Acao = h.Acao,
                Resumo = h.Resumo,
                UsuarioNome = h.UsuarioEmail,
                UsuarioTipo = h.UsuarioTipo,
                CriadoEm = h.CriadoEm,
                DadosJson = h.DadosJson
            }).ToListAsync(cancellationToken);

        var feedbacks = await db.FeedbacksAlunos.AsNoTracking()
            .Where(f => f.AlunoId == alunoId).OrderByDescending(f => f.CriadoEm).Take(8)
            .Select(f => new FeedbackChatDTO
            {
                Categoria = f.Categoria,
                Nota = f.Nota,
                Comentario = f.Comentario,
                Status = f.Status,
                RespostaEquipe = f.RespostaEquipe,
                PersonalNome = f.Personal == null ? null : f.Personal.Nome,
                CriadoEm = f.CriadoEm
            }).ToListAsync(cancellationToken);

        var solicitacoes = await db.SolicitacoesAvaliacoes.AsNoTracking()
            .Where(s => s.AlunoId == alunoId).OrderByDescending(s => s.CriadaEm).Take(8)
            .Select(s => new SolicitacaoAvaliacaoChatDTO
            {
                Origem = s.Origem,
                DataDesejada = s.DataDesejada,
                Status = s.Status,
                Urgente = s.Urgente,
                Motivo = s.Motivo,
                AnalisadaPorNome = s.AnalisadaPor == null ? null : s.AnalisadaPor.Email,
                CriadaEm = s.CriadaEm
            }).ToListAsync(cancellationToken);

        var execucoes = await db.ExecucoesTreino.AsNoTracking()
            .Where(e => e.Treino.AlunoId == alunoId)
            .Include(e => e.Treino).Include(e => e.Exercicios)
            .OrderByDescending(e => e.Data).Take(8)
            .Select(e => new ExecucaoChatDTO
            {
                Id = e.Id,
                TreinoNome = e.Treino.Nome,
                Data = e.Data,
                Inicio = e.Inicio,
                Fim = e.Fim,
                DuracaoSegundos = e.DuracaoSegundos,
                Exercicios = e.Exercicios.OrderBy(x => x.Ordem).Take(12).Select(x => new ExercicioExecucaoChatDTO
                {
                    Nome = x.Nome,
                    StatusDor = x.StatusDor,
                    Feedback = x.Feedback,
                    HardSets = x.HardSets,
                    Tonelagem = x.Tonelagem
                }).ToList()
            }).ToListAsync(cancellationToken);

        var treinosAtuais = await db.Treinos.AsNoTracking()
            .Where(t => t.AlunoId == alunoId && t.Ativo)
            .OrderByDescending(t => t.CriadoEm)
            .Take(12)
            .Select(t => new TreinoChatDTO
            {
                Id = t.Id,
                Nome = t.Nome,
                CriadoEm = t.CriadoEm,
                Exercicios = t.TreinoExercicios.OrderBy(e => e.Ordem).Select(e => new ExercicioPrescritoChatDTO
                {
                    Nome = e.Exercicio,
                    Series = e.Series,
                    Repeticoes = e.Repeticoes,
                    Carga = e.Carga,
                    DescansoSegundos = e.Intervalo,
                    Rir = e.RiRMAX,
                    Observacoes = e.Observacoes
                }).ToList()
            }).ToListAsync(cancellationToken);

        var periodizacoes = await db.Periodizacoes.AsNoTracking()
            .Where(p => p.AlunoId == alunoId)
            .OrderByDescending(p => p.DataInicio)
            .Take(6)
            .Select(p => new PeriodizacaoChatDTO
            {
                Id = p.Id,
                Nome = p.Nome ?? "Periodização sem nome",
                DataInicio = p.DataInicio,
                TotalSemanas = p.PeriodizacaoSemanas.Count
            }).ToListAsync(cancellationToken);

        var idsRecursos = avaliacoes.Select(a => a.Id.ToString())
            .Concat(treinosAtuais.Select(t => t.Id.ToString()))
            .Concat(periodizacoes.Select(p => p.Id.ToString()))
            .Concat(execucoes.Select(e => e.Id.ToString()))
            .Append(alunoId.ToString())
            .ToArray();
        var atividades = await db.RegistrosAuditoria.AsNoTracking()
            .Where(r => r.RecursoId != null && idsRecursos.Contains(r.RecursoId))
            .OrderByDescending(r => r.CriadoEm).Take(20)
            .Select(r => new AtividadeChatDTO
            {
                Acao = r.Acao,
                Resumo = r.Resumo,
                UsuarioNome = r.UsuarioEmail,
                UsuarioTipo = r.UsuarioTipo,
                Resultado = r.Resultado,
                MetodoHttp = r.MetodoHttp,
                Rota = r.Rota,
                StatusCode = r.StatusCode,
                CriadoEm = r.CriadoEm
            }).ToListAsync(cancellationToken);

        return new AlunoChatContextoDTO
        {
            AlunoId = aluno.Id,
            NomeCompleto = aluno.NomeCompleto,
            StatusCadastro = aluno.StatusCadastro,
            UltimaAnamnese = ultimaAnamnese,
            Avaliacoes = avaliacoes,
            HistoricoAvaliacoes = historico,
            Feedbacks = feedbacks,
            SolicitacoesAvaliacao = solicitacoes,
            ExecucoesRecentes = execucoes,
            TreinosAtuais = treinosAtuais,
            Periodizacoes = periodizacoes,
            Atividades = atividades
        };
    }
}
