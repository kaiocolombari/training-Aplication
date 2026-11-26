namespace TreinoAPI.DTOs.AcompanhamentoPersonal;

public sealed class AcompanhamentoPersonalDTO
{
    public DateTime GeradoEm { get; set; }
    public int AlunosAtivos { get; set; }
    public int SessoesNosUltimos7Dias { get; set; }
    public int EnviosAguardandoRevisao { get; set; }
    public int AlertasDeDor { get; set; }
    public int SolicitacoesAvaliacaoPendentes { get; set; }
    public int FeedbacksNovos { get; set; }
    public int TarefasAtrasadas { get; set; }
    public List<AlunoAcompanhamentoDTO> Alunos { get; set; } = [];
    public List<ExecucaoRecebidaDTO> ExecucoesRecentes { get; set; } = [];
    public List<PendenciaAcompanhamentoDTO> Pendencias { get; set; } = [];
}

public sealed class AlunoAcompanhamentoDTO
{
    public Guid AlunoId { get; set; }
    public string NomeCompleto { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool PossuiFichaTecnica { get; set; }
    public int TreinosAtivos { get; set; }
    public int SessoesNosUltimos7Dias { get; set; }
    public int EnviosAguardandoRevisao { get; set; }
    public int AlertasDeDor { get; set; }
    public DateTime? UltimaExecucaoEm { get; set; }
}

public sealed class ExecucaoRecebidaDTO
{
    public Guid Id { get; set; }
    public Guid AlunoId { get; set; }
    public string NomeAluno { get; set; } = string.Empty;
    public Guid TreinoId { get; set; }
    public string NomeTreino { get; set; } = string.Empty;
    public DateOnly Data { get; set; }
    public DateTime? Inicio { get; set; }
    public DateTime? Fim { get; set; }
    public int? DuracaoSegundos { get; set; }
    public int? DuracaoPlanejadaCardioSegundos { get; set; }
    public int? DuracaoRealCardioSegundos { get; set; }
    public string TipoTreino { get; set; } = "strength";
    public int SeriesConcluidas { get; set; }
    public int SeriesTotais { get; set; }
    public double? AdesaoPercentual { get; set; }
    public double? Tonelagem { get; set; }
    public int RelatosDor { get; set; }
    public List<string> Alertas { get; set; } = [];
    public List<string> Feedbacks { get; set; } = [];
    public DateTime? RevisadaEm { get; set; }
    public bool AguardandoRevisao => !RevisadaEm.HasValue;
}

public sealed class PendenciaAcompanhamentoDTO
{
    public string Tipo { get; set; } = string.Empty;
    public string Titulo { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public string Prioridade { get; set; } = "NORMAL";
    public Guid? AlunoId { get; set; }
    public string? NomeAluno { get; set; }
    public Guid? ReferenciaId { get; set; }
    public DateTime CriadaEm { get; set; }
    public DateTime? DataLimite { get; set; }
}

public sealed class RevisarExecucaoDTO
{
    public bool Revisada { get; set; } = true;
}
