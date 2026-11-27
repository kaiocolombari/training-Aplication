using Microsoft.EntityFrameworkCore;
using TreinoAPI.Data;
using TreinoAPI.DTOs.CadastroCompleto;
using TreinoAPI.DTOs.Execucao;
using TreinoAPI.Model;
using TreinoAPI.Security;

namespace TreinoAPI.Services;

public sealed class SalvarFichaService
{
    private readonly AppDbContext _db;
    private readonly ExecucaoTreinoService _execucoes;
    private readonly CadastroCompletoService _cadastro;
    private readonly AvaliacaoAuditService _avaliacaoAudit;
    private readonly CurrentUserService _currentUser;
    private readonly ExercicioCatalogoService _catalogo;

    public SalvarFichaService(
        AppDbContext db,
        ExecucaoTreinoService execucoes,
        CadastroCompletoService cadastro,
        AvaliacaoAuditService avaliacaoAudit,
        CurrentUserService currentUser,
        ExercicioCatalogoService catalogo)
    {
        _db = db;
        _execucoes = execucoes;
        _cadastro = cadastro;
        _avaliacaoAudit = avaliacaoAudit;
        _currentUser = currentUser;
        _catalogo = catalogo;
    }

    public async Task<CadastroCompletoDTO?> SalvarAsync(Guid alunoId, SalvarFichaDTO dto, bool retornarCadastro = true)
    {
        var aluno = await _db.Alunos.Include(a => a.Usuario)
            .FirstOrDefaultAsync(a => a.Id == alunoId);
        if (aluno is null)
            throw DomainException.NotFound("Aluno não encontrado.");

        await using var transaction = await _db.Database.BeginTransactionAsync();

        aluno.NomeCompleto = dto.Aluno.NomeCompleto.Trim();
        aluno.Usuario.Telefone = dto.Aluno.Telefone?.Trim();
        aluno.Genero = dto.Aluno.Genero;
        aluno.DataNascimento = dto.Aluno.DataNascimento;
        aluno.Etnia = dto.Aluno.Etnia;
        aluno.Massa = dto.Aluno.Massa;
        aluno.Estatura = dto.Aluno.Estatura;
        aluno.Femur = dto.Aluno.Femur;
        aluno.Tibia = dto.Aluno.Tibia;
        aluno.Una = dto.Aluno.Una;
        aluno.Umero = dto.Aluno.Umero;
        aluno.FcRepouso = dto.Aluno.FcRepouso;
        aluno.FcReserva = dto.Aluno.FcReserva;
        aluno.Glicose = dto.Aluno.Glicose;
        aluno.Triglicerideos = dto.Aluno.Triglicerideos;
        aluno.Ldl = dto.Aluno.Ldl;
        aluno.Hdl = dto.Aluno.Hdl;
        aluno.Sistolica = dto.Aluno.Sistolica;
        aluno.Diastolica = dto.Aluno.Diastolica;

        foreach (var input in dto.Anamneses)
        {
            var tipo = input.Tipo.Trim();
            if (string.IsNullOrWhiteSpace(tipo))
                continue;

            var item = await _db.Anamnese.FirstOrDefaultAsync(a =>
                a.AlunoId == alunoId && a.Tipo == tipo);
            if (item is null &&
                string.IsNullOrWhiteSpace(input.Objetivo) &&
                string.IsNullOrWhiteSpace(input.Observacoes))
                continue;
            if (item is null)
            {
                item = new Anamnese { AlunoId = alunoId, Tipo = tipo, CriadoEm = DateTime.UtcNow };
                _db.Anamnese.Add(item);
            }

            item.Objetivo = input.Objetivo?.Trim();
            item.Observacoes = input.Observacoes?.Trim();
        }

        if (dto.Avaliacoes.GroupBy(input => input.Numero).Any(group => group.Count() > 1))
            throw DomainException.BadRequest("A ficha não pode repetir o número de uma avaliação.");

        foreach (var input in dto.Avaliacoes)
        {
            if (input.Numero < 1 || input.Id == Guid.Empty)
                throw DomainException.BadRequest("Cada avaliação precisa possuir um número e identificador válidos.");

            var dobrasInput = input.Dobras ?? [];
            var avaliacao = input.Id.HasValue
                ? await _db.Avaliacoes.FirstOrDefaultAsync(a => a.Id == input.Id.Value)
                : null;

            if (avaliacao is not null && avaliacao.AlunoId != alunoId)
                throw DomainException.Conflict("O identificador de avaliação informado pertence a outro aluno.");
            if (avaliacao is not null && !avaliacao.Ativo)
                throw DomainException.Conflict("Uma avaliação arquivada não pode ser alterada.");

            if (avaliacao is null)
            {
                avaliacao = await _db.Avaliacoes.FirstOrDefaultAsync(a =>
                    a.AlunoId == alunoId && a.Numero == input.Numero);
                if (avaliacao is not null && input.Id.HasValue && avaliacao.Id != input.Id.Value)
                    throw DomainException.Conflict("O número da avaliação já pertence a outro registro.");
            }

            var novaAvaliacao = avaliacao is null;
            var agora = DateTime.UtcNow;
            var usuarioId = _currentUser.UsuarioId;

            if (avaliacao is null)
            {
                var novoId = input.Id ?? Guid.NewGuid();
                if (await _db.Avaliacoes.AnyAsync(a => a.Id == novoId))
                    throw DomainException.Conflict("O identificador da avaliação já está sendo utilizado.");

                avaliacao = new Avaliacao
                {
                    Id = novoId,
                    AlunoId = alunoId,
                    Numero = input.Numero,
                    Ativo = true,
                    CriadaEm = agora,
                    CriadaPorUsuarioId = usuarioId == Guid.Empty ? null : usuarioId
                };
                _db.Avaliacoes.Add(avaliacao);
            }
            else
            {
                if (avaliacao.Numero != input.Numero)
                    throw DomainException.BadRequest("O número sequencial de uma avaliação existente não pode ser alterado.");

            }

            avaliacao.Idade = input.Idade;
            avaliacao.Peso = input.Peso;
            avaliacao.Altura = input.Altura;
            avaliacao.PercentualGordura = input.PercentualGordura;
            avaliacao.Objetivo = input.Objetivo?.Trim();
            avaliacao.Observacoes = input.Observacoes?.Trim();
            avaliacao.Ativo = true;
            if (input.RealizadaEm.HasValue)
                avaliacao.RealizadaEm = DateTime.SpecifyKind(input.RealizadaEm.Value, DateTimeKind.Utc);
            else if (novaAvaliacao)
                avaliacao.RealizadaEm = agora;
            if (input.Perimetros is not null)
            {
                var perimetro = await _db.Perimetros.FirstOrDefaultAsync(p => p.AvaliacaoId == avaliacao.Id);
                if (perimetro is null && TemPerimetros(input.Perimetros))
                {
                    perimetro = new Perimetro { AvaliacaoId = avaliacao.Id };
                    _db.Perimetros.Add(perimetro);
                }
                if (perimetro is not null)
                    AplicarPerimetros(perimetro, input.Perimetros);
            }

            if (dobrasInput.GroupBy(d => d.Medida).Any(group => group.Count() > 1))
                throw DomainException.BadRequest("Cada avaliação pode possuir apenas uma entrada por medida de dobra.");

            foreach (var dobraInput in dobrasInput)
            {
                var dobra = await _db.DobrasCutaneas.FirstOrDefaultAsync(d =>
                    d.AvaliacaoId == avaliacao.Id && d.Medida == dobraInput.Medida);
                if (dobra is null && !TemDobras(dobraInput))
                    continue;
                if (dobra is null)
                {
                    dobra = new DobraCutanea { AvaliacaoId = avaliacao.Id, Medida = dobraInput.Medida };
                    _db.DobrasCutaneas.Add(dobra);
                }
                AplicarDobras(dobra, dobraInput);
            }

            var testeCarga = dto.TestesCarga.FirstOrDefault(teste => teste.Numero == input.Numero);
            var novoRegistroHistorico = await _avaliacaoAudit.RegistrarAsync(
                avaliacao,
                novaAvaliacao ? "CRIADA" : "ATUALIZADA",
                novaAvaliacao ? "Avaliação criada pela ficha" : "Dados da avaliação atualizados pela ficha",
                new { avaliacao = input, testeCarga });

            if (!novaAvaliacao && novoRegistroHistorico)
            {
                avaliacao.AtualizadaEm = agora;
                avaliacao.AtualizadaPorUsuarioId = usuarioId == Guid.Empty ? null : usuarioId;
            }

            await _db.SaveChangesAsync();
        }

        if (dto.TestesCarga.GroupBy(input => input.Numero).Any(group => group.Count() > 1))
            throw DomainException.BadRequest("A ficha não pode repetir o número de um teste de carga.");

        foreach (var input in dto.TestesCarga)
        {
            var teste = await _db.TestesCarga.FirstOrDefaultAsync(t =>
                t.AlunoId == alunoId && t.Numero == input.Numero);
            var novoTeste = teste is null;
            if (novoTeste && input.Cargas.Count == 0)
                continue;
            if (teste is null)
            {
                teste = new TesteCarga { AlunoId = alunoId, Numero = input.Numero };
                _db.TestesCarga.Add(teste);
            }
            if (input.RealizadaEm.HasValue)
                teste.RealizadaEm = DateTime.SpecifyKind(input.RealizadaEm.Value, DateTimeKind.Utc);
            else if (novoTeste)
                teste.RealizadaEm = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            var cargasExistentes = await _db.CargasExercicios
                .Where(c => c.TesteCargaId == teste.Id)
                .ToListAsync();
            var nomesCargas = input.Cargas
                .Where(c => !string.IsNullOrWhiteSpace(c.Exercicio))
                .Select(c => c.Exercicio.Trim())
                .ToHashSet(StringComparer.OrdinalIgnoreCase);
            _db.CargasExercicios.RemoveRange(cargasExistentes
                .Where(c => !nomesCargas.Contains(c.Exercicio)));

            if (nomesCargas.Count != input.Cargas.Count(c => !string.IsNullOrWhiteSpace(c.Exercicio)))
                throw DomainException.BadRequest("Um teste de carga não pode repetir o mesmo exercício.");

            foreach (var cargaInput in input.Cargas.Where(c => !string.IsNullOrWhiteSpace(c.Exercicio)))
            {
                var nomeExercicio = cargaInput.Exercicio.Trim();
                var carga = cargasExistentes.FirstOrDefault(c =>
                    string.Equals(c.Exercicio, nomeExercicio, StringComparison.OrdinalIgnoreCase));
                if (carga is null)
                {
                    carga = new CargaExercicio { TesteCargaId = teste.Id, Exercicio = nomeExercicio };
                    _db.CargasExercicios.Add(carga);
                }
                carga.Carga = cargaInput.Carga;
                carga.Repeticoes = cargaInput.Repeticoes;
            }
        }

        if (dto.Treinos.GroupBy(t => t.Id).Any(group => group.Count() > 1))
            throw DomainException.BadRequest("A ficha não pode repetir o identificador de um treino.");

        var treinoIdsRecebidos = dto.Treinos.Select(t => t.Id).ToHashSet();
        var treinosRemovidos = await _db.Treinos
            .Where(t => t.AlunoId == alunoId && t.Ativo && !treinoIdsRecebidos.Contains(t.Id))
            .ToListAsync();
        foreach (var treinoRemovido in treinosRemovidos)
            treinoRemovido.Ativo = false;

        if (treinosRemovidos.Count > 0)
        {
            var idsRemovidos = treinosRemovidos.Select(t => t.Id).ToArray();
            var agendamentosRemovidos = await _db.DiaTreinos
                .Where(link => idsRemovidos.Contains(link.TreinoId))
                .ToListAsync();
            _db.DiaTreinos.RemoveRange(agendamentosRemovidos);
        }

        var exerciciosCatalogoPorNome = await _catalogo.ResolverEmLoteAsync(
            dto.Treinos.SelectMany(treino => treino.Exercicios).Select(exercicio => exercicio.Exercicio),
            CancellationToken.None);

        foreach (var input in dto.Treinos)
        {
            if (input.Id == Guid.Empty)
                throw DomainException.BadRequest("Cada treino precisa possuir um identificador válido.");

            var treino = await _db.Treinos.FirstOrDefaultAsync(t => t.Id == input.Id);
            if (treino is not null && treino.AlunoId != alunoId)
                throw DomainException.Conflict("O identificador de treino informado pertence a outro aluno.");
            if (treino is null)
            {
                treino = new Treino { Id = input.Id, AlunoId = alunoId, CriadoEm = DateTime.UtcNow };
                _db.Treinos.Add(treino);
            }
            treino.Ativo = true;
            treino.Nome = input.Nome.Trim();

            if (input.Exercicios.GroupBy(e => e.Id).Any(group => group.Count() > 1))
                throw DomainException.BadRequest("Um treino não pode repetir o identificador de um exercício.");

            var exerciseIds = input.Exercicios.Select(e => e.Id).ToHashSet();
            var exercisesRemoved = await _db.TreinosExercicios
                .Where(e => e.TreinoId == treino.Id && !exerciseIds.Contains(e.Id))
                .ToListAsync();
            _db.TreinosExercicios.RemoveRange(exercisesRemoved);

            foreach (var exerciseInput in input.Exercicios)
            {
                if (exerciseInput.Id == Guid.Empty)
                    throw DomainException.BadRequest("Cada exercício precisa possuir um identificador válido.");

                var exercise = await _db.TreinosExercicios
                    .Include(e => e.Variacoes)
                    .FirstOrDefaultAsync(e => e.Id == exerciseInput.Id);
                if (exercise is not null && exercise.TreinoId != treino.Id)
                    throw DomainException.Conflict("Um exercício informado pertence a outro treino.");
                if (exercise is null)
                {
                    exercise = new TreinoExercicio { Id = exerciseInput.Id, TreinoId = treino.Id };
                    _db.TreinosExercicios.Add(exercise);
                }

                exercise.Exercicio = exerciseInput.Exercicio.Trim();
                var nomeNormalizado = ExercicioCatalogoMatcher.Normalizar(exercise.Exercicio);
                exercise.ExercicioCatalogoId = exerciciosCatalogoPorNome.GetValueOrDefault(nomeNormalizado);
                exercise.Ordem = exerciseInput.Ordem;
                exercise.Series = exerciseInput.Series;
                exercise.Repeticoes = exerciseInput.Repeticoes;
                exercise.Intervalo = exerciseInput.Intervalo;
                exercise.Carga = exerciseInput.Carga;
                exercise.RiRMAX = exerciseInput.RirMax;
                exercise.Observacoes = exerciseInput.Observacoes;

                if (exerciseInput.Variacoes.GroupBy(v => v.Id).Any(group => group.Count() > 1))
                    throw DomainException.BadRequest("Um exercício não pode repetir o identificador de uma variação.");

                var variationIds = exerciseInput.Variacoes.Select(v => v.Id).ToHashSet();
                var variationsRemoved = await _db.TreinoExercicioVariacoes
                    .Where(v => v.TreinoExercicioId == exercise.Id && !variationIds.Contains(v.Id))
                    .ToListAsync();
                _db.TreinoExercicioVariacoes.RemoveRange(variationsRemoved);

                foreach (var variationInput in exerciseInput.Variacoes)
                {
                    if (variationInput.Id == Guid.Empty)
                        throw DomainException.BadRequest("Cada variação precisa possuir um identificador válido.");

                    var variation = await _db.TreinoExercicioVariacoes
                        .FirstOrDefaultAsync(v => v.Id == variationInput.Id);
                    if (variation is not null && variation.TreinoExercicioId != exercise.Id)
                        throw DomainException.Conflict("Uma variação informada pertence a outro exercício.");
                    if (variation is null)
                    {
                        variation = new TreinoExercicioVariacao
                        {
                            Id = variationInput.Id,
                            TreinoExercicioId = exercise.Id
                        };
                        _db.TreinoExercicioVariacoes.Add(variation);
                    }

                    variation.Exercicio = variationInput.Exercicio.Trim();
                    variation.Ordem = variationInput.Ordem;
                    variation.Series = variationInput.Series;
                    variation.Repeticoes = variationInput.Repeticoes;
                    variation.Intervalo = variationInput.Intervalo;
                    variation.Carga = variationInput.Carga;
                    variation.RiRMAX = variationInput.RirMax;
                    variation.Observacoes = variationInput.Observacoes;
                }
            }
        }

        Periodizacao? periodizacao = null;
        var semanasPorNumero = new Dictionary<int, PeriodizacaoSemana>();
        if (dto.Periodizacao is not null)
        {
            periodizacao = await _db.Periodizacoes
                .FirstOrDefaultAsync(p => p.AlunoId == alunoId);
            if (periodizacao is null)
            {
                periodizacao = new Periodizacao { AlunoId = alunoId };
                _db.Periodizacoes.Add(periodizacao);
            }

            periodizacao.Nome = dto.Periodizacao.Nome;
            periodizacao.DataInicio = DateTime.SpecifyKind(dto.Periodizacao.DataInicio.Date, DateTimeKind.Utc);

            await _db.SaveChangesAsync();
            var existingWeeks = await _db.PeriodizacaoSemanas
                .Where(s => s.PeriodizacaoId == periodizacao.Id)
                .ToListAsync();

            if (dto.Periodizacao.Semanas.GroupBy(s => s.Numero).Any(group => group.Count() > 1))
                throw DomainException.BadRequest("A periodização não pode repetir o número de uma semana.");

            var weekNumbers = dto.Periodizacao.Semanas.Select(s => s.Numero).ToHashSet();
            _db.PeriodizacaoSemanas.RemoveRange(existingWeeks.Where(s => !weekNumbers.Contains(s.Numero)));

            foreach (var weekInput in dto.Periodizacao.Semanas)
            {
                var week = existingWeeks.FirstOrDefault(s => s.Numero == weekInput.Numero);
                if (week is null)
                {
                    week = new PeriodizacaoSemana { PeriodizacaoId = periodizacao.Id, Numero = weekInput.Numero };
                    _db.PeriodizacaoSemanas.Add(week);
                }
                semanasPorNumero[weekInput.Numero] = week;
            }

            await _db.SaveChangesAsync();

            foreach (var weekInput in dto.Periodizacao.Semanas)
            {
                var week = semanasPorNumero[weekInput.Numero];
                if (weekInput.Dias.GroupBy(d => d.Data).Any(group => group.Count() > 1))
                    throw DomainException.BadRequest("Uma semana não pode conter dois dias com a mesma data.");

                var dates = weekInput.Dias.Select(d => d.Data).ToHashSet();
                var existingDays = await _db.PeriodizacaoDias
                    .Where(d => d.SemanaId == week.Id)
                    .ToListAsync();
                _db.PeriodizacaoDias.RemoveRange(existingDays.Where(d =>
                    !dates.Contains(DateOnly.FromDateTime(d.Data))));

                foreach (var dayInput in weekInput.Dias)
                {
                    var dayDate = dayInput.Data.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
                    var day = await _db.PeriodizacaoDias.FirstOrDefaultAsync(d =>
                        d.SemanaId == week.Id && d.Data == dayDate);
                    if (day is null)
                    {
                        day = new PeriodizacaoDia
                        {
                            SemanaId = week.Id,
                            Data = dayDate,
                            DiaSemana = (int)dayInput.Data.DayOfWeek
                        };
                        _db.PeriodizacaoDias.Add(day);
                    }
                    else
                    {
                        day.DiaSemana = (int)dayInput.Data.DayOfWeek;
                    }

                    await _db.SaveChangesAsync();
                    var links = await _db.DiaTreinos.Where(link => link.DiaId == day.Id).ToListAsync();
                    _db.DiaTreinos.RemoveRange(links);

                    if (dayInput.TreinoIds.Distinct().Count() != dayInput.TreinoIds.Count)
                        throw DomainException.BadRequest("Um treino não pode aparecer duas vezes no mesmo dia.");

                    for (var index = 0; index < dayInput.TreinoIds.Count; index++)
                    {
                        var treinoId = dayInput.TreinoIds[index];
                        if (treinoId == Guid.Empty) continue;
                        if (!await _db.Treinos.AnyAsync(t => t.Id == treinoId && t.AlunoId == alunoId && t.Ativo))
                            throw DomainException.BadRequest("A periodização referencia um treino que não pertence ao aluno.");
                        _db.DiaTreinos.Add(new DiaTreino
                        {
                            DiaId = day.Id,
                            TreinoId = treinoId,
                            Ordem = index
                        });
                    }
                }
            }

            await _db.SaveChangesAsync();

            if (dto.Volumes.GroupBy(v => v.Semana).Any(group => group.Count() > 1))
                throw DomainException.BadRequest("A periodização não pode repetir o volume de uma semana.");

            foreach (var weekInput in dto.Periodizacao.Semanas)
            {
                var week = semanasPorNumero[weekInput.Numero];
                var volumeInput = dto.Volumes.FirstOrDefault(v => v.Semana == weekInput.Numero);
                var groupsInput = volumeInput?.Grupos ?? [];
                if (groupsInput.GroupBy(g => g.GrupoMuscularId).Any(group => group.Count() > 1))
                    throw DomainException.BadRequest("Um grupo muscular não pode ser repetido no volume da mesma semana.");

                var groupIds = groupsInput.Select(g => g.GrupoMuscularId).ToHashSet();
                var existingVolumes = await _db.VolumesSemanais
                    .Where(v => v.PeriodizacaoSemanaId == week.Id)
                    .ToListAsync();
                _db.VolumesSemanais.RemoveRange(existingVolumes.Where(v =>
                    !groupIds.Contains(v.GrupoMuscularId)));

                foreach (var groupInput in groupsInput)
                {
                    if (groupInput.GrupoMuscularId == Guid.Empty)
                        throw DomainException.BadRequest("O volume precisa informar um grupo muscular válido.");
                    if (!await _db.GruposMusculares.AnyAsync(g => g.Id == groupInput.GrupoMuscularId))
                        throw DomainException.NotFound("Grupo muscular não encontrado.");

                    var volume = await _db.VolumesSemanais.FirstOrDefaultAsync(v =>
                        v.PeriodizacaoSemanaId == week.Id && v.GrupoMuscularId == groupInput.GrupoMuscularId);
                    if (volume is null && groupInput.SeriesDiretas == 0 && groupInput.SeriesLivres == 0)
                        continue;

                    if (volume is null)
                    {
                        volume = new VolumeSemanal
                        {
                            PeriodizacaoSemanaId = week.Id,
                            GrupoMuscularId = groupInput.GrupoMuscularId
                        };
                        _db.VolumesSemanais.Add(volume);
                    }
                    volume.SeriesDiretas = groupInput.SeriesDiretas;
                    volume.SeriesLivres = groupInput.SeriesLivres;
                }
            }
        }

        await _db.SaveChangesAsync();

        foreach (var execution in dto.Execucoes)
        {
            var treino = await _db.Treinos.FirstOrDefaultAsync(t =>
                t.Id == execution.TreinoId && t.AlunoId == alunoId && t.Ativo);
            if (treino is null)
                throw DomainException.BadRequest("A execução referencia um treino inativo ou que não pertence ao aluno.");

            await _execucoes.SalvarAtualAsync(execution.TreinoId, new AtualizarExecucaoTreinoDTO
            {
                Data = execution.Data,
                Exercicios = execution.Exercicios
            });
        }

        await transaction.CommitAsync();
        if (!retornarCadastro) return null;

        return await _cadastro.ObterCadastro(alunoId)
            ?? throw DomainException.NotFound("Ficha do aluno não encontrada após salvar.");
    }

    private static bool TemPerimetros(PerimetroFichaInputDTO p) =>
        p.Braco_D.HasValue || p.Braco_E.HasValue || p.Antebraco_D.HasValue || p.Antebraco_E.HasValue ||
        p.Torax.HasValue || p.Cintura.HasValue || p.Abdomen.HasValue || p.Quadril.HasValue ||
        p.Coxa_Sup_D.HasValue || p.Coxa_Sup_E.HasValue || p.Coxa_Med_D.HasValue ||
        p.Coxa_Med_E.HasValue || p.Panturrilha_D.HasValue || p.Panturrilha_E.HasValue;

    private static bool TemDobras(DobraFichaInputDTO d) =>
        d.Triceps.HasValue || d.Subescapular.HasValue || d.Biceps.HasValue || d.Iliaca.HasValue ||
        d.Supraespinhal.HasValue || d.Abdominal.HasValue || d.CoxaMedia.HasValue || d.Panturrilha.HasValue;

    private static void AplicarPerimetros(Perimetro target, PerimetroFichaInputDTO source)
    {
        target.Braco_D = source.Braco_D; target.Braco_E = source.Braco_E;
        target.Antebraco_D = source.Antebraco_D; target.Antebraco_E = source.Antebraco_E;
        target.Torax = source.Torax; target.Cintura = source.Cintura;
        target.Abdomen = source.Abdomen; target.Quadril = source.Quadril;
        target.Coxa_Sup_D = source.Coxa_Sup_D; target.Coxa_Sup_E = source.Coxa_Sup_E;
        target.Coxa_Med_D = source.Coxa_Med_D; target.Coxa_Med_E = source.Coxa_Med_E;
        target.Panturrilha_D = source.Panturrilha_D; target.Panturrilha_E = source.Panturrilha_E;
    }

    private static void AplicarDobras(DobraCutanea target, DobraFichaInputDTO source)
    {
        target.Triceps = source.Triceps; target.Subescapular = source.Subescapular;
        target.Biceps = source.Biceps; target.Iliaca = source.Iliaca;
        target.Supraespinhal = source.Supraespinhal; target.Abdominal = source.Abdominal;
        target.CoxaMedia = source.CoxaMedia; target.Panturrilha = source.Panturrilha;
    }
}
