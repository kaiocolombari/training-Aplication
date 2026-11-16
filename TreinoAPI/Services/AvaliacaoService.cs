using Microsoft.EntityFrameworkCore;
using TreinoAPI.Data;
using TreinoAPI.DTOs.Avaliacao;
using TreinoAPI.Model;
using TreinoAPI.Security;

namespace TreinoAPI.Services;

public sealed class AvaliacaoService
{
    private readonly AppDbContext _db;
    private readonly CurrentUserService _currentUser;
    private readonly AvaliacaoAuditService _audit;

    public AvaliacaoService(
        AppDbContext db,
        CurrentUserService currentUser,
        AvaliacaoAuditService audit)
    {
        _db = db;
        _currentUser = currentUser;
        _audit = audit;
    }

    public async Task<AvaliacaoDTO> Criar(Guid alunoId, CriarAvaliacaoDTO dto)
    {
        if (!await _db.Alunos.AnyAsync(a => a.Id == alunoId))
            throw DomainException.NotFound("Aluno não encontrado.");

        var numero = (await _db.Avaliacoes
            .Where(a => a.AlunoId == alunoId)
            .MaxAsync(a => (int?)a.Numero) ?? 0) + 1;
        var agora = DateTime.UtcNow;
        var usuarioId = _currentUser.UsuarioId;

        var avaliacao = new Avaliacao
        {
            Id = Guid.NewGuid(),
            AlunoId = alunoId,
            Numero = numero,
            Idade = dto.Idade,
            Peso = dto.Peso,
            Altura = dto.Altura,
            PercentualGordura = dto.PercentualGordura,
            RealizadaEm = dto.RealizadaEm.HasValue
                ? DateTime.SpecifyKind(dto.RealizadaEm.Value, DateTimeKind.Utc)
                : agora,
            Objetivo = dto.Objetivo?.Trim(),
            Observacoes = dto.Observacoes?.Trim(),
            Ativo = true,
            CriadaEm = agora,
            CriadaPorUsuarioId = usuarioId == Guid.Empty ? null : usuarioId
        };

        _db.Avaliacoes.Add(avaliacao);
        await _audit.RegistrarAsync(avaliacao, "CRIADA", "Avaliação criada", dto);
        await _db.SaveChangesAsync();

        await _db.Entry(avaliacao).Reference(a => a.CriadaPorUsuario).LoadAsync();
        return Mapear(avaliacao);
    }

    public async Task<List<AvaliacaoDTO>> ListarPorAluno(Guid alunoId)
    {
        var avaliacoes = await _db.Avaliacoes.AsNoTracking()
            .Where(a => a.AlunoId == alunoId && a.Ativo)
            .Include(a => a.CriadaPorUsuario)
            .Include(a => a.AtualizadaPorUsuario)
            .OrderBy(a => a.Numero)
            .ThenBy(a => a.RealizadaEm)
            .ToListAsync();

        return avaliacoes.Select(Mapear).ToList();
    }

    public async Task<AvaliacaoDTO?> ObterPorId(Guid id)
    {
        var avaliacao = await _db.Avaliacoes.AsNoTracking()
            .Include(a => a.CriadaPorUsuario)
            .Include(a => a.AtualizadaPorUsuario)
            .FirstOrDefaultAsync(a => a.Id == id);

        return avaliacao is null ? null : Mapear(avaliacao);
    }

    public async Task<AvaliacaoDTO?> Atualizar(Guid id, AtualizarAvaliacaoDTO dto)
    {
        var avaliacao = await _db.Avaliacoes.FirstOrDefaultAsync(a => a.Id == id && a.Ativo);
        if (avaliacao is null)
            return null;

        avaliacao.Idade = dto.Idade;
        avaliacao.Peso = dto.Peso;
        avaliacao.Altura = dto.Altura;
        avaliacao.PercentualGordura = dto.PercentualGordura;
        avaliacao.RealizadaEm = dto.RealizadaEm.HasValue
            ? DateTime.SpecifyKind(dto.RealizadaEm.Value, DateTimeKind.Utc)
            : avaliacao.RealizadaEm;
        avaliacao.Objetivo = dto.Objetivo?.Trim();
        avaliacao.Observacoes = dto.Observacoes?.Trim();
        avaliacao.AtualizadaEm = DateTime.UtcNow;
        var userId = _currentUser.UsuarioId;
        avaliacao.AtualizadaPorUsuarioId = userId == Guid.Empty ? null : userId;

        await _audit.RegistrarAsync(avaliacao, "ATUALIZADA", "Dados da avaliação atualizados", dto);
        await _db.SaveChangesAsync();

        await _db.Entry(avaliacao).Reference(a => a.CriadaPorUsuario).LoadAsync();
        await _db.Entry(avaliacao).Reference(a => a.AtualizadaPorUsuario).LoadAsync();
        return Mapear(avaliacao);
    }

    public async Task<bool> Deletar(Guid id)
    {
        var avaliacao = await _db.Avaliacoes.FirstOrDefaultAsync(a => a.Id == id && a.Ativo);
        if (avaliacao is null)
            return false;

        avaliacao.Ativo = false;
        avaliacao.AtualizadaEm = DateTime.UtcNow;
        var userId = _currentUser.UsuarioId;
        avaliacao.AtualizadaPorUsuarioId = userId == Guid.Empty ? null : userId;

        await _audit.RegistrarAsync(avaliacao, "ARQUIVADA", "Avaliação arquivada", new
        {
            avaliacao.Id,
            avaliacao.Numero,
            avaliacao.RealizadaEm
        });
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<List<AvaliacaoHistoricoDTO>> ListarHistorico(Guid avaliacaoId)
    {
        return await _db.AvaliacoesHistorico.AsNoTracking()
            .Where(item => item.AvaliacaoId == avaliacaoId)
            .OrderByDescending(item => item.CriadoEm)
            .Select(item => new AvaliacaoHistoricoDTO
            {
                Id = item.Id,
                AvaliacaoId = item.AvaliacaoId,
                Acao = item.Acao,
                Resumo = item.Resumo,
                CriadoEm = item.CriadoEm,
                UsuarioEmail = item.UsuarioEmail,
                UsuarioTipo = item.UsuarioTipo
            })
            .ToListAsync();
    }

    private static AvaliacaoDTO Mapear(Avaliacao avaliacao) => new()
    {
        Id = avaliacao.Id,
        AlunoId = avaliacao.AlunoId,
        Numero = avaliacao.Numero,
        Idade = avaliacao.Idade,
        Peso = avaliacao.Peso,
        Altura = avaliacao.Altura,
        PercentualGordura = avaliacao.PercentualGordura,
        RealizadaEm = avaliacao.RealizadaEm,
        Objetivo = avaliacao.Objetivo,
        Observacoes = avaliacao.Observacoes,
        Ativo = avaliacao.Ativo,
        CriadaEm = avaliacao.CriadaEm,
        CriadaPorEmail = avaliacao.CriadaPorUsuario?.Email,
        AtualizadaEm = avaliacao.AtualizadaEm,
        AtualizadaPorEmail = avaliacao.AtualizadaPorUsuario?.Email
    };
}
