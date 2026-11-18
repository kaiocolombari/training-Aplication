import type { Avaliacao } from "../types/avaliacao";
import type { VolumeCicloAcompanhamento } from "../service/volumeAcompanhamentoService";

export interface ResultadoAnaliseEstatistica {
    disponibilidade: "disponivel" | "parcial" | "indisponivel";
    resumo: string;
    quantidadeRegistros: number;
    fontes: string[];
    dadosFaltantes: string[];
    metricas: Array<{ titulo: string; valor: string; detalhe?: string }>;
    linhas: Array<{ titulo: string; valor: string; detalhe?: string }>;
}

const numero = (valor: string | number | null | undefined): number | null => {
    if (valor === null || valor === undefined || String(valor).trim() === "") return null;
    const parsed = Number(String(valor).replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
};

const fmt = (valor: number, casas = 1) =>
    valor.toLocaleString("pt-BR", { maximumFractionDigits: casas, minimumFractionDigits: casas });
const media = (valores: number[]) => valores.length ? valores.reduce((soma, valor) => soma + valor, 0) / valores.length : null;
const desvioPadrao = (valores: number[]) => {
    const mediaAtual = media(valores);
    return mediaAtual === null ? null : Math.sqrt(valores.reduce((soma, valor) => soma + (valor - mediaAtual) ** 2, 0) / valores.length);
};

const dataOrdenavel = (data: string) => typeof data === "string" ? data.slice(0, 10) : "";
const dataLocalIso = (data: Date) =>
    `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;

function resultado(
    resumo: string,
    quantidadeRegistros: number,
    fontes: string[],
    dadosFaltantes: string[],
    metricas: ResultadoAnaliseEstatistica["metricas"] = [],
    linhas: ResultadoAnaliseEstatistica["linhas"] = [],
): ResultadoAnaliseEstatistica {
    return {
        disponibilidade: quantidadeRegistros === 0 ? "indisponivel" : dadosFaltantes.length ? "parcial" : "disponivel",
        resumo,
        quantidadeRegistros,
        fontes,
        dadosFaltantes,
        metricas,
        linhas,
    };
}

function filtrarPeriodo<T extends { data: string }>(itens: T[], dias: number | null) {
    const hoje = dataLocalIso(new Date());
    const limite = dias ? new Date() : null;
    limite?.setDate(limite.getDate() - dias!);
    const inicio = limite ? dataLocalIso(limite) : null;
    return itens.filter(item => {
        const data = dataOrdenavel(item.data);
        return /^\d{4}-\d{2}-\d{2}$/.test(data) && data <= hoje && (!inicio || data >= inicio);
    });
}

export function executarAnaliseEstatistica(
    ferramentaId: string,
    ficha: Avaliacao,
    ciclos: VolumeCicloAcompanhamento[] = [],
    janelaDias: number | null = 90,
    exibirVariabilidade = true,
): ResultadoAnaliseEstatistica {
    const avaliacoes = filtrarPeriodo(
        ficha.avaliacoes.filter(item => item.ativo).map(item => ({ ...item, data: item.realizadaEm })),
        janelaDias,
    ).sort((a, b) => a.realizadaEm.localeCompare(b.realizadaEm));
    const execucoes = filtrarPeriodo(
        ficha.seriesRIR.map(item => ({ ...item, data: dataOrdenavel(item.data) })),
        janelaDias,
    ).sort((a, b) => a.data.localeCompare(b.data));
    const totalSeries = execucoes.flatMap(item => item.exercicios.flatMap(ex => ex.series));
    const exerciciosPrescritos = ficha.treino.flatMap(treino => treino.exercicios
        .filter(exercicio => exercicio.exercicio.trim())
        .map(exercicio => ({ ...exercicio, treinoId: treino.id, treinoNome: treino.nome })));

    switch (ferramentaId) {
        case "aderencia":
        case "periodizacao": {
            const hoje = dataLocalIso(new Date());
            const inicioJanela = janelaDias ? (() => { const data = new Date(); data.setDate(data.getDate() - janelaDias); return dataLocalIso(data); })() : null;
            const planejadas = ficha.periodizacao.semanas.flatMap(semana => semana.dias.flatMap(dia =>
                dia.data <= hoje ? dia.treinoIds.filter(Boolean).map(treinoId => ({ data: dia.data, treinoId, semana: semana.numero })) : [],
            )).filter(item => !inicioJanela || item.data >= inicioJanela);
            const executadas = new Set(execucoes.map(item => `${item.data}|${item.treinoId}`));
            const concluidas = planejadas.filter(item => executadas.has(`${item.data}|${item.treinoId}`)).length;
            const taxa = planejadas.length ? concluidas / planejadas.length * 100 : 0;
            const faltantes = [
                ...(!planejadas.length ? ["Sessões programadas com datas válidas na periodização"] : []),
                ...(!execucoes.length ? ["Execuções registradas pelo aluno no aplicativo"] : []),
                ...((planejadas.length || execucoes.length) ? ["Snapshots versionados do planejamento para reconstruir alterações antigas da periodização"] : []),
            ];
            if (ferramentaId === "periodizacao") {
                const linhas = ficha.periodizacao.semanas.flatMap(semana => {
                    const sessoes = planejadas.filter(item => item.semana === semana.numero);
                    if (!sessoes.length) return [];
                    const concluidasSemana = sessoes.filter(item => executadas.has(`${item.data}|${item.treinoId}`)).length;
                    return [{
                        titulo: `Microciclo ${semana.numero}`,
                        valor: `${concluidasSemana}/${sessoes.length} sessões · ${fmt(concluidasSemana / sessoes.length * 100)}%`,
                        detalhe: "Execução comparada às sessões programadas no microciclo",
                    }];
                });
                const microciclosCompletos = linhas.filter(linha =>
                    linha.valor.split("/")[0] === linha.valor.split("/")[1]?.split(" ")[0],
                );
                return resultado(
                    `${linhas.length} microciclos tiveram sessões previstas no período; ${microciclosCompletos.length} foram concluídos integralmente.`,
                    planejadas.length,
                    [
                        ...(planejadas.length ? ["Periodização planejada por microciclo"] : []),
                        ...(execucoes.length ? ["Histórico de execução"] : []),
                    ],
                    faltantes,
                    [
                        { titulo: "Microciclos analisados", valor: String(linhas.length) },
                        { titulo: "Microciclos completos", valor: String(microciclosCompletos.length) },
                        { titulo: "Sessões concluídas", valor: String(concluidas) },
                        { titulo: "Aderência do período", valor: `${fmt(taxa)}%` },
                    ],
                    linhas,
                );
            }
            return resultado(
                planejadas.length
                    ? `${concluidas} de ${planejadas.length} sessões planejadas foram encontradas no histórico de execução.`
                    : "A periodização ainda não possui sessões passadas programadas para comparar.",
                planejadas.length,
                [
                    ...(planejadas.length ? ["Periodização planejada"] : []),
                    ...(execucoes.length ? ["Histórico de execução"] : []),
                ],
                faltantes,
                [
                    { titulo: "Sessões planejadas", valor: String(planejadas.length) },
                    { titulo: "Sessões concluídas", valor: String(concluidas) },
                    { titulo: "Aderência", valor: planejadas.length ? `${fmt(taxa)}%` : "—" },
                ],
                [{ titulo: "Interpretação", valor: "Frequência realizada versus programada" }],
            );
        }
        case "prescrito-realizado": {
            const planejadosPorId = new Map(exerciciosPrescritos.map(item => [item.id, item]));
            const planejadosPorNome = new Map(exerciciosPrescritos.map(item => [item.exercicio.trim().toLocaleLowerCase("pt-BR"), item]));
            const linhas = execucoes.flatMap(execucao => execucao.exercicios.map(exercicio => {
                const prescrito = planejadosPorId.get(exercicio.exercicioId) ?? planejadosPorNome.get(exercicio.nome.trim().toLocaleLowerCase("pt-BR"));
                const seriesPlanejadas = numero(prescrito?.series);
                const seriesRealizadas = exercicio.series.length;
                const repsValidas = exercicio.series.map(serie => serie.repeticoes).filter(value => Number.isFinite(value) && value > 0);
                const cargasValidas = exercicio.series.map(serie => serie.carga).filter(value => Number.isFinite(value) && value > 0);
                const rirValidos = exercicio.series.filter(serie => serie.rirInformado !== false).map(serie => serie.rir).filter(Number.isFinite);
                const detalhesRealizados = [
                    repsValidas.length ? `${fmt(media(repsValidas) ?? 0)} reps/série` : null,
                    cargasValidas.length ? `${fmt(media(cargasValidas) ?? 0)} kg médios` : null,
                    rirValidos.length ? `RIR ${fmt(media(rirValidos) ?? 0)} médio` : null,
                ].filter(Boolean).join(" · ");
                const detalhesPrescritos = prescrito
                    ? `Prescrito: ${prescrito.series || "—"} séries · ${prescrito.repeticoes || "—"} reps · ${prescrito.carga || "—"} kg · RIR máx. ${prescrito.rirMax || "—"}`
                    : "Exercício sem vínculo com a prescrição atual";
                return {
                    titulo: exercicio.nome,
                    valor: `${seriesRealizadas}/${seriesPlanejadas ?? "—"} séries`,
                    detalhe: [detalhesRealizados, detalhesPrescritos].filter(Boolean).join(" | "),
                };
            }));
            return resultado(
                "Compara séries registradas nas execuções com a prescrição atual. Alterações antigas da ficha podem limitar a comparação histórica.",
                linhas.length,
                [
                    ...(exerciciosPrescritos.length ? ["Prescrição atual"] : []),
                    ...(execucoes.length ? ["Snapshots de execução"] : []),
                ],
                execucoes.length ? ["Snapshot versionado da prescrição vigente em cada data"] : ["Execuções do aluno"],
                [
                    { titulo: "Sessões analisadas", valor: String(execucoes.length) },
                    { titulo: "Exercícios executados", valor: String(linhas.length) },
                    { titulo: "Séries realizadas", valor: String(totalSeries.length) },
                ],
                linhas.slice(0, 12),
            );
        }
        case "volume": {
            const datasSemana = new Map(ficha.periodizacao.semanas.map(semana => [
                semana.numero,
                semana.dias.map(dia => dia.data),
            ]));
            const limite = janelaDias ? (() => { const data = new Date(); data.setDate(data.getDate() - janelaDias); return dataLocalIso(data); })() : null;
            const hoje = dataLocalIso(new Date());
            const semanasNoPeriodo = ficha.volume.filter(semana => !limite || (datasSemana.get(semana.semana) ?? []).some(data => data >= limite && data <= hoje));
            const semanas = semanasNoPeriodo.filter(semana => semana.grupos.some(grupo => grupo.seriesDiretas + grupo.seriesLivres > 0));
            const porGrupo = new Map<string, { diretas: number; livres: number }>();
            semanas.forEach(semana => semana.grupos.forEach(grupo => {
                const atual = porGrupo.get(grupo.grupo) ?? { diretas: 0, livres: 0 };
                atual.diretas += grupo.seriesDiretas;
                atual.livres += grupo.seriesLivres;
                porGrupo.set(grupo.grupo, atual);
            }));
            const linhas = [...porGrupo.entries()].map(([grupo, valores]) => ({
                titulo: grupo,
                valor: `${fmt((valores.diretas + valores.livres) / Math.max(semanas.length, 1), 1)} séries/semana`,
                detalhe: `${fmt(valores.diretas / Math.max(semanas.length, 1), 1)} diretas · ${fmt(valores.livres / Math.max(semanas.length, 1), 1)} livres (média)`,
            })).sort((a, b) => Number(b.valor.split(" ")[0].replace(",", ".")) - Number(a.valor.split(" ")[0].replace(",", ".")));
            const registrosMensais = ciclos.flatMap(ciclo => ciclo.meses.filter(mes =>
                mes.origem === "REGISTRO" && mes.series !== null && mes.inicio <= hoje && (!limite || mes.fim >= limite),
            ));
            return resultado(
                "Mostra volume planejado por grupo muscular e registros mensais informados pelo aluno em ciclos de acompanhamento. Execução real por grupo ainda depende da classificação muscular por exercício.",
                semanas.length + registrosMensais.length,
                [
                    ...(semanas.length ? ["Volume semanal planejado"] : []),
                    ...(registrosMensais.length ? ["Registros mensais de acompanhamento"] : []),
                ],
                [
                    ...(!semanas.length ? ["Volume planejado por grupo muscular preenchido na ficha"] : []),
                    ...(!registrosMensais.length ? ["Registros mensais de volume enviados pelo aluno"] : []),
                    "Classificação muscular ligada a cada exercício executado para calcular volume realmente executado por grupo",
                ],
                [
                    { titulo: "Microciclos com volume", valor: String(semanas.length) },
                    { titulo: "Registros mensais", valor: String(registrosMensais.length) },
                    { titulo: "Séries planejadas/semana", valor: semanas.length ? fmt(semanas.reduce((sum, semana) => sum + semana.grupos.reduce((s, grupo) => s + grupo.seriesDiretas + grupo.seriesLivres, 0), 0) / semanas.length) : "—" },
                ],
                linhas.slice(0, 12),
            );
        }
        case "tonelagem": {
            const tonelagemPorSessao = execucoes.map(item => item.exercicios.reduce((s, ex) => s + ex.series.reduce((n, serie) =>
                n + (Number.isFinite(serie.carga) && serie.carga > 0 && Number.isFinite(serie.repeticoes) && serie.repeticoes > 0 ? serie.carga * serie.repeticoes : 0), 0), 0));
            const tonelagem = tonelagemPorSessao.reduce((sum, valor) => sum + valor, 0);
            const linhas = execucoes.map(item => ({
                titulo: item.data,
                valor: `${fmt(item.exercicios.reduce((s, ex) => s + ex.series.reduce((n, serie) =>
                    n + (Number.isFinite(serie.carga) && serie.carga > 0 && Number.isFinite(serie.repeticoes) && serie.repeticoes > 0 ? serie.carga * serie.repeticoes : 0), 0), 0))} kg·rep`,
                detalhe: `${item.exercicios.length} exercícios registrados`,
            }));
            const seriesValidas = totalSeries.filter(serie => Number.isFinite(serie.carga) && serie.carga > 0 && Number.isFinite(serie.repeticoes) && serie.repeticoes > 0).length;
            return resultado("Soma carga × repetições nas séries registradas, preservando a unidade de tonelagem como carga externa acumulada.", execucoes.length, seriesValidas ? ["Séries executadas com carga e repetições válidas"] : [], [
                ...(!execucoes.length ? ["Execuções registradas pelo aluno"] : []),
                ...(execucoes.length && !seriesValidas ? ["Séries com carga e repetições válidas"] : []),
                ...(seriesValidas && seriesValidas < totalSeries.length ? [`${totalSeries.length - seriesValidas} séries sem carga ou repetições válidas foram desconsideradas`] : []),
            ], [
                { titulo: "Sessões", valor: String(execucoes.length) },
                { titulo: "Tonelagem acumulada", valor: `${fmt(tonelagem)} kg·rep` },
                { titulo: "Média por sessão", valor: tonelagemPorSessao.length ? `${fmt(media(tonelagemPorSessao) ?? 0)} kg·rep` : "—" },
                ...(exibirVariabilidade && tonelagemPorSessao.length > 1 ? [{ titulo: "Desvio padrão", valor: `${fmt(desvioPadrao(tonelagemPorSessao) ?? 0)} kg·rep` }] : []),
                { titulo: "Séries", valor: String(totalSeries.length) },
            ], linhas.slice(-10).reverse());
        }
        case "forca": {
            const chaves = ["supino", "terra", "remada", "agachamento"] as const;
            const linhas = avaliacoes.flatMap(avaliacao => chaves.flatMap(chave => {
                const carga = numero(avaliacao.testeCarga[chave].carga);
                const reps = numero(avaliacao.testeCarga[chave].repeticoes);
                if (!carga || !reps || reps > 12) return [];
                return [{ titulo: `${chave} · ${avaliacao.realizadaEm}`, valor: `${fmt(carga)} kg`, detalhe: `1RM estimado: ${fmt(carga * (1 + reps / 30))} kg · ${reps} repetições` }];
            }));
            return resultado("Estima força relativa por exercício usando Epley (carga × (1 + repetições/30)); é uma estimativa e não substitui teste máximo padronizado.", linhas.length, linhas.length ? ["Testes de carga das avaliações"] : [], [
                ...(!linhas.length ? ["Carga e repetições nos testes de carga"] : []),
                ...(linhas.length ? ["Padronização do exercício, amplitude, equipamento e condições de teste"] : []),
            ], [
                { titulo: "Medições aproveitáveis", valor: String(linhas.length) },
                { titulo: "Avaliações históricas", valor: String(avaliacoes.length) },
            ], linhas.slice(-12).reverse());
        }
        case "intensidade": {
            const rirInformados = totalSeries.filter(serie => serie.rirInformado !== false).map(serie => serie.rir);
            const rpeInformados = totalSeries.map(serie => serie.rpe).filter((value): value is number => value !== undefined);
            const rir = rirInformados.filter(value => Number.isFinite(value) && value >= 0 && value <= 10);
            const rpe = rpeInformados.filter(value => Number.isFinite(value) && value >= 0 && value <= 10);
            const mediaRir = rir.length ? rir.reduce((sum, value) => sum + value, 0) / rir.length : null;
            const mediaRpe = rpe.length ? rpe.reduce((sum, value) => sum + value, 0) / rpe.length : null;
            return resultado("Resume esforço percebido e proximidade da falha a partir dos registros por série.", totalSeries.length, [
                ...(rir.length ? ["RIR válido por série"] : []),
                ...(rpe.length ? ["RPE válido por série"] : []),
            ], [
                ...(!rir.length ? ["RIR registrado por série"] : []),
                ...(!rpe.length ? ["RPE registrado por série"] : []),
                ...(rir.length < rirInformados.length ? [`${rirInformados.length - rir.length} valores de RIR fora da escala 0–10 foram desconsiderados`] : []),
                ...(rpe.length < rpeInformados.length ? [`${rpeInformados.length - rpe.length} valores de RPE fora da escala 0–10 foram desconsiderados`] : []),
            ], [
                { titulo: "Séries", valor: String(totalSeries.length) },
                { titulo: "RIR médio", valor: mediaRir === null ? "—" : fmt(mediaRir) },
                { titulo: "RPE médio", valor: mediaRpe === null ? "—" : fmt(mediaRpe) },
                ...(exibirVariabilidade && rir.length > 1 ? [{ titulo: "Desvio padrão RIR", valor: fmt(desvioPadrao(rir) ?? 0) }] : []),
                ...(exibirVariabilidade && rpe.length > 1 ? [{ titulo: "Desvio padrão RPE", valor: fmt(desvioPadrao(rpe) ?? 0) }] : []),
                { titulo: "Falha registrada", valor: String(totalSeries.filter(serie => serie.falha).length) },
            ]);
        }
        case "consistencia": {
            const contagem = new Map<string, number>();
            execucoes.forEach(execucao => execucao.exercicios.forEach(exercicio => {
                const chave = exercicio.exercicioId || exercicio.nome;
                contagem.set(chave, (contagem.get(chave) ?? 0) + 1);
            }));
            const linhas = exerciciosPrescritos.map(exercicio => ({
                titulo: exercicio.exercicio,
                valor: `${contagem.get(exercicio.id) ?? 0} execuções`,
                detalhe: `${exercicio.treinoNome || "Treino"} · ${exercicio.series || "—"} séries prescritas`,
            })).sort((a, b) => Number(a.valor.split(" ")[0]) - Number(b.valor.split(" ")[0]));
            return resultado("Conta quantas sessões registraram cada exercício prescrito, destacando itens sem execução encontrada. Exercícios removidos ou substituídos só poderão ser avaliados com snapshots históricos da prescrição.", execucoes.length, [
                ...(exerciciosPrescritos.length ? ["Prescrição atual"] : []),
                ...(execucoes.length ? ["Histórico de execuções"] : []),
            ], [
                ...(!execucoes.length ? ["Execuções registradas"] : []),
                ...(execucoes.length ? ["Snapshots históricos da prescrição para identificar exercícios removidos ou substituídos"] : []),
            ], [
                { titulo: "Exercícios prescritos", valor: String(exerciciosPrescritos.length) },
                { titulo: "Exercícios executados", valor: String(linhas.filter(item => item.valor !== "0 execuções").length) },
            ], linhas.slice(0, 15));
        }
        case "antropometria": {
            const pontos = avaliacoes.map(item => ({
                data: item.realizadaEm,
                peso: numero(item.peso),
                cintura: numero(item.perimetros.cintura),
                quadril: numero(item.perimetros.quadril),
                bracoD: numero(item.perimetros.bracoD),
            }));
            const delta = (campo: "peso" | "cintura" | "quadril" | "bracoD") => {
                const medidas = pontos.map(item => item[campo]).filter((value): value is number => value !== null);
                return medidas.length >= 2 ? medidas.at(-1)! - medidas[0] : null;
            };
            const ultimaMedida = (campo: "peso" | "cintura" | "quadril" | "bracoD") =>
                pontos.map(item => item[campo]).filter((value): value is number => value !== null).at(-1) ?? null;
            const campos = ["peso", "cintura", "quadril", "bracoD"] as const;
            const linhas = campos.map(campo => ({ titulo: campo === "bracoD" ? "Braço direito" : campo[0].toUpperCase() + campo.slice(1), valor: delta(campo) === null ? "—" : `${delta(campo)! > 0 ? "+" : ""}${fmt(delta(campo)!)} ${campo === "peso" ? "kg" : "cm"}`, detalhe: "Diferença entre primeira e última avaliação" }));
            const camposAusentes = campos.filter(campo => pontos.filter(item => item[campo] !== null).length < 2);
            const pontosValidos = pontos.filter(item => item.peso !== null || item.cintura !== null || item.quadril !== null || item.bracoD !== null).length;
            const dadosFaltantes = [
                ...(avaliacoes.length < 2 ? ["Pelo menos duas avaliações com medidas preenchidas"] : []),
                ...(camposAusentes.length ? [`Duas medições para: ${camposAusentes.join(", ")}`] : []),
                ...(pontosValidos ? ["Método/protocolo e condições padronizadas das medições"] : []),
            ];
            return resultado("Compara medidas corporais registradas em avaliações com datas identificadas. Compare somente protocolos e condições equivalentes.", pontosValidos, pontosValidos ? ["Avaliações físicas com medidas preenchidas"] : [], dadosFaltantes, [
                { titulo: "Avaliações", valor: String(avaliacoes.length) },
                { titulo: "Peso atual", valor: ultimaMedida("peso") === null ? "—" : `${fmt(ultimaMedida("peso")!)} kg` },
                { titulo: "Variação de peso", valor: delta("peso") === null ? "—" : `${delta("peso")! > 0 ? "+" : ""}${fmt(delta("peso")!)} kg` },
            ], linhas);
        }
        case "composicao": {
            const pontos = avaliacoes.flatMap(item => {
                const peso = numero(item.peso);
                const percentual = numero(item.percentualGordura);
                if (peso === null || percentual === null || percentual < 0 || percentual > 75) return [];
                return [{ data: item.realizadaEm, peso, percentual, massaGorda: peso * percentual / 100, massaMagra: peso * (1 - percentual / 100) }];
            });
            const atual = pontos.at(-1);
            return resultado("Calcula massa gorda e massa livre de gordura a partir do peso e percentual informado na avaliação; são estimativas dependentes do protocolo.", pontos.length, pontos.length ? ["Peso e percentual de gordura nas avaliações"] : [], pontos.length ? ["Método/protocolo utilizado para obter o percentual de gordura"] : ["Peso e percentual de gordura na mesma avaliação", "Método/protocolo utilizado para obter o percentual de gordura"], [
                { titulo: "Avaliações válidas", valor: String(pontos.length) },
                { titulo: "Massa gorda estimada", valor: atual ? `${fmt(atual.massaGorda)} kg` : "—" },
                { titulo: "Massa livre de gordura", valor: atual ? `${fmt(atual.massaMagra)} kg` : "—" },
                { titulo: "% de gordura", valor: atual ? `${fmt(atual.percentual)}%` : "—" },
            ], pontos.map(item => ({ titulo: item.data, valor: `${fmt(item.percentual)}%`, detalhe: `${fmt(item.massaGorda)} kg de massa gorda estimada` })));
        }
        case "plato": {
            const chaves = ["supino", "terra", "remada", "agachamento"] as const;
            const porExercicio = chaves.map(chave => {
                const pontos = avaliacoes.flatMap(item => {
                    const carga = numero(item.testeCarga[chave].carga);
                    const reps = numero(item.testeCarga[chave].repeticoes);
                    return carga && reps && reps <= 12 ? [{ data: item.realizadaEm, valor: carga * (1 + reps / 30) }] : [];
                });
                const primeiro = pontos[0];
                const ultimo = pontos.at(-1);
                const variacao = primeiro && ultimo && primeiro.valor > 0 ? (ultimo.valor - primeiro.valor) / primeiro.valor * 100 : null;
                return { chave, pontos, variacao };
            });
            const suficientes = porExercicio.filter(item => item.pontos.length >= 4);
            const insuficientes = porExercicio.filter(item => item.pontos.length < 4);
            const linhas = suficientes.map(item => ({
                titulo: item.chave[0].toUpperCase() + item.chave.slice(1),
                valor: item.variacao === null ? "—" : `${item.variacao > 0 ? "+" : ""}${fmt(item.variacao)}%`,
                detalhe: `${item.pontos.length} testes comparáveis · ${Math.abs(item.variacao ?? 0) < 1.5 ? "indicador estável nesta janela" : "houve variação observável"}`,
            }));
            const totalPontos = porExercicio.reduce((sum, item) => sum + item.pontos.length, 0);
            return resultado(
                suficientes.length
                    ? `${suficientes.length} exercício(s) têm ao menos quatro testes comparáveis. Estabilidade é um sinal descritivo, não um diagnóstico de platô.`
                    : "São necessárias pelo menos quatro medições comparáveis do mesmo exercício para sinalizar estabilidade com alguma utilidade.",
                totalPontos,
                totalPontos ? ["Testes de carga com estimativa de 1RM"] : [],
                insuficientes.map(item => `${item.chave}: ${Math.max(0, 4 - item.pontos.length)} teste(s) comparável(is) adicional(is)`),
                [
                    { titulo: "Medições aproveitáveis", valor: String(totalPontos) },
                    { titulo: "Exercícios com histórico suficiente", valor: String(suficientes.length) },
                ],
                linhas,
            );
        }
        case "ciclos": {
            const hoje = dataLocalIso(new Date());
            const inicioJanela = janelaDias ? (() => { const data = new Date(); data.setDate(data.getDate() - janelaDias); return dataLocalIso(data); })() : null;
            const registros = ciclos.flatMap(ciclo => ciclo.meses.filter(mes => mes.origem === "REGISTRO" && mes.series !== null && mes.inicio <= hoje && (!inicioJanela || mes.fim >= inicioJanela)).map(mes => ({
                titulo: `${ciclo.treinoNome} · mês ${mes.mesCiclo}`,
                valor: `${mes.series} séries`,
                detalhe: mes.diferencaMesAnterior === null ? "Sem comparação anterior" : `${mes.diferencaMesAnterior > 0 ? "+" : ""}${mes.diferencaMesAnterior} séries versus mês anterior`,
            })));
            return resultado("Compara os registros mensais de volume dos ciclos de até 12 meses, preservando a referência inicial e os meses sem registro.", registros.length, registros.length ? ["Ciclos de volume com registros mensais persistidos"] : [], registros.length ? [] : ["Ciclo iniciado e registros mensais enviados pelo aluno"], [
                { titulo: "Ciclos", valor: String(ciclos.length) },
                { titulo: "Meses registrados", valor: String(registros.length) },
            ], registros.slice(-12).reverse());
        }
        case "assimetria-bilateral": {
            const atual = avaliacoes.at(-1);
            const pares = [
                ["Braço", atual?.perimetros.bracoD, atual?.perimetros.bracoE],
                ["Antebraço", atual?.perimetros.antebracoD, atual?.perimetros.antebracoE],
                ["Coxa superior", atual?.perimetros.coxaSupD, atual?.perimetros.coxaSupE],
                ["Coxa média", atual?.perimetros.coxaMediaD, atual?.perimetros.coxaMediaE],
                ["Panturrilha", atual?.perimetros.panturrilhaD, atual?.perimetros.panturrilhaE],
            ] as const;
            const linhas = pares.flatMap(([nome, direitaRaw, esquerdaRaw]) => {
                const direita = numero(direitaRaw);
                const esquerda = numero(esquerdaRaw);
                if (direita === null || esquerda === null || Math.max(direita, esquerda) === 0) return [];
                const diferenca = direita - esquerda;
                const percentual = Math.abs(diferenca) / Math.max(direita, esquerda) * 100;
                return [{ titulo: nome, valor: `${fmt(percentual)}%`, detalhe: `${diferenca > 0 ? "Direito" : diferenca < 0 ? "Esquerdo" : "Igual"} · diferença ${fmt(Math.abs(diferenca))} cm` }];
            });
            const paresAusentes = pares.filter(([, direitaRaw, esquerdaRaw]) => numero(direitaRaw) === null || numero(esquerdaRaw) === null).map(([nome]) => String(nome));
            return resultado("Calcula diferenças descritivas entre perímetros direito e esquerdo da avaliação mais recente. Nesta versão não compara força ou desempenho unilateral e não indica lesão nem déficit funcional.", linhas.length, linhas.length ? ["Perímetros bilaterais da última avaliação"] : [], [
                ...(paresAusentes.length ? [`Preencher medidas bilaterais de: ${paresAusentes.join(", ")}`] : !linhas.length ? ["Medidas direita e esquerda preenchidas na mesma avaliação"] : []),
                ...(linhas.length ? ["Protocolo padronizado para posicionamento e medição dos dois lados"] : []),
            ], [
                { titulo: "Pares comparáveis", valor: String(linhas.length) },
                { titulo: "Data da avaliação", valor: atual?.realizadaEm ?? "—" },
            ], linhas);
        }
        case "relatorio": {
            const peso = avaliacoes.map(item => numero(item.peso)).filter((value): value is number => value !== null);
            const tonelagem = execucoes.reduce((sum, item) => sum + item.exercicios.reduce((s, ex) => s + ex.series.reduce((n, serie) =>
                n + (Number.isFinite(serie.carga) && serie.carga > 0 && Number.isFinite(serie.repeticoes) && serie.repeticoes > 0 ? serie.carga * serie.repeticoes : 0), 0), 0), 0);
            const hoje = dataLocalIso(new Date());
            const inicioJanela = janelaDias ? (() => { const data = new Date(); data.setDate(data.getDate() - janelaDias); return dataLocalIso(data); })() : null;
            const datasSemana = new Map(ficha.periodizacao.semanas.map(semana => [semana.numero, semana.dias.map(dia => dia.data)]));
            const volumeNoPeriodo = ficha.volume.filter(semana => (datasSemana.get(semana.semana) ?? []).some(data =>
                data <= hoje && (!inicioJanela || data >= inicioJanela),
            ));
            const volumePlanejado = volumeNoPeriodo.reduce((sum, semana) => sum + semana.grupos.reduce((s, grupo) => s + grupo.seriesDiretas + grupo.seriesLivres, 0), 0);
            return resultado("Visão integrada dos dados que já existem na ficha. Indicadores de recuperação, dor e aderência só aparecem quando suas fontes forem integradas.", avaliacoes.length + execucoes.length + volumeNoPeriodo.length, [
                ...(avaliacoes.length ? ["Avaliações físicas"] : []),
                ...(execucoes.length ? ["Execuções e séries realizadas"] : []),
                ...(volumeNoPeriodo.length ? ["Volume planejado na periodização"] : []),
            ], [
                ...(!avaliacoes.length ? ["Avaliações físicas históricas"] : []),
                ...(!execucoes.length ? ["Execuções registradas"] : []),
                "Check-ins, relatos de dor e diário do aplicativo para uma leitura multivariada completa",
            ], [
                { titulo: "Avaliações", valor: String(avaliacoes.length) },
                { titulo: "Execuções", valor: String(execucoes.length) },
                { titulo: "Peso mais recente", valor: peso.length ? `${fmt(peso.at(-1)!)} kg` : "—" },
                { titulo: "Tonelagem no período", valor: `${fmt(tonelagem)} kg·rep` },
                { titulo: "Volume planejado", valor: `${fmt(volumePlanejado, 0)} séries-microciclo` },
            ]);
        }
        case "prontidao":
            return resultado("A análise de prontidão será calculada a partir de respostas diárias do aluno, sem inferir sono ou fadiga a partir da ficha técnica.", 0, [], ["Check-ins com sono, energia, fadiga, estresse, motivação e dor muscular tardia"]);
        case "dor":
            return resultado("Ainda não há uma fonte estruturada de relatos de dor conectada à ficha. Quando existir, a ferramenta organizará localização, lado, intensidade e recorrência sem realizar diagnóstico.", 0, [], ["Relatos do aluno com região, lado, escala 0–10, contexto, duração e data"]);
        case "carga-recuperacao":
            return resultado("A carga de treino já pode ser obtida das execuções, mas ainda não há check-ins de recuperação para calcular associação temporal.", execucoes.length, execucoes.length ? ["Execuções e carga de treinamento"] : [], ["Check-ins diários com sono, fadiga, energia, estresse e prontidão"]);
        case "densidade-sessao":
            return resultado("A ficha registra séries e um campo de descanso, mas esse campo não comprova o tempo efetivamente decorrido. Faltam horários confiáveis para calcular densidade real por tempo.", totalSeries.length, totalSeries.length ? ["Séries executadas", ...(totalSeries.some(serie => serie.descanso > 0) ? ["Campo de descanso informado por série"] : [])] : [], ["Timestamp de início/fim da sessão e duração efetiva dos intervalos realmente realizados"]);
        default:
            return resultado("Ferramenta ainda sem implementação estatística nesta versão.", 0, [], ["Fonte de dados estruturada e regra estatística validada"]);
    }
}
