using TreinoAPI.DTOs.Aluno;
using TreinoAPI.DTOs.Anamnese;
using TreinoAPI.DTOs.Treino;

namespace TreinoAPI.DTOs.CadastroCompleto;

public class CriarAlunoCompletoDTO
{
    public CriarAlunoDTO Aluno { get; set; } = new();

    public CriarAnamneseDTO? Anamnese { get; set; }

    public CriarAvaliacaoDTO? Avaliacao { get; set; }

    public CriarTesteCargaDTO? TesteCarga { get; set; }

    public CriarTreinoDTO? Treino { get; set; }

    public CriarPeriodizacaoDTO? Periodizacao { get; set; }
}