using Microsoft.EntityFrameworkCore;
using TreinoAPI.DTOs.CadastroCompleto;
using TreinoAPI.DTOs.Aluno;
using TreinoAPI.DTOs.Anamnese;
using TreinoAPI.DTOs.Avaliacao;
using TreinoAPI.DTOs.TesteCarga;
using TreinoAPI.DTOs.Treino;
using TreinoAPI.DTOs.Periodizacao;
using TreinoAPI.Model;
using TreinoAPI.Data;
using TreinoAPI.DTOs.VolumeSemanal;
using TreinoAPI.DTOs.DobraCutanea;
using TreinoAPI.DTOs.PersonalAluno;

namespace TreinoAPI.Services;

public class CadastroCompletoService
{
    private readonly AppDbContext _context;

    public CadastroCompletoService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<CadastroCompletoDTO?> ObterCadastro(Guid alunoId)
    {
        var aluno = await _context.Alunos
            .FirstOrDefaultAsync(a => a.Id == alunoId);

        if (aluno == null)
            return null;

        var personais = await _context.PersonalAlunos
            .Where(pa => pa.AlunoId == alunoId)
            .ToListAsync();

        var anamneses = await _context.Anamnese
            .Where(a => a.AlunoId == alunoId)
            .ToListAsync();

        var avaliacoes = await _context.Avaliacoes
            .Where(a => a.AlunoId == alunoId)
            .ToListAsync();

        var avaliacoesIds = avaliacoes
            .Select(a => a.Id)
            .ToList();

        var dobras = await _context.DobrasCutaneas
            .Where(d => avaliacoesIds.Contains(d.AvaliacaoId))
            .ToListAsync();

        var testesCarga = await _context.TestesCarga
            .Where(t => t.AlunoId == alunoId)
            .ToListAsync();

        var treinos = await _context.Treinos
            .Where(t => t.AlunoId == alunoId)
            .ToListAsync();

        var periodizacoes = await _context.Periodizacoes
            .Where(p => p.AlunoId == alunoId)
            .ToListAsync();

        var periodizacaoIds = periodizacoes
            .Select(p => p.Id)
            .ToList();

        var semanas = await _context.PeriodizacaoSemanas
            .Where(s => periodizacaoIds.Contains(s.PeriodizacaoId))
            .ToListAsync();

        var semanaIds = semanas
            .Select(s => s.Id)
            .ToList();

        var volumes = await _context.VolumesSemanais
            .Where(v => semanaIds.Contains(v.PeriodizacaoSemanaId))
            .ToListAsync();

        return new CadastroCompletoDTO
        {
            Aluno = MapearAluno(aluno),

            Personais = personais
                .Select(MapearPersonalAluno)
                .ToList(),

            Anamneses = anamneses
                .Select(MapearAnamnese)
                .ToList(),

            Avaliacoes = avaliacoes
                .Select(MapearAvaliacao)
                .ToList(),

            DobrasCutaneas = dobras
                .Select(MapearDobraCutanea)
                .ToList(),

            TestesCarga = testesCarga
                .Select(MapearTesteCarga)
                .ToList(),

            Treinos = treinos
                .Select(MapearTreino)
                .ToList(),

            Periodizacoes = periodizacoes
                .Select(MapearPeriodizacao)
                .ToList(),

            VolumesSemanais = volumes
                .Select(MapearVolumeSemanal)
                .ToList()
        };
    }

    private AlunoCompletoDTO MapearAluno(Aluno aluno)
    {
        return new AlunoCompletoDTO
        {
            Id = aluno.Id,
            UsuarioId = aluno.UsuarioId,

            NomeCompleto = aluno.NomeCompleto,
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
    }

    private PersonalAlunoDTO MapearPersonalAluno(PersonalAluno personalAluno)
    {
        return new PersonalAlunoDTO
        {
            Id = personalAluno.Id,
            AlunoId = personalAluno.AlunoId,
            PersonalId = personalAluno.PersonalId,
            Ativo = personalAluno.Ativo,
            CriadoEm = personalAluno.CriadoEm
        };
    }

    private DobraCutaneaDTO MapearDobraCutanea(DobraCutanea dobra)
    {
        return new DobraCutaneaDTO
        {
            Id = dobra.Id,
            AvaliacaoId = dobra.AvaliacaoId,
            Abdominal = dobra.Abdominal,
            Biceps = dobra.Biceps,
            CoxaMedia = dobra.CoxaMedia,
            Iliaca = dobra.Iliaca,
            Medida = dobra.Medida,
            Panturrilha = dobra.Panturrilha,
            Subescapular = dobra.Subescapular,
            Supraespinhal = dobra.Supraespinhal,
            Triceps = dobra.Triceps
        };
    }

    private VolumeSemanalDTO MapearVolumeSemanal(VolumeSemanal volume)
    {
        return new VolumeSemanalDTO
        {
            Id = volume.Id,
            GrupoMuscularId = volume.GrupoMuscularId,
            PeriodizacaoSemanaId = volume.PeriodizacaoSemanaId,
            Series = volume.Series
        };
    }

    private AnamneseDTO MapearAnamnese(Anamnese anamnese)
    {
        return new AnamneseDTO
        {
            Id = anamnese.Id,
            AlunoId = anamnese.AlunoId,
            Tipo = anamnese.Tipo,
            CriadoEm = anamnese.CriadoEm,
            Objetivo = anamnese.Objetivo,
            Observacoes = anamnese.Observacoes
        };
    }

    private AvaliacaoDTO MapearAvaliacao(Avaliacao avaliacao)
    {
        return new AvaliacaoDTO
        {
            Id = avaliacao.Id,
            AlunoId = avaliacao.AlunoId,
            Altura = avaliacao.Altura,
            Numero = avaliacao.Numero,
            PerceltualGordura = avaliacao.PerceltualGordura,
            Peso = avaliacao.Peso,
            RealizadaEm = avaliacao.RealizadaEm
        };
    }

    private TesteCargaDTO MapearTesteCarga(TesteCarga teste)
    {
        return new TesteCargaDTO
        {
            Id = teste.Id,
            AlunoId = teste.AlunoId,
            Numero = teste.Numero,
            RealizadaEm = teste.RealizadaEm
        };
    }

    private TreinoDTO MapearTreino(Treino treino)
    {
        return new TreinoDTO
        {
            Id = treino.Id,
            AlunoId = treino.AlunoId,
            CriadoEm = treino.CriadoEm,
            Nome = treino.Nome
        };
    }

    private PeriodizacaoDTO MapearPeriodizacao(Periodizacao periodizacao)
    {
        return new PeriodizacaoDTO
        {
            Id = periodizacao.Id,
            AlunoId = periodizacao.AlunoId,
            Nome = periodizacao.Nome,
            DataInicio = periodizacao.DataInicio
        };
    }
}