using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using TreinoAPI.Data;
using TreinoAPI.DTOs.Aluno;
using TreinoAPI.DTOs.Anamnese;
using TreinoAPI.DTOs.Avaliacao;
using TreinoAPI.DTOs.CadastroCompleto;
using TreinoAPI.DTOs.CargaExercicio;
using TreinoAPI.DTOs.DobraCutanea;
using TreinoAPI.DTOs.Execucao;
using TreinoAPI.DTOs.Exercicio;
using TreinoAPI.DTOs.Perimetro;
using TreinoAPI.DTOs.Periodizacao;
using TreinoAPI.DTOs.PersonalAluno;
using TreinoAPI.DTOs.TesteCarga;
using TreinoAPI.DTOs.Treino;
using TreinoAPI.DTOs.TreinoDia;
using TreinoAPI.DTOs.VolumeSemanal;

namespace TreinoAPI.Services;

public sealed class CadastroCompletoService
{
    private readonly AppDbContext _db;

    public CadastroCompletoService(AppDbContext db) => _db = db;

    public async Task<CadastroCompletoDTO?> ObterCadastro(Guid alunoId)
    {
        var aluno = await _db.Alunos.AsNoTracking()
            .Include(a => a.Usuario)
            .FirstOrDefaultAsync(a => a.Id == alunoId);
        if (aluno is null)
            return null;

        var personais = await _db.PersonalAlunos.AsNoTracking()
            .Where(pa => pa.AlunoId == alunoId)
            .ToListAsync();
        var anamneses = await _db.Anamnese.AsNoTracking()
            .Where(a => a.AlunoId == alunoId)
            .ToListAsync();
        var avaliacoes = await _db.Avaliacoes.AsNoTracking()
            .Where(a => a.AlunoId == alunoId && a.Ativo)
            .Include(a => a.CriadaPorUsuario)
            .Include(a => a.AtualizadaPorUsuario)
            .OrderBy(a => a.Numero)
            .ToListAsync();
        var avaliacaoIds = avaliacoes.Select(a => a.Id).ToArray();

        var dobras = await _db.DobrasCutaneas.AsNoTracking()
            .Where(d => avaliacaoIds.Contains(d.AvaliacaoId))
            .ToListAsync();
        var perimetros = await _db.Perimetros.AsNoTracking()
            .Where(p => avaliacaoIds.Contains(p.AvaliacaoId))
            .ToListAsync();

        var testes = await _db.TestesCarga.AsNoTracking()
            .Where(t => t.AlunoId == alunoId)
            .ToListAsync();
        var testeIds = testes.Select(t => t.Id).ToArray();
        var cargas = await _db.CargasExercicios.AsNoTracking()
            .Where(c => testeIds.Contains(c.TesteCargaId))
            .ToListAsync();

        var treinos = await _db.Treinos.AsNoTracking()
            .Where(t => t.AlunoId == alunoId && t.Ativo)
            .ToListAsync();
        var treinoIds = treinos.Select(t => t.Id).ToArray();
        var exercicios = await _db.TreinosExercicios.AsNoTracking()
            .Where(e => treinoIds.Contains(e.TreinoId))
            .Include(e => e.Variacoes)
            .ToListAsync();

        var periodizacoes = await _db.Periodizacoes.AsNoTracking()
            .Where(p => p.AlunoId == alunoId)
            .ToListAsync();
        var periodizacaoIds = periodizacoes.Select(p => p.Id).ToArray();
        var semanas = await _db.PeriodizacaoSemanas.AsNoTracking()
            .Where(s => periodizacaoIds.Contains(s.PeriodizacaoId))
            .ToListAsync();
        var semanaIds = semanas.Select(s => s.Id).ToArray();
        var dias = await _db.PeriodizacaoDias.AsNoTracking()
            .Where(d => semanaIds.Contains(d.SemanaId))
            .ToListAsync();
        var diaIds = dias.Select(d => d.Id).ToArray();
        var treinosDia = await _db.DiaTreinos.AsNoTracking()
            .Where(d => diaIds.Contains(d.DiaId))
            .ToListAsync();
        var volumes = await _db.VolumesSemanais.AsNoTracking()
            .Where(v => semanaIds.Contains(v.PeriodizacaoSemanaId))
            .ToListAsync();

        var execucoes = await _db.ExecucoesTreino.AsNoTracking()
            .Where(e => treinoIds.Contains(e.TreinoId))
            .Include(e => e.Exercicios)
                .ThenInclude(e => e.Series)
            .ToListAsync();

        return new CadastroCompletoDTO
        {
            Aluno = MapearAluno(aluno),
            Personais = personais.Select(MapearVinculo).ToList(),
            Anamneses = anamneses.Select(MapearAnamnese).ToList(),
            Avaliacoes = avaliacoes.Select(MapearAvaliacao).ToList(),
            DobrasCutaneas = dobras.Select(MapearDobra).ToList(),
            Perimetros = perimetros.Select(MapearPerimetro).ToList(),
            TestesCarga = testes.Select(MapearTeste).ToList(),
            CargasExercicios = cargas.Select(MapearCarga).ToList(),
            Treinos = treinos.Select(MapearTreino).ToList(),
            ExerciciosTreino = exercicios.Select(MapearExercicio).ToList(),
            Periodizacoes = periodizacoes.Select(MapearPeriodizacao).ToList(),
            Semanas = semanas.Select(MapearSemana).ToList(),
            Dias = dias.Select(MapearDia).ToList(),
            TreinosDia = treinosDia.Select(MapearTreinoDia).ToList(),
            VolumesSemanais = volumes.Select(MapearVolume).ToList(),
            ExecucoesTreino = execucoes.Select(MapearExecucao).ToList()
        };
    }

    private static AlunoCompletoDTO MapearAluno(Model.Aluno aluno) => new()
    {
        Id = aluno.Id,
        UsuarioId = aluno.UsuarioId,
        NomeCompleto = aluno.NomeCompleto,
        Email = aluno.Usuario.Email,
        Telefone = aluno.Usuario.Telefone,
        Genero = aluno.Genero,
        DataNascimento = aluno.DataNascimento,
        Etnia = aluno.Etnia,
        Massa = aluno.Massa,
        Estatura = aluno.Estatura,
        Femur = aluno.Femur,
        Tibia = aluno.Tibia,
        Una = aluno.Una,
        Umero = aluno.Umero,
        FcRepouso = aluno.FcRepouso,
        FcReserva = aluno.FcReserva,
        Glicose = aluno.Glicose,
        Triglicerideos = aluno.Triglicerideos,
        Ldl = aluno.Ldl,
        Hdl = aluno.Hdl,
        Sistolica = aluno.Sistolica,
        Diastolica = aluno.Diastolica,
        CriadoEm = aluno.CriadoEm
    };

    private static PersonalAlunoDTO MapearVinculo(Model.PersonalAluno item) => new()
    {
        Id = item.Id,
        AlunoId = item.AlunoId,
        PersonalId = item.PersonalId,
        Ativo = item.Ativo,
        CriadoEm = item.CriadoEm
    };

    private static AnamneseDTO MapearAnamnese(Model.Anamnese item) => new()
    {
        Id = item.Id,
        AlunoId = item.AlunoId,
        Tipo = item.Tipo,
        CriadoEm = item.CriadoEm,
        Objetivo = item.Objetivo,
        Observacoes = item.Observacoes
    };

    private static AvaliacaoDTO MapearAvaliacao(Model.Avaliacao item) => new()
    {
        Id = item.Id,
        AlunoId = item.AlunoId,
        Numero = item.Numero,
        Idade = item.Idade,
        Peso = item.Peso,
        Altura = item.Altura,
        PercentualGordura = item.PercentualGordura,
        RealizadaEm = item.RealizadaEm,
        Objetivo = item.Objetivo,
        Observacoes = item.Observacoes,
        Ativo = item.Ativo,
        CriadaEm = item.CriadaEm,
        CriadaPorEmail = item.CriadaPorUsuario?.Email,
        AtualizadaEm = item.AtualizadaEm,
        AtualizadaPorEmail = item.AtualizadaPorUsuario?.Email
    };

    private static DobraCutaneaDTO MapearDobra(Model.DobraCutanea item) => new()
    {
        Id = item.Id,
        AvaliacaoId = item.AvaliacaoId,
        Medida = item.Medida,
        Triceps = item.Triceps,
        Subescapular = item.Subescapular,
        Biceps = item.Biceps,
        Iliaca = item.Iliaca,
        Supraespinhal = item.Supraespinhal,
        Abdominal = item.Abdominal,
        CoxaMedia = item.CoxaMedia,
        Panturrilha = item.Panturrilha
    };

    private static PerimetroDTO MapearPerimetro(Model.Perimetro item) => new()
    {
        Id = item.Id,
        AvaliacaoId = item.AvaliacaoId,
        Braco_D = item.Braco_D,
        Braco_E = item.Braco_E,
        Antebraco_D = item.Antebraco_D,
        Antebraco_E = item.Antebraco_E,
        Torax = item.Torax,
        Cintura = item.Cintura,
        Abdomen = item.Abdomen,
        Quadril = item.Quadril,
        Coxa_Sup_D = item.Coxa_Sup_D,
        Coxa_Sup_E = item.Coxa_Sup_E,
        Coxa_Med_D = item.Coxa_Med_D,
        Coxa_Med_E = item.Coxa_Med_E,
        Panturrilha_D = item.Panturrilha_D,
        Panturrilha_E = item.Panturrilha_E
    };

    private static TesteCargaDTO MapearTeste(Model.TesteCarga item) => new()
    {
        Id = item.Id,
        AlunoId = item.AlunoId,
        Numero = item.Numero,
        RealizadaEm = item.RealizadaEm
    };

    private static CargaExercicioDTO MapearCarga(Model.CargaExercicio item) => new()
    {
        Id = item.Id,
        TesteCargaId = item.TesteCargaId,
        Exercicio = item.Exercicio,
        Carga = item.Carga,
        Repeticoes = item.Repeticoes
    };

    private static TreinoDTO MapearTreino(Model.Treino item) => new()
    {
        Id = item.Id,
        AlunoId = item.AlunoId,
        Nome = item.Nome,
        CriadoEm = item.CriadoEm
    };

    private static TreinoExercicioDTO MapearExercicio(Model.TreinoExercicio item) => new()
    {
        Id = item.Id,
        TreinoId = item.TreinoId,
        Exercicio = item.Exercicio,
        Ordem = item.Ordem,
        Series = item.Series,
        Repeticoes = item.Repeticoes,
        Intervalo = item.Intervalo,
        Carga = item.Carga,
        RirMax = item.RiRMAX,
        Observacoes = item.Observacoes,
        Variacoes = item.Variacoes.OrderBy(v => v.Ordem).Select(v => new TreinoExercicioVariacaoDTO
        {
            Id = v.Id,
            Exercicio = v.Exercicio,
            Ordem = v.Ordem,
            Series = v.Series,
            Repeticoes = v.Repeticoes,
            Intervalo = v.Intervalo,
            Carga = v.Carga,
            RirMax = v.RiRMAX,
            Observacoes = v.Observacoes
        }).ToList()
    };

    private static PeriodizacaoDTO MapearPeriodizacao(Model.Periodizacao item) => new()
    {
        Id = item.Id,
        AlunoId = item.AlunoId,
        Nome = item.Nome,
        DataInicio = item.DataInicio
    };

    private static PeriodizacaoSemanaDTO MapearSemana(Model.PeriodizacaoSemana item) => new()
    {
        Id = item.Id,
        PeriodizacaoId = item.PeriodizacaoId,
        Numero = item.Numero
    };

    private static PeriodizacaoDiaDTO MapearDia(Model.PeriodizacaoDia item) => new()
    {
        Id = item.Id,
        SemanaId = item.SemanaId,
        Data = item.Data,
        DiaSemana = item.DiaSemana
    };

    private static TreinoDiaDTO MapearTreinoDia(Model.DiaTreino item) => new()
    {
        Id = item.Id,
        DiaId = item.DiaId,
        TreinoId = item.TreinoId,
        Ordem = item.Ordem
    };

    private static VolumeSemanalDTO MapearVolume(Model.VolumeSemanal item) => new()
    {
        Id = item.Id,
        PeriodizacaoSemanaId = item.PeriodizacaoSemanaId,
        GrupoMuscularId = item.GrupoMuscularId,
        SeriesDiretas = item.SeriesDiretas,
        SeriesLivres = item.SeriesLivres
    };

    private static ExecucaoTreinoDTO MapearExecucao(Model.ExecucaoTreino item) => new()
    {
        Id = item.Id,
        TreinoId = item.TreinoId,
        Data = item.Data,
        Exercicios = item.Exercicios.Select(exercicio => new ExecucaoExercicioDTO
        {
            Id = exercicio.Id,
            TreinoExercicioId = exercicio.TreinoExercicioId,
            Nome = exercicio.Nome,
            HardSets = exercicio.HardSets,
            Intensidade = exercicio.Intensidade,
            Tonelagem = exercicio.Tonelagem,
            Estimulo = exercicio.Estimulo,
            Series = exercicio.Series.OrderBy(s => s.Numero).Select(serie => new ExecucaoSerieDTO
            {
                Id = serie.Id,
                Numero = serie.Numero,
                Carga = serie.Carga,
                Repeticoes = serie.Repeticoes,
                Rir = serie.Rir,
                Descanso = serie.Descanso,
                Velocidade = serie.Velocidade,
                Rpe = serie.Rpe,
                ClusterAtivo = serie.ClusterAtivo,
                ClusterBlocos = string.IsNullOrWhiteSpace(serie.ClusterBlocosJson)
                    ? []
                    : JsonSerializer.Deserialize<List<int>>(serie.ClusterBlocosJson) ?? [],
                DropSet = serie.DropSet,
                RestPause = serie.RestPause,
                Falha = serie.Falha
            }).ToList()
        }).ToList()
    };
}
