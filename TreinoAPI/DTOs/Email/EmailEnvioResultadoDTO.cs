namespace TreinoAPI.DTOs.Email;

public sealed class EmailEnvioResultadoDTO
{
    public int TotalDestinatarios { get; set; }
    public int Enviados { get; set; }
    public int Falhas { get; set; }
    public List<EmailDestinatarioResultadoDTO> Resultados { get; set; } = [];
}

public sealed class EmailDestinatarioResultadoDTO
{
    public Guid UsuarioId { get; set; }
    public string Nome { get; set; } = string.Empty;
    public bool Sucesso { get; set; }
    public string Mensagem { get; set; } = string.Empty;
}
