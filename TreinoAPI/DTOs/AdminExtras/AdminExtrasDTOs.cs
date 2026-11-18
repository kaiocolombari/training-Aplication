namespace TreinoAPI.DTOs.AdminExtras;

public sealed class FeedbackAlunoCriarDTO
{
    public Guid? PersonalId { get; set; }
    public string Categoria { get; set; } = "ACOMPANHAMENTO";
    public int Nota { get; set; }
    public string Comentario { get; set; } = string.Empty;
}

public sealed class FeedbackAlunoAtualizarDTO
{
    public string Status { get; set; } = "EM_ANALISE";
    public string? RespostaEquipe { get; set; }
}

public sealed class FeedbackAlunoDTO
{
    public Guid Id { get; set; }
    public Guid AlunoId { get; set; }
    public string AlunoNome { get; set; } = string.Empty;
    public Guid? PersonalId { get; set; }
    public string? PersonalNome { get; set; }
    public string Categoria { get; set; } = string.Empty;
    public int Nota { get; set; }
    public string Comentario { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? RespostaEquipe { get; set; }
    public DateTime CriadoEm { get; set; }
}

public sealed class TarefaPersonalCriarDTO
{
    public Guid? PersonalId { get; set; }
    public Guid? AlunoId { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public string? DicaContexto { get; set; }
    public string Categoria { get; set; } = "GERAL";
    public string Prioridade { get; set; } = "NORMAL";
    public DateTime? DataLimite { get; set; }
}

public sealed class TarefaPersonalAtualizarDTO
{
    public string Titulo { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public string? DicaContexto { get; set; }
    public string Categoria { get; set; } = "GERAL";
    public string Prioridade { get; set; } = "NORMAL";
    public string Status { get; set; } = "PENDENTE";
    public DateTime? DataLimite { get; set; }
}

public sealed class TarefaPersonalDTO
{
    public Guid Id { get; set; }
    public Guid PersonalId { get; set; }
    public string PersonalNome { get; set; } = string.Empty;
    public Guid? AlunoId { get; set; }
    public string? AlunoNome { get; set; }
    public string CriadoPor { get; set; } = string.Empty;
    public string CriadoPorTipo { get; set; } = string.Empty;
    public string Titulo { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public string? DicaContexto { get; set; }
    public string Categoria { get; set; } = string.Empty;
    public string Prioridade { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime? DataLimite { get; set; }
    public DateTime CriadaEm { get; set; }
    public DateTime? ConcluidaEm { get; set; }
}

public sealed class ConfiguracaoAcompanhamentoDTO
{
    public Guid? PersonalId { get; set; }
    public int IntervaloReavaliacaoDias { get; set; } = 90;
    public int IntervaloRevisaoTreinoDias { get; set; } = 60;
    public int AntecedenciaSugestaoDias { get; set; } = 7;
    public bool ControleAvancadoHabilitado { get; set; }
    public DateTime? AtualizadaEm { get; set; }
}

public sealed class RegistroManutencaoCriarDTO
{
    public string Titulo { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public string Categoria { get; set; } = "BUG";
    public string Prioridade { get; set; } = "NORMAL";
}

public sealed class RegistroManutencaoAtualizarDTO
{
    public Guid? ResponsavelUsuarioId { get; set; }
    public string Status { get; set; } = "EM_ANALISE";
    public string? Resolucao { get; set; }
    public string Prioridade { get; set; } = "NORMAL";
}

public sealed class RegistroManutencaoDTO
{
    public Guid Id { get; set; }
    public Guid CriadoPorUsuarioId { get; set; }
    public string CriadoPor { get; set; } = string.Empty;
    public Guid? ResponsavelUsuarioId { get; set; }
    public string? Responsavel { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public string Categoria { get; set; } = string.Empty;
    public string Prioridade { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Resolucao { get; set; }
    public DateTime CriadoEm { get; set; }
    public DateTime AtualizadoEm { get; set; }
    public DateTime? ResolvidoEm { get; set; }
}

public sealed class IndicadoresPersonalDTO
{
    public Guid PersonalId { get; set; }
    public string Nome { get; set; } = string.Empty;
    public int AlunosAtivos { get; set; }
    public int TreinosAtivos { get; set; }
    public int AvaliacoesNoPeriodo { get; set; }
    public int TarefasAbertas { get; set; }
    public int TarefasConcluidas { get; set; }
    public double? NotaMediaFeedback { get; set; }
    public int FeedbacksRecebidos { get; set; }
    public int AcoesRegistradas { get; set; }
}

public sealed class IndicadoresEquipeDTO
{
    public DateOnly Inicio { get; set; }
    public DateOnly Fim { get; set; }
    public List<IndicadoresPersonalDTO> Personais { get; set; } = [];
}

public sealed class VerificacaoSistemaDTO
{
    public string Nome { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Detalhe { get; set; } = string.Empty;
    public long? DuracaoMs { get; set; }
}

public sealed class SaudeSistemaDTO
{
    public string StatusGeral { get; set; } = string.Empty;
    public DateTime VerificadoEm { get; set; }
    public long UptimeSegundos { get; set; }
    public List<VerificacaoSistemaDTO> Verificacoes { get; set; } = [];
}
