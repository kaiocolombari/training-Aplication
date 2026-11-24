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

        if (current.Role == "PERSONAL")
        {
            var vinculado = await db.PersonalAlunos.AnyAsync(v => v.Ativo && v.AlunoId == alunoId &&
                v.Personal.UsuarioId == current.UsuarioId, cancellationToken);
            if (!vinculado) throw DomainException.NotFound("Aluno não encontrado.");
        }

        var avaliacoes = await db.Avaliacoes.AsNoTracking()
            .Where(a => a.AlunoId == alunoId && a.Ativo)
            .Include(a => a.CriadaPorUsuario).ThenInclude(u => u!.Personal)
            .Include(a => a.AtualizadaPorUsuario).ThenInclude(u => u!.Personal)
            .OrderByDescending(a => a.RealizadaEm).Take(8)
            .Select(a => new AvaliacaoChatDTO
            {
                Id = a.Id,
                Numero = a.Numero,
                RealizadaEm = a.RealizadaEm,
                Peso = a.Peso,
                Altura = a.Altura,
                PercentualGordura = a.PercentualGordura,
                Objetivo = a.Objetivo,
                CriadaPorNome = a.CriadaPorUsuario == null ? null : a.CriadaPorUsuario.Personal != null
                    ? a.CriadaPorUsuario.Personal.Nome : a.CriadaPorUsuario.Email,
                AtualizadaPorNome = a.AtualizadaPorUsuario == null ? null : a.AtualizadaPorUsuario.Personal != null
                    ? a.AtualizadaPorUsuario.Personal.Nome : a.AtualizadaPorUsuario.Email,
                AtualizadaEm = a.AtualizadaEm
            }).ToListAsync(cancellationToken);
        var avaliacaoIds = avaliacoes.Select(a => a.Id).ToArray();

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
                CriadoEm = h.CriadoEm
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

        var idsRecursos = avaliacaoIds.Select(id => id.ToString()).Append(alunoId.ToString()).ToArray();
        var atividades = await db.RegistrosAuditoria.AsNoTracking()
            .Where(r => r.RecursoId != null && idsRecursos.Contains(r.RecursoId))
            .OrderByDescending(r => r.CriadoEm).Take(20)
            .Select(r => new AtividadeChatDTO
            {
                Acao = r.Acao,
                Resumo = r.Resumo,
                UsuarioNome = r.UsuarioEmail,
                Resultado = r.Resultado,
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
            Atividades = atividades
        };
    }
}
