using Microsoft.AspNetCore.Http;

namespace TreinoAPI.DTOs.ArquivoEquipe;

public sealed class AtualizarArquivoEquipeForm
{
    public string Nome { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public List<IFormFile> Arquivos { get; set; } = [];
}
