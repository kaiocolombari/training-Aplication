using Microsoft.AspNetCore.Http;

namespace TreinoAPI.DTOs.ArquivoEquipe;

public sealed class CriarArquivoEquipeForm
{
    public string Nome { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public string PrazoRetencao { get; set; } = "7D";
    public List<IFormFile> Arquivos { get; set; } = [];
}
