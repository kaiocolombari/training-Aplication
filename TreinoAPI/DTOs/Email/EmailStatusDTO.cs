namespace TreinoAPI.DTOs.Email;

public sealed class EmailStatusDTO
{
    public bool Configurado { get; set; }
    public bool ServidorAcessivel { get; set; }
    public bool Autenticado { get; set; }
    public bool ProntoParaEnvio { get; set; }
    public string Estado { get; set; } = "NAO_VERIFICADO";
    public string Biblioteca { get; set; } = "MailKit";
    public bool BibliotecaDisponivel { get; set; }
    public string VersaoBiblioteca { get; set; } = string.Empty;
    public string Servidor { get; set; } = string.Empty;
    public string[] ConfiguracoesPendentes { get; set; } = [];
    public DateTime? VerificadoEm { get; set; }
    public long DuracaoMs { get; set; }
    public string Marca { get; set; } = string.Empty;
    public string RemetenteNome { get; set; } = string.Empty;
    public string RemetenteEmail { get; set; } = string.Empty;
    public string LogoUrl { get; set; } = string.Empty;
    public string CorPrincipal { get; set; } = "#5558D9";
    public string Mensagem { get; set; } = string.Empty;
}
