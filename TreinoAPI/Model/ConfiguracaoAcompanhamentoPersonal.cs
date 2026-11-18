namespace TreinoAPI.Model;

public sealed class ConfiguracaoAcompanhamentoPersonal
{
    public Guid Id { get; set; }
    public Guid PersonalId { get; set; }
    public int IntervaloReavaliacaoDias { get; set; } = 90;
    public int IntervaloRevisaoTreinoDias { get; set; } = 60;
    public int AntecedenciaSugestaoDias { get; set; } = 7;
    public bool ControleAvancadoHabilitado { get; set; }
    public DateTime AtualizadaEm { get; set; }
    public Personal Personal { get; set; } = null!;
}
