using Microsoft.EntityFrameworkCore;
using TreinoAPI.Data;
using TreinoAPI.DTOs.Avaliacao;
using TreinoAPI.Model;
using TreinoAPI.Security;

namespace TreinoAPI.Services;

public sealed class AgendaAvaliacaoService
{
    private readonly AppDbContext _db;
    private readonly CurrentUserService _current;

    public AgendaAvaliacaoService(AppDbContext db, CurrentUserService current)
    {
        _db = db;
        _current = current;
    }

    public async Task<List<AgendaAvaliacaoDTO>> ListarDoAlunoAsync()
    {
        var alunoId = await _db.Alunos.AsNoTracking()
            .Where(a => a.UsuarioId == _current.UsuarioId && a.Usuario.Ativo)
            .Select(a => (Guid?)a.Id)
            .FirstOrDefaultAsync();
        if (!alunoId.HasValue)
            throw DomainException.NotFound("Aluno não encontrado.");

        return await ConsultarAgenda(alunoId.Value);
    }

    public async Task<List<AgendaAvaliacaoDTO>> ListarSolicitacoesPendentesAsync()
    {
        var consulta = _db.SolicitacoesAvaliacoes
            .AsNoTracking()
            .Where(s => s.Status == "PENDENTE" && s.Origem == "ALUNO");

        var registros = await consulta
            .Include(s => s.Aluno)
            .Include(s => s.AnalisadaPor).ThenInclude(u => u!.Personal)
            .OrderByDescending(s => s.Urgente)
            .ThenBy(s => s.DataDesejada)
            .ToListAsync();

        return registros.Select(Mapear).ToList();
    }

    public Task<List<AgendaAvaliacaoDTO>> ListarPorAlunoAsync(Guid alunoId) => ConsultarAgenda(alunoId);

    public async Task<AgendaAvaliacaoDTO> SolicitarAsync(SolicitarAvaliacaoDTO dto)
    {
        ValidarData(dto.DataDesejada, "A data desejada");
        var motivo = string.IsNullOrWhiteSpace(dto.Motivo) ? null : dto.Motivo.Trim();
        if (motivo?.Length > 1000)
            throw DomainException.BadRequest("O motivo deve ter no máximo 1.000 caracteres.");

        var aluno = await _db.Alunos
            .Include(a => a.Usuario)
            .FirstOrDefaultAsync(a => a.UsuarioId == _current.UsuarioId && a.Usuario.Ativo);
        if (aluno is null)
            throw DomainException.NotFound("Aluno não encontrado.");

        var possuiPendente = await _db.SolicitacoesAvaliacoes.AnyAsync(s =>
            s.AlunoId == aluno.Id && s.Origem == "ALUNO" && s.Status == "PENDENTE");
        if (possuiPendente)
            throw DomainException.Conflict("Você já possui uma solicitação de avaliação aguardando análise.");

        var agora = DateTime.UtcNow;
        var solicitacao = new SolicitacaoAvaliacao
        {
            Id = Guid.NewGuid(),
            AlunoId = aluno.Id,
            SolicitanteUsuarioId = _current.UsuarioId,
            Origem = "ALUNO",
            DataDesejada = dto.DataDesejada,
            Motivo = motivo,
            Urgente = dto.Urgente,
            Status = "PENDENTE",
            EnviadaEm = agora,
            CriadaEm = agora
        };
        _db.SolicitacoesAvaliacoes.Add(solicitacao);

        if (dto.Urgente)
        {
            var personalUsuarioIds = await _db.Personais.AsNoTracking()
                .Where(p => p.Usuario != null && p.Usuario.Ativo)
                .Select(p => p.UsuarioId).ToListAsync();
            var mensagem = $"{aluno.NomeCompleto} solicitou uma avaliação urgente para {FormatarData(dto.DataDesejada)}.";
            _db.NotificacoesUsuarios.AddRange(personalUsuarioIds.Select(usuarioId => new NotificacaoUsuario
            {
                Id = Guid.NewGuid(),
                UsuarioId = usuarioId,
                Titulo = "Solicitação urgente de avaliação",
                Mensagem = mensagem,
                Tipo = "AVALIACAO",
                ReferenciaId = solicitacao.Id,
                CriadaEm = agora
            }));
        }

        await _db.SaveChangesAsync();
        return await MapearPorIdAsync(solicitacao.Id);
    }

    public async Task<AgendaAvaliacaoDTO> AgendarAsync(Guid alunoId, AgendarAvaliacaoDTO dto)
    {
        ValidarData(dto.DataAgendada, "A data agendada");
        var descricao = string.IsNullOrWhiteSpace(dto.Descricao) ? null : dto.Descricao.Trim();
        if (descricao?.Length > 1000)
            throw DomainException.BadRequest("A descrição deve ter no máximo 1.000 caracteres.");

        var aluno = await _db.Alunos
            .Include(a => a.Usuario)
            .FirstOrDefaultAsync(a => a.Id == alunoId && a.Usuario.Ativo);
        if (aluno is null)
            throw DomainException.NotFound("Aluno não encontrado.");

        var agora = DateTime.UtcNow;
        SolicitacaoAvaliacao agenda;
        if (dto.SolicitacaoId.HasValue)
        {
            agenda = await _db.SolicitacoesAvaliacoes
                .FirstOrDefaultAsync(s => s.Id == dto.SolicitacaoId.Value && s.AlunoId == alunoId)
                ?? throw DomainException.NotFound("Solicitação de avaliação não encontrada.");
            if (agenda.Status != "PENDENTE" || agenda.Origem != "ALUNO")
                throw DomainException.Conflict("Esta solicitação já foi analisada.");

            agenda.Status = "AGENDADA";
            agenda.DataAgendada = dto.DataAgendada;
            agenda.DescricaoAgendamento = descricao;
            agenda.AnalisadaEm = agora;
            agenda.AnalisadaPorUsuarioId = _current.UsuarioId;
        }
        else
        {
            agenda = new SolicitacaoAvaliacao
            {
                Id = Guid.NewGuid(),
                AlunoId = alunoId,
                SolicitanteUsuarioId = _current.UsuarioId,
                Origem = "PERSONAL",
                DataDesejada = dto.DataAgendada,
                DataAgendada = dto.DataAgendada,
                DescricaoAgendamento = descricao,
                Status = "AGENDADA",
                CriadaEm = agora,
                AnalisadaEm = agora,
                AnalisadaPorUsuarioId = _current.UsuarioId
            };
            _db.SolicitacoesAvaliacoes.Add(agenda);
        }

        _db.NotificacoesUsuarios.Add(new NotificacaoUsuario
        {
            Id = Guid.NewGuid(),
            UsuarioId = aluno.UsuarioId,
            Titulo = "Avaliação agendada",
            Mensagem = $"Seu personal agendou uma avaliação para {FormatarData(dto.DataAgendada)}.",
            Tipo = "AVALIACAO",
            ReferenciaId = agenda.Id,
            CriadaEm = agora
        });

        await _db.SaveChangesAsync();
        return await MapearPorIdAsync(agenda.Id);
    }

    public async Task RecusarAsync(Guid solicitacaoId)
    {
        var solicitacao = await _db.SolicitacoesAvaliacoes
            .Include(s => s.Aluno)
            .FirstOrDefaultAsync(s => s.Id == solicitacaoId);
        if (solicitacao is null)
            throw DomainException.NotFound("Solicitação de avaliação não encontrada.");
        if (solicitacao.Status != "PENDENTE" || solicitacao.Origem != "ALUNO")
            throw DomainException.Conflict("Esta solicitação já foi analisada.");

        var agora = DateTime.UtcNow;
        solicitacao.Status = "RECUSADA";
        solicitacao.AnalisadaEm = agora;
        solicitacao.AnalisadaPorUsuarioId = _current.UsuarioId;
        _db.NotificacoesUsuarios.Add(new NotificacaoUsuario
        {
            Id = Guid.NewGuid(),
            UsuarioId = solicitacao.Aluno.UsuarioId,
            Titulo = "Solicitação de avaliação analisada",
            Mensagem = "Seu personal analisou a solicitação. Entre em contato para combinar uma nova data.",
            Tipo = "AVALIACAO",
            ReferenciaId = solicitacao.Id,
            CriadaEm = agora
        });
        await _db.SaveChangesAsync();
    }

    private async Task<List<AgendaAvaliacaoDTO>> ConsultarAgenda(Guid alunoId)
    {
        var registros = await _db.SolicitacoesAvaliacoes
            .AsNoTracking()
            .Where(s => s.AlunoId == alunoId)
            .Include(s => s.Aluno)
            .Include(s => s.AnalisadaPor).ThenInclude(u => u!.Personal)
            .OrderBy(s => s.Status == "PENDENTE" ? 0 : 1)
            .ThenByDescending(s => s.Urgente)
            .ThenBy(s => s.DataAgendada ?? s.DataDesejada)
            .ToListAsync();
        return registros.Select(Mapear).ToList();
    }

    private async Task<AgendaAvaliacaoDTO> MapearPorIdAsync(Guid id)
    {
        var item = await _db.SolicitacoesAvaliacoes.AsNoTracking()
            .Include(s => s.Aluno)
            .Include(s => s.AnalisadaPor).ThenInclude(u => u!.Personal)
            .FirstOrDefaultAsync(s => s.Id == id);
        return item is null
            ? throw DomainException.NotFound("Registro de agenda não encontrado.")
            : Mapear(item);
    }

    private static AgendaAvaliacaoDTO Mapear(SolicitacaoAvaliacao item) => new()
    {
        Id = item.Id,
        AlunoId = item.AlunoId,
        AlunoNome = item.Aluno.NomeCompleto,
        Origem = item.Origem,
        DataDesejada = item.DataDesejada,
        DataAgendada = item.DataAgendada,
        Motivo = item.Motivo,
        DescricaoAgendamento = item.DescricaoAgendamento,
        Status = item.Status,
        Urgente = item.Urgente,
        EnviadaEm = item.EnviadaEm,
        CriadaEm = item.CriadaEm,
        AnalisadaEm = item.AnalisadaEm,
        AnalisadaPorNome = item.AnalisadaPor?.Personal?.Nome ?? item.AnalisadaPor?.Email
    };

    private static void ValidarData(DateOnly data, string campo)
    {
        if (data < HojeBrasil())
            throw DomainException.BadRequest($"{campo} não pode estar no passado.");
    }

    private static DateOnly HojeBrasil() => DateOnly.FromDateTime(DateTime.UtcNow.AddHours(-3));

    private static string FormatarData(DateOnly data) => data.ToString("dd/MM/yyyy");
}
