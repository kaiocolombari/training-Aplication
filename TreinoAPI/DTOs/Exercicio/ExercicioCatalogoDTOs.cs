using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace TreinoAPI.DTOs.Exercicio;

public class ExercicioCatalogoDTO
{
    public Guid Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string? GrupoMuscular { get; set; }
    public string? Equipamento { get; set; }
    public string? Dificuldade { get; set; }
    public string? Descricao { get; set; }
    public string? Instrucoes { get; set; }
    public List<string> Sinonimos { get; set; } = [];
    public List<VideoExercicioDTO> Videos { get; set; } = [];
    public string? VideoPrincipalUrl => Videos.FirstOrDefault(video => video.Principal)?.Url
        ?? Videos.FirstOrDefault()?.Url;
}

public sealed class VideoExercicioDTO
{
    public Guid Id { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string Origem { get; set; } = string.Empty;
    public string Licenca { get; set; } = string.Empty;
    public string? Fonte { get; set; }
    public double? DuracaoSegundos { get; set; }
    public bool Principal { get; set; }
}

public sealed class ExercicioBuscaDTO : ExercicioCatalogoDTO
{
    public double Pontuacao { get; set; }
    public string TipoCorrespondencia { get; set; } = string.Empty;
}

public sealed class SalvarExercicioCatalogoDTO
{
    [Required, StringLength(160, MinimumLength = 2)]
    public string Nome { get; set; } = string.Empty;
    [StringLength(100)]
    public string? GrupoMuscular { get; set; }
    [StringLength(160)]
    public string? Equipamento { get; set; }
    [StringLength(40)]
    public string? Dificuldade { get; set; }
    [StringLength(2000)]
    public string? Descricao { get; set; }
    [StringLength(4000)]
    public string? Instrucoes { get; set; }
    public List<string> Sinonimos { get; set; } = [];
}

public sealed class CriarVideoExercicioForm
{
    [Required]
    public IFormFile? Arquivo { get; set; }
    [StringLength(180)]
    public string? Titulo { get; set; }
    [Required, RegularExpression("^(PROPRIO|LICENCIADO)$")]
    public string Licenca { get; set; } = "PROPRIO";
    [StringLength(500)]
    public string? Fonte { get; set; }
    public bool ConfirmouDireitos { get; set; }
    [Range(0, 3600)]
    public double? DuracaoSegundos { get; set; }
}
