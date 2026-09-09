using TreinoAPI.DTOs.Aluno;
using TreinoAPI.DTOs.Anamnese;
using TreinoAPI.DTOs.Avaliacao;
using TreinoAPI.DTOs.DobraCutanea;
using TreinoAPI.DTOs.PersonalAluno;
using TreinoAPI.DTOs.Periodizacao;
using TreinoAPI.DTOs.TesteCarga;
using TreinoAPI.DTOs.Treino;
using TreinoAPI.DTOs.VolumeSemanal;

namespace TreinoAPI.DTOs.CadastroCompleto;

public class CadastroCompletoDTO
{
    public AlunoCompletoDTO Aluno { get; set; } = new();

    public List<PersonalAlunoDTO> Personais { get; set; } = new();

    public List<AnamneseDTO> Anamneses { get; set; } = new();

    public List<AvaliacaoDTO> Avaliacoes { get; set; } = new();

    public List<DobraCutaneaDTO> DobrasCutaneas { get; set; } = new();

    public List<TesteCargaDTO> TestesCarga { get; set; } = new();

    public List<TreinoDTO> Treinos { get; set; } = new();

    public List<PeriodizacaoDTO> Periodizacoes { get; set; } = new();
    
    public List<PeriodizacaoSemanaDTO> Semanas { get; set; } = new();

    public List<VolumeSemanalDTO> VolumesSemanais { get; set; } = new();
}