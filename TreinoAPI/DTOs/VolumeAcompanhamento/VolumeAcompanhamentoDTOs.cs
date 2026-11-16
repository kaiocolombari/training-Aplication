namespace TreinoAPI.DTOs.VolumeAcompanhamento;

public sealed class IniciarCicloVolumeDTO
{
    public Guid TreinoId { get; set; }
    public DateOnly? DataInicio { get; set; }
}

public sealed class RegistrarVolumeMensalDTO
{
    public int MesCiclo { get; set; }
    public int SeriesInformadas { get; set; }
    public string? Observacao { get; set; }
}

public sealed class VolumeExercicioSnapshotDTO
{
    public string Exercicio { get; set; } = string.Empty;
    public int SeriesPlanejadas { get; set; }
}

public sealed class VolumeMesDTO
{
    public int MesCiclo { get; set; }
    public DateOnly Inicio { get; set; }
    public DateOnly Fim { get; set; }
    public int? Series { get; set; }
    public string Origem { get; set; } = "SEM_REGISTRO";
    public int? DiferencaReferencia { get; set; }
    public decimal? VariacaoReferenciaPercentual { get; set; }
    public string? ClassificacaoReferencia { get; set; }
    public int? DiferencaMesAnterior { get; set; }
    public decimal? VariacaoMesAnteriorPercentual { get; set; }
    public string? ClassificacaoMesAnterior { get; set; }
    public DateTime? RegistradoEm { get; set; }
    public string? Observacao { get; set; }
    public bool PodeRegistrar { get; set; }
}

public sealed class VolumeCicloDTO
{
    public Guid Id { get; set; }
    public Guid TreinoId { get; set; }
    public string TreinoNome { get; set; } = string.Empty;
    public DateOnly DataInicio { get; set; }
    public int ReferenciaSeries { get; set; }
    public DateTime CriadoEm { get; set; }
    public DateTime? EncerradoEm { get; set; }
    public bool Encerrado { get; set; }
    public List<VolumeExercicioSnapshotDTO> Exercicios { get; set; } = [];
    public List<VolumeMesDTO> Meses { get; set; } = [];
}
