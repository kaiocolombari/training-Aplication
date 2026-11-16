using TreinoAPI.DTOs.Aluno;
using TreinoAPI.DTOs.Anamnese;
using TreinoAPI.DTOs.Avaliacao;
using TreinoAPI.DTOs.CargaExercicio;
using TreinoAPI.DTOs.DobraCutanea;
using TreinoAPI.DTOs.Execucao;
using TreinoAPI.DTOs.Perimetro;
using TreinoAPI.DTOs.Periodizacao;
using TreinoAPI.DTOs.PersonalAluno;
using TreinoAPI.DTOs.Treino;
using TreinoAPI.DTOs.TreinoDia;
using TreinoAPI.DTOs.Exercicio;
using TreinoAPI.DTOs.TesteCarga;
using TreinoAPI.DTOs.VolumeSemanal;

namespace TreinoAPI.DTOs.CadastroCompleto;

public sealed class CadastroCompletoDTO
{
    public AlunoCompletoDTO Aluno { get; set; } = new();
    public List<PersonalAlunoDTO> Personais { get; set; } = [];
    public List<AnamneseDTO> Anamneses { get; set; } = [];
    public List<AvaliacaoDTO> Avaliacoes { get; set; } = [];
    public List<DobraCutaneaDTO> DobrasCutaneas { get; set; } = [];
    public List<PerimetroDTO> Perimetros { get; set; } = [];
    public List<TesteCargaDTO> TestesCarga { get; set; } = [];
    public List<CargaExercicioDTO> CargasExercicios { get; set; } = [];
    public List<TreinoDTO> Treinos { get; set; } = [];
    public List<TreinoExercicioDTO> ExerciciosTreino { get; set; } = [];
    public List<PeriodizacaoDTO> Periodizacoes { get; set; } = [];
    public List<PeriodizacaoSemanaDTO> Semanas { get; set; } = [];
    public List<PeriodizacaoDiaDTO> Dias { get; set; } = [];
    public List<TreinoDiaDTO> TreinosDia { get; set; } = [];
    public List<VolumeSemanalDTO> VolumesSemanais { get; set; } = [];
    public List<ExecucaoTreinoDTO> ExecucoesTreino { get; set; } = [];
}
