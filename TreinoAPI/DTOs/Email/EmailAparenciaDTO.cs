namespace TreinoAPI.DTOs.Email;

public sealed class EmailAparenciaDTO
{
    public string? NomeRemetente { get; set; }
    public string? Marca { get; set; }
    public string? LogoUrl { get; set; }
    public string? TextoRodape { get; set; }
    public string CorPrincipal { get; set; } = "#5558D9";
    public string CorFundo { get; set; } = "#F4F5F8";
    public string CorCartao { get; set; } = "#FFFFFF";
    public string CorCabecalho { get; set; } = "#FFFFFF";
    public string CorTexto { get; set; } = "#20232B";
    public string CorTextoSecundario { get; set; } = "#505664";
    public string CorBorda { get; set; } = "#E7E9EF";
    public string CorRodape { get; set; } = "#F8F9FB";
    public string CorTextoRodape { get; set; } = "#858B98";
}
