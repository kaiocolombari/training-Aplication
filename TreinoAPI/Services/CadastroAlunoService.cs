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
            .FirstOrDefaultAsync(a => a.UsuarioId == _current.UsuarioId);

        if (aluno is null)
            throw DomainException.NotFound("Cadastro de aluno não encontrado.");
        if (aluno.StatusCadastro != StatusCadastroAluno.PENDENTE)
            throw DomainException.Conflict("Este cadastro não está aguardando avaliação.");
        if (aluno.SolicitacaoCadastro is not null)
            throw DomainException.Conflict("O formulário já foi enviado e está aguardando avaliação.");

        _db.SolicitacoesCadastro.Add(new SolicitacaoCadastro
        {
            AlunoId = aluno.Id,
            RespostasJson = json,
            EnviadaEm = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();
    }

    public async Task<List<SolicitacaoCadastroDTO>> ListarPendentesAsync()
    {
        var alunos = await _db.Alunos
            .AsNoTracking()
            .Where(a => a.StatusCadastro == StatusCadastroAluno.PENDENTE)
            .Include(a => a.Usuario)
            .Include(a => a.SolicitacaoCadastro)
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
            Respostas = aluno.SolicitacaoCadastro is null
                ? new()
                : JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(aluno.SolicitacaoCadastro.RespostasJson) ?? new()
        }).ToList();
    }

    public async Task<object> ObterResumoPendentesAsync()
    {
        var pendentes = _db.Alunos.Where(a => a.StatusCadastro == StatusCadastroAluno.PENDENTE);
        var total = await pendentes.CountAsync();
        var enviados = await pendentes.CountAsync(a => a.SolicitacaoCadastro != null);
        return new { total, enviados, aguardandoFormulario = total - enviados };
    }

    public async Task AprovarAsync(Guid alunoId, Guid? personalIdSolicitado)
    {
        var personalId = _current.Role == "PERSONAL"
            ? await _db.Personais.Where(p => p.UsuarioId == _current.UsuarioId).Select(p => (Guid?)p.Id).FirstOrDefaultAsync()
            : personalIdSolicitado;

        if (!personalId.HasValue || !await _db.Personais.AnyAsync(p => p.Id == personalId.Value))
            throw DomainException.BadRequest("Informe um personal válido para vincular o aluno.");

        await using var transaction = await _db.Database.BeginTransactionAsync();
        var aluno = await _db.Alunos
            .Include(a => a.SolicitacaoCadastro)
            .FirstOrDefaultAsync(a => a.Id == alunoId);

        if (aluno is null)
            throw DomainException.NotFound("Aluno não encontrado.");
        if (aluno.StatusCadastro != StatusCadastroAluno.PENDENTE || aluno.SolicitacaoCadastro is null)
            throw DomainException.Conflict("A solicitação não está mais pendente ou não possui formulário enviado.");

        var vinculoExistente = await _db.PersonalAlunos
            .FirstOrDefaultAsync(pa => pa.AlunoId == alunoId && pa.PersonalId == personalId.Value);
        if (vinculoExistente?.Ativo == true)
            throw DomainException.Conflict("Este aluno já está vinculado ao personal selecionado.");

        var vinculosAtivos = await _db.PersonalAlunos.CountAsync(pa => pa.AlunoId == alunoId && pa.Ativo);
        if (vinculosAtivos >= 3)
            throw DomainException.Conflict("O aluno já possui o limite de 3 personais ativos.");

        if (vinculoExistente is null)
        {
            _db.PersonalAlunos.Add(new PersonalAluno
            {
                AlunoId = alunoId,
                PersonalId = personalId.Value,
                Ativo = true,
                CriadoEm = DateTime.UtcNow
            });
        }
        else
        {
            vinculoExistente.Ativo = true;
        }

        aluno.StatusCadastro = StatusCadastroAluno.APROVADO;
        _db.SolicitacoesCadastro.Remove(aluno.SolicitacaoCadastro);
        var personalUsuarioId = await _db.Personais
            .Where(p => p.Id == personalId.Value)
            .Select(p => p.UsuarioId)
            .SingleAsync();
        _db.NotificacoesUsuarios.Add(new NotificacaoUsuario
        {
            Id = Guid.NewGuid(),
            UsuarioId = personalUsuarioId,
            Titulo = "Novo aluno aprovado",
            Mensagem = $"O cadastro de {aluno.NomeCompleto} foi aprovado e vinculado à sua equipe.",
            Tipo = "SISTEMA",
            ReferenciaId = alunoId,
            CriadaEm = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();
        await transaction.CommitAsync();
    }
}
