import { initialState } from "../context/avaliacaoContext";
import { criarAvaliacaoFisicaInicial, type Avaliacao, type AvaliacaoFisica } from "../types/avaliacao";
import type { ExercicioTreino } from "../interface/interfaceExercicio";
import type { ExecucaoTreino } from "../interface/execucaoTreino";
import type { ExecucaoExercicio } from "../interface/execucaoExercicio";
import type Serie from "../interface/interfaceSeriesRIR";
import type { VolumeMuscular } from "../interface/interfaceVolume";
import type { VolumeSemanal } from "../interface/interfaceVolumeSemanal";
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "./api";

let filaSalvarFicha: Promise<void> = Promise.resolve();

function enfileirarSalvarFicha<T>(operacao: () => Promise<T>): Promise<T> {
    const resultado = filaSalvarFicha.then(operacao, operacao);
    filaSalvarFicha = resultado.then(() => undefined, () => undefined);
    return resultado;
}

export interface AlunoResumoApi {
    id: string;
    nomeCompleto: string;
    email: string;
    telefone?: string | null;
    genero?: string | null;
    dataNascimento?: string | null;
    etnia?: string | null;
    criadoEm?: string;
    statusCadastro?: string;
    possuiFichaTecnica?: boolean;
}

export interface PersonalResumoApi {
    id: string;
    usuarioId: string;
    nomeCompleto: string;
    email: string;
    telefone?: string | null;
}

export interface PersonalAlunoApi {
    id: string;
    personalId: string;
    alunoId: string;
    ativo: boolean;
    criadoEm: string;
}

export interface AvaliacaoHistoricoApi {
    id: string;
    avaliacaoId: string;
    acao: string;
    resumo: string;
    criadoEm: string;
    usuarioEmail: string;
    usuarioTipo: string;
}

interface AlunoCompletoApi extends AlunoResumoApi {
    massa?: number | null; estatura?: number | null; femur?: number | null; tibia?: number | null;
    una?: number | null; umero?: number | null; fcRepouso?: number | null; fcReserva?: number | null;
    glicose?: number | null; triglicerideos?: number | null; ldl?: number | null; hdl?: number | null;
    sistolica?: number | null; diastolica?: number | null;
}

interface AnamneseApi { id: string; alunoId: string; tipo: string; objetivo: string; observacoes: string; }
export interface AvaliacaoApi {
    id: string; alunoId: string; numero: number; idade?: number | null; peso?: number | null;
    altura?: number | null; percentualGordura?: number | null; realizadaEm: string;
    objetivo?: string | null; observacoes?: string | null; ativo: boolean; criadaEm: string;
    criadaPorEmail?: string | null; atualizadaEm?: string | null; atualizadaPorEmail?: string | null;
}
interface DobraApi { id: string; avaliacaoId: string; medida: number; triceps?: number | null; subescapular?: number | null; biceps?: number | null; iliaca?: number | null; supraespinhal?: number | null; abdominal?: number | null; coxaMedia?: number | null; panturrilha?: number | null; }
interface PerimetroApi { id: string; avaliacaoId: string; braco_D?: number | null; braco_E?: number | null; antebraco_D?: number | null; antebraco_E?: number | null; torax?: number | null; cintura?: number | null; abdomen?: number | null; quadril?: number | null; coxa_Sup_D?: number | null; coxa_Sup_E?: number | null; coxa_Med_D?: number | null; coxa_Med_E?: number | null; panturrilha_D?: number | null; panturrilha_E?: number | null; }
interface TesteCargaApi { id: string; alunoId: string; numero: number; realizadaEm: string; }
interface CargaApi { id: string; testeCargaId: string; exercicio: string; carga?: number | null; repeticoes?: number | null; }
interface VariacaoApi { id: string; exercicio: string; ordem?: number | null; series?: number | null; repeticoes?: number | null; intervalo?: number | null; carga?: number | null; rirMax?: number | null; observacoes?: string | null; }
interface ExercicioApi { id: string; treinoId: string; exercicio: string; ordem?: number | null; series?: number | null; repeticoes?: number | null; intervalo?: number | null; carga?: number | null; rirMax?: number | null; observacoes?: string | null; variacoes: VariacaoApi[]; }
interface TreinoApi { id: string; alunoId: string; nome: string; criadoEm: string; }
interface PeriodizacaoApi { id: string; alunoId: string; nome?: string | null; dataInicio: string; }
interface SemanaApi { id: string; periodizacaoId: string; numero: number; }
interface DiaApi { id: string; semanaId: string; data: string; diaSemana: number; }
interface TreinoDiaApi { id: string; diaId: string; treinoId: string; ordem: number; }
interface GrupoApi { id: string; nome: string; }
interface VolumeApi { id: string; periodizacaoSemanaId: string; grupoMuscularId: string; seriesDiretas?: number | null; seriesLivres?: number | null; }
interface ExecucaoSerieApi { id: string; numero: number; carga: number; repeticoes: number; rir?: number | null; descanso?: number | null; velocidade?: number | null; rpe?: number | null; clusterAtivo: boolean; clusterBlocos: number[]; dropSet: boolean; restPause: boolean; falha: boolean; }
interface ExecucaoExercicioApi { id: string; treinoExercicioId?: string | null; nome: string; hardSets: number; intensidade: number; tonelagem: number; estimulo: number; series: ExecucaoSerieApi[]; }
interface ExecucaoApi { id: string; treinoId: string; data: string; exercicios: ExecucaoExercicioApi[]; }

export interface CadastroCompletoApi {
    aluno: AlunoCompletoApi;
    personais: Array<{ id: string; personalId: string; alunoId: string; ativo: boolean }>;
    anamneses: AnamneseApi[];
    avaliacoes: AvaliacaoApi[];
    dobrasCutaneas: DobraApi[];
    perimetros: PerimetroApi[];
    testesCarga: TesteCargaApi[];
    cargasExercicios: CargaApi[];
    treinos: TreinoApi[];
    exerciciosTreino: ExercicioApi[];
    periodizacoes: PeriodizacaoApi[];
    semanas: SemanaApi[];
    dias: DiaApi[];
    treinosDia: TreinoDiaApi[];
    volumesSemanais: VolumeApi[];
    execucoesTreino: ExecucaoApi[];
}

const valor = (input: number | string | null | undefined) =>
    input === null || input === undefined ? "" : String(input);

const numero = (input: string | number | null | undefined): number | null => {
    if (input === null || input === undefined || String(input).trim() === "") return null;
    const parsed = Number(input);
    return Number.isFinite(parsed) ? parsed : null;
};

const idadeAtual = (dataNascimento?: string | null) => {
    if (!dataNascimento) return "";
    const nascimento = new Date(dataNascimento);
    if (Number.isNaN(nascimento.getTime())) return "";
    const hoje = new Date();
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const aniversarioAindaNaoOcorreu =
        hoje.getMonth() < nascimento.getMonth() ||
        (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate());
    if (aniversarioAindaNaoOcorreu) idade--;
    return String(Math.max(0, idade));
};

function mapearDobras(registro: DobraApi | undefined) {
    return {
        triceps: valor(registro?.triceps),
        subescapular: valor(registro?.subescapular),
        biceps: valor(registro?.biceps),
        iliaca: valor(registro?.iliaca),
        supraespinhal: valor(registro?.supraespinhal),
        abdominal: valor(registro?.abdominal),
        coxaMedia: valor(registro?.coxaMedia),
        panturrilha: valor(registro?.panturrilha),
    };
}

function mapearPerimetros(registro: PerimetroApi | undefined) {
    return {
        bracoD: valor(registro?.braco_D), bracoE: valor(registro?.braco_E),
        antebracoD: valor(registro?.antebraco_D), antebracoE: valor(registro?.antebraco_E),
        torax: valor(registro?.torax), cintura: valor(registro?.cintura),
        abdomen: valor(registro?.abdomen), quadril: valor(registro?.quadril),
        coxaSupD: valor(registro?.coxa_Sup_D), coxaSupE: valor(registro?.coxa_Sup_E),
        coxaMediaD: valor(registro?.coxa_Med_D), coxaMediaE: valor(registro?.coxa_Med_E),
        panturrilhaD: valor(registro?.panturrilha_D), panturrilhaE: valor(registro?.panturrilha_E),
    };
}

export function mapearAvaliacaoApiParaFisica(registro: AvaliacaoApi): AvaliacaoFisica {
    const base = criarAvaliacaoFisicaInicial(registro.numero, registro.id);
    return {
        ...base,
        numero: registro.numero,
        realizadaEm: registro.realizadaEm?.slice(0, 10) ?? base.realizadaEm,
        criadaEm: registro.criadaEm ?? null,
        criadaPorEmail: registro.criadaPorEmail ?? null,
        atualizadaEm: registro.atualizadaEm ?? null,
        atualizadaPorEmail: registro.atualizadaPorEmail ?? null,
        ativo: registro.ativo !== false,
        idade: valor(registro.idade),
        peso: valor(registro.peso),
        altura: valor(registro.altura),
        percentualGordura: valor(registro.percentualGordura),
        anamnese: {
            objetivo: registro.objetivo ?? "",
            observacoes: registro.observacoes ?? "",
        },
    };
}

function mapearAnamnese(anamneses: AnamneseApi[], categoria: "inicial" | "reavaliacao" | "comparacao") {
    const found = anamneses.find(item => {
        const tipo = item.tipo.toLocaleLowerCase("pt-BR");
        if (categoria === "comparacao") return tipo.includes("compar");
        if (categoria === "reavaliacao") return tipo.includes("reav") || tipo.includes("segunda") || tipo.includes("2");
        return tipo.includes("inicial") || tipo.includes("primeira") || tipo.includes("1");
    });
    return { objetivo: found?.objetivo ?? "", observacoes: found?.observacoes ?? "" };
}

function mapearExecucao(registro: ExecucaoApi): ExecucaoTreino {
    return {
        treinoId: registro.treinoId,
        data: registro.data,
        exercicios: registro.exercicios.map((item): ExecucaoExercicio => ({
            // Execuções antigas mantêm o snapshot mesmo após a remoção do exercício prescrito.
            exercicioId: item.treinoExercicioId ?? "",
            nome: item.nome,
            series: item.series.map((serie): Serie => ({
                numero: serie.numero,
                carga: serie.carga,
                repeticoes: serie.repeticoes,
                rir: serie.rir ?? 0,
                descanso: serie.descanso ?? 0,
                velocidade: serie.velocidade ?? undefined,
                rpe: serie.rpe ?? undefined,
                cluster: { ativo: serie.clusterAtivo, blocos: serie.clusterBlocos ?? [] },
                dropSet: serie.dropSet,
                restPause: serie.restPause,
                falha: serie.falha,
            })),
            resultado: {
                hardSets: item.hardSets,
                intensidade: item.intensidade,
                tonelagem: item.tonelagem,
                estimulo: item.estimulo,
            },
        })),
    };
}

export function mapearCadastroParaAvaliacao(cadastro: CadastroCompletoApi, grupos: GrupoApi[]): Avaliacao {
    const dados = structuredClone(initialState);
    const aluno = cadastro.aluno;

    dados.aluno = {
        ...dados.aluno,
        nomeCompleto: aluno.nomeCompleto,
        email: aluno.email,
        telefone: aluno.telefone ?? "",
        dataNascimento: aluno.dataNascimento ?? "",
        idade: idadeAtual(aluno.dataNascimento),
        genero: aluno.genero ?? "",
        etnia: aluno.etnia ?? "",
        massa: valor(aluno.massa), estatura: valor(aluno.estatura),
        femur: valor(aluno.femur), tibia: valor(aluno.tibia),
        una: valor(aluno.una), umero: valor(aluno.umero),
        fcRepouso: valor(aluno.fcRepouso), fcReserva: valor(aluno.fcReserva),
        glicose: valor(aluno.glicose), triglicerideos: valor(aluno.triglicerideos),
        ldl: valor(aluno.ldl), hdl: valor(aluno.hdl),
        sistolica: valor(aluno.sistolica), diastolica: valor(aluno.diastolica),
    };

    dados.anamneseComparacao = mapearAnamnese(cadastro.anamneses, "comparacao");

    dados.avaliacoes = cadastro.avaliacoes
        .filter(item => item.ativo !== false)
        .sort((a, b) => a.numero - b.numero)
        .map((registro): AvaliacaoFisica => {
            const base = criarAvaliacaoFisicaInicial(registro.numero, registro.id);
            const perimetros = cadastro.perimetros.find(item => item.avaliacaoId === registro.id);
            const dobras = cadastro.dobrasCutaneas.filter(item => item.avaliacaoId === registro.id);
            const teste = cadastro.testesCarga.find(item => item.numero === registro.numero);
            const cargas = teste
                ? cadastro.cargasExercicios.filter(item => item.testeCargaId === teste.id)
                : [];

            for (const key of ["supino", "terra", "remada", "agachamento"] as const) {
                const item = cargas.find(carga => carga.exercicio.toLocaleLowerCase("pt-BR").includes(key));
                base.testeCarga[key] = { carga: valor(item?.carga), repeticoes: valor(item?.repeticoes) };
            }

            return {
                ...base,
                id: registro.id,
                numero: registro.numero,
                realizadaEm: registro.realizadaEm?.slice(0, 10) ?? base.realizadaEm,
                criadaEm: registro.criadaEm ?? null,
                criadaPorEmail: registro.criadaPorEmail ?? null,
                atualizadaEm: registro.atualizadaEm ?? null,
                atualizadaPorEmail: registro.atualizadaPorEmail ?? null,
                ativo: registro.ativo !== false,
                peso: valor(registro.peso),
                altura: valor(registro.altura),
                idade: valor(registro.idade),
                percentualGordura: valor(registro.percentualGordura),
                perimetros: mapearPerimetros(perimetros),
                dobrasCutaneas: {
                    medida1: mapearDobras(dobras.find(item => item.medida === 1)),
                    medida2: mapearDobras(dobras.find(item => item.medida === 2)),
                },
                anamnese: {
                    objetivo: registro.objetivo ?? "",
                    observacoes: registro.observacoes ?? "",
                },
            };
        });

    const execucoes = [...cadastro.execucoesTreino].sort((a, b) => b.data.localeCompare(a.data));
    const dataLocalAtual = new Date(Date.now() - new Date().getTimezoneOffset() * 60_000)
        .toISOString().slice(0, 10);
    dados.treino = cadastro.treinos
        .sort((a, b) => a.criadoEm.localeCompare(b.criadoEm))
        .map(treino => {
            const exercicios = cadastro.exerciciosTreino
                .filter(item => item.treinoId === treino.id)
                .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
                .map((item): ExercicioTreino => {
                    const sessaoAtual = execucoes.find(session =>
                        session.treinoId === treino.id && session.data.slice(0, 10) === dataLocalAtual
                    );
                    const execution = sessaoAtual?.exercicios
                        .find(entry => entry.treinoExercicioId === item.id);
                    return {
                        id: item.id,
                        exercicio: item.exercicio,
                        series: valor(item.series),
                        repeticoes: valor(item.repeticoes),
                        intervalo: valor(item.intervalo),
                        carga: valor(item.carga),
                        rirMax: valor(item.rirMax),
                        observacoes: item.observacoes ?? "",
                        variacoes: (item.variacoes ?? []).map(variation => ({
                            id: variation.id,
                            exercicio: variation.exercicio,
                            series: valor(variation.series),
                            repeticoes: valor(variation.repeticoes),
                            intervalo: valor(variation.intervalo),
                            carga: valor(variation.carga),
                            rirMax: valor(variation.rirMax),
                            observacoes: variation.observacoes ?? "",
                            variacoes: [],
                        })),
                        seriesIntensidade: sessaoAtual ? (execution?.series ?? []).map(serie => ({
                            reps: valor(serie.repeticoes),
                            carga: valor(serie.carga),
                            rir: valor(serie.rir),
                            descanso: serie.descanso ?? undefined,
                            velocidade: serie.velocidade ?? undefined,
                            rpe: serie.rpe ?? undefined,
                            cluster: { ativo: serie.clusterAtivo, blocos: serie.clusterBlocos ?? [] },
                            dropSet: serie.dropSet,
                            restPause: serie.restPause,
                            falha: serie.falha,
                        })) : undefined,
                    };
                });
            return { id: treino.id, nome: treino.nome, exercicios };
        });

    const periodizacao = cadastro.periodizacoes[0];
    if (periodizacao) {
        const semanas = cadastro.semanas
            .filter(semana => semana.periodizacaoId === periodizacao.id)
            .sort((a, b) => a.numero - b.numero);
        dados.periodizacao = {
            nome: periodizacao.nome ?? "Periodização principal",
            dataInicio: periodizacao.dataInicio.slice(0, 10),
            semanas: semanas.map(semana => ({
                numero: semana.numero,
                dias: cadastro.dias
                    .filter(dia => dia.semanaId === semana.id)
                    .sort((a, b) => a.data.localeCompare(b.data))
                    .map(dia => ({
                        data: dia.data.slice(0, 10),
                        treinoIds: cadastro.treinosDia
                            .filter(link => link.diaId === dia.id)
                            .sort((a, b) => a.ordem - b.ordem)
                            .map(link => link.treinoId)
                            .concat(["", "", ""])
                            .slice(0, 3),
                    })),
            })),
        };

        const gruposById = new Map(grupos.map(group => [group.id, group.nome]));
        dados.volume = semanas.map(semana => {
            const volumes = cadastro.volumesSemanais.filter(item => item.periodizacaoSemanaId === semana.id);
            const volumeByGroup = new Map(volumes.map(item => [item.grupoMuscularId, item]));
            const groups: VolumeMuscular[] = grupos.map(group => {
                const volume = volumeByGroup.get(group.id);
                return {
                    id: group.id,
                    grupo: gruposById.get(group.id) ?? group.nome,
                    seriesDiretas: volume?.seriesDiretas ?? 0,
                    seriesLivres: volume?.seriesLivres ?? 0,
                };
            });
            return { semana: semana.numero, grupos: groups } satisfies VolumeSemanal;
        });
    } else {
        // Alunos recém-criados ainda não têm periodização; use os IDs reais
        // dos grupos vindos da API em vez dos IDs estáticos do estado inicial.
        dados.volume = dados.periodizacao.semanas.map(semana => ({
            semana: semana.numero,
            grupos: grupos.map(group => ({
                id: group.id,
                grupo: group.nome,
                seriesDiretas: 0,
                seriesLivres: 0,
            })),
        }));
    }

    dados.seriesRIR = execucoes.map(mapearExecucao);
    return dados;
}

export function mapearAvaliacaoParaSalvarFicha(dados: Avaliacao) {
    const mapearMedidas = (medidas: Record<string, string>) => ({
        Braco_D: numero(medidas.bracoD), Braco_E: numero(medidas.bracoE),
        Antebraco_D: numero(medidas.antebracoD), Antebraco_E: numero(medidas.antebracoE),
        Torax: numero(medidas.torax), Cintura: numero(medidas.cintura),
        Abdomen: numero(medidas.abdomen), Quadril: numero(medidas.quadril),
        Coxa_Sup_D: numero(medidas.coxaSupD), Coxa_Sup_E: numero(medidas.coxaSupE),
        Coxa_Med_D: numero(medidas.coxaMediaD), Coxa_Med_E: numero(medidas.coxaMediaE),
        Panturrilha_D: numero(medidas.panturrilhaD), Panturrilha_E: numero(medidas.panturrilhaE),
    });

    const mapearDobra = (medida: number, item: Record<string, string>) => ({
        medida,
        Triceps: numero(item.triceps), Subescapular: numero(item.subescapular),
        Biceps: numero(item.biceps), Iliaca: numero(item.iliaca),
        Supraespinhal: numero(item.supraespinhal), Abdominal: numero(item.abdominal),
        CoxaMedia: numero(item.coxaMedia), Panturrilha: numero(item.panturrilha),
    });

    const anamneses = [
        { tipo: "COMPARACAO", ...dados.anamneseComparacao },
    ];

    const avaliacoes = dados.avaliacoes.map(item => ({
        id: item.id,
        numero: item.numero,
        idade: numero(item.idade),
        peso: numero(item.peso),
        altura: numero(item.altura),
        percentualGordura: numero(item.percentualGordura),
        realizadaEm: item.realizadaEm ? `${item.realizadaEm}T00:00:00` : null,
        objetivo: item.anamnese.objetivo,
        observacoes: item.anamnese.observacoes,
        perimetros: mapearMedidas(item.perimetros as unknown as Record<string, string>),
        dobras: [
            mapearDobra(1, item.dobrasCutaneas.medida1 as unknown as Record<string, string>),
            mapearDobra(2, item.dobrasCutaneas.medida2 as unknown as Record<string, string>),
        ],
    }));

    const testesCarga = dados.avaliacoes.map(item => {
        const teste = item.testeCarga;
        const cargas = (["supino", "terra", "remada", "agachamento"] as const)
            .map(exercicio => ({
                exercicio: exercicio[0].toUpperCase() + exercicio.slice(1),
                carga: numero(teste[exercicio].carga),
                repeticoes: numero(teste[exercicio].repeticoes),
            }))
            .filter(item => item.carga !== null || item.repeticoes !== null);
        return { numero: item.numero, realizadaEm: item.realizadaEm ? `${item.realizadaEm}T00:00:00` : null, cargas };
    });

    const treinos = dados.treino
        .filter(treino => treino.nome.trim().length >= 2)
        .map(treino => ({
            id: treino.id,
            nome: treino.nome.trim(),
            exercicios: treino.exercicios
                .filter(exercicio => exercicio.exercicio.trim().length >= 2)
                .map((exercicio, ordem) => ({
                    id: exercicio.id,
                    exercicio: exercicio.exercicio.trim(),
                    ordem,
                    series: numero(exercicio.series),
                    repeticoes: numero(exercicio.repeticoes),
                    intervalo: numero(exercicio.intervalo),
                    carga: numero(exercicio.carga),
                    rirMax: numero(exercicio.rirMax),
                    observacoes: exercicio.observacoes,
                    variacoes: (exercicio.variacoes ?? [])
                        .filter(variacao => variacao.exercicio.trim().length >= 2)
                        .map((variacao, variacaoOrdem) => ({
                            id: variacao.id,
                            exercicio: variacao.exercicio.trim(),
                            ordem: variacaoOrdem,
                            series: numero(variacao.series),
                            repeticoes: numero(variacao.repeticoes),
                            intervalo: numero(variacao.intervalo),
                            carga: numero(variacao.carga),
                            rirMax: numero(variacao.rirMax),
                            observacoes: variacao.observacoes,
                        })),
                })),
        }));

    const treinoIds = new Set(treinos.map(treino => treino.id));
    const periodizacao = {
        nome: dados.periodizacao.nome,
        dataInicio: dados.periodizacao.dataInicio,
        semanas: dados.periodizacao.semanas.map(semana => ({
            numero: semana.numero,
            dias: semana.dias
                .filter(dia => /^\d{4}-\d{2}-\d{2}$/.test(dia.data))
                .map(dia => ({ data: dia.data, treinoIds: dia.treinoIds.filter(id => treinoIds.has(id)) })),
        })),
    };

    const volumes = dados.volume.map(semana => ({
        semana: semana.semana,
        grupos: semana.grupos.map(grupo => ({
            grupoMuscularId: grupo.id,
            seriesDiretas: grupo.seriesDiretas,
            seriesLivres: grupo.seriesLivres,
        })),
    }));

    const dataLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
    const execucoesAtuais = dados.treino.filter(treino =>
        treinoIds.has(treino.id) && treino.exercicios.some(exercicio => exercicio.seriesIntensidade !== undefined)
    ).map(treino => ({
        treinoId: treino.id,
        data: dataLocal,
        exercicios: treino.exercicios
            .filter(exercicio => exercicio.exercicio.trim() && exercicio.seriesIntensidade !== undefined)
            .map(exercicio => ({
                treinoExercicioId: exercicio.id,
                series: (exercicio.seriesIntensidade ?? []).map((serie, index) => ({
                    numero: index + 1,
                    carga: numero(serie.carga) ?? 0,
                    repeticoes: numero(serie.reps) ?? 0,
                    rir: numero(serie.rir),
                    descanso: serie.descanso ?? null,
                    velocidade: serie.velocidade ?? null,
                    rpe: serie.rpe ?? null,
                    clusterAtivo: serie.cluster?.ativo ?? false,
                    clusterBlocos: serie.cluster?.blocos ?? [],
                    dropSet: serie.dropSet ?? false,
                    restPause: serie.restPause ?? false,
                falha: serie.falha ?? false,
                })).filter(serie => serie.carga > 0 || serie.repeticoes > 0 || serie.rir !== null),
            }))
    }));
    return {
        aluno: {
            nomeCompleto: dados.aluno.nomeCompleto,
            telefone: dados.aluno.telefone || null,
            genero: dados.aluno.genero || null,
            dataNascimento: dados.aluno.dataNascimento || null,
            etnia: dados.aluno.etnia || null,
            massa: numero(dados.aluno.massa), estatura: numero(dados.aluno.estatura),
            femur: numero(dados.aluno.femur), tibia: numero(dados.aluno.tibia),
            una: numero(dados.aluno.una), umero: numero(dados.aluno.umero),
            fcRepouso: numero(dados.aluno.fcRepouso), fcReserva: numero(dados.aluno.fcReserva),
            glicose: numero(dados.aluno.glicose), triglicerideos: numero(dados.aluno.triglicerideos),
            ldl: numero(dados.aluno.ldl), hdl: numero(dados.aluno.hdl),
            sistolica: numero(dados.aluno.sistolica), diastolica: numero(dados.aluno.diastolica),
        },
        anamneses,
        avaliacoes,
        testesCarga,
        treinos,
        periodizacao,
        volumes,
        // O histórico é append-only no servidor; somente a sessão do dia atual é editável nesta tela.
        execucoes: execucoesAtuais,
    };
}

export async function salvarFicha(alunoId: string, dados: Avaliacao) {
    return enfileirarSalvarFicha(async () => {
        const payload = mapearAvaliacaoParaSalvarFicha(dados);
        await apiPut<CadastroCompletoApi>(`/api/cadastros/alunos/${alunoId}`, payload);
        const [cadastro, grupos] = await Promise.all([
            cadastroService.obterCadastro(alunoId),
            cadastroService.listarGruposMusculares(),
        ]);
        return mapearCadastroParaAvaliacao(cadastro, grupos);
    });
}

export async function salvarFichaAutosave(alunoId: string, dados: Avaliacao) {
    return enfileirarSalvarFicha(async () => {
        const payload = mapearAvaliacaoParaSalvarFicha(dados);
        await apiPut<void>(`/api/cadastros/alunos/${alunoId}/autosave`, payload);
    });
}

export const cadastroService = {
    listarAlunos: () => apiGet<AlunoResumoApi[]>("/api/Aluno"),
    listarPersonais: () => apiGet<PersonalResumoApi[]>("/api/Personal"),
    listarVinculos: (personalId: string) =>
        apiGet<PersonalAlunoApi[]>("/api/PersonalAluno/" + personalId + "/alunos"),
    criarPersonal: (payload: { nomeCompleto: string; email: string; senha: string; telefone?: string }) =>
        apiPost<PersonalResumoApi>("/api/Personal", payload),
    vincularAluno: (personalId: string, alunoId: string) =>
        apiPost<PersonalAlunoApi>("/api/PersonalAluno", { personalId, alunoId }),
    desvincularAluno: (vinculoId: string) =>
        apiDelete<void>("/api/PersonalAluno/" + vinculoId),
    atualizarVinculo: (vinculoId: string, ativo: boolean) =>
        apiPatch<PersonalAlunoApi>("/api/PersonalAluno/" + vinculoId, { ativo }),
    obterCadastro: (alunoId: string) => apiGet<CadastroCompletoApi>(`/api/cadastros/alunos/${alunoId}`),
    listarGruposMusculares: () => apiGet<GrupoApi[]>("/api/grupos-musculares"),
    criarAvaliacao: (alunoId: string) =>
        apiPost<AvaliacaoApi>(`/api/alunos/${alunoId}/avaliacoes`, {}),
    listarHistoricoAvaliacao: (avaliacaoId: string) =>
        apiGet<AvaliacaoHistoricoApi[]>(`/api/avaliacoes/${avaliacaoId}/historico`),
    arquivarAvaliacao: (avaliacaoId: string) =>
        apiDelete<void>(`/api/avaliacoes/${avaliacaoId}`),
    criarAluno: (payload: { nomeCompleto: string; email: string; senha: string; telefone?: string; dataNascimento?: string }) =>
        apiPost<AlunoResumoApi>("/api/Aluno", payload),
    excluirAluno: (alunoId: string) => apiDelete<void>(`/api/Aluno/${alunoId}`),
};
