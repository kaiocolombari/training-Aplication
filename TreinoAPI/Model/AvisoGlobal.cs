namespace TreinoAPI.Model;

public sealed class AvisoGlobal
{
    public Guid Id { get; set; }
    public Guid AutorId { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string Conteudo { get; set; } = string.Empty;
    public DateTime PublicadoEm { get; set; }
    public Usuario Autor { get; set; } = null!;
}
