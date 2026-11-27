using System.Globalization;
using System.Text;
using TreinoAPI.Model;

namespace TreinoAPI.Services;

public static class ExercicioCatalogoMatcher
{
    private static readonly HashSet<string> StopWords = new(StringComparer.Ordinal)
    {
        "com", "de", "da", "do", "das", "dos", "na", "no", "nas", "nos", "para", "por",
        "the", "with", "and", "of", "a", "an"
    };

    public static string Normalizar(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;

        var decomposed = value.Trim().Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(decomposed.Length);
        foreach (var character in decomposed)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(character) == UnicodeCategory.NonSpacingMark)
                continue;
            builder.Append(char.IsLetterOrDigit(character) ? char.ToLowerInvariant(character) : ' ');
        }

        return string.Join(' ', builder.ToString().Split(' ', StringSplitOptions.RemoveEmptyEntries));
    }

    public static double Pontuar(string consulta, ExercicioCatalogo exercicio)
    {
        var normalizada = Normalizar(consulta);
        if (normalizada.Length == 0)
            return 0;

        var nomes = new[] { exercicio.Nome }
            .Concat(exercicio.Sinonimos.Where(sinonimo => !string.IsNullOrWhiteSpace(sinonimo.Nome)).Select(sinonimo => sinonimo.Nome));
        var melhor = 0d;
        foreach (var nome in nomes)
        {
            var candidato = Normalizar(nome);
            if (candidato == normalizada)
                return 1;

            var leftTokens = Tokens(normalizada);
            var rightTokens = Tokens(candidato);
            var union = leftTokens.Union(rightTokens).Count();
            var tokenScore = union == 0 ? 0 : (double)leftTokens.Intersect(rightTokens).Count() / union;
            var charScore = SimilaridadeCaracteres(normalizada, candidato);
            melhor = Math.Max(melhor, tokenScore * 0.65 + charScore * 0.35);
        }

        return melhor;
    }

    private static HashSet<string> Tokens(string value) => value
        .Split(' ', StringSplitOptions.RemoveEmptyEntries)
        .Where(token => token.Length > 1 && !StopWords.Contains(token))
        .ToHashSet(StringComparer.Ordinal);

    private static double SimilaridadeCaracteres(string left, string right)
    {
        if (left.Length == 0 || right.Length == 0)
            return 0;

        var previous = new int[right.Length + 1];
        var current = new int[right.Length + 1];
        for (var column = 0; column <= right.Length; column++)
            previous[column] = column;

        for (var row = 1; row <= left.Length; row++)
        {
            current[0] = row;
            for (var column = 1; column <= right.Length; column++)
            {
                var cost = left[row - 1] == right[column - 1] ? 0 : 1;
                current[column] = Math.Min(
                    Math.Min(current[column - 1] + 1, previous[column] + 1),
                    previous[column - 1] + cost);
            }
            (previous, current) = (current, previous);
        }

        return 1d - (double)previous[right.Length] / Math.Max(left.Length, right.Length);
    }
}
