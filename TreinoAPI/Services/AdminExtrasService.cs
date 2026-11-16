using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using TreinoAPI.Configuration;
using TreinoAPI.Data;
using TreinoAPI.DTOs.AdminExtras;
using TreinoAPI.Model;
using TreinoAPI.Security;

namespace TreinoAPI.Services;

public sealed class AdminExtrasService
{
    private static readonly string[] FeedbackCategorias = ["ACOMPANHAMENTO", "TREINAMENTO", "SISTEMA", "SUGESTAO"];
    private static readonly string[] FeedbackStatus = ["NOVO", "EM_ANALISE", "RESPONDIDO", "ARQUIVADO"];
    private static readonly string[] TarefaCategorias = ["GERAL", "TREINO", "AVALIACAO", "ALUNO", "ADMINISTRATIVO"];
    private static readonly string[] Prioridades = ["BAIXA", "NORMAL", "ALTA", "URGENTE"];
    private static readonly string[] TarefaStatus = ["PENDENTE", "EM_ANDAMENTO", "CONCLUIDA", "CANCELADA"];
    private static readonly string[] ManutencaoCategorias = ["BUG", "MELHORIA", "INFRAESTRUTURA", "DADOS", "ACESSO"];
    private static readonly string[] ManutencaoStatus = ["ABERTO", "EM_ANALISE", "EM_ANDAMENTO", "RESOLVIDO", "CANCELADO"];

    private readonly AppDbContext _db;
    private readonly CurrentUserService _current;
    private readonly OwnershipService _ownership;
    private readonly ArquivoEquipeStorage _storage;
    private readonly EmailOptions _email;

    public AdminExtrasService(
        AppDbContext db,
        CurrentUserService current,
        OwnershipService ownership,
        ArquivoEquipeStorage storage,
        IOptions<EmailOptions> email)
    {
        _db = db;
        _current = current;
        _ownership = ownership;
        _storage = storage;
        _email = email.Value;
    }

    public async Task<List<FeedbackAlunoDTO>> ListarFeedbackAsync(bool meus)
    {
        IQueryable<FeedbackAluno> consulta = _db.FeedbacksAlunos.AsNoTracking()
            .Include(f => f.Aluno).Include(f => f.Personal);

        if (meus)
        {
            var alunoId = await ObterAlunoAtualIdAsync();
            consulta = consulta.Where(f => f.AlunoId == alunoId);
        }
        else if (_current.Role == "PERSONAL")
        {
            var personalId = await _ownership.GetCurrentPersonalIdAsync();
            consulta = consulta.Where(f => f.PersonalId == personalId ||
                (f.PersonalId == null && f.Aluno.Personais.Any(pa => pa.PersonalId == personalId && pa.Ativo)));
        }

        var registros = await consulta.OrderByDescending(f => f.CriadoEm).Take(250).ToListAsync();
        return registros.Select(MapearFeedback).ToList();
    }

    public async Task<FeedbackAlunoDTO> CriarFeedbackAsync(FeedbackAlunoCriarDTO dto)
    {
        var categoria = Normalizar(dto.Categoria);
        var comentario = dto.Comentario.Trim();
        if (!FeedbackCategorias.Contains(categoria) || dto.Nota is < 1 or > 5 || comentario.Length is < 5 or > 2000)
            throw DomainException.BadRequest("Informe uma categoria válida, nota de 1 a 5 e comentário entre 5 e 2.000 caracteres.");

        var alunoId = await ObterAlunoAtualIdAsync();
        if (dto.PersonalId.HasValue && !await _db.PersonalAlunos.AnyAsync(pa =>
            pa.PersonalId == dto.PersonalId && pa.AlunoId == alunoId && pa.Ativo))
            throw DomainException.NotFound("O profissional selecionado não está vinculado ao seu cadastro.");

        var registro = new FeedbackAluno
        {
            Id = Guid.NewGuid(), AlunoId = alunoId, PersonalId = dto.PersonalId,
            Categoria = categoria, Nota = dto.Nota, Comentario = comentario,
            Status = "NOVO", CriadoEm = DateTime.UtcNow
        };
        _db.FeedbacksAlunos.Add(registro);
        await _db.SaveChangesAsync();
        await _db.Entry(registro).Reference(f => f.Aluno).LoadAsync();
        if (registro.PersonalId.HasValue)
            await _db.Entry(registro).Reference(f => f.Personal).LoadAsync();
        return MapearFeedback(registro);
    }

    public async Task<List<object>> ListarPersonaisDoAlunoAsync()
    {
        var alunoId = await ObterAlunoAtualIdAsync();
        var registros = await _db.PersonalAlunos.AsNoTracking()
            .Where(pa => pa.AlunoId == alunoId && pa.Ativo && pa.Personal.Usuario!.Ativo)
            .OrderBy(pa => pa.Personal.Nome)
            .Select(pa => new { pa.PersonalId, Nome = pa.Personal.Nome })
            .ToListAsync();
        return registros.Cast<object>().ToList();
    }

    public async Task AtualizarFeedbackAsync(Guid id, FeedbackAlunoAtualizarDTO dto)
    {
        var registro = await _db.FeedbacksAlunos.Include(f => f.Aluno)
            .FirstOrDefaultAsync(f => f.Id == id) ?? throw DomainException.NotFound("Feedback não encontrado.");
        await GarantirFeedbackAcessivelAsync(registro);

        var status = Normalizar(dto.Status);
        if (!FeedbackStatus.Contains(status))
            throw DomainException.BadRequest("Status de feedback inválido.");
        if (dto.RespostaEquipe?.Length > 2000)
            throw DomainException.BadRequest("A resposta deve ter até 2.000 caracteres.");

        registro.Status = status;
        registro.RespostaEquipe = string.IsNullOrWhiteSpace(dto.RespostaEquipe) ? null : dto.RespostaEquipe.Trim();
        registro.AtualizadoEm = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task<List<TarefaPersonalDTO>> ListarTarefasAsync(Guid? personalId, string? status)
    {
        var consulta = _db.TarefasPersonais.AsNoTracking()
            .Include(t => t.Personal).ThenInclude(p => p.Usuario)
            .Include(t => t.Aluno).Include(t => t.CriadoPorUsuario).AsQueryable();
        if (_current.Role == "PERSONAL")
            consulta = consulta.Where(t => t.Personal.UsuarioId == _current.UsuarioId);
        else if (personalId.HasValue)
            consulta = consulta.Where(t => t.PersonalId == personalId.Value);

        if (!string.IsNullOrWhiteSpace(status))
            consulta = consulta.Where(t => t.Status == Normalizar(status));

        var registros = await consulta.OrderBy(t => t.DataLimite == null)
            .ThenBy(t => t.DataLimite).ThenByDescending(t => t.Prioridade == "URGENTE")
            .ThenByDescending(t => t.CriadaEm).Take(300).ToListAsync();
        return registros.Select(MapearTarefa).ToList();
    }

    public async Task<TarefaPersonalDTO> CriarTarefaAsync(TarefaPersonalCriarDTO dto)
    {
        var personalId = _current.Role == "PERSONAL"
            ? await _ownership.GetCurrentPersonalIdAsync()
            : dto.PersonalId ?? throw DomainException.BadRequest("Selecione o personal responsável.");
        await ValidarPersonalAsync(personalId);
        await ValidarAlunoDaTarefaAsync(personalId, dto.AlunoId);

        var titulo = dto.Titulo.Trim();
        var descricao = dto.Descricao.Trim();
        var categoria = Normalizar(dto.Categoria);
        var prioridade = Normalizar(dto.Prioridade);
        if (titulo.Length is < 3 or > 140 || descricao.Length > 3000 ||
            !TarefaCategorias.Contains(categoria) || !Prioridades.Contains(prioridade) ||
            (dto.DicaContexto?.Length ?? 0) > 1500)
            throw DomainException.BadRequest("Revise o título, a descrição, a categoria, a prioridade e a dica da tarefa.");

        var agora = DateTime.UtcNow;
        var registro = new TarefaPersonal
        {
            Id = Guid.NewGuid(), PersonalId = personalId, AlunoId = dto.AlunoId,
            CriadoPorUsuarioId = _current.UsuarioId, Titulo = titulo, Descricao = descricao,
            DicaContexto = string.IsNullOrWhiteSpace(dto.DicaContexto) ? null : dto.DicaContexto.Trim(),
            Categoria = categoria, Prioridade = prioridade, Status = "PENDENTE",
            DataLimite = dto.DataLimite?.ToUniversalTime(), CriadaEm = agora, AtualizadaEm = agora
        };
        _db.TarefasPersonais.Add(registro);
        if (_current.Role == "ADMIN")
        {
            var usuarioPersonalId = await _db.Personais.Where(p => p.Id == personalId)
                .Select(p => p.UsuarioId).FirstAsync();
            _db.NotificacoesUsuarios.Add(new NotificacaoUsuario
            {
                Id = Guid.NewGuid(), UsuarioId = usuarioPersonalId,
                Titulo = "Nova tarefa atribuída", Mensagem = titulo,
                Tipo = "TAREFA_PERSONAL", ReferenciaId = registro.Id, CriadaEm = agora
            });
        }
        await _db.SaveChangesAsync();
        return await ObterTarefaAsync(registro.Id);
    }

    public async Task<TarefaPersonalDTO> AtualizarTarefaAsync(Guid id, TarefaPersonalAtualizarDTO dto)
    {
        var registro = await _db.TarefasPersonais.Include(t => t.Personal).ThenInclude(p => p.Usuario)
            .Include(t => t.Aluno).Include(t => t.CriadoPorUsuario)
            .FirstOrDefaultAsync(t => t.Id == id) ?? throw DomainException.NotFound("Tarefa não encontrada.");
        if (_current.Role == "PERSONAL" && registro.Personal.UsuarioId != _current.UsuarioId)
            throw DomainException.NotFound("Tarefa não encontrada.");

        var titulo = dto.Titulo.Trim();
        var descricao = dto.Descricao.Trim();
        var categoria = Normalizar(dto.Categoria);
        var prioridade = Normalizar(dto.Prioridade);
        var status = Normalizar(dto.Status);
        if (titulo.Length is < 3 or > 140 || descricao.Length > 3000 ||
            !TarefaCategorias.Contains(categoria) || !Prioridades.Contains(prioridade) ||
            !TarefaStatus.Contains(status) || (dto.DicaContexto?.Length ?? 0) > 1500)
            throw DomainException.BadRequest("Revise os dados e o status da tarefa.");

        registro.Titulo = titulo; registro.Descricao = descricao;
        registro.DicaContexto = string.IsNullOrWhiteSpace(dto.DicaContexto) ? null : dto.DicaContexto.Trim();
        registro.Categoria = categoria; registro.Prioridade = prioridade; registro.Status = status;
        registro.DataLimite = dto.DataLimite?.ToUniversalTime();
        registro.AtualizadaEm = DateTime.UtcNow;
        registro.ConcluidaEm = status == "CONCLUIDA" ? registro.ConcluidaEm ?? DateTime.UtcNow : null;
        await _db.SaveChangesAsync();
        return MapearTarefa(registro);
    }

    public async Task<ConfiguracaoAcompanhamentoDTO> ObterConfiguracaoAsync(Guid? personalId)
    {
        var id = await ResolverPersonalIdAsync(personalId);
        var config = await _db.ConfiguracoesAcompanhamento.FirstOrDefaultAsync(c => c.PersonalId == id);
        if (config is null)
        {
            config = new ConfiguracaoAcompanhamentoPersonal { Id = Guid.NewGuid(), PersonalId = id, AtualizadaEm = DateTime.UtcNow };
            _db.ConfiguracoesAcompanhamento.Add(config);
            await _db.SaveChangesAsync();
        }
        return MapearConfiguracao(config);
    }

    public async Task<ConfiguracaoAcompanhamentoDTO> SalvarConfiguracaoAsync(ConfiguracaoAcompanhamentoDTO dto)
    {
        var id = await ResolverPersonalIdAsync(dto.PersonalId);
        if (dto.IntervaloReavaliacaoDias is < 7 or > 730 ||
            dto.IntervaloRevisaoTreinoDias is < 7 or > 365 ||
            dto.AntecedenciaSugestaoDias is < 0 or > 90)
            throw DomainException.BadRequest("Os intervalos devem estar dentro dos limites informados.");

        var config = await _db.ConfiguracoesAcompanhamento.FirstOrDefaultAsync(c => c.PersonalId == id);
        if (config is null)
        {
            config = new ConfiguracaoAcompanhamentoPersonal { Id = Guid.NewGuid(), PersonalId = id };
            _db.ConfiguracoesAcompanhamento.Add(config);
        }
        config.IntervaloReavaliacaoDias = dto.IntervaloReavaliacaoDias;
        config.IntervaloRevisaoTreinoDias = dto.IntervaloRevisaoTreinoDias;
        config.AntecedenciaSugestaoDias = dto.AntecedenciaSugestaoDias;
        config.AtualizadaEm = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return MapearConfiguracao(config);
    }

    public async Task<List<RegistroManutencaoDTO>> ListarManutencaoAsync()
    {
        var consulta = _db.RegistrosManutencao.AsNoTracking()
            .Include(m => m.CriadoPorUsuario).Include(m => m.ResponsavelUsuario).AsQueryable();
        if (_current.Role == "PERSONAL")
            consulta = consulta.Where(m => m.CriadoPorUsuarioId == _current.UsuarioId);
        var registros = await consulta.OrderByDescending(m => m.CriadoEm).Take(250).ToListAsync();
        return registros.Select(MapearManutencao).ToList();
    }

    public async Task<RegistroManutencaoDTO> CriarManutencaoAsync(RegistroManutencaoCriarDTO dto)
    {
        var titulo = dto.Titulo.Trim();
        var descricao = dto.Descricao.Trim();
        var categoria = Normalizar(dto.Categoria);
        var prioridade = Normalizar(dto.Prioridade);
        if (titulo.Length is < 3 or > 140 || descricao.Length is < 5 or > 3000 ||
            !ManutencaoCategorias.Contains(categoria) || !Prioridades.Contains(prioridade))
            throw DomainException.BadRequest("Revise o título, a descrição, a categoria e a prioridade.");

        var agora = DateTime.UtcNow;
        var registro = new RegistroManutencao
        {
            Id = Guid.NewGuid(), CriadoPorUsuarioId = _current.UsuarioId,
            Titulo = titulo, Descricao = descricao, Categoria = categoria,
            Prioridade = prioridade, Status = "ABERTO", CriadoEm = agora, AtualizadoEm = agora
        };
        _db.RegistrosManutencao.Add(registro);
        await _db.SaveChangesAsync();
        await _db.Entry(registro).Reference(m => m.CriadoPorUsuario).LoadAsync();
        return MapearManutencao(registro);
    }

    public async Task<RegistroManutencaoDTO> AtualizarManutencaoAsync(Guid id, RegistroManutencaoAtualizarDTO dto)
    {
        var registro = await _db.RegistrosManutencao.Include(m => m.CriadoPorUsuario)
            .Include(m => m.ResponsavelUsuario).FirstOrDefaultAsync(m => m.Id == id)
            ?? throw DomainException.NotFound("Registro de manutenção não encontrado.");
        var status = Normalizar(dto.Status);
        var prioridade = Normalizar(dto.Prioridade);
        if (!ManutencaoStatus.Contains(status) || !Prioridades.Contains(prioridade) || (dto.Resolucao?.Length ?? 0) > 3000)
            throw DomainException.BadRequest("Status, prioridade ou resolução inválidos.");
        if (dto.ResponsavelUsuarioId.HasValue && !await _db.Usuarios.AnyAsync(u =>
            u.Id == dto.ResponsavelUsuarioId && (u.Tipo == TipoUsuario.ADMIN || u.Tipo == TipoUsuario.PERSONAL)))
            throw DomainException.NotFound("Responsável não encontrado.");

        registro.ResponsavelUsuarioId = dto.ResponsavelUsuarioId;
        registro.Status = status; registro.Prioridade = prioridade;
        registro.Resolucao = string.IsNullOrWhiteSpace(dto.Resolucao) ? null : dto.Resolucao.Trim();
        registro.AtualizadoEm = DateTime.UtcNow;
        registro.ResolvidoEm = status == "RESOLVIDO" ? registro.ResolvidoEm ?? DateTime.UtcNow : null;
        await _db.SaveChangesAsync();
        await _db.Entry(registro).Reference(m => m.ResponsavelUsuario).LoadAsync();
        return MapearManutencao(registro);
    }

    public async Task<IndicadoresEquipeDTO> ObterIndicadoresEquipeAsync(DateOnly? inicio, DateOnly? fim)
    {
        var hoje = DateOnly.FromDateTime(DateTime.UtcNow);
        var dataFim = fim ?? hoje;
        var dataInicio = inicio ?? dataFim.AddDays(-29);
        var inicioUtc = dataInicio.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var fimUtc = dataFim.AddDays(1).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var personais = await _db.Personais.AsNoTracking().Include(p => p.Usuario)
            .Where(p => p.Usuario!.Ativo).OrderBy(p => p.Nome).ToListAsync();
        var resultado = new List<IndicadoresPersonalDTO>();

        foreach (var personal in personais)
        {
            var alunoIds = _db.PersonalAlunos.AsNoTracking()
                .Where(pa => pa.PersonalId == personal.Id && pa.Ativo && pa.Aluno.StatusCadastro == StatusCadastroAluno.APROVADO)
                .Select(pa => pa.AlunoId);
            var feedbacks = _db.FeedbacksAlunos.AsNoTracking().Where(f => f.PersonalId == personal.Id);
            resultado.Add(new IndicadoresPersonalDTO
            {
                PersonalId = personal.Id,
                Nome = string.IsNullOrWhiteSpace(personal.Nome) ? personal.Usuario?.Email ?? "Personal" : personal.Nome,
                AlunosAtivos = await alunoIds.CountAsync(),
                TreinosAtivos = await _db.Treinos.CountAsync(t => alunoIds.Contains(t.AlunoId) && t.Ativo),
                AvaliacoesNoPeriodo = await _db.Avaliacoes.CountAsync(a => a.CriadaPorUsuarioId == personal.UsuarioId && a.Ativo && a.CriadaEm >= inicioUtc && a.CriadaEm < fimUtc),
                TarefasAbertas = await _db.TarefasPersonais.CountAsync(t => t.PersonalId == personal.Id && t.Status != "CONCLUIDA" && t.Status != "CANCELADA"),
                TarefasConcluidas = await _db.TarefasPersonais.CountAsync(t => t.PersonalId == personal.Id && t.Status == "CONCLUIDA" && t.ConcluidaEm >= inicioUtc && t.ConcluidaEm < fimUtc),
                NotaMediaFeedback = await feedbacks.Select(f => (double?)f.Nota).AverageAsync(),
                FeedbacksRecebidos = await feedbacks.CountAsync(),
                AcoesRegistradas = await _db.RegistrosAuditoria.CountAsync(a => a.UsuarioId == personal.UsuarioId && a.CriadoEm >= inicioUtc && a.CriadoEm < fimUtc && a.Resultado == "SUCESSO")
            });
        }

        return new IndicadoresEquipeDTO { Inicio = dataInicio, Fim = dataFim, Personais = resultado };
    }

    public async Task<SaudeSistemaDTO> ObterSaudeSistemaAsync()
    {
        var verificacoes = new List<VerificacaoSistemaDTO>();
        var inicioDb = System.Diagnostics.Stopwatch.StartNew();
        try
        {
            var conectado = await _db.Database.CanConnectAsync();
            inicioDb.Stop();
            verificacoes.Add(new VerificacaoSistemaDTO { Nome = "Banco de dados", Status = conectado ? "OK" : "ERRO", Detalhe = conectado ? "Conexão com PostgreSQL disponível." : "Não foi possível estabelecer conexão com PostgreSQL.", DuracaoMs = inicioDb.ElapsedMilliseconds });
        }
        catch (Exception ex)
        {
            inicioDb.Stop();
            verificacoes.Add(new VerificacaoSistemaDTO { Nome = "Banco de dados", Status = "ERRO", Detalhe = $"Falha na verificação ({ex.GetType().Name}).", DuracaoMs = inicioDb.ElapsedMilliseconds });
        }

        try
        {
            var gravavel = _storage.VerificarEscrita();
            verificacoes.Add(new VerificacaoSistemaDTO { Nome = "Armazenamento de arquivos", Status = gravavel ? "OK" : "ERRO", Detalhe = gravavel ? "Diretório privado disponível para leitura e escrita." : "Não foi possível gravar no diretório privado." });
        }
        catch (Exception ex)
        {
            verificacoes.Add(new VerificacaoSistemaDTO { Nome = "Armazenamento de arquivos", Status = "ERRO", Detalhe = $"Falha na verificação ({ex.GetType().Name})." });
        }

        var smtpConfigurado = _email.Enabled && !string.IsNullOrWhiteSpace(_email.Smtp.Host) &&
            !string.IsNullOrWhiteSpace(_email.Smtp.Username) && !string.IsNullOrWhiteSpace(_email.Smtp.Password) &&
            !string.IsNullOrWhiteSpace(_email.SenderEmail);
        verificacoes.Add(new VerificacaoSistemaDTO
        {
            Nome = "Envio de e-mails", Status = smtpConfigurado ? "OK" : "AVISO",
            Detalhe = smtpConfigurado ? "SMTP está configurado. A conectividade do provedor não é testada nesta verificação." : "SMTP não está completamente configurado; envios permanecem desabilitados."
        });

        var erros = verificacoes.Count(v => v.Status == "ERRO");
        var avisos = verificacoes.Count(v => v.Status == "AVISO");
        using var processo = System.Diagnostics.Process.GetCurrentProcess();
        return new SaudeSistemaDTO
        {
            StatusGeral = erros > 0 ? "DEGRADADO" : avisos > 0 ? "ATENCAO" : "SAUDAVEL",
            VerificadoEm = DateTime.UtcNow,
            UptimeSegundos = Math.Max(0, (long)(DateTime.UtcNow - processo.StartTime.ToUniversalTime()).TotalSeconds),
            Verificacoes = verificacoes
        };
    }

    public async Task<List<object>> ListarPersonaisAsync()
    {
        var registros = await _db.Personais.AsNoTracking().Include(p => p.Usuario).OrderBy(p => p.Nome)
            .Where(p => p.Usuario!.Ativo)
            .Select(p => new { p.Id, p.Nome, Email = p.Usuario!.Email }).ToListAsync();
        return registros.Cast<object>().ToList();
    }

    public async Task<List<object>> ListarResponsaveisManutencaoAsync()
    {
        var registros = await _db.Usuarios.AsNoTracking()
            .Where(u => u.Tipo == TipoUsuario.ADMIN || u.Tipo == TipoUsuario.PERSONAL)
            .Where(u => u.Ativo)
            .OrderBy(u => u.Tipo).ThenBy(u => u.Personal != null ? u.Personal.Nome : u.Email)
            .Select(u => new { u.Id, Nome = u.Personal != null ? u.Personal.Nome : u.Email, Tipo = u.Tipo.ToString() })
            .ToListAsync();
        return registros.Cast<object>().ToList();
    }

    public async Task<List<object>> ListarAlunosDoPersonalAsync(Guid? personalId)
    {
        var id = await ResolverPersonalIdAsync(personalId);
        var registros = await _db.PersonalAlunos.AsNoTracking()
            .Where(pa => pa.PersonalId == id && pa.Ativo && pa.Personal.Usuario!.Ativo &&
                pa.Aluno.Usuario.Ativo && pa.Aluno.StatusCadastro == StatusCadastroAluno.APROVADO)
            .OrderBy(pa => pa.Aluno.NomeCompleto)
            .Select(pa => new { pa.AlunoId, Nome = pa.Aluno.NomeCompleto })
            .ToListAsync();
        return registros.Cast<object>().ToList();
    }

    private async Task<Guid> ResolverPersonalIdAsync(Guid? informado)
    {
        if (_current.Role == "PERSONAL") return await _ownership.GetCurrentPersonalIdAsync();
        var id = informado ?? throw DomainException.BadRequest("Selecione um personal.");
        await ValidarPersonalAsync(id);
        return id;
    }

    private async Task ValidarPersonalAsync(Guid personalId)
    {
        if (!await _db.Personais.AnyAsync(p => p.Id == personalId && p.Usuario!.Ativo))
            throw DomainException.NotFound("Personal não encontrado.");
        if (_current.Role == "PERSONAL" && !await _db.Personais.AnyAsync(p => p.Id == personalId && p.UsuarioId == _current.UsuarioId))
            throw DomainException.Forbidden();
    }

    private async Task ValidarAlunoDaTarefaAsync(Guid personalId, Guid? alunoId)
    {
        if (!alunoId.HasValue) return;
        var vinculado = await _db.PersonalAlunos.AnyAsync(pa => pa.PersonalId == personalId &&
            pa.AlunoId == alunoId && pa.Ativo && pa.Personal.Usuario!.Ativo && pa.Aluno.Usuario.Ativo);
        if (!vinculado) throw DomainException.BadRequest("O aluno selecionado não está vinculado ao personal responsável.");
    }

    private async Task<Guid> ObterAlunoAtualIdAsync()
    {
        return await _db.Alunos.Where(a => a.UsuarioId == _current.UsuarioId && a.Usuario.Ativo &&
                a.StatusCadastro == StatusCadastroAluno.APROVADO)
            .Select(a => (Guid?)a.Id).FirstOrDefaultAsync() ?? throw DomainException.Forbidden("Somente alunos aprovados podem enviar feedback.");
    }

    private async Task GarantirFeedbackAcessivelAsync(FeedbackAluno registro)
    {
        if (_current.Role == "ADMIN") return;
        if (_current.Role != "PERSONAL") throw DomainException.Forbidden();
        var personalId = await _ownership.GetCurrentPersonalIdAsync();
        var permitido = registro.PersonalId == personalId || (registro.PersonalId == null &&
            await _db.PersonalAlunos.AnyAsync(pa => pa.PersonalId == personalId && pa.AlunoId == registro.AlunoId && pa.Ativo));
        if (!permitido) throw DomainException.NotFound("Feedback não encontrado.");
    }

    private async Task<TarefaPersonalDTO> ObterTarefaAsync(Guid id)
    {
        var tarefa = await _db.TarefasPersonais.AsNoTracking()
            .Include(t => t.Personal).ThenInclude(p => p.Usuario)
            .Include(t => t.Aluno).Include(t => t.CriadoPorUsuario)
            .FirstAsync(t => t.Id == id);
        return MapearTarefa(tarefa);
    }

    private static string Normalizar(string? valor) => (valor ?? string.Empty).Trim().ToUpperInvariant();

    private static FeedbackAlunoDTO MapearFeedback(FeedbackAluno f) => new()
    {
        Id = f.Id, AlunoId = f.AlunoId, AlunoNome = f.Aluno?.NomeCompleto ?? string.Empty,
        PersonalId = f.PersonalId, PersonalNome = f.Personal?.Nome, Categoria = f.Categoria,
        Nota = f.Nota, Comentario = f.Comentario, Status = f.Status,
        RespostaEquipe = f.RespostaEquipe, CriadoEm = f.CriadoEm
    };

    private static TarefaPersonalDTO MapearTarefa(TarefaPersonal t) => new()
    {
        Id = t.Id, PersonalId = t.PersonalId, PersonalNome = t.Personal?.Nome ?? t.Personal?.Usuario?.Email ?? string.Empty,
        AlunoId = t.AlunoId, AlunoNome = t.Aluno?.NomeCompleto, CriadoPor = t.CriadoPorUsuario?.Email ?? string.Empty,
        Titulo = t.Titulo, Descricao = t.Descricao, DicaContexto = t.DicaContexto,
        Categoria = t.Categoria, Prioridade = t.Prioridade, Status = t.Status,
        DataLimite = t.DataLimite, CriadaEm = t.CriadaEm, ConcluidaEm = t.ConcluidaEm
    };

    private static ConfiguracaoAcompanhamentoDTO MapearConfiguracao(ConfiguracaoAcompanhamentoPersonal c) => new()
    {
        PersonalId = c.PersonalId, IntervaloReavaliacaoDias = c.IntervaloReavaliacaoDias,
        IntervaloRevisaoTreinoDias = c.IntervaloRevisaoTreinoDias,
        AntecedenciaSugestaoDias = c.AntecedenciaSugestaoDias, AtualizadaEm = c.AtualizadaEm
    };

    private static RegistroManutencaoDTO MapearManutencao(RegistroManutencao m) => new()
    {
        Id = m.Id, CriadoPorUsuarioId = m.CriadoPorUsuarioId, CriadoPor = m.CriadoPorUsuario?.Email ?? string.Empty,
        ResponsavelUsuarioId = m.ResponsavelUsuarioId, Responsavel = m.ResponsavelUsuario?.Email,
        Titulo = m.Titulo, Descricao = m.Descricao, Categoria = m.Categoria, Prioridade = m.Prioridade,
        Status = m.Status, Resolucao = m.Resolucao, CriadoEm = m.CriadoEm,
        AtualizadoEm = m.AtualizadoEm, ResolvidoEm = m.ResolvidoEm
    };
}
