namespace TreinoAPI.DTOs.Comunicacao;

public sealed class AvisoGlobalDTO
{
    public Guid Id { get; set; }
    public Guid AutorId { get; set; }
    public string AutorNome { get; set; } = string.Empty;
    public string Titulo { get; set; } = string.Empty;
    public string Conteudo { get; set; } = string.Empty;
    public DateTime PublicadoEm { get; set; }
}
