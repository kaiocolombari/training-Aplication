import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    BsActivity,
    BsArrowLeft,
    BsArrowUpRight,
    BsBarChartLine,
    BsCalendar2Range,
    BsCheck2Circle,
    BsClockHistory,
    BsCpu,
    BsDatabase,
    BsDiagram3,
    BsEye,
    BsFilter,
    BsGraphUpArrow,
    BsExclamationTriangle,
    BsLock,
    BsPlayFill,
    BsSearch,
    BsShieldLock,
    BsStars,
    BsSpeedometer2,
    BsToggleOn,
    BsToggleOff,
    BsX,
} from "react-icons/bs";
import type { PersonalResumoApi } from "../service/cadastroService";
import { cadastroService, mapearCadastroParaAvaliacao } from "../service/cadastroService";
import type { AlunoMonitoramentoOption } from "../components/AlunoMonitoramentoPicker";
import AlunoMonitoramentoPicker from "../components/AlunoMonitoramentoPicker";
import { volumeAcompanhamentoService } from "../service/volumeAcompanhamentoService";
import { analiseEstatisticaService } from "../service/analiseEstatisticaService";
import { executarAnaliseEstatistica } from "../functions/analiseEstatistica";
import { adminExtrasService } from "../service/adminExtrasService";

type Categoria =
    | "Adesão"
    | "Treinamento"
    | "Desempenho"
    | "Recuperação"
    | "Evolução"
    | "Inteligência";
type Ferramenta = {
    id: string;
    nome: string;
    categoria: Categoria;
    resumo: string;
    analisa: string;
    entrega: string;
    requisito: string;
    fase: "Estatística" | "ML futuro";
};

const ferramentas: Ferramenta[] = [
    {
        id: "aderencia",
        nome: "Adesão e frequência",
        categoria: "Adesão",
        resumo: "Mede consistência de presença e cumprimento do planejamento.",
        analisa:
            "Sessões planejadas, concluídas, faltas, frequência semanal e sequência de atividade.",
        entrega:
            "Taxa de adesão por período, calendário de consistência e alertas de queda de frequência.",
        requisito: "Agenda de treino e execuções sincronizadas.",
        fase: "Estatística",
    },
    {
        id: "prescrito-realizado",
        nome: "Prescrito × realizado",
        categoria: "Treinamento",
        resumo: "Compara a prescrição com o que realmente aconteceu em cada sessão.",
        analisa: "Séries, repetições, carga, RIR, exercícios substituídos e sessões interrompidas.",
        entrega: "Desvios por exercício, sessão e semana; volume planejado versus executado.",
        requisito: "Snapshot versionado da prescrição e execução detalhada.",
        fase: "Estatística",
    },
    {
        id: "volume",
        nome: "Volume planejado por grupo",
        categoria: "Treinamento",
        resumo: "Consolida séries diretas e livres planejadas por grupo muscular.",
        analisa:
            "Séries diretas/livres, frequência, distribuição semanal e sobreposição entre exercícios.",
        entrega: "Mapa de volume planejado por grupo e médias por microciclo; não representa volume efetivamente executado por músculo.",
        requisito: "Catálogo de exercícios e classificação muscular consistente.",
        fase: "Estatística",
    },
    {
        id: "tonelagem",
        nome: "Tonelagem e carga acumulada",
        categoria: "Desempenho",
        resumo: "Acompanha a carga externa acumulada sem confundir tonelagem com estímulo.",
        analisa: "Carga × repetições, séries válidas, exercício, sessão e janela temporal.",
        entrega: "Tendência de tonelagem, variação entre ciclos e distribuição por exercício.",
        requisito: "Séries executadas com carga e repetições válidas.",
        fase: "Estatística",
    },
    {
        id: "forca",
        nome: "Progressão de força",
        categoria: "Desempenho",
        resumo: "Identifica evolução de desempenho em exercícios comparáveis.",
        analisa: "Carga, repetições, estimativas de força, histórico e condições do teste.",
        entrega: "Estimativas de 1RM pela fórmula de Epley nos testes registrados, sem substituir teste máximo padronizado.",
        requisito: "Histórico de execução e testes padronizados.",
        fase: "Estatística",
    },
    {
        id: "intensidade",
        nome: "Intensidade, RIR e RPE",
        categoria: "Treinamento",
        resumo: "Mostra como a intensidade percebida acompanha a prescrição.",
        analisa: "RIR, RPE, proximidade da falha, repetições e variação entre séries.",
        entrega: "Distribuição de esforço, aderência à faixa prescrita e tendências de esforço.",
        requisito: "Registro de RIR/RPE por série.",
        fase: "Estatística",
    },
    {
        id: "consistencia",
        nome: "Consistência por exercício",
        categoria: "Treinamento",
        resumo: "Detecta exercícios frequentemente ignorados, substituídos ou interrompidos.",
        analisa: "Presença no plano, execução, substituições, interrupções e frequência.",
        entrega: "Ranking de consistência e exercícios que merecem revisão do profissional.",
        requisito: "Vínculo estável entre exercício prescrito e executado.",
        fase: "Estatística",
    },
    {
        id: "prontidao",
        nome: "Prontidão e recuperação",
        categoria: "Recuperação",
        resumo: "Cruza percepção diária de recuperação com a carga de treinamento.",
        analisa: "Sono, energia, fadiga, estresse, motivação e carga recente.",
        entrega: "Tendências individuais e alertas de mudança persistente, sem diagnóstico.",
        requisito: "Check-ins diários e histórico de carga.",
        fase: "Estatística",
    },
    {
        id: "dor",
        nome: "Mapa de dor e desconforto",
        categoria: "Recuperação",
        resumo: "Organiza relatos por região, intensidade, exercício e recorrência.",
        analisa: "Localização, escala relatada, duração, contexto e evolução do relato.",
        entrega: "Mapa temporal e recorrência para revisão humana; nunca diagnóstico automático.",
        requisito: "Relatos do aluno e registro das decisões do personal.",
        fase: "Estatística",
    },
    {
        id: "antropometria",
        nome: "Evolução antropométrica",
        categoria: "Evolução",
        resumo: "Compara medidas corporais ao longo do tempo e por protocolo.",
        analisa: "Peso, estatura, perímetros, dobras, data e método de avaliação.",
        entrega:
            "Variações absolutas/relativas, gráficos e comparação entre avaliações equivalentes.",
        requisito: "Avaliações históricas com método e unidade identificados.",
        fase: "Estatística",
    },
    {
        id: "composicao",
        nome: "Composição corporal",
        categoria: "Evolução",
        resumo: "Apresenta estimativas com contexto do método utilizado.",
        analisa:
            "Percentuais e estimativas calculadas, origem, protocolo e margem de interpretação.",
        entrega: "Séries históricas e comparações sem misturar métodos incompatíveis.",
        requisito: "Medições válidas e identificação explícita do protocolo.",
        fase: "Estatística",
    },
    {
        id: "periodizacao",
        nome: "Eficiência da periodização",
        categoria: "Treinamento",
        resumo: "Avalia a execução do ciclo contra o planejamento original.",
        analisa: "Semanas, sessões previstas/concluídas, volume, intensidade e deloads.",
        entrega: "Aderência por microciclo e visão de desvios acumulados.",
        requisito: "Periodização versionada e execução vinculada à semana.",
        fase: "Estatística",
    },
    {
        id: "plato",
        nome: "Detecção de platôs",
        categoria: "Desempenho",
        resumo: "Sinaliza períodos sem mudança relevante em indicadores escolhidos.",
        analisa: "Tendências de carga, repetições, medidas e consistência em janelas móveis.",
        entrega: "Sinalização descritiva quando há pelo menos quatro testes comparáveis por exercício (supino, terra, remada ou agachamento).",
        requisito: "Histórico suficiente e medidas comparáveis.",
        fase: "Estatística",
    },
    {
        id: "carga-recuperacao",
        nome: "Relação carga × recuperação",
        categoria: "Recuperação",
        resumo: "Coloca carga recente e sinais subjetivos na mesma linha temporal.",
        analisa: "Volume, intensidade, frequência, sono, fadiga e percepção de prontidão.",
        entrega: "Correlação exploratória e alertas para investigação profissional.",
        requisito: "Execuções e check-ins regulares.",
        fase: "Estatística",
    },
    {
        id: "ciclos",
        nome: "Comparador de ciclos",
        categoria: "Evolução",
        resumo: "Compara blocos de treinamento sem perder o contexto de cada fase.",
        analisa: "Objetivo do ciclo, exercícios, volume, intensidade, adesão e resultados.",
        entrega: "Comparação dos registros mensais de séries e variações entre meses nos ciclos de volume.",
        requisito: "Ciclos encerrados e snapshots históricos.",
        fase: "Estatística",
    },
    {
        id: "assimetria-bilateral",
        nome: "Assimetria bilateral",
        categoria: "Desempenho",
        resumo: "Compara diferenças entre lados em medidas e exercícios unilaterais.",
        analisa:
            "Perímetros pareados de braço, antebraço, coxa e panturrilha na avaliação mais recente.",
        entrega:
            "Diferenças absolutas e relativas entre lados para revisão profissional; não avalia força unilateral nem diagnostica disfunções.",
        requisito:
            "Registros identificados por lado, exercícios comparáveis e protocolos de medição consistentes.",
        fase: "Estatística",
    },
    {
        id: "densidade-sessao",
        nome: "Densidade e eficiência da sessão",
        categoria: "Treinamento",
        resumo: "Estrutura planejada para avaliar como o volume de trabalho se distribui ao longo do tempo da sessão.",
        analisa:
            "Duração, séries válidas, tonelagem, intervalos de descanso, pausas e exercícios concluídos.",
        entrega:
            "Densidade por sessão, tempo médio por série, comparação entre sessões equivalentes e tendências de duração.",
        requisito:
            "Horários de início/fim e registros de séries e descansos com timestamps confiáveis.",
        fase: "Estatística",
    },
    {
        id: "relatorio",
        nome: "Relatórios multivariados",
        categoria: "Evolução",
        resumo: "Combina diferentes dimensões para apoiar revisões de acompanhamento.",
        analisa: "Adesão, desempenho, evolução física, periodização e check-ins.",
        entrega: "Relatórios filtráveis, exportáveis e com origem dos dados identificada.",
        requisito: "Conjunto mínimo de dados históricos consistentes.",
        fase: "Estatística",
    },
    {
        id: "perfil-adaptativo",
        nome: "Perfil adaptativo de resposta",
        categoria: "Inteligência",
        resumo: "Aprende como cada aluno costuma responder a diferentes estímulos.",
        analisa: "Histórico longitudinal, estímulos, resposta, recuperação e contexto individual.",
        entrega: "Perfil de resposta com incerteza, evidências e limitações explícitas.",
        requisito: "Dataset longitudinal anonimizado e validação especializada.",
        fase: "ML futuro",
    },
    {
        id: "previsao-adesao",
        nome: "Previsão de aderência",
        categoria: "Inteligência",
        resumo: "Estima risco de queda de adesão para antecipar contato humano.",
        analisa: "Padrões históricos de frequência, check-ins, interrupções e sazonalidade.",
        entrega: "Probabilidade calibrada, fatores associados e janela de previsão.",
        requisito: "Volume de dados representativo, consentimento e avaliação de viés.",
        fase: "ML futuro",
    },
    {
        id: "anomalias",
        nome: "Detecção de anomalias",
        categoria: "Inteligência",
        resumo: "Encontra mudanças incomuns nos padrões individuais de execução.",
        analisa: "Desvios de carga, volume, desempenho, recuperação e registros.",
        entrega: "Eventos atípicos explicáveis para revisão do profissional.",
        requisito: "Séries históricas confiáveis e baseline individual.",
        fase: "ML futuro",
    },
    {
        id: "apoio-decisao",
        nome: "Copiloto de revisão",
        categoria: "Inteligência",
        resumo: "Organiza evidências e sugere perguntas para a revisão do personal.",
        analisa: "Indicadores, histórico, metas, relatos e regras configuradas.",
        entrega: "Resumo explicável e opções de revisão; nunca altera a prescrição sozinho.",
        requisito: "Camada de regras, modelos validados e aprovação humana obrigatória.",
        fase: "ML futuro",
    },
];

const categorias = [
    "Todas",
    "Adesão",
    "Treinamento",
    "Desempenho",
    "Recuperação",
    "Evolução",
    "Inteligência",
] as const;

export default function ControleAvancado({
    isAdmin,
    autorizado,
    personais,
    alunosDisponiveis,
    onBack,
}: {
    isAdmin: boolean;
    autorizado: boolean;
    personais: PersonalResumoApi[];
    alunosDisponiveis: AlunoMonitoramentoOption[];
    onBack: () => void;
}) {
    const queryClient = useQueryClient();
    const [modo, setModo] = useState<"estatistico" | "inteligente">("estatistico");
    const [categoria, setCategoria] = useState<(typeof categorias)[number]>("Todas");
    const [busca, setBusca] = useState("");
    const [selecionada, setSelecionada] = useState<string | null>(null);
    const [atualizandoPermissaoId, setAtualizandoPermissaoId] = useState<string | null>(null);
    const [mensagemPermissao, setMensagemPermissao] = useState("");
    const [periodo, setPeriodo] = useState("90");
    const [granularidade, setGranularidade] = useState("semanal");
    const [comparacao, setComparacao] = useState("periodo-anterior");
    const [segmentacao, setSegmentacao] = useState("grupo-muscular");
    const [excluirIncompletos, setExcluirIncompletos] = useState(true);
    const [exibirVariabilidade, setExibirVariabilidade] = useState(true);
    const [alunoSelecionadoId, setAlunoSelecionadoId] = useState("");
    const [salvandoAnalise, setSalvandoAnalise] = useState(false);
    const [mensagemAnalise, setMensagemAnalise] = useState("");

    const alunoSelecionado = alunosDisponiveis.find(aluno => aluno.id === alunoSelecionadoId);
    const fichaQuery = useQuery({
        queryKey: ["controle-avancado", "ficha", alunoSelecionadoId],
        queryFn: async () => {
            const [cadastro, grupos] = await Promise.all([
                cadastroService.obterCadastro(alunoSelecionadoId),
                cadastroService.listarGruposMusculares(),
            ]);
            return mapearCadastroParaAvaliacao(cadastro, grupos);
        },
        enabled: Boolean(alunoSelecionadoId) && (isAdmin || autorizado),
    });
    const ciclosQuery = useQuery({
        queryKey: ["controle-avancado", "ciclos-volume", alunoSelecionadoId],
        queryFn: () => volumeAcompanhamentoService.listar(alunoSelecionadoId),
        enabled: Boolean(alunoSelecionadoId) && (isAdmin || autorizado),
    });
    const historicoQuery = useQuery({
        queryKey: ["controle-avancado", "historico", alunoSelecionadoId],
        queryFn: () => analiseEstatisticaService.listar(alunoSelecionadoId),
        enabled: Boolean(alunoSelecionadoId) && (isAdmin || autorizado),
    });
    const permissoesQuery = useQuery({
        queryKey: ["controle-avancado", "permissoes", personais.map(item => item.id).join("|")],
        queryFn: async () => Promise.all(personais.map(async personal => ({
            personalId: personal.id,
            config: await adminExtrasService.obterConfiguracao(personal.id),
        }))),
        enabled: isAdmin && personais.length > 0,
    });
    const configuracoesPorPersonal = useMemo(
        () => new Map((permissoesQuery.data ?? []).map(item => [item.personalId, item.config])),
        [permissoesQuery.data],
    );

    const lista = useMemo(
        () =>
            ferramentas.filter(
                item =>
                    (modo === "estatistico"
                        ? item.fase === "Estatística"
                        : item.fase === "ML futuro") &&
                    (categoria === "Todas" || item.categoria === categoria) &&
                    (item.nome + " " + item.resumo + " " + item.categoria)
                        .toLocaleLowerCase("pt-BR")
                        .includes(busca.toLocaleLowerCase("pt-BR")),
            ),
        [modo, categoria, busca],
    );
    const detalhe = ferramentas.find(item => item.id === selecionada);
    const ficha = fichaQuery.data;
    const resultadoDetalhe = useMemo(
        () => detalhe && ficha && !ciclosQuery.isLoading
            ? executarAnaliseEstatistica(
                detalhe.id,
                ficha,
                ciclosQuery.data ?? [],
                periodo === "ciclo" ? null : Number(periodo),
                exibirVariabilidade,
            )
            : null,
        [detalhe, ficha, ciclosQuery.data, ciclosQuery.isLoading, periodo, exibirVariabilidade],
    );
    const resultadosFerramentas = useMemo(() => {
        if (!ficha || ciclosQuery.isLoading) return {};
        return Object.fromEntries(
            ferramentas.filter(item => item.fase === "Estatística").map(item => [
                item.id,
                executarAnaliseEstatistica(item.id, ficha, ciclosQuery.data ?? [], periodo === "ciclo" ? null : Number(periodo), exibirVariabilidade),
            ]),
        );
    }, [ficha, ciclosQuery.data, ciclosQuery.isLoading, periodo, exibirVariabilidade]);

    async function salvarAnaliseAtual() {
        if (!alunoSelecionadoId || !detalhe || !resultadoDetalhe || !resultadoDetalhe.quantidadeRegistros) return;
        setSalvandoAnalise(true);
        setMensagemAnalise("");
        try {
            const fim = new Date();
            const inicio = periodo === "ciclo" ? null : new Date(Date.now() - Number(periodo) * 86400000);
            const dataIso = (data: Date) => `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
            await analiseEstatisticaService.salvar(alunoSelecionadoId, {
                ferramentaId: detalhe.id,
                nomeFerramenta: detalhe.nome,
                periodoInicio: inicio ? dataIso(inicio) : undefined,
                periodoFim: dataIso(fim),
                parametrosJson: JSON.stringify({ periodo, exibirVariabilidade }),
                resultadoJson: JSON.stringify(resultadoDetalhe),
                resumo: resultadoDetalhe.resumo,
                quantidadeRegistros: resultadoDetalhe.quantidadeRegistros,
            });
            await queryClient.invalidateQueries({ queryKey: ["controle-avancado", "historico", alunoSelecionadoId] });
            setMensagemAnalise("Análise salva no histórico deste aluno.");
        } catch {
            setMensagemAnalise("Não foi possível salvar a análise. Verifique a conexão e a permissão da API.");
        } finally {
            setSalvandoAnalise(false);
        }
    }

    async function alternarAcessoPersonal(personalId: string, habilitado: boolean) {
        const config = configuracoesPorPersonal.get(personalId);
        if (!config) return;
        setAtualizandoPermissaoId(personalId);
        setMensagemPermissao("");
        try {
            await adminExtrasService.salvarConfiguracao({
                ...config,
                personalId,
                controleAvancadoHabilitado: !habilitado,
            });
            await queryClient.invalidateQueries({ queryKey: ["controle-avancado", "permissoes"] });
            setMensagemPermissao("Permissão atualizada. O profissional verá a alteração ao atualizar a sessão.");
        } catch {
            setMensagemPermissao("Não foi possível atualizar a permissão deste profissional.");
        } finally {
            setAtualizandoPermissaoId(null);
        }
    }

    function renderPermissoesAdmin() {
        if (!isAdmin) return null;
        return (
            <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <p className="text-[9px] font-bold uppercase tracking-[.15em] text-[var(--accent-text)]">Administração</p>
                        <h2 className="mt-1 text-[14px] font-semibold text-[var(--text-primary)]">Acesso por profissional</h2>
                        <p className="mt-1 max-w-[650px] text-[10px] leading-5 text-[var(--text-muted)]">
                            A autorização é persistida pelo ADMIN. O personal autorizado continua limitado aos próprios alunos vinculados, inclusive nas rotas da API.
                        </p>
                    </div>
                    <span className="rounded-full bg-[var(--success-soft)] px-2.5 py-1 text-[8px] font-semibold text-[var(--success)]">Permissões persistidas</span>
                </div>
                {permissoesQuery.isError && <p role="alert" className="mt-3 text-[10px] text-[var(--danger)]">Não foi possível carregar as permissões dos profissionais.</p>}
                <div className="mt-4 divide-y divide-[var(--border)]">
                    {permissoesQuery.isLoading ? (
                        <p className="py-4 text-[10px] text-[var(--text-muted)]">Carregando permissões...</p>
                    ) : personais.length ? (
                        personais.map(personal => {
                            const ativo = configuracoesPorPersonal.get(personal.id)?.controleAvancadoHabilitado ?? false;
                            return (
                                <div key={personal.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-semibold text-[var(--text-primary)]">{personal.nomeCompleto}</p>
                                        <p className="mt-0.5 truncate text-[9px] text-[var(--text-muted)]">{personal.email}</p>
                                    </div>
                                    <button
                                        disabled={atualizandoPermissaoId === personal.id || !configuracoesPorPersonal.has(personal.id)}
                                        onClick={() => void alternarAcessoPersonal(personal.id, ativo)}
                                        className={ativo
                                            ? "inline-flex h-8 items-center gap-2 rounded-lg bg-[var(--success-soft)] px-3 text-[9px] font-semibold text-[var(--success)] disabled:opacity-50"
                                            : "inline-flex h-8 items-center gap-2 rounded-lg border border-[var(--border)] px-3 text-[9px] font-semibold text-[var(--text-secondary)] disabled:opacity-50"}
                                    >
                                        {atualizandoPermissaoId === personal.id ? "Salvando" : ativo ? <BsToggleOn className={ativo ? "text-lg" : "text-lg opacity-40"}/> : <BsToggleOff className={ativo ? "text-lg" : "text-lg opacity-40"}/>}
                                        {atualizandoPermissaoId === personal.id ? "Salvando..." : ativo ? "Revogar acesso" : "Conceder acesso"}
                                    </button>
                                </div>
                            );
                        })
                    ) : (
                        <p className="py-4 text-[10px] text-[var(--text-muted)]">Nenhum profissional disponível para configurar.</p>
                    )}
                </div>
                {mensagemPermissao && <p role="status" className="mt-3 text-[10px] text-[var(--text-secondary)]">{mensagemPermissao}</p>}
                <p className="mt-3 rounded-xl bg-[var(--surface-secondary)] p-3 text-[9px] leading-5 text-[var(--text-muted)]">
                    A alteração é gravada em ConfiguracoesAcompanhamento e refletida na sessão do profissional após atualizar a página ou autenticar novamente.
                </p>
            </section>
        );
    }

    if (!isAdmin && !autorizado)
        return (
            <section className="controle-avancado w-full max-w-[1100px] space-y-5">
                <button
                    onClick={onBack}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-[10px] font-semibold text-[var(--text-secondary)]"
                >
                    <BsArrowLeft /> Voltar
                </button>
                <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-7 sm:p-10">
                    <div className="absolute -right-12 -top-16 h-64 w-64 rounded-full bg-[var(--accent)] opacity-[.07] blur-3xl" />
                    <div className="relative mx-auto max-w-[560px] text-center">
                        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[var(--surface-tertiary)] text-[var(--text-muted)]">
                            <BsLock className="text-2xl" />
                        </span>
                        <p className="mt-5 text-[9px] font-bold uppercase tracking-[.18em] text-[var(--accent-text)]">
                            GGP · Advanced Intelligence
                        </p>
                        <h1 className="mt-2 text-[25px] font-semibold tracking-[-.04em] text-[var(--text-primary)]">
                            Controle avançado restrito
                        </h1>
                        <p className="mt-3 text-[11px] leading-6 text-[var(--text-secondary)]">
                            Este ambiente reúne ferramentas estatísticas avançadas e, futuramente,
                            modelos inteligentes de análise. O acesso será concedido individualmente
                            por um administrador.
                        </p>
                        <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] p-4 text-left">
                            <p className="text-[10px] font-semibold text-[var(--text-primary)]">
                                Como solicitar acesso
                            </p>
                            <p className="mt-1 text-[10px] leading-5 text-[var(--text-muted)]">
                                Entre em contato com um administrador da equipe. A autorização será
                                registrada no perfil profissional e respeitará o escopo de alunos
                                vinculado ao personal.
                            </p>
                        </div>
                        <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1.5 text-[9px] font-semibold text-amber-700">
                            <BsShieldLock /> Acesso não habilitado para esta conta
                        </span>
                    </div>
                </div>
            </section>
        );

    if (!alunoSelecionadoId)
        return (
            <section className="controle-avancado w-full max-w-[1500px] space-y-5">
                <div className="flex items-center justify-between gap-3">
                    <button
                        onClick={onBack}
                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-[10px] font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--row-hover)]"
                    >
                        <BsArrowLeft /> Voltar
                    </button>
                    <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1.5 text-[9px] font-semibold text-[var(--accent-text)]">
                        Controle avançado · acesso autorizado
                    </span>
                </div>
                <header className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">
                    <p className="text-[9px] font-bold uppercase tracking-[.16em] text-[var(--accent-text)]">GGP / Advanced Intelligence</p>
                    <h1 className="mt-2 text-[25px] font-semibold tracking-[-.04em] text-[var(--text-primary)] sm:text-[30px]">Escolha um aluno para analisar</h1>
                    <p className="mt-2 max-w-[720px] text-[11px] leading-6 text-[var(--text-secondary)]">
                        A análise será vinculada ao aluno selecionado. Antes de executar cada ferramenta, você verá quais dados existem na ficha, quais estão faltando e quais resultados podem ser calculados agora.
                    </p>
                </header>
                {alunosDisponiveis.length ? (
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-8">
                        <AlunoMonitoramentoPicker
                            alunos={alunosDisponiveis}
                            selectedId={alunoSelecionadoId}
                            onSelectedChange={setAlunoSelecionadoId}
                            onOpen={setAlunoSelecionadoId}
                        />
                    </div>
                ) : (
                    <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface)] p-8 text-center">
                        <p className="text-[13px] font-semibold text-[var(--text-primary)]">Nenhum aluno disponível</p>
                        <p className="mt-1 text-[11px] text-[var(--text-muted)]">Os alunos vinculados à sua carteira aparecerão aqui.</p>
                    </div>
                )}
                {renderPermissoesAdmin()}
            </section>
        );

    return (
        <section className="controle-avancado w-full max-w-[1500px] space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                    onClick={() => {
                        setAlunoSelecionadoId("");
                        setSelecionada(null);
                    }}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-[10px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--row-hover)]"
                >
                    <BsArrowLeft /> Trocar aluno
                </button>
                <div className="flex flex-wrap items-center gap-2">
                    <AlunoMonitoramentoPicker
                        compact
                        alunos={alunosDisponiveis}
                        selectedId={alunoSelecionadoId}
                        loading={fichaQuery.isLoading}
                        onOpen={id => {
                            setAlunoSelecionadoId(id);
                            setSelecionada(null);
                            setMensagemAnalise("");
                        }}
                    />
                    <span className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/20 bg-[var(--accent-soft)] px-3 py-1.5 text-[9px] font-semibold text-[var(--accent-text)]">
                        <BsShieldLock /> Área de acesso controlado
                    </span>
                </div>
            </div>
            {(fichaQuery.isLoading || ciclosQuery.isLoading) && <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-[11px] text-[var(--text-muted)]">Carregando ficha, ciclos de volume e histórico estatístico do aluno...</div>}
            {fichaQuery.isError && <div role="alert" className="rounded-xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-4 text-[11px] text-[var(--danger)]">Não foi possível carregar os dados deste aluno. Confira a conexão com a API e tente novamente.</div>}
            {ciclosQuery.isError && <div role="alert" className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-[11px] text-amber-700">Não foi possível carregar os ciclos de volume. As ferramentas que dependem desses registros poderão apresentar resultados incompletos.</div>}
            {alunoSelecionado && <p className="px-1 text-[10px] text-[var(--text-muted)]">Análises vinculadas a <strong className="text-[var(--text-primary)]">{alunoSelecionado.nomeCompleto}</strong>. Os resultados salvos ficam no histórico individual desse aluno.</p>}
            <header className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">
                <div className="pointer-events-none absolute -right-12 -top-24 h-72 w-72 rounded-full bg-[var(--accent)] opacity-[.08] blur-3xl" />
                <div className="relative grid gap-6 xl:grid-cols-[1.3fr_.7fr] xl:items-end">
                    <div>
                        <p className="inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.18em] text-[var(--accent-text)]">
                            <BsStars /> GGP / Advanced Intelligence
                        </p>
                        <h1 className="mt-3 text-[27px] font-semibold tracking-[-.05em] text-[var(--text-primary)] sm:text-[34px]">
                            Central de análise avançada
                        </h1>
                        <p className="mt-3 max-w-[680px] text-[11px] leading-6 text-[var(--text-secondary)]">
                            Um ambiente para transformar histórico de treinamento em evidências
                            úteis. Primeiro, análises estatísticas transparentes e configuráveis.
                            Depois, modelos de aprendizado de máquina com explicabilidade e
                            validação humana.
                        </p>
                        <div className="mt-5 flex flex-wrap gap-2">
                            <span className="rounded-full bg-[var(--surface-tertiary)] px-3 py-1.5 text-[9px] text-[var(--text-secondary)]">
                                22 ferramentas planejadas
                            </span>
                            <span className="rounded-full bg-[var(--surface-tertiary)] px-3 py-1.5 text-[9px] text-[var(--text-secondary)]">
                                18 estatísticas
                            </span>
                            <span className="rounded-full bg-[var(--surface-tertiary)] px-3 py-1.5 text-[9px] text-[var(--text-secondary)]">
                                4 módulos ML futuro
                            </span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] p-4">
                            <BsDatabase className="text-lg text-[var(--accent)]" />
                            <p className="mt-3 text-[9px] text-[var(--text-muted)]">
                                Camada de dados
                            </p>
                            <p className="mt-1 text-[12px] font-semibold text-[var(--text-primary)]">
                                Histórico confiável
                            </p>
                        </div>
                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] p-4">
                            <BsCpu className="text-lg text-[var(--accent)]" />
                            <p className="mt-3 text-[9px] text-[var(--text-muted)]">
                                Motor analítico
                            </p>
                            <p className="mt-1 text-[12px] font-semibold text-[var(--text-primary)]">
                                Estatística + ML
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid gap-3 md:grid-cols-2">
                <button
                    onClick={() => {
                        setModo("estatistico");
                        setCategoria("Todas");
                        setSelecionada(null);
                    }}
                    className={
                        modo === "estatistico"
                            ? "rounded-2xl border border-[var(--accent)] bg-[var(--accent-soft)] p-5 text-left"
                            : "rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-left hover:border-[var(--accent)]"
                    }
                >
                    <span className="flex items-center justify-between">
                        <BsBarChartLine className="text-xl text-[var(--accent)]" />
                        <span className="text-[9px] font-semibold text-[var(--text-muted)]">
                            18 ferramentas
                        </span>
                    </span>
                    <h2 className="mt-3 text-[14px] font-semibold text-[var(--text-primary)]">
                        Controle estatístico
                    </h2>
                    <p className="mt-1 text-[10px] leading-5 text-[var(--text-secondary)]">
                        Indicadores, séries temporais, comparações, filtros, correlações e alertas
                        configuráveis.
                    </p>
                </button>
                <button
                    onClick={() => {
                        setModo("inteligente");
                        setCategoria("Todas");
                        setSelecionada(null);
                    }}
                    className={
                        modo === "inteligente"
                            ? "rounded-2xl border border-[var(--accent)] bg-[var(--accent-soft)] p-5 text-left"
                            : "rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-left hover:border-[var(--accent)]"
                    }
                >
                    <span className="flex items-center justify-between">
                        <BsCpu className="text-xl text-[var(--accent)]" />
                        <span className="text-[9px] font-semibold text-[var(--text-muted)]">
                            4 módulos futuros
                        </span>
                    </span>
                    <h2 className="mt-3 text-[14px] font-semibold text-[var(--text-primary)]">
                        Controle inteligente · ML
                    </h2>
                    <p className="mt-1 text-[10px] leading-5 text-[var(--text-secondary)]">
                        Espaço reservado para modelos treinados, previsões explicáveis e apoio à
                        decisão.
                    </p>
                </button>
            </div>

            {modo === "inteligente" && (
                <section className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sky-500/10 text-sky-600">
                            <BsCpu />
                        </span>
                        <div>
                            <p className="text-[11px] font-semibold text-[var(--text-primary)]">
                                Laboratório de modelos · roadmap
                            </p>
                            <p className="mt-1 text-[10px] leading-5 text-[var(--text-secondary)]">
                                Os modelos ainda não foram treinados nem conectados. Cada previsão
                                deverá apresentar evidências, confiança, versão do modelo e
                                limitações. Nenhum modelo poderá alterar treino, carga ou conduta
                                automaticamente.
                            </p>
                        </div>
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-3">
                        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                            <p className="text-[9px] text-[var(--text-muted)]">Etapa 01</p>
                            <p className="mt-1 text-[10px] font-semibold text-[var(--text-primary)]">
                                Dataset e qualidade
                            </p>
                        </div>
                        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                            <p className="text-[9px] text-[var(--text-muted)]">Etapa 02</p>
                            <p className="mt-1 text-[10px] font-semibold text-[var(--text-primary)]">
                                Treino e validação
                            </p>
                        </div>
                        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                            <p className="text-[9px] text-[var(--text-muted)]">Etapa 03</p>
                            <p className="mt-1 text-[10px] font-semibold text-[var(--text-primary)]">
                                Inferência monitorada
                            </p>
                        </div>
                    </div>
                </section>
            )}

            {modo === "estatistico" && (
                <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <p className="text-[9px] font-bold uppercase tracking-[.15em] text-[var(--accent-text)]">
                                Laboratório de análise
                            </p>
                            <h2 className="mt-1 text-[14px] font-semibold text-[var(--text-primary)]">
                                Configuração do motor estatístico
                            </h2>
                            <p className="mt-1 text-[10px] leading-5 text-[var(--text-muted)]">
                                Defina como os dados deverão ser filtrados, agrupados e comparados
                                antes de executar uma análise.
                            </p>
                        </div>
                        <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[8px] font-semibold text-amber-700">
                            Período aplicado · opções avançadas em evolução
                        </span>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <label className="grid gap-1.5">
                            <span className="text-[9px] font-semibold text-[var(--text-muted)]">
                                Janela de análise
                            </span>
                            <select
                                value={periodo}
                                onChange={e => setPeriodo(e.target.value)}
                                className="h-9 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-2.5 text-[10px] text-[var(--text-primary)]"
                            >
                                <option value="30">Últimos 30 dias</option>
                                <option value="90">Últimos 90 dias</option>
                                <option value="180">Últimos 6 meses</option>
                                <option value="365">Últimos 12 meses</option>
                                <option value="ciclo">Ciclo completo</option>
                            </select>
                        </label>
                        <label className="grid gap-1.5">
                            <span className="text-[9px] font-semibold text-[var(--text-muted)]">
                                Granularidade temporal · em breve
                            </span>
                            <select
                                value={granularidade}
                                onChange={e => setGranularidade(e.target.value)}
                                disabled
                                className="h-9 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-2.5 text-[10px] text-[var(--text-primary)]"
                            >
                                <option value="diaria">Diária</option>
                                <option value="semanal">Semanal</option>
                                <option value="mensal">Mensal</option>
                                <option value="ciclo">Por ciclo</option>
                            </select>
                        </label>
                        <label className="grid gap-1.5">
                            <span className="text-[9px] font-semibold text-[var(--text-muted)]">
                                Base de comparação · em breve
                            </span>
                            <select
                                value={comparacao}
                                onChange={e => setComparacao(e.target.value)}
                                disabled
                                className="h-9 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-2.5 text-[10px] text-[var(--text-primary)]"
                            >
                                <option value="periodo-anterior">Período anterior</option>
                                <option value="ciclo-anterior">Ciclo anterior</option>
                                <option value="linha-base">Linha de base individual</option>
                                <option value="sem-comparacao">Sem comparação</option>
                            </select>
                        </label>
                        <label className="grid gap-1.5">
                            <span className="text-[9px] font-semibold text-[var(--text-muted)]">
                                Agrupar resultados por · em breve
                            </span>
                            <select
                                value={segmentacao}
                                onChange={e => setSegmentacao(e.target.value)}
                                disabled
                                className="h-9 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-2.5 text-[10px] text-[var(--text-primary)]"
                            >
                                <option value="grupo-muscular">Grupo muscular</option>
                                <option value="exercicio">Exercício</option>
                                <option value="sessao">Sessão de treino</option>
                                <option value="microciclo">Microciclo</option>
                                <option value="aluno">Aluno</option>
                            </select>
                        </label>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-4 border-t border-[var(--border)] pt-4">
                        <label className="inline-flex items-center gap-2 text-[9px] text-[var(--text-secondary)]">
                            <input
                                type="checkbox"
                                checked={excluirIncompletos}
                                onChange={e => setExcluirIncompletos(e.target.checked)}
                                disabled
                                className="accent-[var(--accent)]"
                            />
                            Excluir registros incompletos
                        </label>
                        <label className="inline-flex items-center gap-2 text-[9px] text-[var(--text-secondary)]">
                            <input
                                type="checkbox"
                                checked={exibirVariabilidade}
                                onChange={e => setExibirVariabilidade(e.target.checked)}
                                className="accent-[var(--accent)]"
                            />
                            Exibir variabilidade e dispersão
                        </label>
                    </div>
                    <div className="mt-4 rounded-xl bg-[var(--surface-secondary)] p-3">
                        <p className="text-[9px] font-semibold text-[var(--text-primary)]">
                            Prévia dos parâmetros selecionados
                        </p>
                        <p className="mt-1 text-[9px] leading-5 text-[var(--text-muted)]">
                            Janela: {periodo === "ciclo" ? "ciclo completo" : periodo + " dias"} ·
                            Variabilidade: {exibirVariabilidade ? "exibida" : "oculta"}. Nesta versão,
                            somente esses dois parâmetros afetam os cálculos e são salvos. Granularidade,
                            comparação, agrupamento e exclusão de incompletos ainda não estão aplicados.
                        </p>
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-5">
                        {[
                            ["01", "Coleta", "Eventos e snapshots"],
                            ["02", "Validação", "Integridade e qualidade"],
                            ["03", "Normalização", "Unidades e contexto"],
                            ["04", "Agregação", "Séries e indicadores"],
                            ["05", "Apresentação", "Gráficos e alertas"],
                        ].map(([numero, titulo, descricao]) => (
                            <div
                                key={numero}
                                className="rounded-xl border border-[var(--border)] p-3"
                            >
                                <span className="text-[8px] font-bold text-[var(--accent-text)]">
                                    ETAPA {numero}
                                </span>
                                <p className="mt-1 text-[10px] font-semibold text-[var(--text-primary)]">
                                    {titulo}
                                </p>
                                <p className="mt-1 text-[8px] leading-4 text-[var(--text-muted)]">
                                    {descricao}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                        <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">
                            {modo === "estatistico"
                                ? "Catálogo de ferramentas estatísticas"
                                : "Modelos inteligentes planejados"}
                        </h2>
                        <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                            Selecione uma ferramenta para ver objetivo, dados necessários e
                            resultado esperado.
                        </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <label className="relative">
                            <BsSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                            <input
                                value={busca}
                                onChange={e => setBusca(e.target.value)}
                                placeholder="Buscar ferramenta..."
                                className="h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] pl-9 pr-3 text-[10px] text-[var(--text-primary)] outline-none sm:w-52"
                            />
                        </label>
                        <label className="relative">
                            <BsFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                            <select
                                value={categoria}
                                onChange={e =>
                                    setCategoria(e.target.value as (typeof categorias)[number])
                                }
                                className="h-9 w-full appearance-none rounded-lg border border-[var(--border)] bg-[var(--input-bg)] pl-9 pr-7 text-[10px] text-[var(--text-primary)] outline-none sm:w-44"
                            >
                                {categorias.map(item => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {lista.map((item, index) => (
                        <button
                            key={item.id}
                            onClick={() => setSelecionada(item.id)}
                            className={
                                selecionada === item.id
                                    ? "rounded-xl border border-[var(--accent)] bg-[var(--accent-soft)] p-4 text-left transition"
                                    : "rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] p-4 text-left transition hover:border-[var(--accent)] hover:bg-[var(--surface)]"
                            }
                        >
                            <div className="flex items-start justify-between gap-3">
                                <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--surface-tertiary)] text-[var(--accent-text)]">
                                    {modo === "estatistico" ? <BsGraphUpArrow /> : <BsStars />}
                                </span>
                                <span className="rounded-full bg-[var(--surface-tertiary)] px-2 py-1 text-[8px] font-semibold text-[var(--text-muted)]">
                                    {item.categoria}
                                </span>
                            </div>
                            {modo === "estatistico" && (
                                <span className={`mt-3 inline-flex rounded-full px-2 py-1 text-[8px] font-semibold ${
                                    !ficha ? "bg-[var(--surface-tertiary)] text-[var(--text-muted)]" :
                                    resultadosFerramentas[item.id]?.disponibilidade === "disponivel" ? "bg-[var(--success-soft)] text-[var(--success)]" :
                                    resultadosFerramentas[item.id]?.disponibilidade === "parcial" ? "bg-amber-500/10 text-amber-700" :
                                    "bg-[var(--surface-tertiary)] text-[var(--text-muted)]"
                                }`}>
                                    {!ficha ? "Aguardando ficha" : resultadosFerramentas[item.id]?.disponibilidade === "disponivel" ? "Dados suficientes" : resultadosFerramentas[item.id]?.disponibilidade === "parcial" ? "Análise parcial" : "Dados insuficientes"}
                                </span>
                            )}
                            <p className="mt-3 text-[11px] font-semibold text-[var(--text-primary)]">
                                {String(index + 1).padStart(2, "0")} · {item.nome}
                            </p>
                            <p className="mt-1 min-h-10 text-[9px] leading-5 text-[var(--text-muted)]">
                                {item.resumo}
                            </p>
                            <span className="mt-3 inline-flex items-center gap-1 text-[9px] font-semibold text-[var(--accent-text)]">
                                Explorar ferramenta <BsArrowUpRight />
                            </span>
                        </button>
                    ))}
                </div>
                {!lista.length && (
                    <p className="py-8 text-center text-[10px] text-[var(--text-muted)]">
                        Nenhuma ferramenta corresponde ao filtro.
                    </p>
                )}
            </section>

            {detalhe && (
                <section className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--surface)] p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <p className="text-[9px] font-bold uppercase tracking-[.15em] text-[var(--accent-text)]">
                                Especificação da ferramenta
                            </p>
                            <h3 className="mt-1 text-[17px] font-semibold text-[var(--text-primary)]">
                                {detalhe.nome}
                            </h3>
                            <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                                {detalhe.categoria} · {detalhe.fase}
                            </p>
                        </div>
                        <button
                            onClick={() => setSelecionada(null)}
                            aria-label="Fechar detalhe"
                            className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--border)] text-[var(--text-muted)]"
                        >
                            <BsX />
                        </button>
                    </div>
                    <p className="mt-4 text-[11px] leading-5 text-[var(--text-secondary)]">
                        {detalhe.resumo}
                    </p>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <div className="rounded-xl bg-[var(--surface-secondary)] p-4">
                            <p className="text-[9px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
                                O que analisa
                            </p>
                            <p className="mt-2 text-[10px] leading-5 text-[var(--text-secondary)]">
                                {detalhe.analisa}
                            </p>
                        </div>
                        <div className="rounded-xl bg-[var(--surface-secondary)] p-4">
                            <p className="text-[9px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
                                O que entrega
                            </p>
                            <p className="mt-2 text-[10px] leading-5 text-[var(--text-secondary)]">
                                {detalhe.entrega}
                            </p>
                        </div>
                        <div className="rounded-xl bg-[var(--surface-secondary)] p-4">
                            <p className="text-[9px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
                                Dados necessários
                            </p>
                            <p className="mt-2 text-[10px] leading-5 text-[var(--text-secondary)]">
                                {detalhe.requisito}
                            </p>
                        </div>
                    </div>
                    {modo === "estatistico" && (
                        <div className="mt-4 space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] p-4 sm:p-5">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <p className="text-[9px] font-bold uppercase tracking-[.14em] text-[var(--accent-text)]">Diagnóstico da ficha selecionada</p>
                                    <h4 className="mt-1 text-[13px] font-semibold text-[var(--text-primary)]">Resultado calculado com os dados atuais</h4>
                                    <p className="mt-1 text-[10px] leading-5 text-[var(--text-secondary)]">{resultadoDetalhe?.resumo ?? "Carregue a ficha para avaliar a disponibilidade desta ferramenta."}</p>
                                </div>
                                {resultadoDetalhe && <span className={`rounded-full px-2.5 py-1 text-[8px] font-semibold ${resultadoDetalhe.disponibilidade === "disponivel" ? "bg-[var(--success-soft)] text-[var(--success)]" : resultadoDetalhe.disponibilidade === "parcial" ? "bg-amber-500/10 text-amber-700" : "bg-[var(--surface-tertiary)] text-[var(--text-muted)]"}`}>
                                    {resultadoDetalhe.disponibilidade === "disponivel" ? "Pronta para análise" : resultadoDetalhe.disponibilidade === "parcial" ? "Parcial · exige atenção" : "Aguardando dados"}
                                </span>}
                            </div>
                            {resultadoDetalhe && (
                                <>
                                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                                        {resultadoDetalhe.metricas.map(metrica => (
                                            <div key={metrica.titulo} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                                                <p className="text-[9px] text-[var(--text-muted)]">{metrica.titulo}</p>
                                                <p className="mt-1 text-[16px] font-semibold text-[var(--text-primary)]">{metrica.valor}</p>
                                                {metrica.detalhe && <p className="mt-1 text-[9px] text-[var(--text-muted)]">{metrica.detalhe}</p>}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="grid gap-3 lg:grid-cols-2">
                                        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                                            <p className="text-[9px] font-bold uppercase tracking-wide text-[var(--text-muted)]">Dados encontrados</p>
                                            {resultadoDetalhe.fontes.length ? <ul className="mt-2 space-y-1.5">{resultadoDetalhe.fontes.map(fonte => <li key={fonte} className="flex gap-2 text-[10px] text-[var(--text-secondary)]"><BsCheck2Circle className="mt-0.5 shrink-0 text-[var(--success)]" />{fonte}</li>)}</ul> : <p className="mt-2 text-[10px] text-[var(--text-muted)]">Nenhuma fonte disponível para esta ferramenta.</p>}
                                        </div>
                                        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                                            <p className="text-[9px] font-bold uppercase tracking-wide text-[var(--text-muted)]">Dados faltantes e limitações</p>
                                            {resultadoDetalhe.dadosFaltantes.length ? <ul className="mt-2 space-y-1.5">{resultadoDetalhe.dadosFaltantes.map(item => <li key={item} className="flex gap-2 text-[10px] text-[var(--text-secondary)]"><BsExclamationTriangle className="mt-0.5 shrink-0 text-amber-600" />{item}</li>)}</ul> : <p className="mt-2 text-[10px] text-[var(--success)]">Nenhum dado obrigatório identificado como ausente para este cálculo.</p>}
                                        </div>
                                    </div>
                                    {resultadoDetalhe.linhas.length > 0 && (
                                        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                                            <div className="border-b border-[var(--border)] px-3 py-2"><p className="text-[9px] font-bold uppercase tracking-wide text-[var(--text-muted)]">Detalhamento dos resultados</p></div>
                                            <div className="divide-y divide-[var(--border)]">
                                                {resultadoDetalhe.linhas.map((linha, index) => <div key={`${linha.titulo}-${index}`} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
                                                    <div className="min-w-0"><p className="text-[10px] font-semibold text-[var(--text-primary)]">{linha.titulo}</p>{linha.detalhe && <p className="mt-0.5 text-[9px] text-[var(--text-muted)]">{linha.detalhe}</p>}</div>
                                                    <span className="text-[10px] font-semibold tabular-nums text-[var(--text-primary)]">{linha.valor}</span>
                                                </div>)}
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-3">
                                        <p className="text-[9px] text-[var(--text-muted)]">Amostra: {resultadoDetalhe.quantidadeRegistros} registros · os resultados são descritivos e dependem da qualidade dos dados.</p>
                                        <button type="button" onClick={() => void salvarAnaliseAtual()} disabled={salvandoAnalise || !resultadoDetalhe.quantidadeRegistros || fichaQuery.isLoading || ciclosQuery.isLoading} className="inline-flex h-9 items-center gap-2 rounded-lg bg-[var(--accent)] px-3 text-[10px] font-semibold text-[var(--on-accent)] transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-45">
                                            <BsPlayFill /> {salvandoAnalise ? "Salvando análise..." : "Executar e salvar análise"}
                                        </button>
                                    </div>
                                    {mensagemAnalise && <p role="status" className="text-[10px] text-[var(--text-secondary)]">{mensagemAnalise}</p>}
                                </>
                            )}
                        </div>
                    )}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
                        <span className="inline-flex items-center gap-2 text-[9px] text-[var(--text-muted)]">
                            <BsDatabase /> {modo === "estatistico" ? "Cálculo local com dados da ficha" : "Roadmap de modelos"}
                        </span>
                        <span className={`rounded-full px-2.5 py-1 text-[8px] font-semibold ${modo === "estatistico" ? "bg-[var(--success-soft)] text-[var(--success)]" : "bg-amber-500/10 text-amber-700"}`}>
                            {modo === "estatistico" ? "Histórico persistido na API" : "ML ainda não implementado"}
                        </span>
                    </div>
                </section>
            )}

            {modo === "estatistico" && (
                <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
                    <div className="flex items-center gap-2"><BsClockHistory className="text-[var(--accent-text)]" /><h2 className="text-[13px] font-semibold text-[var(--text-primary)]">Histórico de análises deste aluno</h2></div>
                    {historicoQuery.isError ? <p role="alert" className="mt-3 text-[10px] text-[var(--danger)]">Não foi possível carregar o histórico salvo deste aluno.</p> : historicoQuery.isLoading ? <p className="mt-3 text-[10px] text-[var(--text-muted)]">Carregando histórico...</p> : historicoQuery.data?.length ? (
                        <div className="mt-3 divide-y divide-[var(--border)]">{historicoQuery.data.map(item => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                            <div><p className="text-[10px] font-semibold text-[var(--text-primary)]">{item.nomeFerramenta}</p><p className="mt-0.5 text-[9px] text-[var(--text-muted)]">{new Date(item.geradoEm).toLocaleString("pt-BR")} · {item.quantidadeRegistros} registros</p><p className="mt-1 text-[9px] text-[var(--text-secondary)]">{item.resumo}</p></div>
                            <span className="rounded-full bg-[var(--surface-tertiary)] px-2.5 py-1 text-[8px] font-semibold text-[var(--text-muted)]">Snapshot salvo</span>
                        </div>)}</div>
                    ) : <p className="mt-3 text-[10px] text-[var(--text-muted)]">Ainda não existem análises salvas para este aluno. Execute uma ferramenta para iniciar o histórico.</p>}
                </section>
            )}

            {renderPermissoesAdmin()}
            <p className="flex items-start gap-2 px-1 text-[9px] leading-5 text-[var(--text-muted)]">
                <BsEye className="mt-0.5 shrink-0" />
                Toda análise deverá exibir período, filtros, fonte dos dados, tamanho da amostra e
                limitações. Correlação não representa causalidade; previsões são apoio à decisão e
                exigem revisão do profissional.
            </p>
        </section>
    );
}
