using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using TreinoAPI.Data;
using TreinoAPI.DTOs.AnaliseEstatistica;
using TreinoAPI.Model;
using TreinoAPI.Security;

namespace TreinoAPI.Services;

public sealed class AnaliseEstatisticaService
{
    private const int MaximoJsonBytes = 512 * 1024;
    private static readonly HashSet<string> FerramentasPermitidas =
    [
        "aderencia", "prescrito-realizado", "volume", "tonelagem", "forca",
        "intensidade", "consistencia", "prontidao", "dor", "antropometria",
        "composicao", "periodizacao", "plato", "carga-recuperacao", "ciclos",
        "assimetria-bilateral", "densidade-sessao", "relatorio"
    ];

    private readonly AppDbContext _db;

    public AnaliseEstatisticaService(AppDbContext db) => _db = db;

    public async Task<List<AnaliseEstatisticaDTO>> ListarAsync(Guid alunoId)
    {
        var registros = await _db.AnalisesEstatisticas
            .AsNoTracking()
            .Where(item => item.AlunoId == alunoId)
            .OrderByDescending(item => item.GeradoEm)
            .Take(50)
            .ToListAsync();

        return registros.Select(Mapear).ToList();
    }

    public async Task<AnaliseEstatisticaDTO> CriarAsync(
        Guid alunoId,
        Guid usuarioId,
        CriarAnaliseEstatisticaDTO dto)
    {
        if (!FerramentasPermitidas.Contains(dto.FerramentaId))
            throw DomainException.BadRequest("Ferramenta estatística inválida.");
        if (string.IsNullOrWhiteSpace(dto.NomeFerramenta) || dto.NomeFerramenta.Length > 120)
            throw DomainException.BadRequest("Informe um nome de ferramenta válido.");
        if (string.IsNullOrWhiteSpace(dto.Resumo) || dto.Resumo.Length > 1000)
            throw DomainException.BadRequest("O resumo deve possuir entre 1 e 1000 caracteres.");
        if (dto.QuantidadeRegistros < 0 || dto.QuantidadeRegistros > 1_000_000)
            throw DomainException.BadRequest("Quantidade de registros inválida.");
        if (dto.PeriodoInicio.HasValue && dto.PeriodoFim.HasValue && dto.PeriodoInicio > dto.PeriodoFim)
            throw DomainException.BadRequest("O início do período não pode ser posterior ao fim.");

        ValidarJson(dto.ParametrosJson, "Parâmetros");
        ValidarJson(dto.ResultadoJson, "Resultado");

        var registro = new AnaliseEstatistica
        {
            Id = Guid.NewGuid(),
            AlunoId = alunoId,
            GeradoPorUsuarioId = usuarioId,
            FerramentaId = dto.FerramentaId,
            NomeFerramenta = dto.NomeFerramenta.Trim(),
            PeriodoInicio = dto.PeriodoInicio,
            PeriodoFim = dto.PeriodoFim,
            ParametrosJson = dto.ParametrosJson,
            ResultadoJson = dto.ResultadoJson,
            Resumo = dto.Resumo.Trim(),
            QuantidadeRegistros = dto.QuantidadeRegistros,
            GeradoEm = DateTime.UtcNow
        };

        _db.AnalisesEstatisticas.Add(registro);
        await _db.SaveChangesAsync();
        return Mapear(registro);
    }

    private static void ValidarJson(string json, string campo)
    {
        if (string.IsNullOrWhiteSpace(json) || System.Text.Encoding.UTF8.GetByteCount(json) > MaximoJsonBytes)
            throw DomainException.BadRequest($"{campo} ausente ou acima do limite de 512 KB.");
        try
        {
            using var document = JsonDocument.Parse(json);
        }
        catch (JsonException)
        {
            throw DomainException.BadRequest($"{campo} precisa conter JSON válido.");
        }
    }

    private static AnaliseEstatisticaDTO Mapear(AnaliseEstatistica item) => new()
    {
        Id = item.Id,
        AlunoId = item.AlunoId,
        FerramentaId = item.FerramentaId,
        NomeFerramenta = item.NomeFerramenta,
        PeriodoInicio = item.PeriodoInicio,
        PeriodoFim = item.PeriodoFim,
        ParametrosJson = item.ParametrosJson,
        ResultadoJson = item.ResultadoJson,
        Resumo = item.Resumo,
        QuantidadeRegistros = item.QuantidadeRegistros,
        GeradoEm = item.GeradoEm
    };
}
