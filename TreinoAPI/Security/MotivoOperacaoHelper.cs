using TreinoAPI.DTOs;

namespace TreinoAPI.Security;

public static class MotivoOperacaoHelper
{
    private static readonly IReadOnlyDictionary<string, string> Motivos =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["DIRETRIZES"] = "Quebra das diretrizes",
            ["SOLICITACAO_USUARIO"] = "Solicitação do próprio usuário (mobile)",
            ["DUPLICIDADE"] = "Cadastro duplicado",
            ["ENCERRAMENTO_ADMINISTRATIVO"] = "Encerramento administrativo",
            ["SOLICITACAO_PERSONAL"] = "Solicitação do próprio personal",
            ["SOLICITACAO_ALUNO"] = "Solicitação do aluno",
            ["REORGANIZACAO_EQUIPE"] = "Reorganização da equipe",
            ["OUTRO"] = "Outro motivo"
        };

    public static string Formatar(MotivoOperacaoDTO? dto, string motivoPadrao = "ENCERRAMENTO_ADMINISTRATIVO")
    {
        var codigo = string.IsNullOrWhiteSpace(dto?.Motivo)
            ? motivoPadrao
            : dto.Motivo.Trim().ToUpperInvariant();

        if (!Motivos.TryGetValue(codigo, out var descricao))
            throw DomainException.BadRequest("Selecione um motivo válido para a operação.");

        var detalhe = dto?.Detalhe?.Trim();
        if (codigo == "OUTRO" && string.IsNullOrWhiteSpace(detalhe))
            throw DomainException.BadRequest("Descreva o motivo no campo de detalhes.");
        if (detalhe?.Length > 500)
            throw DomainException.BadRequest("O detalhe do motivo deve ter até 500 caracteres.");

        return string.IsNullOrWhiteSpace(detalhe)
            ? descricao
            : $"{descricao}. Detalhe: {detalhe}";
    }
}
