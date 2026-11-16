namespace TreinoAPI.DTOs.Relatorios;

public sealed class RelatorioMensalDTO
{
    public string Mes { get; set; } = string.Empty;
    public int AlunosNovos { get; set; }
    public int AvaliacoesCriadas { get; set; }
    public int TreinosCriados { get; set; }
    public int Execucoes { get; set; }
}

public sealed class RelatorioGeralDTO
{
    public DateOnly Inicio { get; set; }
    public DateOnly Fim { get; set; }
    public int TotalAlunos { get; set; }
    public int CadastrosEmAnalise { get; set; }
    public int CadastrosAguardandoFormulario { get; set; }
    public int AlunosSemFichaTecnica { get; set; }
    public int AlunosComFichaTecnica { get; set; }
    public int TreinosAtivos { get; set; }
    public int AvaliacoesAtivas { get; set; }
    public int AlunosNovosNoPeriodo { get; set; }
    public int ExecucoesNoPeriodo { get; set; }
    public List<RelatorioMensalDTO> EvolucaoMensal { get; set; } = [];
}
