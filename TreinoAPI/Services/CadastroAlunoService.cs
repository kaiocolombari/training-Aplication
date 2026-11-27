using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using TreinoAPI.Data;
using TreinoAPI.DTOs.CadastroAluno;
using TreinoAPI.Model;
using TreinoAPI.Security;

namespace TreinoAPI.Services;

public sealed class CadastroAlunoService
{
    private readonly AppDbContext _db;
    private readonly CurrentUserService _current;

    public CadastroAlunoService(AppDbContext db, CurrentUserService current)
    {
        _db = db;
        _current = current;
    }

    public async Task EnviarRespostasAsync(EnviarRespostasCadastroDTO dto)
    {
        if (dto.Respostas.Count == 0 || dto.Respostas.Count > 50 ||
            dto.Respostas.Any(item => string.IsNullOrWhiteSpace(item.Key) || item.Key.Length > 80))
            throw DomainException.BadRequest("Respostas do formulário inválidas.");

        var json = JsonSerializer.Serialize(dto.Respostas);
        if (json.Length > 20_000)
            throw DomainException.BadRequest("O formulário excede o tamanho permitido.");

        var aluno = await _db.Alunos
            .Include(a => a.SolicitacaoCadastro)
            .FirstOrDefaultAsync(a => a.UsuarioId == _current.UsuarioId && a.Usuario.Ativo);

        if (aluno is null)
            throw DomainException.NotFound("Cadastro de aluno não encontrado.");
        if (aluno.StatusCadastro == StatusCadastroAluno.APROVADO)
            throw DomainException.Conflict("Seu cadastro já foi aprovado.");

        var agora = DateTime.UtcNow;
        if (aluno.SolicitacaoCadastro is null)
        {
            _db.SolicitacoesCadastro.Add(new SolicitacaoCadastro
            {
                AlunoId = aluno.Id, RespostasJson = json, EnviadaEm = agora
            });
        }
        else
        {
            aluno.SolicitacaoCadastro.RespostasJson = json;
            aluno.SolicitacaoCadastro.EnviadaEm = agora;
            aluno.SolicitacaoCadastro.StatusAnalise = "AGUARDANDO_ANALISE";
            aluno.SolicitacaoCadastro.ObservacaoAnalise = null;
            aluno.SolicitacaoCadastro.AvaliadorUsuarioId = null;
            aluno.SolicitacaoCadastro.AnalisadaEm = null;
        }
        aluno.StatusCadastro = StatusCadastroAluno.PENDENTE;
        await _db.SaveChangesAsync();
    }

    public async Task<List<SolicitacaoCadastroDTO>> ListarPendentesAsync()
    {
        var alunos = await _db.Alunos
            .AsNoTracking()
            .Where(a => a.Usuario.Ativo && a.StatusCadastro == StatusCadastroAluno.PENDENTE)
            .Include(a => a.Usuario)
            .Include(a => a.SolicitacaoCadastro)
            .Include(a => a.ConvidadoPorPersonal)
            .OrderBy(a => a.CriadoEm)
            .ToListAsync();

        return alunos.Select(aluno => new SolicitacaoCadastroDTO
        {
            AlunoId = aluno.Id,
            NomeCompleto = aluno.NomeCompleto,
            Email = aluno.Usuario.Email,
            Telefone = aluno.Usuario.Telefone,
            CriadoEm = aluno.CriadoEm,
            EnviadaEm = aluno.SolicitacaoCadastro?.EnviadaEm,
            FormularioEnviado = aluno.SolicitacaoCadastro is not null,
            ConvidadoPorPersonal = aluno.ConvidadoPorPersonal?.Nome,
            StatusAnalise = aluno.SolicitacaoCadastro?.StatusAnalise ?? "AGUARDANDO_FORMULARIO",
            ObservacaoAnalise = aluno.SolicitacaoCadastro?.ObservacaoAnalise,
            AnalisadaEm = aluno.SolicitacaoCadastro?.AnalisadaEm,
            Respostas = aluno.SolicitacaoCadastro is null
                ? new()
                : JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(aluno.SolicitacaoCadastro.RespostasJson) ?? new()
        }).ToList();
    }

    public async Task<object> ObterResumoPendentesAsync()
    {
        var pendentes = _db.Alunos.Where(a => a.Usuario.Ativo && a.StatusCadastro == StatusCadastroAluno.PENDENTE);
        var total = await pendentes.CountAsync();
        var enviados = await pendentes.CountAsync(a => a.SolicitacaoCadastro != null);
        return new { total, enviados, aguardandoFormulario = total - enviados };
    }

    public async Task AprovarAsync(Guid alunoId, string? observacao)
    {
        if (_current.Role == "PERSONAL" && !await _db.Personais.AnyAsync(p => p.UsuarioId == _current.UsuarioId && p.Usuario!.Ativo))
            throw DomainException.Forbidden();
        if (observacao?.Length > 1000)
            throw DomainException.BadRequest("A observação deve ter até 1.000 caracteres.");

        await using var transaction = await _db.Database.BeginTransactionAsync();
        var aluno = await _db.Alunos
            .Include(a => a.SolicitacaoCadastro)
            .FirstOrDefaultAsync(a => a.Id == alunoId && a.Usuario.Ativo);

        if (aluno is null)
            throw DomainException.NotFound("Aluno não encontrado.");
        if (aluno.StatusCadastro != StatusCadastroAluno.PENDENTE || aluno.SolicitacaoCadastro is null)
            throw DomainException.Conflict("A solicitação não está mais pendente ou não possui formulário enviado.");

        aluno.StatusCadastro = StatusCadastroAluno.APROVADO;
        aluno.SolicitacaoCadastro.StatusAnalise = "APROVADO";
        aluno.SolicitacaoCadastro.ObservacaoAnalise = string.IsNullOrWhiteSpace(observacao) ? null : observacao.Trim();
        aluno.SolicitacaoCadastro.AvaliadorUsuarioId = _current.UsuarioId;
        aluno.SolicitacaoCadastro.AnalisadaEm = DateTime.UtcNow;
        var equipe = await _db.Usuarios.Where(u => u.Ativo && u.Tipo == TipoUsuario.PERSONAL)
            .Select(u => u.Id).ToListAsync();
        _db.NotificacoesUsuarios.AddRange(equipe.Select(usuarioId => new NotificacaoUsuario
        {
            Id = Guid.NewGuid(),
            UsuarioId = usuarioId,
            Titulo = "Novo aluno aprovado",
            Mensagem = $"O cadastro de {aluno.NomeCompleto} foi aprovado e está disponível para toda a equipe.",
            Tipo = "SISTEMA",
            ReferenciaId = alunoId,
            CriadaEm = DateTime.UtcNow
        }));
        _db.NotificacoesUsuarios.Add(new NotificacaoUsuario
        {
            Id = Guid.NewGuid(), UsuarioId = aluno.UsuarioId,
            Titulo = "Cadastro aprovado",
            Mensagem = "Seu cadastro foi aprovado. Seu acesso aos treinos está liberado.",
            Tipo = "SISTEMA", ReferenciaId = alunoId, CriadaEm = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();
        await transaction.CommitAsync();
    }

    public async Task ReprovarAsync(Guid alunoId, string observacao)
    {
        if (_current.Role == "PERSONAL" && !await _db.Personais.AnyAsync(p => p.UsuarioId == _current.UsuarioId && p.Usuario!.Ativo))
            throw DomainException.Forbidden();
        var nota = observacao.Trim();
        if (nota.Length is < 3 or > 1000)
            throw DomainException.BadRequest("Informe um motivo de reprovação entre 3 e 1.000 caracteres.");
        var aluno = await _db.Alunos.Include(a => a.SolicitacaoCadastro)
            .FirstOrDefaultAsync(a => a.Id == alunoId && a.Usuario.Ativo)
            ?? throw DomainException.NotFound("Aluno não encontrado.");
        if (aluno.StatusCadastro != StatusCadastroAluno.PENDENTE || aluno.SolicitacaoCadastro is null)
            throw DomainException.Conflict("O cadastro não possui formulário pendente para análise.");
        aluno.StatusCadastro = StatusCadastroAluno.REPROVADO;
        aluno.SolicitacaoCadastro.StatusAnalise = "REPROVADO";
        aluno.SolicitacaoCadastro.ObservacaoAnalise = nota;
        aluno.SolicitacaoCadastro.AvaliadorUsuarioId = _current.UsuarioId;
        aluno.SolicitacaoCadastro.AnalisadaEm = DateTime.UtcNow;
        _db.NotificacoesUsuarios.Add(new NotificacaoUsuario
        {
            Id = Guid.NewGuid(), UsuarioId = aluno.UsuarioId,
            Titulo = "Cadastro precisa de ajustes", Mensagem = nota,
            Tipo = "SISTEMA", ReferenciaId = alunoId, CriadaEm = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();
    }
}
