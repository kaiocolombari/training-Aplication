import {
    BsHouseDoor,
    BsPeople,
    BsClipboard2Pulse,
    BsCalendar3,
    BsBarChart,
    BsChatDots,
    BsBell,
    BsExclamationTriangle,
    BsQuestionCircle,
    BsGear,
    BsFileEarmarkText,
    BsDownload,
    BsTrash3,
    BsPlusLg,
    BsSearch,
    BsThreeDots,
    BsFolder2Open,
    BsUpload,
    BsArrowUpRight,
    BsX,
    BsMoonStars,
    BsSun,
    BsActivity,
    BsCpu,
    BsPalette,
    BsType,
    BsEnvelope,
    BsCollectionPlay,
} from "react-icons/bs";
import { FaPeopleGroup, FaRegCircleQuestion } from "react-icons/fa6";
import { VscFeedback } from "react-icons/vsc";
import { IoChatbubblesSharp } from "react-icons/io5";
import { FaTools } from "react-icons/fa";
import { TbUserStar } from "react-icons/tb";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAvaliacao } from "../context/avaliacaoContext";
import { useLocation, useNavigate } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    cadastroService,
    mapearCadastroParaAvaliacao,
    salvarFicha,
    type AlunoResumoApi,
    type CadastroCompletoApi,
    type PersonalResumoApi,
    type PersonalExclusaoResumoApi,
} from "../service/cadastroService";
import type { Avaliacao } from "../types/avaliacao";
import { useAuth } from "../context/authContext";
import { ApiError } from "../service/api";
import { lerUltimoSalvamento } from "../utils/lastSaved";
import SolicitacoesCadastro from "./SolicitacoesCadastro";
import CentralComunicacao from "./CentralComunicacao";
import { comunicacaoService } from "../service/comunicacaoService";
import { adminExtrasService } from "../service/adminExtrasService";
import { cadastroAlunoService } from "../service/cadastroAlunoService";
import AtividadesAdmin from "./AtividadesAdmin";
import Relatorios from "./Relatorios";
import ControleAluno from "./ControleAluno";
import ControleAvancado from "./ControleAvancado";
import CentralAcompanhamentoPersonal from "../components/CentralAcompanhamentoPersonal";
import {
    ESCALAS_TEXTO,
    FONTES_UI,
    TEMAS,
    gerarVariaveisTema,
    type EscalaTextoId,
    type FonteUiId,
    type TemaId,
} from "../types/temas";
import EmailCenter from "./EmailCenter";
import { Skeleton } from "../components/Skeleton";
import { LoadingState } from "../components/LoadingState";
import AlunoMonitoramentoPicker from "../components/AlunoMonitoramentoPicker";
import ArquivosEquipe from "./ArquivosEquipe";
import BibliotecaExercicios from "./BibliotecaExercicios";
import TarefasPersonal from "./TarefasPersonal";
import FeedbackAlunos from "./FeedbackAlunos";
import IndicadoresEquipe from "./IndicadoresEquipe";
import ManutencaoSistema from "./ManutencaoSistema";
import ConvitesEquipe from "./ConvitesEquipe";
import { assessmentScheduleService } from "../service/assessmentScheduleService";
import { createChatConnection, startChatConnection } from "../service/chatRealtimeService";

interface AlunoPainel {
    id: string;
    nome: string;
    email: string;
    telefone: string;
    criadoEm: string;
    statusCadastro: string;
    possuiFichaTecnica: boolean;
    convidadoPorPersonalNome?: string | null;
    avaliacaoPendente: boolean;
    avaliacaoUrgente: boolean;
}

const MOTIVOS_OPERACAO = [
    ["DIRETRIZES", "Quebra das diretrizes"],
    ["SOLICITACAO_USUARIO", "Solicitação do próprio usuário (mobile)"],
    ["DUPLICIDADE", "Cadastro duplicado"],
    ["ENCERRAMENTO_ADMINISTRATIVO", "Encerramento administrativo"],
    ["SOLICITACAO_PERSONAL", "Solicitação do próprio personal"],
    ["SOLICITACAO_ALUNO", "Solicitação do aluno"],
    ["REORGANIZACAO_EQUIPE", "Reorganização da equipe"],
    ["OUTRO", "Outro motivo"],
] as const;

function clonarIdsFicha(ficha: Avaliacao): Avaliacao {
    const idsTreino = new Map<string, string>();
    const idsExercicio = new Map<string, string>();
    const treino = ficha.treino.map(item => {
        const id = crypto.randomUUID();
        idsTreino.set(item.id, id);
        const exercicios = item.exercicios.map(exercicio => {
            const exercicioId = crypto.randomUUID();
            idsExercicio.set(exercicio.id, exercicioId);
            return {
                ...exercicio,
                id: exercicioId,
                variacoes: (exercicio.variacoes ?? []).map(variacao => ({
                    ...variacao,
                    id: crypto.randomUUID(),
                })),
            };
        });
        return { ...item, id, exercicios };
    });

    return {
        ...ficha,
        treino,
        periodizacao: {
            ...ficha.periodizacao,
            semanas: ficha.periodizacao.semanas.map(semana => ({
                ...semana,
                dias: semana.dias.map(dia => ({
                    ...dia,
                    treinoIds: dia.treinoIds.map(id => idsTreino.get(id) ?? ""),
                })),
            })),
        },
        seriesRIR: ficha.seriesRIR.map(execucao => ({
            ...execucao,
            treinoId: idsTreino.get(execucao.treinoId) ?? "",
            exercicios: execucao.exercicios.map(exercicio => ({
                ...exercicio,
                exercicioId: idsExercicio.get(exercicio.exercicioId) ?? "",
            })),
        })),
    };
}

const secoes = [
    {
        id: "inicio",
        nome: "Visão geral",
        grupo: "Gestão",
        icone: <BsHouseDoor />,
    },
    { id: "alunos", nome: "Alunos", grupo: "Gestão", icone: <BsPeople /> },
    { id: "equipe", nome: "Equipe", grupo: "Gestão", icone: <FaPeopleGroup /> },
    { id: "solicitacoes", nome: "Novos cadastros", grupo: "Gestão", icone: <BsClipboard2Pulse /> },
    { id: "convites", nome: "Convites", grupo: "Gestão", icone: <BsArrowUpRight /> },
    { id: "indicadores", nome: "Equipe e indicadores", grupo: "Gestão", icone: <TbUserStar /> },
    {
        id: "avaliacoes",
        nome: "Avaliações",
        grupo: "Acompanhamento",
        icone: <BsClipboard2Pulse />,
    },
    {
        id: "periodizacao",
        nome: "Periodização",
        grupo: "Acompanhamento",
        icone: <BsCalendar3 />,
    },
    {
        id: "exercicios",
        nome: "Biblioteca de exercícios",
        grupo: "Acompanhamento",
        icone: <BsCollectionPlay />,
    },
    {
        id: "relatorios",
        nome: "Relatórios",
        grupo: "Inteligência",
        icone: <BsBarChart />,
    },
    {
        id: "chat",
        nome: "Mensagens",
        grupo: "Comunicação",
        icone: <IoChatbubblesSharp />,
    },
    { id: "emails", nome: "E-mails", grupo: "Comunicação", icone: <BsEnvelope /> },
    { id: "arquivos", nome: "Biblioteca de arquivos", grupo: "Comunicação", icone: <BsFolder2Open /> },
    {
        id: "feedback",
        nome: "Feedback",
        grupo: "Comunicação",
        icone: <VscFeedback />,
    },
    {
        id: "ajuda",
        nome: "Ajuda e tutoriais",
        grupo: "Sistema",
        icone: <FaRegCircleQuestion />,
    },
    {
        id: "log",
        nome: "Histórico de atividades",
        grupo: "Sistema",
        icone: <BsFileEarmarkText />,
    },
    {
        id: "configuracoes",
        nome: "Preferências",
        grupo: "Sistema",
        icone: <BsGear />,
    },
    {
        id: "controleAluno",
        nome: "Controle do aluno",
        grupo: "Acompanhamento",
        icone: <BsActivity />,
    },
    {
        id: "controleAvancado",
        nome: "Análise avançada",
        grupo: "Acompanhamento",
        icone: <BsCpu />,
    },
    {
        id: "tarefas",
        nome: "Tarefas",
        grupo: "Acompanhamento",
        icone: <BsClipboard2Pulse />,
    },
    { id: "manutencao", nome: "Ferramentas do sistema", grupo: "Sistema", icone: <FaTools /> },
];

const gruposNavegacao = ["Gestão", "Acompanhamento", "Comunicação", "Inteligência", "Sistema"];
const descricoesGrupos: Record<string, string> = {
    Gestão: "Pessoas e entrada",
    Acompanhamento: "Rotina dos alunos",
    Comunicação: "Contato e materiais",
    Inteligência: "Leitura de resultados",
    Sistema: "Preferências e suporte",
};

const descricoesSecoes: Record<string, string> = {
    inicio: "Um panorama do que merece atenção e dos caminhos disponíveis no painel.",
    alunos: "Encontre pessoas, abra fichas e acompanhe cada jornada de treinamento.",
    equipe: "Cadastre profissionais e organize os acessos da equipe.",
    solicitacoes: "Revise inscrições recebidas e decida os próximos passos de cada cadastro.",
    convites: "Crie links de entrada e acompanhe quem chegou por cada convite.",
    indicadores: "Entenda a atividade da equipe e a origem dos novos alunos.",
    avaliacoes: "Avaliações físicas, anamneses, medidas e histórico dos alunos.",
    periodizacao: "Planejamento de semanas, dias, sessões e distribuição de volume.",
    exercicios: "Gerencie movimentos, sinônimos e vídeos que alimentam as prescrições e o mobile.",
    relatorios: "Transforme os registros da equipe em uma leitura clara da evolução.",
    chat: "Converse com alunos e mantenha o acompanhamento próximo.",
    emails: "Organize comunicações por e-mail com os alunos.",
    arquivos: "Guarde e compartilhe materiais importantes da equipe.",
    feedback: "Leia relatos dos alunos e acompanhe as respostas da equipe.",
    ajuda: "Aprenda os fluxos do sistema e descubra como usar cada recurso.",
    log: "Consulte o que mudou, quando aconteceu e quem realizou cada ação.",
    configuracoes: "Ajuste aparência, leitura e comportamento do seu espaço.",
    controleAluno: "Reúna ficha, execução mobile, tarefas e comunicação em uma visão do aluno.",
    controleAvancado: "Investigue tendências e aprofunde o acompanhamento da equipe.",
    tarefas: "Organize pendências, responsáveis e próximos passos do acompanhamento.",
    manutencao: "Acesse ferramentas administrativas e de diagnóstico do sistema.",
};

const cores = {
    primaryButton: "rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]",
    secondaryButton:
        "rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--row-hover)]",
    input: "rounded-lg border border-[var(--border-strong)] bg-[var(--input-bg)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15",
    subtleText: "text-[var(--text-muted)]",
    bodyText: "text-[var(--text-secondary)]",
    heading: "text-[var(--text-primary)]",
    divider: "border-[var(--border)]",
};

function formatarData(data: string) {
    const valor = new Date(data);
    if (Number.isNaN(valor.getTime())) return "Data não disponível";

    return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(valor);
}

export default function Painel() {
    const {
        carregarAvaliacao,
        alunoSelecionadoId,
        setAlunoSelecionadoId,
        alteracoesPendentes,
        avaliacao: fichaAtual,
        autoSaveEnabled,
        setAutoSaveEnabled,
        autoSaveDelayMs,
        setAutoSaveDelayMs,
        autoSaveStatus,
        autoSaveLastSavedAt,
        autoSaveError,
    } = useAvaliacao();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();
    useEffect(() => {
        if (user?.tipo !== "ADMIN" && user?.tipo !== "PERSONAL") return;
        const realtime = createChatConnection();
        realtime.on("NovaMensagem", (event: { conversaId?: string; mensagemId?: string }) => {
            if (event.mensagemId) void realtime.invoke("ConfirmarEntrega", event.mensagemId).catch(() => undefined);
            void queryClient.invalidateQueries({ queryKey: ["comunicacao", "alunos", "resumo"] });
            void queryClient.invalidateQueries({ queryKey: ["comunicacao", "alunos"] });
            void queryClient.invalidateQueries({ queryKey: ["comunicacao", "conversas"] });
            void queryClient.invalidateQueries({ queryKey: ["comunicacao", "notificacoes"] });
            if (typeof document !== "undefined" && document.hidden && "Notification" in window && Notification.permission === "granted") {
                new Notification("Nova mensagem", { body: "Você recebeu uma nova mensagem no chat.", tag: event.conversaId });
            }
        });
        void startChatConnection(realtime).catch(() => undefined);
        return () => { void realtime.stop(); };
    }, [user?.usuarioId, user?.tipo, queryClient]);
    const notificacoesPainelQuery = useQuery({
        queryKey: ["comunicacao", "notificacoes"],
        queryFn: comunicacaoService.listarNotificacoes,
        refetchInterval: 15000,
    });
    const alertasNaoLidos = (notificacoesPainelQuery.data ?? []).filter(
        item => !item.lidaEm,
    ).length;

    const [tema, setTema] = useState<"light" | "dark">(() => {
        if (typeof window === "undefined") return "light";
        return localStorage.getItem("painel_tema") === "dark" ? "dark" : "light";
    });
    const [temaVisualId, setTemaVisualId] = useState<TemaId>(() => {
        if (typeof window === "undefined") return "indigo";
        const salvo = localStorage.getItem("painel_tema_visual");
        return salvo && salvo in TEMAS ? (salvo as TemaId) : "indigo";
    });
    const [tamanhoTexto, setTamanhoTexto] = useState<EscalaTextoId>(() => {
        if (typeof window === "undefined") return "padrao";
        const salvo = localStorage.getItem("painel_tamanho_texto");
        return salvo && salvo in ESCALAS_TEXTO ? (salvo as EscalaTextoId) : "padrao";
    });
    const [fonteUi, setFonteUi] = useState<FonteUiId>(() => {
        if (typeof window === "undefined") return "sistema";
        const salvo = localStorage.getItem("painel_fonte_ui");
        return salvo && salvo in FONTES_UI ? (salvo as FonteUiId) : "sistema";
    });
    const estiloPainel = useMemo(
        () =>
            ({
                ...gerarVariaveisTema(temaVisualId, tema),
                fontFamily: FONTES_UI[fonteUi].css,
                "--ui-font-scale": String(ESCALAS_TEXTO[tamanhoTexto].escala),
            }) as React.CSSProperties,
        [temaVisualId, tema, fonteUi, tamanhoTexto],
    );

    const [secaoAtual, setSecaoAtual] = useState("inicio");
    
    const alunosQuery = useQuery({
        queryKey: ["alunos"],
        queryFn: cadastroService.listarAlunos,
    });

    const solicitacoesAvaliacaoPendentesQuery = useQuery({
        queryKey: ["avaliacoes", "solicitacoes", "pendentes"],
        queryFn: assessmentScheduleService.listarPendentes,
        enabled: user?.tipo === "ADMIN" || user?.tipo === "PERSONAL",
        refetchInterval: 15000,
    });
    const solicitacoesAvaliacaoUrgentes = (solicitacoesAvaliacaoPendentesQuery.data ?? [])
        .filter(solicitacao => solicitacao.urgente);
    
    const tarefasControleQuery = useQuery({
        queryKey: ["extras", "tarefas", "controle-aluno"],
        queryFn: () => adminExtrasService.listarTarefas(),
        enabled: (user?.tipo === "ADMIN" || user?.tipo === "PERSONAL") && secaoAtual === "controleAluno",
        refetchInterval: 30000,
    });

    const chatsAlunosResumoQuery = useQuery({
        queryKey: ["comunicacao", "alunos", "resumo"],
        queryFn: comunicacaoService.listarResumoChatsAlunos,
        enabled: (user?.tipo === "ADMIN" || user?.tipo === "PERSONAL") && secaoAtual === "controleAluno",
    });
    
    const solicitacoesResumoQuery = useQuery({
        queryKey: ["solicitacoes-cadastro", "resumo"],
        queryFn: cadastroAlunoService.obterResumo,
        enabled: user?.tipo === "ADMIN" || user?.tipo === "PERSONAL",
        refetchInterval: 30000,
    });

    const personaisQuery = useQuery({
        queryKey: ["personais"],
        queryFn: cadastroService.listarPersonais,
        enabled: user?.tipo === "ADMIN",
    });

    const [novoPersonalNome, setNovoPersonalNome] = useState("");
    const [novoPersonalEmail, setNovoPersonalEmail] = useState("");
    const [novoPersonalTelefone, setNovoPersonalTelefone] = useState("");
    const [novoPersonalSenha, setNovoPersonalSenha] = useState("");
    const [erroEquipe, setErroEquipe] = useState("");
    const [sucessoEquipe, setSucessoEquipe] = useState("");
    const [salvandoEquipe, setSalvandoEquipe] = useState(false);
    const [personalParaExcluir, setPersonalParaExcluir] = useState<PersonalResumoApi | null>(null);
    const [resumoExclusaoPersonal, setResumoExclusaoPersonal] =
        useState<PersonalExclusaoResumoApi | null>(null);
    const [carregandoResumoExclusao, setCarregandoResumoExclusao] = useState(false);
    const [motivoExclusao, setMotivoExclusao] = useState("ENCERRAMENTO_ADMINISTRATIVO");
    const [detalheExclusao, setDetalheExclusao] = useState("");
    const [executandoExclusao, setExecutandoExclusao] = useState(false);
    const [alunoParaMonitorarId, setAlunoParaMonitorarId] = useState("");
    const alunos: AlunoPainel[] = (alunosQuery.data ?? []).map((aluno: AlunoResumoApi) => ({
        id: aluno.id,
        nome: aluno.nomeCompleto,
        email: aluno.email,
        telefone: aluno.telefone ?? "",
        criadoEm: aluno.criadoEm ?? "",
        statusCadastro: aluno.statusCadastro ?? "APROVADO",
        possuiFichaTecnica: aluno.possuiFichaTecnica === true,
        convidadoPorPersonalNome: aluno.convidadoPorPersonalNome ?? null,
        avaliacaoPendente: (solicitacoesAvaliacaoPendentesQuery.data ?? []).some(
            solicitacao => solicitacao.alunoId === aluno.id,
        ),
        avaliacaoUrgente: solicitacoesAvaliacaoUrgentes.some(
            solicitacao => solicitacao.alunoId === aluno.id,
        ),
    }));

    const tarefasAbertasPorAluno = useMemo(() => {
        const resumo = new Map<string, number>();
        for (const tarefa of tarefasControleQuery.data ?? []) {
            if (!tarefa.alunoId || tarefa.criadoPorTipo === "PERSONAL" || !["PENDENTE", "EM_ANDAMENTO"].includes(tarefa.status)) continue;
            resumo.set(tarefa.alunoId, (resumo.get(tarefa.alunoId) ?? 0) + 1);
        }
        return resumo;
    }, [tarefasControleQuery.data]);

    const mensagensNaoLidasPorAluno = useMemo(
        () => new Map((chatsAlunosResumoQuery.data ?? []).map(item => [item.alunoId, item.naoLidas])),
        [chatsAlunosResumoQuery.data],
    );

    const alunosParaMonitoramento = useMemo(
        () => alunos.map(aluno => ({
            id: aluno.id,
            nomeCompleto: aluno.nome,
            email: aluno.email,
            possuiFichaTecnica: aluno.possuiFichaTecnica,
            avaliacaoPendente: aluno.avaliacaoPendente,
            avaliacaoUrgente: aluno.avaliacaoUrgente,
            tarefasAbertas: tarefasAbertasPorAluno.get(aluno.id) ?? 0,
            mensagensNaoLidas: mensagensNaoLidasPorAluno.get(aluno.id) ?? 0,
        })),
        [alunos, tarefasAbertasPorAluno, mensagensNaoLidasPorAluno],
    );

    const [alunoParaExcluir, setAlunoParaExcluir] = useState<AlunoPainel | null>(null);
    const [busca, setBusca] = useState("");
    const [filtroFicha, setFiltroFicha] = useState<"todos" | "sem-ficha" | "com-ficha" | "avaliacao-pendente" | "avaliacao-urgente">("todos");
    const [menuPerfilAberto, setMenuPerfilAberto] = useState(false);
    const [menuAlunoAberto, setMenuAlunoAberto] = useState<string | null>(null);
    const [menuMobileAberto, setMenuMobileAberto] = useState(false);
    const [buscaPainelAberta, setBuscaPainelAberta] = useState(false);
    const [buscaPainel, setBuscaPainel] = useState("");
    const [modalNovoAluno, setModalNovoAluno] = useState(false);
    const [novoNome, setNovoNome] = useState("");
    const [novoEmail, setNovoEmail] = useState("");
    const [novoTelefone, setNovoTelefone] = useState("");
    const [novaSenha, setNovaSenha] = useState("");
    const [confirmarNovaSenha, setConfirmarNovaSenha] = useState("");
    const [novaDataNascimento, setNovaDataNascimento] = useState("");
    const [erroNovoAluno, setErroNovoAluno] = useState("");
    const [infoNovoAluno, setInfoNovoAluno] = useState("");
    const [dadosImportacao, setDadosImportacao] = useState<CadastroCompletoApi | null>(null);
    const [carregandoAlunoId, setCarregandoAlunoId] = useState<string | null>(null);
    const [avisoRecuperacao, setAvisoRecuperacao] = useState<{
        mensagem: string;
        ultimoSalvamento: Date | null;
    } | null>(null);

    useEffect(() => {
        const estado = location.state as {
            apiRecoveryError?: string;
            lastSavedAt?: string | null;
        } | null;
        if (!estado?.apiRecoveryError) return;

        const dataSalva = estado.lastSavedAt ? new Date(estado.lastSavedAt) : null;
        setAvisoRecuperacao({
            mensagem: estado.apiRecoveryError,
            ultimoSalvamento: dataSalva && !Number.isNaN(dataSalva.getTime()) ? dataSalva : null,
        });
        navigate(location.pathname, { replace: true, state: null });
    }, [location.key]);

    const inputImportarRef = useRef<HTMLInputElement>(null);
    const menuPerfilRef = useRef<HTMLDivElement>(null);
    const buscaPainelInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        localStorage.setItem("painel_tema", tema);
    }, [tema]);

    useEffect(() => {
        localStorage.setItem("painel_tema_visual", temaVisualId);
    }, [temaVisualId]);

    useEffect(() => {
        localStorage.setItem("painel_tamanho_texto", tamanhoTexto);
    }, [tamanhoTexto]);

    useEffect(() => {
        localStorage.setItem("painel_fonte_ui", fonteUi);
    }, [fonteUi]);

    useEffect(() => {
        function fecharMenus(event: MouseEvent) {
            if (menuPerfilRef.current && !menuPerfilRef.current.contains(event.target as Node)) {
                setMenuPerfilAberto(false);
            }

            const alvo = event.target as HTMLElement;
            if (!alvo.closest("[data-aluno-menu]")) setMenuAlunoAberto(null);
        }

        function fecharComEscape(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setMenuPerfilAberto(false);
                setMenuAlunoAberto(null);
                setMenuMobileAberto(false);
                setBuscaPainelAberta(false);
                setAlunoParaExcluir(null);
                setPersonalParaExcluir(null);
            }
        }

        function atalhosGlobais(event: KeyboardEvent) {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
                event.preventDefault();
                setBuscaPainelAberta(true);
            }
        }

        document.addEventListener("mousedown", fecharMenus);
        document.addEventListener("keydown", fecharComEscape);
        document.addEventListener("keydown", atalhosGlobais);

        return () => {
            document.removeEventListener("mousedown", fecharMenus);
            document.removeEventListener("keydown", fecharComEscape);
            document.removeEventListener("keydown", atalhosGlobais);
        };
    }, []);

    useEffect(() => {
        if (!buscaPainelAberta) return;
        buscaPainelInputRef.current?.focus();
    }, [buscaPainelAberta]);

    const alunosFiltrados = useMemo(() => {
        const termo = busca.trim().toLocaleLowerCase("pt-BR");
        return alunos.filter(aluno => {
            const correspondeFicha =
                filtroFicha === "todos" ||
                (filtroFicha === "sem-ficha" && !aluno.possuiFichaTecnica) ||
                (filtroFicha === "com-ficha" && aluno.possuiFichaTecnica) ||
                (filtroFicha === "avaliacao-pendente" && aluno.avaliacaoPendente) ||
                (filtroFicha === "avaliacao-urgente" && aluno.avaliacaoUrgente);
            if (!correspondeFicha) return false;
            if (!termo) return true;
            return (
                aluno.nome.toLocaleLowerCase("pt-BR").includes(termo) ||
                aluno.email.toLocaleLowerCase("pt-BR").includes(termo) ||
                aluno.id.toLowerCase().includes(termo)
            );
        });
    }, [alunos, busca, filtroFicha]);

    function criarAluno() {
        navegar("convites");
    }

    async function confirmarCriacaoAluno(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setErroNovoAluno("");
        if (novaSenha.length < 8) {
            setErroNovoAluno("A senha inicial deve possuir pelo menos 8 caracteres.");
            return;
        }
        if (novaSenha !== confirmarNovaSenha) {
            setErroNovoAluno("As senhas não coincidem.");
            return;
        }
        try {
            const alunoCriado = await cadastroService.criarAluno({
                nomeCompleto: novoNome.trim(),
                email: novoEmail.trim(),
                telefone: novoTelefone.trim() || undefined,
                senha: novaSenha,
                dataNascimento: novaDataNascimento || undefined,
            });
            if (dadosImportacao) {
                try {
                    const grupos = await cadastroService.listarGruposMusculares();
                    const fichaImportada = mapearCadastroParaAvaliacao(dadosImportacao, grupos);
                    fichaImportada.aluno.nomeCompleto = novoNome.trim();
                    fichaImportada.aluno.email = novoEmail.trim();
                    fichaImportada.aluno.telefone = novoTelefone.trim();
                    fichaImportada.aluno.dataNascimento = novaDataNascimento;
                    const ficha = clonarIdsFicha(fichaImportada);
                    await salvarFicha(alunoCriado.id, ficha);
                } catch (error) {
                    alert(
                        `A conta foi criada, mas a ficha importada não pôde ser restaurada: ${error instanceof ApiError ? error.message : "erro inesperado"}`,
                    );
                }
            }
            await queryClient.invalidateQueries({ queryKey: ["alunos"] });
            await queryClient.invalidateQueries({ queryKey: ["relatorios"] });
            setModalNovoAluno(false);
            setDadosImportacao(null);
            setSecaoAtual("alunos");
            setBusca("");
        } catch (error) {
            setErroNovoAluno(
                error instanceof ApiError ? error.message : "Não foi possível criar o aluno.",
            );
        }
    }

    function importarAluno(evento: React.ChangeEvent<HTMLInputElement>) {
        const arquivo = evento.target.files?.[0];
        if (!arquivo) return;

        const leitor = new FileReader();

        leitor.onload = e => {
            try {
                const texto = e.target?.result;
                if (typeof texto !== "string") throw new Error("Arquivo inválido.");

                const dados = JSON.parse(texto) as CadastroCompletoApi;
                const nome = dados?.aluno?.nomeCompleto || "";
                if (!nome || !dados?.aluno?.email || !Array.isArray(dados.treinos)) {
                    throw new Error(
                        "O JSON precisa conter nome e e-mail do aluno para criar a conta no servidor.",
                    );
                }
                setNovoNome(nome);
                setNovoEmail(dados.aluno.email);
                setNovoTelefone(dados.aluno.telefone ?? "");
                setNovaDataNascimento(dados.aluno.dataNascimento?.slice(0, 10) ?? "");
                setDadosImportacao(dados);
                setInfoNovoAluno(
                    "A ficha será copiada para a nova conta após o cadastro. Os IDs internos serão recriados para não manter vínculos com o aluno original.",
                );
                setErroNovoAluno("");
                setModalNovoAluno(true);
            } catch (erro) {
                console.error("Erro ao importar aluno:", erro);
                alert("Não foi possível importar o arquivo JSON.");
            }
        };

        leitor.readAsText(arquivo);
        evento.target.value = "";
    }

    async function exportarAluno(aluno: AlunoPainel) {
        try {
            const cadastro = await cadastroService.obterCadastro(aluno.id);
            const blob = new Blob([JSON.stringify(cadastro, null, 2)], {
                type: "application/json",
            });

            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");

            link.href = url;
            link.download = `${aluno.nome || "aluno"}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            setMenuAlunoAberto(null);
        } catch (error) {
            alert(error instanceof ApiError ? error.message : "Não foi possível exportar a ficha.");
        }
    }

    async function abrirAluno(aluno: AlunoPainel, destino: "ficha" | "controle" = "ficha") {
        setAvisoRecuperacao(null);
        if (alunoSelecionadoId === aluno.id) {
            setAlunoParaMonitorarId(aluno.id);
            if (destino === "ficha") navigate("/avaliacoes");
            else navegar("controleAluno");
            return;
        }
        if (alunoSelecionadoId && alteracoesPendentes) {
            if (autoSaveEnabled) {
                alert(
                    autoSaveStatus === "error"
                        ? "O salvamento automático falhou. Abra Salvar para tentar novamente manualmente antes de trocar de aluno."
                        : "O salvamento automático ainda não terminou. Aguarde a confirmação de que a ficha está salva antes de trocar de aluno.",
                );
                return;
            }
            const continuar = window.confirm(
                `Há alterações não salvas na ficha de ${fichaAtual.aluno.nomeCompleto || "outro aluno"}. Se trocar agora, elas serão descartadas. Deseja continuar?`,
            );
            if (!continuar) return;
        }

        setAlunoParaMonitorarId(aluno.id);
        setCarregandoAlunoId(aluno.id);
        try {
            const [cadastro, grupos] = await Promise.all([
                cadastroService.obterCadastro(aluno.id),
                cadastroService.listarGruposMusculares(),
            ]);
            carregarAvaliacao(mapearCadastroParaAvaliacao(cadastro, grupos), aluno.id);
            setAvisoRecuperacao(null);
            if (destino === "ficha") navigate("/avaliacoes");
            else navegar("controleAluno");
        } catch (error) {
            setAvisoRecuperacao({
                mensagem: error instanceof ApiError
                    ? error.message
                    : "Não foi possível carregar a ficha do aluno. Verifique a conexão com a API.",
                ultimoSalvamento: lerUltimoSalvamento(user?.usuarioId, aluno.id),
            });
        } finally {
            setCarregandoAlunoId(null);
        }
    }

    async function excluirAluno() {
        if (!alunoParaExcluir) return;
        setExecutandoExclusao(true);
        try {
            await cadastroService.excluirAluno(alunoParaExcluir.id, {
                motivo: motivoExclusao,
                detalhe: detalheExclusao.trim() || undefined,
            });
            await queryClient.invalidateQueries({ queryKey: ["alunos"] });
            await queryClient.invalidateQueries({ queryKey: ["relatorios"] });
            if (alunoSelecionadoId === alunoParaExcluir.id) {
                setAlunoSelecionadoId(null);
                setAlunoParaMonitorarId("");
            }
            setAlunoParaExcluir(null);
            setDetalheExclusao("");
            setSucessoEquipe("Conta do aluno desativada. O histórico foi preservado.");
        } catch (error) {
            alert(error instanceof ApiError ? error.message : "Não foi possível excluir o aluno.");
        } finally {
            setExecutandoExclusao(false);
        }
    }

    async function abrirConfirmacaoExclusaoPersonal(personal: PersonalResumoApi) {
        setPersonalParaExcluir(personal);
        setResumoExclusaoPersonal(null);
        setCarregandoResumoExclusao(true);
        setMotivoExclusao("ENCERRAMENTO_ADMINISTRATIVO");
        setDetalheExclusao("");
        try {
            const resumo = await cadastroService.obterResumoExclusaoPersonal(personal.id);
            setResumoExclusaoPersonal(resumo);
        } catch (error) {
            setPersonalParaExcluir(null);
            alert(
                error instanceof ApiError
                    ? error.message
                    : "Não foi possível consultar os alunos convidados por este Personal.",
            );
        } finally {
            setCarregandoResumoExclusao(false);
        }
    }

    async function excluirPersonal() {
        if (!personalParaExcluir || !resumoExclusaoPersonal || carregandoResumoExclusao) return;
        setExecutandoExclusao(true);
        try {
            await cadastroService.excluirPersonal(personalParaExcluir.id, {
                motivo: motivoExclusao,
                detalhe: detalheExclusao.trim() || undefined,
            });
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["personais"] }),
                queryClient.invalidateQueries({ queryKey: ["alunos"] }),
                queryClient.invalidateQueries({ queryKey: ["relatorios"] }),
                queryClient.invalidateQueries({ queryKey: ["comunicacao", "notificacoes"] }),
            ]);
            setPersonalParaExcluir(null);
            setResumoExclusaoPersonal(null);
            setDetalheExclusao("");
            setSucessoEquipe(
                "Personal desativado. Os históricos e as fichas dos alunos foram preservados.",
            );
        } catch (error) {
            alert(
                error instanceof ApiError
                    ? error.message
                    : "Não foi possível desativar o Personal.",
            );
        } finally {
            setExecutandoExclusao(false);
        }
    }

    async function criarPersonal(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setErroEquipe("");
        setSucessoEquipe("");
        if (novoPersonalSenha.length < 8) {
            setErroEquipe("A senha inicial do Personal deve possuir pelo menos 8 caracteres.");
            return;
        }

        setSalvandoEquipe(true);
        try {
            await cadastroService.criarPersonal({
                nomeCompleto: novoPersonalNome.trim(),
                email: novoPersonalEmail.trim(),
                telefone: novoPersonalTelefone.trim() || undefined,
                senha: novoPersonalSenha,
            });
            await queryClient.invalidateQueries({ queryKey: ["personais"] });
            setNovoPersonalNome("");
            setNovoPersonalEmail("");
            setNovoPersonalTelefone("");
            setNovoPersonalSenha("");
            setSucessoEquipe("Personal cadastrado com sucesso.");
        } catch (error) {
            setErroEquipe(
                error instanceof ApiError
                    ? error.message
                    : "Não foi possível cadastrar o Personal.",
            );
        } finally {
            setSalvandoEquipe(false);
        }
    }

    function navegar(secao: string) {
        setSecaoAtual(secao);
        setMenuMobileAberto(false);
        setMenuPerfilAberto(false);
    }

    const secaoSelecionada = secoes.find(secao => secao.id === secaoAtual) ?? secoes[1];
    const acessoControleAvancado =
        user?.tipo === "ADMIN" ||
        Boolean(user?.controleAvancadoHabilitado);
    // Mantém os módulos em desenvolvimento fora da navegação principal.
    const secoesVisiveis = secoes.filter(
        secao =>
            secao.id === "inicio" ||
            secao.id === "alunos" ||
            (secao.id === "exercicios" && (user?.tipo === "ADMIN" || user?.tipo === "PERSONAL")) ||
            (secao.id === "equipe" && user?.tipo === "ADMIN") ||
            secao.id === "solicitacoes" ||
            (secao.id === "convites" && (user?.tipo === "ADMIN" || user?.tipo === "PERSONAL")) ||
            secao.id === "relatorios" ||
            secao.id === "chat" ||
            (secao.id === "emails" && (user?.tipo === "ADMIN" || user?.tipo === "PERSONAL")) ||
            (secao.id === "arquivos" && (user?.tipo === "ADMIN" || user?.tipo === "PERSONAL")) ||
            (secao.id === "feedback" && (user?.tipo === "ADMIN" || user?.tipo === "PERSONAL")) ||
            (secao.id === "indicadores" && user?.tipo === "ADMIN") ||
            (secao.id === "tarefas" && (user?.tipo === "ADMIN" || user?.tipo === "PERSONAL")) ||
            (secao.id === "manutencao" && (user?.tipo === "ADMIN" || user?.tipo === "PERSONAL")) ||
            (secao.id === "log" && user?.tipo === "ADMIN") ||
            secao.id === "configuracoes" ||
            (secao.id === "controleAluno" &&
                (user?.tipo === "ADMIN" || user?.tipo === "PERSONAL")) ||
            (secao.id === "controleAvancado" &&
                (user?.tipo === "ADMIN" || user?.tipo === "PERSONAL")),
    );

    function renderEquipe() {
        const personais = personaisQuery.data ?? [];

        return (
            <section className="w-full max-w-[1440px] space-y-6">
                <div className="flex flex-col justify-between gap-4 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-end">
                    <div>
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-text)]">
                            Workspace / Administração
                        </p>
                        <h1
                            className={
                                "text-[28px] font-semibold tracking-[-0.045em] " + cores.heading
                            }
                        >
                            Gestão da equipe
                        </h1>
                        <p className={"mt-2 text-[13px] " + cores.bodyText}>
                            Cadastre os profissionais da equipe. Todos os personais ativos podem
                            visualizar e atualizar os alunos da equipe; cadastros pendentes aparecem
                            na fila de análise e o convite registra a origem
                            do cadastro, sem criar uma carteira exclusiva.
                        </p>
                    </div>
                    <span className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[11px] text-[var(--text-secondary)]">
                        {personais.length}{" "}
                        {personais.length === 1 ? "profissional" : "profissionais"}
                    </span>
                </div>

                {erroEquipe && (
                    <p
                        role="alert"
                        className="rounded-lg border border-[var(--danger)]/20 bg-[var(--danger-soft)] px-4 py-3 text-[11px] text-[var(--danger)]"
                    >
                        {erroEquipe}
                    </p>
                )}
                {sucessoEquipe && (
                    <p
                        role="status"
                        className="rounded-lg border border-[var(--success)]/20 bg-[var(--success-soft)] px-4 py-3 text-[11px] text-[var(--success)]"
                    >
                        {sucessoEquipe}
                    </p>
                )}
                {personaisQuery.isError && (
                    <p role="alert" className="text-[11px] text-[var(--danger)]">
                        {personaisQuery.error instanceof ApiError
                            ? personaisQuery.error.message
                            : "Não foi possível carregar a equipe."}
                    </p>
                )}

                <div className="grid gap-5 xl:grid-cols-2">
                    <form
                        onSubmit={criarPersonal}
                        autoComplete="off"
                        className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
                    >
                        <div>
                            <h2 className={"text-[15px] font-semibold " + cores.heading}>
                                Novo Personal
                            </h2>
                            <p className={"mt-1 text-[11px] " + cores.bodyText}>
                                O profissional entra com este e-mail e senha. Ele terá acesso
                                compartilhado aos alunos, sem acesso às funções administrativas.
                            </p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <label className="grid gap-1.5 sm:col-span-2">
                                <span className={"text-[10px] font-semibold " + cores.bodyText}>
                                    Nome completo
                                </span>
                                <input
                                    required
                                    minLength={2}
                                    maxLength={160}
                                    autoComplete="off"
                                    value={novoPersonalNome}
                                    onChange={event => setNovoPersonalNome(event.target.value)}
                                    className={"h-10 px-3 text-[12px] outline-none " + cores.input}
                                />
                            </label>
                            <label className="grid gap-1.5 sm:col-span-2">
                                <span className={"text-[10px] font-semibold " + cores.bodyText}>
                                    E-mail
                                </span>
                                <input
                                    required
                                    type="email"
                                    maxLength={254}
                                    autoComplete="off"
                                    value={novoPersonalEmail}
                                    onChange={event => setNovoPersonalEmail(event.target.value)}
                                    className={"h-10 px-3 text-[12px] outline-none " + cores.input}
                                />
                            </label>
                            <label className="grid gap-1.5">
                                <span className={"text-[10px] font-semibold " + cores.bodyText}>
                                    Telefone
                                </span>
                                <input
                                    autoComplete="off"
                                    value={novoPersonalTelefone}
                                    onChange={event => setNovoPersonalTelefone(event.target.value)}
                                    className={"h-10 px-3 text-[12px] outline-none " + cores.input}
                                />
                            </label>
                            <label className="grid gap-1.5">
                                <span className={"text-[10px] font-semibold " + cores.bodyText}>
                                    Senha inicial
                                </span>
                                <input
                                    required
                                    type="password"
                                    minLength={8}
                                    maxLength={128}
                                    autoComplete="new-password"
                                    value={novoPersonalSenha}
                                    onChange={event => setNovoPersonalSenha(event.target.value)}
                                    className={"h-10 px-3 text-[12px] outline-none " + cores.input}
                                />
                            </label>
                        </div>
                        <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
                            <span className={"text-[10px] " + cores.subtleText}>
                                Mínimo de 8 caracteres
                            </span>
                            <button
                                disabled={salvandoEquipe}
                                aria-busy={salvandoEquipe}
                                type="submit"
                                className={
                                    "h-9 px-4 text-[11px] font-semibold disabled:opacity-50 " +
                                    cores.primaryButton
                                }
                            >
                                {salvandoEquipe ? "Salvando..." : "Cadastrar Personal"}
                            </button>
                        </div>
                    </form>

                    <aside className="flex flex-col justify-between gap-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[var(--accent-text)]">Modelo de equipe</p>
                            <h2 className={"mt-2 text-[15px] font-semibold " + cores.heading}>Acompanhamento compartilhado</h2>
                            <p className={"mt-2 text-[11px] leading-5 " + cores.bodyText}>
                                Nenhum aluno fica restrito a um profissional. O personal que enviou o
                                convite permanece identificado como origem, enquanto toda a equipe
                                pode consultar, atualizar e acompanhar o cadastro.
                            </p>
                        </div>
                        <button type="button" onClick={() => navegar("convites")} className={"h-10 self-start px-4 text-[11px] font-semibold " + cores.primaryButton}>
                            Gerenciar links de convite
                        </button>
                    </aside>
                </div>

                <div className="grid gap-5">
                    <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                        <div className="border-b border-[var(--border)] px-4 py-3">
                            <h2 className={"text-[12px] font-semibold " + cores.heading}>
                                Profissionais cadastrados
                            </h2>
                        </div>
                        {personaisQuery.isLoading ? (
                            <LoadingState
                                label="Carregando profissionais..."
                                className="justify-start p-4"
                            />
                        ) : personais.length === 0 ? (
                            <p className={"p-4 text-[11px] " + cores.subtleText}>
                                Nenhum Personal cadastrado.
                            </p>
                        ) : (
                            <div className="ui-stagger divide-y divide-[var(--border)]">
                                {personais.map(personal => (
                                        <div
                                            key={personal.id}
                                            className="flex items-center gap-2 px-3 py-2"
                                        >
                                            <div className="min-w-0 flex-1 px-1 py-2">
                                                <span
                                                    className={
                                                        "block truncate text-[12px] font-semibold " + cores.heading
                                                    }
                                                >
                                                    {personal.nomeCompleto}
                                                </span>
                                                <span
                                                    className={
                                                        "mt-1 block truncate text-[10px] " +
                                                        cores.subtleText
                                                    }
                                                >
                                                    {personal.email}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    void abrirConfirmacaoExclusaoPersonal(personal)
                                                }
                                                disabled={
                                                    executandoExclusao || carregandoResumoExclusao
                                                }
                                                aria-label={`Desativar ${personal.nomeCompleto}`}
                                                title="Desativar Personal"
                                                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[var(--danger)] transition hover:bg-[var(--danger-soft)] disabled:opacity-40"
                                            >
                                                <BsTrash3 />
                                            </button>
                                        </div>
                                ))}
                            </div>
                        )}
                    </section>

                </div>
            </section>
        );
    }

    function renderAlunos() {
        return (
            <section className="w-full max-w-[1440px]">
                {/* Cabeçalho */}
                <div className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                    <div>
                        <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-text)]">
                            <span>Workspace</span>
                            <span className="text-[var(--text-muted)]">/</span>
                            <span>Alunos</span>
                        </div>

                        <h1
                            className={`text-[28px] font-semibold tracking-[-0.045em] ${cores.heading}`}
                        >
                            Alunos da equipe
                        </h1>

                        <p className={`mt-2 text-[13px] ${cores.bodyText}`}>
                            Gerencie os cadastros, avaliações e fichas de acompanhamento.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {user?.tipo === "ADMIN" && <>
                            <input
                                ref={inputImportarRef}
                                type="file"
                                accept=".json,application/json"
                                className="hidden"
                                onChange={importarAluno}
                            />
                            <button
                                onClick={() => inputImportarRef.current?.click()}
                                className={`inline-flex h-10 items-center justify-center gap-2 px-4 text-[11px] font-semibold ${cores.secondaryButton}`}
                            >
                                <BsUpload />
                                Importar legado
                            </button>
                        </>}
                        <button
                            onClick={criarAluno}
                            className={`inline-flex h-10 items-center justify-center gap-2 px-4 text-[11px] font-semibold ${cores.primaryButton}`}
                        >
                            <BsPlusLg />
                            Gerar convite
                        </button>
                    </div>
                </div>

                {(solicitacoesResumoQuery.data?.total ?? 0) > 0 && (
                    <button
                        type="button"
                        onClick={() => navegar("solicitacoes")}
                        className="mb-5 flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 text-left transition hover:bg-amber-500/10"
                    >
                        <span className="flex min-w-0 items-center gap-3">
                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-amber-500/10 text-amber-600">
                                <BsClipboard2Pulse />
                            </span>
                            <span className="min-w-0">
                                <span className="block text-xs font-bold text-[var(--text-primary)]">
                                    {solicitacoesResumoQuery.data?.total} novo(s) cadastro(s) em
                                    análise
                                </span>
                                <span className="mt-1 block text-[11px] text-[var(--text-secondary)]">
                                    {solicitacoesResumoQuery.data?.aguardandoFormulario} aguardando
                                    formulário · {solicitacoesResumoQuery.data?.enviados} pronto(s)
                                    para análise
                                </span>
                            </span>
                        </span>
                        <span className="text-[11px] font-bold text-amber-700">
                            Abrir solicitações →
                        </span>
                    </button>
                )}

                {/* Indicadores */}
                <div className="mb-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                            <BsPeople className="text-lg" />
                        </span>

                        <div>
                            <p className="text-[10px] text-[var(--text-muted)]">Total de alunos</p>
                            {alunosQuery.isLoading ? (
                                <Skeleton className="mt-2 h-7 w-12 rounded-md" />
                            ) : (
                                <p
                                    className={`mt-0.5 text-[20px] font-semibold tracking-[-0.04em] ${cores.heading}`}
                                >
                                    {alunos.length}
                                </p>
                            )}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setFiltroFicha("sem-ficha")}
                        className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${filtroFicha === "sem-ficha" ? "border-amber-500/50 bg-amber-500/5" : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--row-hover)]"}`}
                    >
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-amber-500/10 text-amber-600">
                            <BsFileEarmarkText className="text-lg" />
                        </span>
                        <span>
                            <span className="block text-[10px] text-[var(--text-muted)]">
                                Sem ficha técnica
                            </span>
                            <span
                                className={`mt-0.5 block text-[20px] font-semibold tracking-[-0.04em] ${cores.heading}`}
                            >
                                {alunos.filter(aluno => !aluno.possuiFichaTecnica).length}
                            </span>
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => navegar("solicitacoes")}
                        className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left transition hover:bg-[var(--row-hover)]"
                    >
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-sky-500/10 text-sky-600">
                            <BsClipboard2Pulse className="text-lg" />
                        </span>
                        <span>
                            <span className="block text-[10px] text-[var(--text-muted)]">
                                Em análise
                            </span>
                            <span
                                className={`mt-0.5 block text-[20px] font-semibold tracking-[-0.04em] ${cores.heading}`}
                            >
                                {solicitacoesResumoQuery.data?.total ?? "—"}
                            </span>
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setFiltroFicha("com-ficha")}
                        className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${filtroFicha === "com-ficha" ? "border-[var(--success)]/50 bg-[var(--success-soft)]" : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--row-hover)]"}`}
                    >
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--success-soft)] text-[var(--success)]">
                            <BsClipboard2Pulse className="text-lg" />
                        </span>
                        <span>
                            <span className="block text-[10px] text-[var(--text-muted)]">
                                Com ficha técnica
                            </span>
                            <span
                                className={`mt-0.5 block text-[20px] font-semibold tracking-[-0.04em] ${cores.heading}`}
                            >
                                {alunos.filter(aluno => aluno.possuiFichaTecnica).length}
                            </span>
                        </span>
                    </button>
                </div>

                {/* Diretório */}
                <div className="overflow-visible rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                    <div className="flex flex-col justify-between gap-4 rounded-t-xl border-b border-[var(--border)] p-5 sm:flex-row sm:items-center">
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className={`text-[14px] font-semibold ${cores.heading}`}>
                                    Diretório de alunos
                                </h2>

                                <span className="rounded-md bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--accent-text)]">
                                    {alunosFiltrados.length}
                                </span>
                            </div>

                            <p className={`mt-1 text-[11px] ${cores.subtleText}`}>
                                Acompanhe quem já possui ficha e quem ainda precisa iniciar o
                                preenchimento.
                            </p>
                        </div>

                        <label className="relative block w-full sm:w-[290px]">
                            <BsSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[var(--text-muted)]" />

                            <input
                                type="search"
                                value={busca}
                                onChange={event => setBusca(event.target.value)}
                                placeholder="Buscar aluno..."
                                aria-label="Buscar alunos"
                                className={`h-10 w-full pl-9 pr-3 text-[11px] outline-none transition ${cores.input}`}
                            />
                        </label>
                    </div>

                    <div className="flex flex-wrap gap-2 border-b border-[var(--border)] px-5 py-3">
                        {(["todos", "sem-ficha", "com-ficha", "avaliacao-pendente", "avaliacao-urgente"] as const).map(filtro => (
                            <button
                                key={filtro}
                                type="button"
                                onClick={() => setFiltroFicha(filtro)}
                                className={`rounded-lg px-3 py-2 text-[10px] font-semibold transition ${filtroFicha === filtro ? "bg-[var(--accent)] text-white" : "border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--row-hover)]"}`}
                            >
                                {filtro === "todos"
                                    ? "Todos"
                                    : filtro === "sem-ficha"
                                      ? "Sem ficha técnica"
                                      : filtro === "com-ficha"
                                        ? "Com ficha técnica"
                                      : filtro === "avaliacao-pendente"
                                        ? `Avaliação pendente (${alunos.filter(aluno => aluno.avaliacaoPendente).length})`
                                        : `Urgentes (${alunos.filter(aluno => aluno.avaliacaoUrgente).length})`}
                            </button>
                        ))}
                    </div>

                    {/* Lista vazia */}
                    {alunosQuery.isLoading ? (
                        <div
                            aria-label="Carregando diretório de alunos"
                            aria-busy="true"
                            className="space-y-4 p-5"
                        >
                            {Array.from({ length: 5 }, (_, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-3"
                                >
                                    <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                                    <div className="min-w-0 flex-1 space-y-2">
                                        <Skeleton className="h-3 w-2/5 rounded" />
                                        <Skeleton className="h-2.5 w-3/5 rounded" />
                                    </div>
                                    <Skeleton className="hidden h-7 w-20 rounded-lg sm:block" />
                                    <Skeleton className="h-8 w-8 rounded-lg" />
                                </div>
                            ))}
                        </div>
                    ) : alunosQuery.isError ? (
                        <div className="flex min-h-[240px] flex-col items-center justify-center px-6 text-center">
                            <p className="text-[13px] font-semibold text-[var(--danger)]">
                                Não foi possível carregar os alunos.
                            </p>
                            <button
                                disabled={alunosQuery.isFetching}
                                aria-busy={alunosQuery.isFetching}
                                onClick={() => void alunosQuery.refetch()}
                                className={`mt-3 h-9 px-4 text-[11px] font-semibold ${cores.secondaryButton}`}
                            >
                                {alunosQuery.isFetching ? "Carregando..." : "Tentar novamente"}
                            </button>
                        </div>
                    ) : alunos.length === 0 ? (
                        <div className="flex min-h-[300px] flex-col items-center justify-center px-5 py-10 text-center">
                            <span className="grid h-14 w-14 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                                <BsPeople className="text-2xl" />
                            </span>

                            <h3 className={`mt-4 text-[15px] font-semibold ${cores.heading}`}>
                                Sua base começa aqui.
                            </h3>

                            <p className={`mt-2 max-w-sm text-[12px] leading-5 ${cores.bodyText}`}>
                                Cadastre seu primeiro aluno e comece a organizar suas fichas de
                                avaliação e treinamento.
                            </p>

                            <div className="mt-5 flex flex-wrap justify-center gap-2">
                                <button
                                    onClick={criarAluno}
                                    className={`h-10 rounded-lg px-5 text-[11px] font-semibold ${cores.primaryButton}`}
                                >
                                    <BsPlusLg className="mr-2 inline" />
                                    Cadastrar aluno
                                </button>

                                <button
                                    onClick={() => inputImportarRef.current?.click()}
                                    className={`h-10 px-4 text-[11px] font-semibold ${cores.secondaryButton}`}
                                >
                                    Importar JSON
                                </button>
                            </div>
                        </div>
                    ) : alunosFiltrados.length === 0 ? (
                        <div className="flex min-h-[220px] flex-col items-center justify-center px-5 text-center">
                            <BsSearch className="text-2xl text-[var(--text-muted)]" />

                            <p className={`mt-3 text-[13px] font-semibold ${cores.heading}`}>
                                Nenhum aluno encontrado.
                            </p>

                            <p className={`mt-1 text-[11px] ${cores.bodyText}`}>
                                Não encontramos resultados para "{busca}".
                            </p>

                            <button
                                onClick={() => setBusca("")}
                                className="mt-3 text-[11px] font-semibold text-[var(--accent-text)] hover:underline"
                            >
                                Limpar pesquisa
                            </button>
                        </div>
                    ) : (
                        <div className="ui-stagger divide-y divide-[var(--border)]">
                            {alunosFiltrados.map(aluno => (
                                <article
                                    key={aluno.id}
                                    className={`group relative flex flex-col gap-4 p-4 transition-colors hover:bg-[var(--row-hover)] sm:flex-row sm:items-center sm:justify-between sm:px-5 ${menuAlunoAberto === aluno.id ? "z-[100]" : "z-0"}`}
                                >
                                    {/* Identificação */}
                                    <div className="flex min-w-0 items-center gap-3">
                                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-[14px] font-semibold text-[var(--accent-text)]">
                                            {aluno.nome?.charAt(0)?.toLocaleUpperCase("pt-BR") ||
                                                "A"}
                                        </span>

                                        <div className="min-w-0">
                                            <h3
                                                className={`truncate text-[13px] font-semibold ${cores.heading}`}
                                            >
                                                {aluno.nome}
                                            </h3>

                                            <p className="mt-1 truncate font-mono text-[10px] text-[var(--text-muted)]">
                                                ID: {aluno.id}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Informações e ações */}
                                    <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                                        <div className="mr-2 hidden min-w-[115px] flex-col gap-1 lg:flex">
                                            <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">
                                                Cadastro
                                            </span>

                                            <span className={`text-[11px] ${cores.bodyText}`}>
                                                {formatarData(aluno.criadoEm)}
                                            </span>
                                        </div>

                                        <span
                                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-medium ${aluno.possuiFichaTecnica ? "bg-[var(--success-soft)] text-[var(--success)]" : "bg-amber-500/10 text-amber-600"}`}
                                        >
                                            <span
                                                className={`h-1.5 w-1.5 rounded-full ${aluno.possuiFichaTecnica ? "bg-[var(--success)]" : "bg-amber-500"}`}
                                            />
                                            {aluno.possuiFichaTecnica
                                                ? "Ficha técnica cadastrada"
                                                : "Sem ficha técnica"}
                                        </span>

                                        {aluno.avaliacaoPendente && (
                                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-semibold ${aluno.avaliacaoUrgente ? "bg-red-500/10 text-red-700 ring-1 ring-red-500/20" : "bg-amber-500/10 text-amber-700"}`} title={aluno.avaliacaoUrgente ? "Solicitação urgente de nova avaliação aguardando análise" : "Solicitação de nova avaliação aguardando análise"}>
                                                {aluno.avaliacaoUrgente ? <BsExclamationTriangle /> : <BsCalendar3 />}
                                                {aluno.avaliacaoUrgente ? "Avaliação urgente" : "Avaliação pendente"}
                                            </span>
                                        )}

                                        <div className="flex shrink-0 items-center gap-2">
                                            <button
                                                onClick={() => void abrirAluno(aluno, "controle")}
                                                disabled={carregandoAlunoId === aluno.id}
                                                aria-busy={carregandoAlunoId === aluno.id}
                                                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 text-[10px] font-semibold text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--accent-text)]"
                                            >
                                                {carregandoAlunoId === aluno.id
                                                    ? "Abrindo..."
                                                    : "Acompanhar"}
                                            </button>
                                            <button
                                                onClick={() => void abrirAluno(aluno)}
                                                disabled={carregandoAlunoId === aluno.id}
                                                aria-busy={carregandoAlunoId === aluno.id}
                                                className="inline-flex h-9 min-w-[104px] items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-3 text-[10px] font-semibold text-white transition hover:bg-[var(--accent-hover)]"
                                            >
                                                {carregandoAlunoId === aluno.id
                                                    ? "Abrindo..."
                                                    : user?.tipo === "PERSONAL"
                                                      ? "Assumir"
                                                      : "Abrir ficha"}
                                                <BsArrowUpRight />
                                            </button>

                                            <div className="relative" data-aluno-menu>
                                                <button
                                                    aria-label={`Mais opções para ${aluno.nome}`}
                                                    aria-expanded={menuAlunoAberto === aluno.id}
                                                    onClick={() =>
                                                        setMenuAlunoAberto(
                                                            menuAlunoAberto === aluno.id
                                                                ? null
                                                                : aluno.id,
                                                        )
                                                    }
                                                    className="grid h-9 w-9 place-items-center rounded-lg border border-[var(--border)] text-[var(--text-secondary)] transition hover:bg-[var(--surface-tertiary)] hover:text-[var(--text-primary)]"
                                                >
                                                    <BsThreeDots />
                                                </button>

                                                {menuAlunoAberto === aluno.id && (
                                                    <div className="absolute right-0 top-11 z-[110] w-44 rounded-lg border border-[var(--border)] bg-[var(--menu-bg)] py-1 shadow-xl">
                                                        <button
                                                            onClick={() => exportarAluno(aluno)}
                                                            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-[11px] text-[var(--text-secondary)] hover:bg-[var(--row-hover)]"
                                                        >
                                                            <BsDownload />
                                                            Exportar JSON
                                                        </button>

                                                        {user?.tipo === "ADMIN" && (
                                                            <>
                                                                <div className="my-1 border-t border-[var(--border)]" />
                                                                <button
                                                                    onClick={() => {
                                                                        setAlunoParaExcluir(aluno);
                                                                        setMotivoExclusao(
                                                                            "ENCERRAMENTO_ADMINISTRATIVO",
                                                                        );
                                                                        setDetalheExclusao("");
                                                                        setMenuAlunoAberto(null);
                                                                    }}
                                                                    className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-[11px] text-[var(--danger)] hover:bg-[var(--danger-soft)]"
                                                                >
                                                                    <BsTrash3 />
                                                                    Desativar conta
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>

                {/* Rodapé */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[10px] text-[var(--text-muted)]">
                    <span>Os cadastros são armazenados no PostgreSQL.</span>

                    <span>
                        {alunos.length}{" "}
                        {alunos.length === 1 ? "aluno cadastrado" : "alunos cadastrados"}
                    </span>
                </div>
            </section>
        );
    }

    function renderInicio() {
        const alunosRecentes = [...alunos]
            .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())
            .slice(0, 5);
        const primeiroNome = user?.nome?.trim().split(/\s+/)[0] || "por aqui";
        const hora = new Date().getHours();
        const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
        const semFicha = alunos.filter(aluno => !aluno.possuiFichaTecnica).length;
        const solicitacoesPendentes = solicitacoesResumoQuery.data?.total ?? 0;
        const ferramentas = secoesVisiveis.filter(secao => secao.id !== "inicio");

        return (
            <section className="w-full max-w-[1480px] space-y-8">
                <header className="painel-hero relative isolate overflow-hidden rounded-[28px] p-6 text-white shadow-[0_28px_70px_-38px_rgba(10,20,30,.7)] sm:p-9 xl:p-11">
                    <div className="relative z-10 max-w-3xl">
                        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.16em] text-white/80 backdrop-blur">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,.9)]" />
                            Espaço de trabalho da equipe
                        </div>
                        <p className="text-sm font-medium text-white/70">{saudacao}, {primeiroNome}.</p>
                        <h1 className="mt-2 max-w-2xl text-[clamp(2rem,4vw,3.5rem)] font-semibold leading-[1.04] tracking-[-.055em]">
                            Cada aluno tem uma jornada. <span className="text-white/55">Vamos movimentá-la.</span>
                        </h1>
                        <p className="mt-4 max-w-xl text-[13px] leading-6 text-white/75 sm:text-sm">
                            Convide, avalie, prescreva e acompanhe. Tudo começa por aqui — escolha uma tarefa ou explore as ferramentas da equipe.
                        </p>
                        <div className="mt-7 flex flex-wrap gap-3">
                            <button type="button" onClick={criarAluno} className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-[11px] font-bold text-slate-900 shadow-lg transition hover:-translate-y-0.5 hover:bg-white/90">
                                <BsPlusLg /> Criar convite <BsArrowUpRight className="ml-1" />
                            </button>
                            <button type="button" onClick={() => navegar("alunos")} className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 text-[11px] font-semibold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/15">
                                <BsPeople /> Explorar alunos
                            </button>
                        </div>
                    </div>
                    <div className="painel-hero-orbit pointer-events-none absolute -right-20 -top-28 hidden h-[440px] w-[440px] rounded-full border border-white/10 lg:block" />
                    <div className="pointer-events-none absolute -right-10 bottom-[-150px] hidden h-[360px] w-[360px] rounded-full border border-white/10 lg:block" />
                    <div className="pointer-events-none absolute right-[8%] top-[18%] hidden h-32 w-32 rounded-full border border-white/15 bg-white/[.04] shadow-[inset_0_0_60px_rgba(255,255,255,.08)] backdrop-blur-sm lg:block" />
                    <div className="pointer-events-none absolute right-[15%] top-[31%] hidden h-3 w-3 rounded-full bg-white/80 shadow-[0_0_25px_rgba(255,255,255,.9)] lg:block" />
                    <div className="pointer-events-none absolute bottom-7 right-8 hidden text-right lg:block">
                        <p className="text-[9px] font-bold uppercase tracking-[.2em] text-white/45">Seu painel em movimento</p>
                        <p className="mt-1 text-2xl font-semibold tracking-[-.04em] text-white/80">01 <span className="text-sm font-normal text-white/45">/ visão geral</span></p>
                    </div>
                </header>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <button type="button" onClick={() => navegar("alunos")} className="painel-metric group text-left">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]"><BsPeople size={18} /></span>
                        <span className="mt-5 block text-[10px] font-semibold uppercase tracking-[.12em] text-[var(--text-muted)]">Alunos na equipe</span>
                        <span className="mt-1 block text-3xl font-semibold tracking-[-.06em] text-[var(--text-primary)]">{alunos.length}</span>
                        <span className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-[var(--accent-text)]">Abrir base <BsArrowUpRight className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" /></span>
                    </button>
                    <button type="button" onClick={() => navegar("solicitacoes")} className="painel-metric group text-left">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-amber-600"><BsClipboard2Pulse size={18} /></span>
                        <span className="mt-5 block text-[10px] font-semibold uppercase tracking-[.12em] text-[var(--text-muted)]">Cadastros para revisar</span>
                        <span className="mt-1 block text-3xl font-semibold tracking-[-.06em] text-[var(--text-primary)]">{solicitacoesPendentes}</span>
                        <span className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-[var(--accent-text)]">Ir para solicitações <BsArrowUpRight className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" /></span>
                    </button>
                    <button type="button" onClick={() => navegar("controleAluno")} className="painel-metric group text-left">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-rose-500/10 text-rose-600"><BsActivity size={18} /></span>
                        <span className="mt-5 block text-[10px] font-semibold uppercase tracking-[.12em] text-[var(--text-muted)]">Sem ficha técnica</span>
                        <span className="mt-1 block text-3xl font-semibold tracking-[-.06em] text-[var(--text-primary)]">{semFicha}</span>
                        <span className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-[var(--accent-text)]">Acompanhar alunos <BsArrowUpRight className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" /></span>
                    </button>
                    <button type="button" onClick={() => navegar("chat")} className="painel-metric group text-left">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-500/10 text-sky-600"><BsChatDots size={18} /></span>
                        <span className="mt-5 block text-[10px] font-semibold uppercase tracking-[.12em] text-[var(--text-muted)]">Notificações pendentes</span>
                        <span className="mt-1 block text-3xl font-semibold tracking-[-.06em] text-[var(--text-primary)]">{alertasNaoLidos}</span>
                        <span className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-[var(--accent-text)]">Abrir comunicação <BsArrowUpRight className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" /></span>
                    </button>
                </div>

                <section className="space-y-4">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[.17em] text-[var(--accent-text)]">Descubra o painel</p>
                            <h2 className="mt-1 text-[22px] font-semibold tracking-[-.04em] text-[var(--text-primary)] sm:text-[26px]">O que você quer fazer agora?</h2>
                            <p className="mt-1 text-[11px] text-[var(--text-secondary)]">As ferramentas estão organizadas por objetivo. Abra uma para começar a explorar.</p>
                        </div>
                        <button type="button" onClick={() => setBuscaPainelAberta(true)} className="inline-flex h-9 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-[10px] font-semibold text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--accent-text)]">
                            <BsSearch /> Encontrar ferramenta <kbd className="rounded-md bg-[var(--surface-tertiary)] px-1.5 py-0.5 font-mono text-[9px]">Ctrl / ⌘ K</kbd>
                        </button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                        {gruposNavegacao.map((grupo, index) => {
                            const itens = ferramentas.filter(secao => secao.grupo === grupo);
                            if (!itens.length) return null;
                            const numero = String(index + 1).padStart(2, "0");
                            return (
                                <article key={grupo} className="painel-tool-group">
                                    <div className="mb-4 flex items-center justify-between">
                                        <div>
                                            <p className="text-[9px] font-bold uppercase tracking-[.16em] text-[var(--text-muted)]">Área {numero}</p>
                                            <h3 className="mt-1 text-[15px] font-semibold tracking-[-.025em] text-[var(--text-primary)]">{grupo}</h3>
                                        </div>
                                        <span className="grid h-8 w-8 place-items-center rounded-full border border-[var(--border)] text-[10px] font-semibold text-[var(--text-muted)]">{itens.length}</span>
                                    </div>
                                    <div className="space-y-2">
                                        {itens.map(secao => (
                                            <button key={secao.id} type="button" onClick={() => navegar(secao.id)} className="painel-tool-link group">
                                                <span className="painel-tool-icon">{secao.icone}</span>
                                                <span className="min-w-0 flex-1 text-left">
                                                    <strong className="block truncate text-[11px] font-semibold text-[var(--text-primary)]">{secao.nome}</strong>
                                                    <span className="mt-0.5 block text-[9px] leading-4 text-[var(--text-muted)]">{descricoesSecoes[secao.id]}</span>
                                                </span>
                                                {secao.id === "solicitacoes" && solicitacoesPendentes > 0 ? <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[9px] font-bold text-amber-600">{solicitacoesPendentes}</span> : null}
                                                {secao.id === "chat" && alertasNaoLidos > 0 ? <span className="rounded-full bg-[var(--accent-soft)] px-2 py-1 text-[9px] font-bold text-[var(--accent-text)]">{alertasNaoLidos}</span> : null}
                                                <BsArrowUpRight className="shrink-0 text-[12px] text-[var(--text-muted)] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--accent)]" />
                                            </button>
                                        ))}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </section>

                <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,.65fr)]">
                    <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4 sm:px-6">
                            <div>
                                <p className="text-[9px] font-bold uppercase tracking-[.15em] text-[var(--accent-text)]">Movimento recente</p>
                                <h2 className="mt-1 text-[15px] font-semibold text-[var(--text-primary)]">Alunos que chegaram por último</h2>
                            </div>
                            <button type="button" onClick={() => navegar("alunos")} className="inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold text-[var(--accent-text)] hover:underline">Ver base <BsArrowUpRight /></button>
                        </div>
                        {alunosRecentes.length === 0 ? (
                            <div className="px-5 py-10 text-center sm:px-8">
                                <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]"><BsPeople size={22} /></span>
                                <p className="mt-4 text-[13px] font-semibold text-[var(--text-primary)]">Sua próxima jornada começa com um convite</p>
                                <p className="mx-auto mt-1 max-w-sm text-[10px] leading-5 text-[var(--text-muted)]">Envie um link para o aluno preencher o cadastro. Depois, a equipe analisa as informações e inicia o acompanhamento.</p>
                                <button type="button" onClick={criarAluno} className="mt-4 inline-flex h-9 items-center gap-2 rounded-xl bg-[var(--accent)] px-4 text-[10px] font-semibold text-[var(--on-accent)]"><BsPlusLg /> Gerar primeiro convite</button>
                            </div>
                        ) : (
                            <div className="divide-y divide-[var(--border)]">
                                {alunosRecentes.map((aluno, index) => (
                                    <button key={aluno.id} type="button" onClick={() => abrirAluno(aluno)} className="group flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left transition hover:bg-[var(--row-hover)] sm:px-6">
                                        <span className="flex min-w-0 items-center gap-3">
                                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--surface-tertiary)] text-[12px] font-bold text-[var(--text-secondary)]">{aluno.nome?.charAt(0)?.toUpperCase() || "A"}</span>
                                            <span className="min-w-0">
                                                <strong className="block truncate text-[11px] font-semibold text-[var(--text-primary)]">{aluno.nome}</strong>
                                                <span className="mt-0.5 block text-[9px] text-[var(--text-muted)]">{index === 0 ? "Cadastro mais recente" : `Entrou em ${formatarData(aluno.criadoEm)}`}</span>
                                            </span>
                                        </span>
                                        <span className="inline-flex shrink-0 items-center gap-1 text-[9px] font-semibold text-[var(--accent-text)]">Abrir <BsArrowUpRight className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" /></span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </section>

                    <aside className="space-y-4">
                        <article className="painel-workflow-card">
                            <p className="text-[9px] font-bold uppercase tracking-[.15em] text-[var(--accent-text)]">Um caminho simples</p>
                            <h3 className="mt-1 text-[15px] font-semibold tracking-[-.025em] text-[var(--text-primary)]">Da chegada ao acompanhamento</h3>
                            <div className="mt-5 space-y-4">
                                {[
                                    { n: "01", titulo: "Convide", detalhe: "Compartilhe um link de entrada.", destino: "convites", icone: <BsArrowUpRight /> },
                                    { n: "02", titulo: "Revise", detalhe: "Analise as informações recebidas.", destino: "solicitacoes", icone: <BsClipboard2Pulse /> },
                                    { n: "03", titulo: "Estruture", detalhe: "Abra o aluno e monte a ficha.", destino: "alunos", icone: <BsPeople /> },
                                    { n: "04", titulo: "Acompanhe", detalhe: "Veja execução, relatos e tarefas.", destino: "controleAluno", icone: <BsActivity /> },
                                ].map(etapa => (
                                    <button key={etapa.n} type="button" onClick={() => navegar(etapa.destino)} className="group flex w-full items-start gap-3 text-left">
                                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] text-[9px] font-bold text-[var(--text-muted)] transition group-hover:border-[var(--accent)] group-hover:bg-[var(--accent-soft)] group-hover:text-[var(--accent-text)]">{etapa.n}</span>
                                        <span className="min-w-0 flex-1">
                                            <strong className="block text-[10px] font-semibold text-[var(--text-primary)]">{etapa.titulo}</strong>
                                            <span className="mt-0.5 block text-[9px] leading-4 text-[var(--text-muted)]">{etapa.detalhe}</span>
                                        </span>
                                        <span className="pt-1 text-[11px] text-[var(--text-muted)] transition group-hover:translate-x-1 group-hover:text-[var(--accent)]">{etapa.icone}</span>
                                    </button>
                                ))}
                            </div>
                        </article>
                        <button type="button" onClick={() => navegar("arquivos")} className="group flex w-full items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]">
                            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--surface-tertiary)] text-[var(--accent)]"><BsFolder2Open size={18} /></span>
                            <span className="min-w-0 flex-1"><strong className="block text-[11px] font-semibold text-[var(--text-primary)]">Biblioteca da equipe</strong><span className="mt-0.5 block text-[9px] text-[var(--text-muted)]">Encontre materiais e arquivos compartilhados.</span></span>
                            <BsArrowUpRight className="text-[12px] text-[var(--text-muted)] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--accent)]" />
                        </button>
                    </aside>
                </div>
            </section>
        );
    }

    function renderSecaoVazia(titulo: string, descricao: string, icone: React.ReactNode) {
        return (
            <section className="w-full max-w-[1100px]">
                <div className={`mb-7 border-b ${cores.divider} pb-6`}>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-text)]">
                        Workspace / {titulo}
                    </p>
                    <h1
                        className={`text-[30px] font-semibold tracking-[-0.045em] ${cores.heading}`}
                    >
                        {titulo}
                    </h1>
                    <p className={`mt-1.5 text-[13px] ${cores.bodyText}`}>{descricao}</p>
                </div>

                <div
                    className={`flex min-h-[260px] items-center gap-5 rounded-xl border ${cores.divider} bg-[var(--surface)] p-6`}
                >
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-[var(--border)] bg-[var(--accent-soft)] text-[20px] text-[var(--accent)]">
                        {icone}
                    </div>
                    <div>
                        <p className={`text-[14px] font-semibold ${cores.heading}`}>
                            Esta área está no planejamento.
                        </p>
                        <p className={`mt-1 text-[12px] ${cores.bodyText}`}>
                            A estrutura será disponibilizada em uma próxima etapa do produto.
                        </p>
                        <span className="mt-3 inline-flex rounded-md border border-[var(--border)] bg-[var(--surface-tertiary)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--warning)]">
                            Em desenvolvimento
                        </span>
                    </div>
                </div>
            </section>
        );
    }

    function renderConfiguracoes() {
        const temaSelecionado = TEMAS[temaVisualId];
        return (
            <section className="w-full max-w-[1200px] space-y-5">
                <div className={`border-b ${cores.divider} pb-6`}>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-text)]">
                        Sistema / Preferências
                    </p>
                    <h1
                        className={`text-[30px] font-semibold tracking-[-0.045em] ${cores.heading}`}
                    >
                        Configurações
                    </h1>
                    <p className={`mt-1.5 text-[13px] ${cores.bodyText}`}>
                        Personalize a aparência, leitura e comportamento do seu workspace.
                    </p>
                </div>

                <section
                    className={`rounded-2xl border ${cores.divider} bg-[var(--surface)] p-5 sm:p-6`}
                >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <BsPalette className="text-[var(--accent)]" />
                                <h2 className={`text-[14px] font-bold ${cores.heading}`}>
                                    Temas e identidade visual
                                </h2>
                            </div>
                            <p
                                className={`mt-1.5 max-w-2xl text-[11px] leading-5 ${cores.bodyText}`}
                            >
                                Escolha uma paleta pronta. Cada tema possui cores próprias para o
                                modo claro e escuro; para criar outro, adicione uma nova chave no
                                arquivo{" "}
                                <code className="rounded bg-[var(--surface-tertiary)] px-1.5 py-0.5">
                                    src/types/temas.ts
                                </code>
                                .
                            </p>
                        </div>
                        <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[9px] font-semibold text-[var(--accent-text)]">
                            {temaSelecionado.nome}
                        </span>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {(Object.keys(TEMAS) as TemaId[]).map(id => {
                            const item = TEMAS[id];
                            const ativo = temaVisualId === id;
                            return (
                                <button
                                    key={id}
                                    type="button"
                                    aria-pressed={ativo}
                                    onClick={() => setTemaVisualId(id)}
                                    className={`rounded-xl border p-4 text-left transition ${ativo ? "border-[var(--accent)] bg-[var(--accent-soft)] ring-2 ring-[var(--ring)]" : "border-[var(--border)] bg-[var(--surface-secondary)] hover:border-[var(--accent)]"}`}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <span
                                            className={`text-[12px] font-semibold ${cores.heading}`}
                                        >
                                            {item.nome}
                                        </span>
                                        {ativo && (
                                            <span className="rounded-full bg-[var(--accent)] px-2 py-1 text-[8px] font-bold text-white">
                                                ATIVO
                                            </span>
                                        )}
                                    </div>
                                    <p
                                        className={`mt-1 min-h-8 text-[9px] leading-4 ${cores.subtleText}`}
                                    >
                                        {item.descricao}
                                    </p>
                                    <div
                                        className="mt-3 flex items-center gap-1.5"
                                        aria-label="Cores principais do tema"
                                    >
                                        {item.amostras.map((cor, index) => (
                                            <span
                                                key={index}
                                                className="h-6 w-6 rounded-md border border-black/10 shadow-sm"
                                                style={{ backgroundColor: cor }}
                                            />
                                        ))}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <div
                        className={`mt-5 flex flex-wrap items-center justify-between gap-3 border-t ${cores.divider} pt-4`}
                    >
                        <div>
                            <p className={`text-[10px] font-semibold ${cores.bodyText}`}>
                                Modo de exibição
                            </p>
                            <p className={`mt-0.5 text-[9px] ${cores.subtleText}`}>
                                A paleta selecionada adapta suas cores ao modo claro ou escuro.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setTema("light")}
                                aria-pressed={tema === "light"}
                                className={
                                    tema === "light"
                                        ? "inline-flex h-9 items-center gap-2 rounded-lg bg-[var(--accent)] px-3 text-[10px] font-semibold text-white"
                                        : `inline-flex h-9 items-center gap-2 rounded-lg border ${cores.divider} px-3 text-[10px] font-semibold ${cores.bodyText}`
                                }
                            >
                                <BsSun /> Claro
                            </button>
                            <button
                                type="button"
                                onClick={() => setTema("dark")}
                                aria-pressed={tema === "dark"}
                                className={
                                    tema === "dark"
                                        ? "inline-flex h-9 items-center gap-2 rounded-lg bg-[var(--accent)] px-3 text-[10px] font-semibold text-white"
                                        : `inline-flex h-9 items-center gap-2 rounded-lg border ${cores.divider} px-3 text-[10px] font-semibold ${cores.bodyText}`
                                }
                            >
                                <BsMoonStars /> Escuro
                            </button>
                        </div>
                    </div>
                </section>

                <div className="grid gap-5 xl:grid-cols-2">
                    <section
                        className={`rounded-2xl border ${cores.divider} bg-[var(--surface)] p-5 sm:p-6`}
                    >
                        <div className="flex items-center gap-2">
                            <BsType className="text-[var(--accent)]" />
                            <h2 className={`text-[14px] font-bold ${cores.heading}`}>
                                Tamanho das letras
                            </h2>
                        </div>
                        <p className={`mt-1.5 text-[11px] leading-5 ${cores.bodyText}`}>
                            Ajuste a escala tipográfica para priorizar mais conteúdo ou uma leitura
                            mais confortável.
                        </p>
                        <div className="mt-4 grid grid-cols-2 gap-2">
                            {(Object.keys(ESCALAS_TEXTO) as EscalaTextoId[]).map(id => {
                                const item = ESCALAS_TEXTO[id];
                                const ativo = tamanhoTexto === id;
                                return (
                                    <button
                                        key={id}
                                        type="button"
                                        aria-pressed={ativo}
                                        onClick={() => setTamanhoTexto(id)}
                                        className={`rounded-xl border p-3 text-left transition ${ativo ? "border-[var(--accent)] bg-[var(--accent-soft)]" : `border-[var(--border)] bg-[var(--surface-secondary)] hover:border-[var(--accent)]`}`}
                                    >
                                        <span
                                            className={`block text-[10px] font-semibold ${cores.heading}`}
                                        >
                                            {item.nome}
                                        </span>
                                        <span
                                            className="mt-2 block font-semibold text-[var(--text-primary)]"
                                            style={{ fontSize: 14 * item.escala + "px" }}
                                        >
                                            Aa
                                        </span>
                                        <span
                                            className={`mt-1 block text-[9px] ${cores.subtleText}`}
                                        >
                                            {item.exemplo}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        <div
                            className={`mt-4 rounded-xl border ${cores.divider} bg-[var(--surface-secondary)] p-3`}
                        >
                            <p
                                className={`text-[9px] font-semibold uppercase tracking-wide ${cores.subtleText}`}
                            >
                                Prévia da leitura
                            </p>
                            <p
                                className={`mt-2 font-semibold ${cores.heading}`}
                                style={{ fontSize: 15 * ESCALAS_TEXTO[tamanhoTexto].escala + "px" }}
                            >
                                Acompanhe a evolução do aluno
                            </p>
                            <p
                                className={`mt-1 leading-5 ${cores.bodyText}`}
                                style={{ fontSize: 12 * ESCALAS_TEXTO[tamanhoTexto].escala + "px" }}
                            >
                                Os indicadores e informações do painel acompanham a escala
                                escolhida.
                            </p>
                        </div>
                    </section>

                    <section
                        className={`rounded-2xl border ${cores.divider} bg-[var(--surface)] p-5 sm:p-6`}
                    >
                        <div className="flex items-center gap-2">
                            <BsType className="text-[var(--accent)]" />
                            <h2 className={`text-[14px] font-bold ${cores.heading}`}>
                                Família tipográfica
                            </h2>
                        </div>
                        <p className={`mt-1.5 text-[11px] leading-5 ${cores.bodyText}`}>
                            Escolha a fonte usada nos textos, títulos, menus e formulários do
                            painel.
                        </p>
                        <label className="mt-4 grid gap-1.5">
                            <span className={`text-[10px] font-semibold ${cores.bodyText}`}>
                                Fonte do workspace
                            </span>
                            <select
                                value={fonteUi}
                                onChange={event => setFonteUi(event.target.value as FonteUiId)}
                                className={`${cores.input} h-10 px-3 text-[11px] outline-none`}
                            >
                                {(Object.keys(FONTES_UI) as FonteUiId[]).map(id => (
                                    <option key={id} value={id}>
                                        {FONTES_UI[id].nome}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <div
                            className={`mt-4 rounded-xl border ${cores.divider} bg-[var(--surface-secondary)] p-4`}
                        >
                            <p
                                className={`text-[9px] font-semibold uppercase tracking-wide ${cores.subtleText}`}
                            >
                                Prévia da fonte · {FONTES_UI[fonteUi].nome}
                            </p>
                            <p
                                className={`mt-3 text-[20px] font-semibold tracking-tight ${cores.heading}`}
                                style={{ fontFamily: FONTES_UI[fonteUi].css }}
                            >
                                Gestão de treinamento
                            </p>
                            <p
                                className={`mt-1 text-[11px] leading-5 ${cores.bodyText}`}
                                style={{ fontFamily: FONTES_UI[fonteUi].css }}
                            >
                                Prescrição, acompanhamento e evolução em um só lugar.
                            </p>
                            <p
                                className={`mt-3 text-[10px] ${cores.subtleText}`}
                                style={{ fontFamily: FONTES_UI[fonteUi].css }}
                            >
                                Aa Bb Cc · 0123456789
                            </p>
                        </div>
                    </section>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3">
                    <p className={`text-[10px] ${cores.subtleText}`}>
                        As preferências visuais são salvas neste navegador e não alteram os dados
                        dos alunos.
                    </p>
                    <button
                        type="button"
                        onClick={() => {
                            setTemaVisualId("indigo");
                            setTamanhoTexto("padrao");
                            setFonteUi("sistema");
                            setTema("light");
                        }}
                        className={`h-8 rounded-lg border ${cores.divider} bg-[var(--surface)] px-3 text-[9px] font-semibold ${cores.bodyText} hover:bg-[var(--row-hover)]`}
                    >
                        Restaurar aparência padrão
                    </button>
                </div>

                <div
                    className={`rounded-xl border ${cores.divider} bg-[var(--surface)] p-5 sm:p-6`}
                >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="max-w-xl">
                            <h2 className={`text-sm font-bold ${cores.heading}`}>
                                Salvamento automático
                            </h2>
                            <p className={`mt-1.5 text-xs leading-5 ${cores.bodyText}`}>
                                Quando ativado, as alterações da ficha são enviadas ao banco após um
                                período sem edição. Você continua podendo salvar manualmente quando
                                quiser.
                            </p>
                        </div>
                        <label
                            className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border ${cores.divider} px-3 py-2 text-xs font-semibold ${cores.bodyText}`}
                        >
                            <input
                                type="checkbox"
                                checked={autoSaveEnabled}
                                onChange={event => setAutoSaveEnabled(event.target.checked)}
                                className="h-4 w-4 accent-[var(--accent)]"
                            />
                            {autoSaveEnabled ? "Ativado" : "Desativado"}
                        </label>
                    </div>

                    {autoSaveEnabled && (
                        <div
                            className={`mt-5 flex flex-wrap items-center gap-3 border-t ${cores.divider} pt-5`}
                        >
                            <label
                                htmlFor="painel-autosave-delay"
                                className={`text-xs font-semibold ${cores.bodyText}`}
                            >
                                Aguardar antes de salvar
                            </label>
                            <select
                                id="painel-autosave-delay"
                                value={autoSaveDelayMs}
                                onChange={event => setAutoSaveDelayMs(Number(event.target.value))}
                                className={`${cores.input} min-w-36 px-3 py-2 text-xs outline-none`}
                            >
                                <option value={2000}>2 segundos</option>
                                <option value={4000}>4 segundos</option>
                                <option value={6000}>6 segundos</option>
                                <option value={10000}>10 segundos</option>
                            </select>
                            <span className={`text-[11px] ${cores.subtleText}`}>
                                após a última alteração
                            </span>
                        </div>
                    )}

                    <div className={`mt-5 border-t ${cores.divider} pt-4`}>
                        <p className={`text-[11px] font-semibold ${cores.bodyText}`}>
                            {!autoSaveEnabled && "O salvamento automático está desligado."}
                            {autoSaveEnabled &&
                                autoSaveStatus === "idle" &&
                                "Ativo e aguardando alterações."}
                            {autoSaveEnabled &&
                                autoSaveStatus === "waiting" &&
                                `Aguardando ${autoSaveDelayMs / 1000}s de inatividade.`}
                            {autoSaveEnabled &&
                                autoSaveStatus === "saving" &&
                                "Salvando a ficha no banco..."}
                            {autoSaveEnabled &&
                                autoSaveStatus === "saved" &&
                                `Último salvamento${autoSaveLastSavedAt ? ` às ${autoSaveLastSavedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : ""}.`}
                            {autoSaveEnabled &&
                                autoSaveStatus === "error" &&
                                "O último salvamento automático falhou."}
                        </p>
                        {autoSaveEnabled && autoSaveError && (
                            <p role="alert" className="mt-1 text-[11px] text-[var(--danger)]">
                                {autoSaveError} Acesse Salvar para tentar novamente manualmente.
                            </p>
                        )}
                        <p className={`mt-2 text-[10px] leading-5 ${cores.subtleText}`}>
                            Essa preferência é individual para sua conta neste navegador. Os dados
                            da ficha continuam sendo armazenados somente no PostgreSQL.
                        </p>
                    </div>
                </div>
            </section>
        );
    }

    function renderConteudo() {
        switch (secaoAtual) {
            case "inicio":
                return renderInicio();
            case "alunos":
                return renderAlunos();
            case "solicitacoes":
                return <SolicitacoesCadastro />;
            case "chat":
                return <CentralComunicacao />;
            case "emails":
                return user?.tipo === "ADMIN" || user?.tipo === "PERSONAL" ? (
                    <EmailCenter tipoUsuario={user.tipo} />
                ) : (
                    renderInicio()
                );
            case "arquivos":
                return user?.tipo === "ADMIN" || user?.tipo === "PERSONAL" ? (
                    <ArquivosEquipe isAdmin={user.tipo === "ADMIN"} />
                ) : (
                    renderInicio()
                );
            case "indicadores":
                return user?.tipo === "ADMIN" ? <IndicadoresEquipe /> : renderInicio();
            case "convites":
                return user?.tipo === "ADMIN" || user?.tipo === "PERSONAL" ? <ConvitesEquipe /> : renderInicio();
            case "tarefas":
                return user?.tipo === "ADMIN" || user?.tipo === "PERSONAL" ? (
                    <TarefasPersonal />
                ) : (
                    renderInicio()
                );
            case "manutencao":
                return user?.tipo === "ADMIN" || user?.tipo === "PERSONAL" ? (
                    <ManutencaoSistema />
                ) : (
                    renderInicio()
                );
            case "equipe":
                return user?.tipo === "ADMIN" ? renderEquipe() : renderAlunos();

            case "avaliacoes":
                return renderSecaoVazia(
                    "Avaliações",
                    "Avaliações físicas, anamneses, medidas e histórico dos alunos.",
                    <BsClipboard2Pulse />,
                );
            case "ajuda":
                return renderSecaoVazia(
                    "Central de ajuda",
                    "Tutoriais, orientações e explicações sobre o funcionamento do sistema.",
                    <BsQuestionCircle />,
                );
            case "feedback":
                return user?.tipo === "ADMIN" || user?.tipo === "PERSONAL" ? (
                    <FeedbackAlunos />
                ) : (
                    renderInicio()
                );
            case "log":
                return user?.tipo === "ADMIN" ? <AtividadesAdmin /> : renderInicio();
            case "periodizacao":
                return renderSecaoVazia(
                    "Periodização",
                    "Planejamento de semanas, dias, sessões e distribuição de volume.",
                    <BsCalendar3 />,
                );
            case "exercicios":
                return user?.tipo === "ADMIN" || user?.tipo === "PERSONAL"
                    ? <BibliotecaExercicios />
                    : renderInicio();
            case "relatorios":
                return <Relatorios />;

            case "configuracoes":
                return renderConfiguracoes();

            case "controleAluno": {
                const aluno = alunos.find(item => item.id === alunoSelecionadoId);
                if (!aluno || !alunoSelecionadoId) {
                    return (
                        <CentralAcompanhamentoPersonal
                            onAbrirAluno={(alunoId, destino) => {
                                const selecionado = alunos.find(item => item.id === alunoId);
                                if (selecionado) void abrirAluno(selecionado, destino);
                            }}
                            onNavigate={navegar}
                        />
                    );
                }
                return (
                    <ControleAluno
                        aluno={{
                            id: aluno.id,
                            nomeCompleto: aluno.nome,
                            email: aluno.email,
                            telefone: aluno.telefone,
                            criadoEm: aluno.criadoEm,
                            possuiFichaTecnica: aluno.possuiFichaTecnica,
                            convidadoPorPersonalNome: aluno.convidadoPorPersonalNome,
                        }}
                        alunosDisponiveis={alunosParaMonitoramento}
                        ficha={fichaAtual}
                        alunoCarregando={Boolean(carregandoAlunoId)}
                        onBack={() => {
                            setAlunoSelecionadoId(null);
                            setAlunoParaMonitorarId("");
                        }}
                        onSelecionarAluno={alunoId => {
                            const proximoAluno = alunos.find(item => item.id === alunoId);
                            if (proximoAluno) void abrirAluno(proximoAluno, "controle");
                        }}
                        onNavigate={navegar}
                        canChat={user?.tipo === "PERSONAL"}
                        isAdmin={user?.tipo === "ADMIN"}
                        personais={personaisQuery.data ?? []}
                    />
                );
            }
            case "controleAvancado":
                return (
                    <ControleAvancado
                        isAdmin={user?.tipo === "ADMIN"}
                        autorizado={acessoControleAvancado}
                        personais={personaisQuery.data ?? []}
                        alunosDisponiveis={alunosParaMonitoramento}
                        onBack={() => navegar("alunos")}
                    />
                );
            default:
                return renderInicio();
        }
    }

    return (
        <div
            data-theme={tema}
            className="painel-theme flex min-h-screen bg-[var(--surface-secondary)] text-[var(--text-primary)]"
            style={estiloPainel}
        >
            {/* Sidebar desktop */}
            <aside className="sticky top-0 hidden h-screen max-h-screen w-[252px] shrink-0 self-start flex-col overflow-hidden border-r border-[var(--border)] bg-[var(--sidebar)] lg:flex">
                <div className="flex h-[82px] items-center gap-3 border-b border-[var(--border)] px-5">
                    <div className="grid h-10 w-10 place-items-center rounded-[14px] bg-[var(--accent)] text-[13px] font-black tracking-[-0.08em] text-white shadow-[0_8px_20px_color-mix(in_srgb,var(--accent)_28%,transparent)]">
                        GF
                    </div>
                    <div className="min-w-0">
                        <p className={`truncate text-[13px] font-bold tracking-[-0.03em] ${cores.heading}`}>
                            G. Fernando
                        </p>
                        <p className={`mt-1 text-[8px] font-bold uppercase tracking-[.16em] ${cores.subtleText}`}>
                            Training studio
                        </p>
                    </div>
                </div>

                <div className="border-b border-[var(--border)] px-4 py-4">
                    <div className="flex items-center gap-3 rounded-xl bg-[var(--surface-secondary)] p-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-[12px] font-bold text-[var(--accent-text)]">{(user?.nome?.[0] ?? "U").toUpperCase()}</span>
                        <span className="min-w-0 flex-1">
                            <strong className={`block truncate text-[10px] font-semibold ${cores.heading}`}>{user?.nome ?? "Profissional"}</strong>
                            <span className={`mt-0.5 block text-[9px] ${cores.subtleText}`}>{user?.tipo === "ADMIN" ? "Administrador da equipe" : "Personal da equipe"}</span>
                        </span>
                        <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,.12)]" title="Sessão ativa" />
                    </div>
                </div>

                <nav
                    aria-label="Navegação principal"
                    className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4"
                >
                    {gruposNavegacao
                        .filter(grupo => secoesVisiveis.some(secao => secao.grupo === grupo))
                        .map(grupo => (
                            <div key={grupo} className="mb-5">
                                <div className="mb-2 px-2">
                                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">{grupo}</p>
                                    <p className="mt-0.5 text-[8px] text-[var(--text-muted)]">{descricoesGrupos[grupo]}</p>
                                </div>

                                <div className="space-y-0.5">
                                    {secoesVisiveis
                                        .filter(secao => secao.grupo === grupo)
                                        .map(secao => {
                                            const ativo = secaoAtual === secao.id;

                                            return (
                                                <button
                                                    key={secao.id}
                                                    onClick={() => navegar(secao.id)}
                                                    aria-current={ativo ? "page" : undefined}
                                                    className={`group relative flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-[11px] font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--accent)] ${
                                                        ativo
                                                            ? "bg-[var(--accent-soft)] font-semibold text-[var(--accent-text)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--accent)_16%,transparent)]"
                                                            : "text-[var(--text-secondary)] hover:bg-[var(--row-hover)] hover:text-[var(--text-primary)]"
                                                    }`}
                                                >
                                                    {ativo && (
                                                        <span className="absolute inset-y-1 left-0 w-[2px] rounded-full bg-[var(--accent)]" />
                                                    )}
                                                    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[14px] transition-colors ${ativo ? "bg-[var(--surface)] text-[var(--accent)]" : "text-[var(--text-muted)] group-hover:bg-[var(--surface)]"}`}>
                                                        {secao.icone}
                                                    </span>
                                                    <span className="min-w-0 flex-1 truncate">{secao.nome}</span>
                                                    {secao.id === "chat" && alertasNaoLidos > 0 && (
                                                        <span className="ml-auto rounded-full bg-[var(--accent)] px-1.5 py-0.5 text-[9px] font-bold text-white">
                                                            {alertasNaoLidos > 99
                                                                ? "99+"
                                                                : alertasNaoLidos}
                                                        </span>
                                                    )}
                                                    {secao.id === "solicitacoes" &&
                                                        (solicitacoesResumoQuery.data?.total ?? 0) >
                                                            0 && (
                                                            <span className="ml-auto rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                                                                {
                                                                    solicitacoesResumoQuery.data
                                                                        ?.total
                                                                }
                                                            </span>
                                                        )}
                                                </button>
                                            );
                                        })}
                                </div>
                            </div>
                        ))}
                </nav>

                <div className="border-t border-[var(--border)] px-4 py-4">
                    <div className="flex items-center justify-between rounded-xl bg-[var(--surface-secondary)] px-3 py-2.5">
                        <span className={`flex items-center gap-2 text-[9px] font-medium ${cores.bodyText}`}><span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />{import.meta.env.DEV ? "Ambiente local" : "Ambiente publicado"}</span>
                        <button type="button" onClick={() => navegar("configuracoes")} className="text-[var(--text-muted)] transition hover:text-[var(--accent-text)]" title="Abrir preferências"><BsGear size={13} /></button>
                    </div>
                </div>
            </aside>

            <div className="flex min-h-screen min-w-0 flex-1 flex-col">
                <header className="sticky top-0 z-20 flex h-[68px] shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--header)]/90 px-3 backdrop-blur-xl sm:px-7">
                    <div className="flex min-w-0 items-center gap-3">
                        <button
                            onClick={() => setMenuMobileAberto(!menuMobileAberto)}
                            aria-label="Abrir navegação"
                            aria-expanded={menuMobileAberto}
                            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[var(--border)] text-[var(--text-secondary)] lg:hidden"
                        >
                            <BsThreeDots />
                        </button>

                        <div className="min-w-0">
                            <p
                                className={`text-[9px] font-semibold uppercase tracking-[0.15em] ${cores.subtleText}`}
                            >
                                G. Fernando <span className="px-1 text-[var(--text-muted)]">/</span>{" "}
                                {secaoSelecionada.grupo}
                            </p>
                            <p className={`truncate text-[13px] font-semibold ${cores.heading}`}>
                                {secaoSelecionada.nome}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <button type="button" onClick={() => setBuscaPainelAberta(true)} aria-label="Buscar ferramentas" className="group hidden h-9 w-[min(34vw,260px)] items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] px-3 text-left transition hover:border-[var(--accent)] md:flex">
                            <BsSearch className="shrink-0 text-[12px] text-[var(--text-muted)] group-hover:text-[var(--accent-text)]" />
                            <span className="min-w-0 flex-1 truncate text-[10px] text-[var(--text-muted)]">Buscar uma ferramenta...</span>
                            <kbd className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-1.5 py-0.5 font-mono text-[8px] text-[var(--text-muted)]">Ctrl K</kbd>
                        </button>
                        <button type="button" onClick={() => setBuscaPainelAberta(true)} aria-label="Buscar ferramentas" className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--border)] text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--accent-text)] md:hidden"><BsSearch size={14} /></button>
                        {solicitacoesAvaliacaoUrgentes.length > 0 && (
                            <button
                                type="button"
                                onClick={() => navegar("controleAluno")}
                                aria-label={`${solicitacoesAvaliacaoUrgentes.length} solicitações urgentes de avaliação aguardando análise`}
                                title="Solicitações urgentes de avaliação"
                                className="relative inline-flex h-8 items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 text-[10px] font-bold text-red-700 transition hover:bg-red-500/15 sm:px-3"
                            >
                                <BsExclamationTriangle />
                                <span className="hidden sm:inline">Avaliações urgentes</span>
                                <span className="grid h-4 min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[8px] text-white">
                                    {solicitacoesAvaliacaoUrgentes.length}
                                </span>
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => navegar("chat")}
                            aria-label={`Abrir alertas${alertasNaoLidos > 0 ? `, ${alertasNaoLidos} não lidos` : ""}`}
                            title="Central de comunicação"
                            className="relative grid h-8 w-8 place-items-center rounded-lg border border-[var(--border)] text-[var(--text-secondary)] transition hover:bg-[var(--row-hover)]"
                        >
                            <BsBell size={14} />
                            {alertasNaoLidos > 0 && (
                                <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--accent)] px-1 text-[8px] font-bold text-white">
                                    {alertasNaoLidos > 9 ? "9+" : alertasNaoLidos}
                                </span>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setTema(atual => (atual === "light" ? "dark" : "light"))}
                            aria-label={
                                tema === "light" ? "Ativar tema escuro" : "Ativar tema claro"
                            }
                            aria-pressed={tema === "dark"}
                            title={tema === "light" ? "Ativar tema escuro" : "Ativar tema claro"}
                            className={`inline-flex h-8 items-center gap-2 px-3 text-[11px] font-medium transition-colors ${cores.secondaryButton}`}
                        >
                            {tema === "light" ? <BsMoonStars size={14} /> : <BsSun size={14} />}
                            <span className="hidden sm:inline">
                                {tema === "light" ? "Escuro" : "Claro"}
                            </span>
                        </button>

                        <span className={`hidden text-[10px] sm:block ${cores.subtleText}`}>
                            Gestão de Academia
                        </span>

                        <div ref={menuPerfilRef} className="relative">
                            <button
                                onClick={() => setMenuPerfilAberto(!menuPerfilAberto)}
                                aria-label="Abrir menu do perfil"
                                aria-expanded={menuPerfilAberto}
                                className="flex h-8 items-center gap-2 rounded-lg border-l border-[var(--border)] pl-3 text-left"
                            >
                                <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--surface-tertiary)] text-[10px] font-semibold text-[var(--text-primary)]">
                                    {(user?.nome?.[0] ?? "U").toUpperCase()}
                                </span>
                                <span
                                    className={`hidden text-[11px] font-semibold sm:block ${cores.bodyText}`}
                                >
                                    {user?.nome ?? "Usuário"}
                                </span>
                            </button>

                            {menuPerfilAberto && (
                                <div className="absolute right-0 top-10 z-40 w-56 rounded-xl border border-[var(--border)] bg-[var(--menu-bg)] py-2 shadow-lg">
                                    <div className="border-b border-[var(--border)] px-4 pb-3">
                                        <p className={`text-[12px] font-semibold ${cores.heading}`}>
                                            {user?.nome ?? "Usuário"}
                                        </p>
                                        <p className={`mt-0.5 text-[10px] ${cores.subtleText}`}>
                                            {user?.tipo === "ADMIN"
                                                ? "Administrador"
                                                : "Personal trainer"}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => navegar("configuracoes")}
                                        className="flex w-full items-center gap-2 rounded-md px-4 py-2.5 text-left text-[11px] text-[var(--text-secondary)] hover:bg-[var(--row-hover)]"
                                    >
                                        <BsGear /> Configurações
                                    </button>
                                    <button
                                        onClick={() => setMenuPerfilAberto(false)}
                                        className="flex w-full items-center gap-2 rounded-md px-4 py-2.5 text-left text-[11px] text-[var(--danger)] hover:bg-[var(--danger-soft)]"
                                    >
                                        <BsX /> Fechar menu
                                    </button>
                                    <button
                                        onClick={() => {
                                            setMenuPerfilAberto(false);
                                            void logout()
                                                .catch(() => undefined)
                                                .then(() => navigate("/register", { replace: true }));
                                        }}
                                        className="flex w-full items-center gap-2 rounded-md px-4 py-2.5 text-left text-[11px] text-[var(--danger)] hover:bg-[var(--danger-soft)]"
                                    >
                                        <BsX /> Sair da conta
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {buscaPainelAberta && (
                    <div className="painel-command-backdrop fixed inset-0 z-[70] flex items-start justify-center bg-slate-950/55 px-3 pt-[12vh] backdrop-blur-sm sm:px-6" onMouseDown={event => { if (event.target === event.currentTarget) { setBuscaPainelAberta(false); setBuscaPainel(""); } }}>
                        <section role="dialog" aria-modal="true" aria-labelledby="titulo-busca-painel" className="painel-command-panel w-full max-w-[620px] overflow-hidden rounded-[22px] border border-[var(--border)] bg-[var(--modal-bg)] shadow-[0_32px_100px_rgba(0,0,0,.35)]">
                            <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-4 sm:px-5">
                                <BsSearch className="shrink-0 text-[17px] text-[var(--accent-text)]" />
                                <label className="min-w-0 flex-1">
                                    <span id="titulo-busca-painel" className="sr-only">Encontrar ferramenta</span>
                                    <input ref={buscaPainelInputRef} value={buscaPainel} onChange={event => setBuscaPainel(event.target.value)} placeholder="O que você quer encontrar?" className="w-full border-0 bg-transparent p-0 text-[14px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:ring-0" />
                                </label>
                                <kbd className="rounded-md border border-[var(--border)] bg-[var(--surface-secondary)] px-2 py-1 font-mono text-[9px] text-[var(--text-muted)]">ESC</kbd>
                            </div>
                            <div className="max-h-[min(58vh,520px)] overflow-y-auto p-3">
                                <p className="px-2 pb-2 text-[9px] font-bold uppercase tracking-[.15em] text-[var(--text-muted)]">{buscaPainel.trim() ? "Resultados" : "Acesse uma área"}</p>
                                {secoesVisiveis.filter(secao => `${secao.nome} ${secao.grupo} ${descricoesSecoes[secao.id] ?? ""}`.toLocaleLowerCase("pt-BR").includes(buscaPainel.trim().toLocaleLowerCase("pt-BR"))).length ? (
                                    secoesVisiveis.filter(secao => `${secao.nome} ${secao.grupo} ${descricoesSecoes[secao.id] ?? ""}`.toLocaleLowerCase("pt-BR").includes(buscaPainel.trim().toLocaleLowerCase("pt-BR"))).map(secao => (
                                        <button key={secao.id} type="button" onClick={() => { navegar(secao.id); setBuscaPainelAberta(false); setBuscaPainel(""); }} className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-[var(--accent-soft)]">
                                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--surface-secondary)] text-[15px] text-[var(--text-secondary)] transition group-hover:bg-[var(--surface)] group-hover:text-[var(--accent-text)]">{secao.icone}</span>
                                            <span className="min-w-0 flex-1"><strong className="block text-[11px] font-semibold text-[var(--text-primary)]">{secao.nome}</strong><span className="mt-0.5 block truncate text-[9px] text-[var(--text-muted)]">{secao.grupo} · {descricoesSecoes[secao.id]}</span></span>
                                            <BsArrowUpRight className="text-[12px] text-[var(--text-muted)] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--accent)]" />
                                        </button>
                                    ))
                                ) : (
                                    <div className="px-4 py-10 text-center"><BsSearch className="mx-auto text-xl text-[var(--text-muted)]" /><p className="mt-3 text-[11px] font-semibold text-[var(--text-primary)]">Nenhuma ferramenta encontrada</p><p className="mt-1 text-[9px] text-[var(--text-muted)]">Tente buscar por aluno, mensagem, tarefa, relatório ou configuração.</p></div>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-[9px] text-[var(--text-muted)] sm:px-5">
                                <span>Busque pelo nome ou pelo que deseja fazer.</span>
                                <span className="font-mono">CTRL / CMD + K</span>
                            </div>
                        </section>
                    </div>
                )}

                {menuMobileAberto && (
                    <div
                        className="ui-modal-backdrop fixed inset-0 z-30 bg-[var(--overlay)] lg:hidden"
                        onClick={() => setMenuMobileAberto(false)}
                    >
                        <nav
                            aria-label="Navegação móvel"
                            onClick={event => event.stopPropagation()}
                            className="absolute inset-y-0 left-0 w-[min(300px,85vw)] overflow-y-auto rounded-r-2xl border-r border-[var(--border)] bg-[var(--sidebar)] px-4 py-5 shadow-xl"
                        >
                            <div className="mb-5 flex items-center justify-between border-b border-[var(--border)] pb-4">
                                <div className="flex items-center gap-2">
                                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--accent)] text-[11px] font-black text-white shadow-lg">
                                        GF
                                    </span>
                                    <span>
                                        <strong className={`block text-[12px] font-bold ${cores.heading}`}>G. Fernando</strong>
                                        <span className={`mt-0.5 block text-[9px] ${cores.subtleText}`}>Navegação do painel</span>
                                    </span>
                                </div>

                                <button
                                    onClick={() => setMenuMobileAberto(false)}
                                    aria-label="Fechar navegação"
                                    className="grid h-8 w-8 place-items-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--row-hover)]"
                                >
                                    <BsX />
                                </button>
                            </div>

                            {gruposNavegacao
                                .filter(grupo =>
                                    secoesVisiveis.some(secao => secao.grupo === grupo),
                                )
                                .map(grupo => (
                                    <div key={grupo} className="mb-5">
                                        <div className="mb-2 px-2">
                                            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">{grupo}</p>
                                            <p className="mt-0.5 text-[8px] text-[var(--text-muted)]">{descricoesGrupos[grupo]}</p>
                                        </div>

                                        {secoesVisiveis
                                            .filter(secao => secao.grupo === grupo)
                                            .map(secao => {
                                                const ativo = secaoAtual === secao.id;

                                                return (
                                                    <button
                                                        key={secao.id}
                                                        onClick={() => navegar(secao.id)}
                                                        aria-current={ativo ? "page" : undefined}
                                                        className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-2.5 text-left text-[12px] ${
                                                            ativo
                                                                ? "bg-[var(--accent-soft)] font-semibold text-[var(--accent-text)]"
                                                                : "text-[var(--text-secondary)] hover:bg-[var(--row-hover)]"
                                                        }`}
                                                    >
                                                        <span
                                                            className={`text-[15px] ${ativo ? "text-[var(--accent)]" : "text-[var(--text-muted)]"}`}
                                                        >
                                                            {secao.icone}
                                                        </span>
                                                        {secao.nome}
                                                        {secao.id === "solicitacoes" &&
                                                            (solicitacoesResumoQuery.data?.total ??
                                                                0) > 0 && (
                                                                <span className="ml-auto rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                                                                    {
                                                                        solicitacoesResumoQuery.data
                                                                            ?.total
                                                                    }
                                                                </span>
                                                            )}
                                                    </button>
                                                );
                                            })}
                                    </div>
                                ))}
                        </nav>
                    </div>
                )}

                <main
                    className="min-w-0 flex-1 px-3 py-4 pb-24 transition-colors duration-200 sm:px-7 sm:py-8 sm:pb-28 xl:px-10"
                    style={{ backgroundColor: "var(--surface-secondary)" }}
                >
                    {avisoRecuperacao && (
                        <section role="alert" className="mx-auto mb-5 flex w-full max-w-[1600px] flex-col gap-3 rounded-2xl border border-[var(--danger)]/25 bg-[var(--danger-soft)] p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-[var(--danger)]">Não foi possível carregar a tela</p>
                                <p className="mt-1 text-xs leading-5 text-[var(--text-primary)]">{avisoRecuperacao.mensagem}</p>
                                <p className="mt-2 text-[11px] text-[var(--text-secondary)]">
                                    Último salvamento confirmado: <strong className="text-[var(--text-primary)]">{avisoRecuperacao.ultimoSalvamento ? avisoRecuperacao.ultimoSalvamento.toLocaleString("pt-BR") : "Nenhum horário confirmado encontrado para este aluno neste navegador"}</strong>
                                </p>
                                <p className="mt-1 text-[10px] text-[var(--text-muted)]">Esse horário representa a última gravação confirmada no servidor; alterações posteriores podem não ter sido salvas.</p>
                            </div>
                            <button type="button" onClick={() => setAvisoRecuperacao(null)} className="shrink-0 rounded-lg border border-[var(--danger)]/30 px-3 py-2 text-[11px] font-semibold text-[var(--danger)] transition hover:bg-[var(--danger)]/10">Fechar aviso</button>
                        </section>
                    )}
                    {carregandoAlunoId && (
                        <div role="status" aria-live="polite" className="mx-auto mb-5 flex w-full max-w-[1600px] items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-xs font-medium text-[var(--text-secondary)]">
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--accent)] border-r-transparent" />
                            Carregando ficha do aluno. Aguarde a resposta da API...
                        </div>
                    )}
                    <div className="mx-auto w-full max-w-[1600px]">
                        <div key={secaoAtual} className="route-enter">
                            {renderConteudo()}
                        </div>
                    </div>
                </main>

                <footer className="flex min-h-9 items-center justify-between border-t border-[var(--border)] bg-[var(--header)] px-4 text-[9px] text-[var(--text-muted)] sm:px-7">
                    <span>G. Fernando · Gestão de treinamento</span>
                    <span>Dados sincronizados com o servidor</span>
                </footer>
            </div>

            <nav aria-label="Atalhos móveis" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-[var(--border)] bg-[var(--header)]/95 px-2 pt-2 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur-lg lg:hidden" style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}>
                {[
                    { id: "inicio", label: "Início" },
                    { id: "alunos", label: "Alunos" },
                    { id: "controleAluno", label: "Controle" },
                    { id: "chat", label: "Mensagens" },
                ].filter(item => secoesVisiveis.some(secao => secao.id === item.id)).map(item => {
                    const secao = secoes.find(entry => entry.id === item.id);
                    const ativo = secaoAtual === item.id;
                    return (
                        <button key={item.id} type="button" onClick={() => navegar(item.id)} aria-current={ativo ? "page" : undefined} className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[9px] font-semibold ${ativo ? "text-[var(--accent-text)]" : "text-[var(--text-muted)]"}`}>
                            <span className="text-[17px]">{secao?.icone}</span>
                            <span className="max-w-full truncate">{item.label}</span>
                        </button>
                    );
                })}
                <button type="button" onClick={() => setMenuMobileAberto(true)} aria-label="Abrir todas as seções" className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[9px] font-semibold text-[var(--text-muted)]">
                    <BsThreeDots className="text-[17px]" />
                    <span>Mais</span>
                </button>
            </nav>

            {modalNovoAluno && (
                <div
                    className="ui-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay)] p-4"
                    role="presentation"
                    onMouseDown={event => {
                        if (event.target === event.currentTarget) setModalNovoAluno(false);
                    }}
                >
                    <form
                        onSubmit={confirmarCriacaoAluno}
                        autoComplete="off"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="titulo-novo-aluno"
                        className="w-full max-w-[500px] rounded-2xl border border-[var(--border)] bg-[var(--modal-bg)] p-6 shadow-2xl"
                    >
                        <div className="mb-5">
                            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--accent-text)]">
                                Importação administrativa
                            </p>
                            <h2
                                id="titulo-novo-aluno"
                                className={`mt-1 text-[20px] font-semibold ${cores.heading}`}
                            >
                                Importar aluno existente
                            </h2>
                            <p className={`mt-2 text-[11px] leading-5 ${cores.bodyText}`}>
                                Use somente para migrar um aluno que já fazia parte da equipe. Novos
                                alunos devem receber um link de convite e passar pelo formulário de
                                análise antes da liberação do acesso.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <label className="grid gap-1.5 sm:col-span-2">
                                <span className={`text-[10px] font-semibold ${cores.bodyText}`}>
                                    Nome completo
                                </span>
                                <input
                                    required
                                    minLength={2}
                                    autoComplete="off"
                                    value={novoNome}
                                    onChange={event => setNovoNome(event.target.value)}
                                    className={`h-10 px-3 text-[12px] outline-none ${cores.input}`}
                                />
                            </label>
                            <label className="grid gap-1.5 sm:col-span-2">
                                <span className={`text-[10px] font-semibold ${cores.bodyText}`}>
                                    E-mail
                                </span>
                                <input
                                    required
                                    type="email"
                                    autoComplete="off"
                                    value={novoEmail}
                                    onChange={event => setNovoEmail(event.target.value)}
                                    className={`h-10 px-3 text-[12px] outline-none ${cores.input}`}
                                />
                            </label>
                            <label className="grid gap-1.5">
                                <span className={`text-[10px] font-semibold ${cores.bodyText}`}>
                                    Telefone
                                </span>
                                <input
                                    autoComplete="off"
                                    value={novoTelefone}
                                    onChange={event => setNovoTelefone(event.target.value)}
                                    className={`h-10 px-3 text-[12px] outline-none ${cores.input}`}
                                />
                            </label>
                            <label className="grid gap-1.5">
                                <span className={`text-[10px] font-semibold ${cores.bodyText}`}>
                                    Data de nascimento
                                </span>
                                <input
                                    type="date"
                                    autoComplete="off"
                                    value={novaDataNascimento}
                                    onChange={event => setNovaDataNascimento(event.target.value)}
                                    className={`h-10 px-3 text-[12px] outline-none ${cores.input}`}
                                />
                            </label>
                            <label className="grid gap-1.5">
                                <span className={`text-[10px] font-semibold ${cores.bodyText}`}>
                                    Senha inicial
                                </span>
                                <input
                                    required
                                    type="password"
                                    minLength={8}
                                    autoComplete="new-password"
                                    value={novaSenha}
                                    onChange={event => setNovaSenha(event.target.value)}
                                    className={`h-10 px-3 text-[12px] outline-none ${cores.input}`}
                                />
                            </label>
                            <label className="grid gap-1.5">
                                <span className={`text-[10px] font-semibold ${cores.bodyText}`}>
                                    Confirmar senha
                                </span>
                                <input
                                    required
                                    type="password"
                                    minLength={8}
                                    autoComplete="new-password"
                                    value={confirmarNovaSenha}
                                    onChange={event => setConfirmarNovaSenha(event.target.value)}
                                    className={`h-10 px-3 text-[12px] outline-none ${cores.input}`}
                                />
                            </label>
                        </div>

                        <p className={`mt-3 text-[10px] ${cores.subtleText}`}>
                            A senha inicial deve ter ao menos 8 caracteres. Combine a senha com o
                            aluno por um canal seguro.
                        </p>
                        {erroNovoAluno && (
                            <p
                                role="alert"
                                className="mt-3 rounded-lg bg-[var(--danger-soft)] px-3 py-2 text-[11px] text-[var(--danger)]"
                            >
                                {erroNovoAluno}
                            </p>
                        )}
                        {infoNovoAluno && (
                            <p className="mt-3 rounded-lg bg-[var(--accent-soft)] px-3 py-2 text-[11px] text-[var(--accent-text)]">
                                {infoNovoAluno}
                            </p>
                        )}

                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setModalNovoAluno(false)}
                                className={`h-9 px-4 text-[11px] font-semibold ${cores.secondaryButton}`}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className={`h-9 px-4 text-[11px] font-semibold ${cores.primaryButton}`}
                            >
                                Criar conta
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {alunoParaExcluir && (
                <div
                    className="ui-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay)] p-4"
                    role="presentation"
                    onMouseDown={event => {
                        if (event.target === event.currentTarget) setAlunoParaExcluir(null);
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="titulo-excluir-aluno"
                        className="w-full max-w-[420px] rounded-2xl border border-[var(--border)] bg-[var(--modal-bg)] p-6 shadow-2xl"
                    >
                        <div className="mb-5 flex items-start justify-between">
                            <div>
                                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--danger)]">
                                    Desativação de conta
                                </p>
                                <h2
                                    id="titulo-excluir-aluno"
                                    className={`mt-1 text-[19px] font-semibold tracking-[-0.03em] ${cores.heading}`}
                                >
                                    Desativar aluno?
                                </h2>
                            </div>

                            <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--danger-soft)] text-[var(--danger)]">
                                <BsTrash3 />
                            </span>
                        </div>

                        <div className="border-y border-[var(--border)] py-4">
                            <p className={`text-[11px] ${cores.bodyText}`}>
                                Você está prestes a remover este registro:
                            </p>
                            <p className={`mt-1 text-[13px] font-semibold ${cores.heading}`}>
                                {alunoParaExcluir.nome}
                            </p>
                            <p className={`mt-3 text-[11px] leading-5 ${cores.bodyText}`}>
                                A conta será desativada e o acesso será bloqueado. Avaliações,
                                anamneses, treinos, execuções e histórico serão preservados. Os
                                Personais vinculados serão avisados da remoção do aluno.
                            </p>
                            <div className="mt-4 grid gap-2">
                                <label
                                    className={`grid gap-1.5 text-[10px] font-semibold ${cores.bodyText}`}
                                >
                                    Motivo da desativação
                                    <select
                                        value={motivoExclusao}
                                        onChange={event => setMotivoExclusao(event.target.value)}
                                        className={`h-10 rounded-lg px-3 text-[11px] ${cores.input}`}
                                    >
                                        {MOTIVOS_OPERACAO.map(([valor, rotulo]) => (
                                            <option key={valor} value={valor}>
                                                {rotulo}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label
                                    className={`grid gap-1.5 text-[10px] font-semibold ${cores.bodyText}`}
                                >
                                    Detalhes (opcional; obrigatório para "Outro")
                                    <textarea
                                        value={detalheExclusao}
                                        onChange={event => setDetalheExclusao(event.target.value)}
                                        maxLength={500}
                                        rows={2}
                                        className={`resize-y rounded-lg px-3 py-2 text-[11px] ${cores.input}`}
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    setAlunoParaExcluir(null);
                                    setDetalheExclusao("");
                                }}
                                className={`h-9 px-4 text-[11px] font-semibold ${cores.secondaryButton}`}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={excluirAluno}
                                disabled={
                                    executandoExclusao ||
                                    (motivoExclusao === "OUTRO" && !detalheExclusao.trim())
                                }
                                aria-busy={executandoExclusao}
                                className="h-9 rounded-lg bg-[var(--danger)] px-4 text-[11px] font-semibold text-white hover:brightness-95"
                            >
                                {executandoExclusao ? "Desativando..." : "Desativar conta"}
                            </button>
                        </div>
                    </section>
                </div>
            )}

            {personalParaExcluir && (
                <div
                    className="ui-modal-backdrop fixed inset-0 z-[70] flex items-center justify-center bg-[var(--overlay)] p-4"
                    role="presentation"
                    onMouseDown={event => {
                        if (event.target === event.currentTarget && !executandoExclusao) {
                            setPersonalParaExcluir(null);
                            setResumoExclusaoPersonal(null);
                        }
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="titulo-desativar-personal"
                        className="flex max-h-[90vh] w-full max-w-[560px] flex-col rounded-2xl border border-[var(--border)] bg-[var(--modal-bg)] p-6 shadow-2xl"
                    >
                        <div className="mb-4 flex items-start justify-between gap-3">
                            <div>
                                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--danger)]">
                                    Desativação administrativa
                                </p>
                                <h2
                                    id="titulo-desativar-personal"
                                    className={`mt-1 text-[19px] font-semibold ${cores.heading}`}
                                >
                                    Desativar Personal?
                                </h2>
                                <p className={`mt-1 text-[11px] ${cores.bodyText}`}>
                                    {personalParaExcluir.nomeCompleto} · {personalParaExcluir.email}
                                </p>
                            </div>
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--danger-soft)] text-[var(--danger)]">
                                <BsTrash3 />
                            </span>
                        </div>

                        {carregandoResumoExclusao ? (
                            <LoadingState
                                label="Consultando alunos convidados..."
                                className="min-h-28"
                            />
                        ) : resumoExclusaoPersonal ? (
                            <>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="rounded-lg border border-[var(--border)] p-3">
                                        <p className={`text-[10px] ${cores.subtleText}`}>
                                            Alunos convidados por este profissional
                                        </p>
                                        <p
                                            className={`mt-1 text-xl font-semibold ${cores.heading}`}
                                        >
                                            {resumoExclusaoPersonal.totalAlunos}
                                        </p>
                                    </div>
                                    <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-3">
                                        <p className="text-[10px] text-amber-700">
                                            Acesso após desativação
                                        </p>
                                        <p className="mt-1 text-xl font-semibold text-amber-700">
                                            Compartilhado
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-3 min-h-0 flex-1 overflow-y-auto rounded-lg border border-[var(--border)]">
                                    <div className="sticky top-0 border-b border-[var(--border)] bg-[var(--surface)] px-3 py-2">
                                        <p
                                            className={`text-[10px] font-semibold ${cores.bodyText}`}
                                        >
                                            Alunos cuja origem de convite está registrada neste profissional
                                        </p>
                                    </div>
                                    {resumoExclusaoPersonal.alunos.length === 0 ? (
                                        <p className={`p-3 text-[11px] ${cores.subtleText}`}>
                                            Este profissional ainda não possui convites aceitos.
                                        </p>
                                    ) : (
                                        <ul className="divide-y divide-[var(--border)]">
                                            {resumoExclusaoPersonal.alunos.map(aluno => (
                                                <li
                                                    key={aluno.id}
                                                    className="flex items-center justify-between gap-3 px-3 py-2.5"
                                                >
                                                    <span className="min-w-0">
                                                        <span
                                                            className={`block truncate text-[11px] font-semibold ${cores.heading}`}
                                                        >
                                                            {aluno.nomeCompleto}
                                                        </span>
                                                        <span
                                                            className={`mt-0.5 block truncate text-[10px] ${cores.subtleText}`}
                                                        >
                                                            {aluno.email}
                                                        </span>
                                                    </span>
                                                    <span className="shrink-0 text-right text-[9px] text-[var(--text-muted)]">
                                                        Origem registrada
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                                <p className={`mt-3 text-[10px] leading-5 ${cores.bodyText}`}>
                                    A conta do profissional será desativada, mas a origem dos
                                    convites continuará registrada. A equipe mantém acesso
                                    compartilhado aos alunos; fichas, avaliações, treinos e histórico
                                    serão preservados.
                                </p>
                                <div className="mt-3 grid gap-2">
                                    <label
                                        className={`grid gap-1.5 text-[10px] font-semibold ${cores.bodyText}`}
                                    >
                                        Motivo da desativação
                                        <select
                                            value={motivoExclusao}
                                            onChange={event =>
                                                setMotivoExclusao(event.target.value)
                                            }
                                            className={`h-10 rounded-lg px-3 text-[11px] ${cores.input}`}
                                        >
                                            {MOTIVOS_OPERACAO.map(([valor, rotulo]) => (
                                                <option key={valor} value={valor}>
                                                    {rotulo}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <label
                                        className={`grid gap-1.5 text-[10px] font-semibold ${cores.bodyText}`}
                                    >
                                        Detalhes (opcional; obrigatório para "Outro")
                                        <textarea
                                            value={detalheExclusao}
                                            onChange={event =>
                                                setDetalheExclusao(event.target.value)
                                            }
                                            maxLength={500}
                                            rows={2}
                                            className={`resize-y rounded-lg px-3 py-2 text-[11px] ${cores.input}`}
                                        />
                                    </label>
                                </div>
                            </>
                        ) : (
                            <p role="alert" className="text-[11px] text-[var(--danger)]">
                                Não foi possível obter a lista de alunos. Feche e tente novamente.
                            </p>
                        )}

                        <div className="mt-5 flex justify-end gap-2 border-t border-[var(--border)] pt-4">
                            <button
                                type="button"
                                disabled={executandoExclusao}
                                onClick={() => {
                                    setPersonalParaExcluir(null);
                                    setResumoExclusaoPersonal(null);
                                }}
                                className={`h-9 px-4 text-[11px] font-semibold ${cores.secondaryButton}`}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={() => void excluirPersonal()}
                                disabled={
                                    executandoExclusao ||
                                    carregandoResumoExclusao ||
                                    !resumoExclusaoPersonal ||
                                    (motivoExclusao === "OUTRO" && !detalheExclusao.trim())
                                }
                                aria-busy={executandoExclusao}
                                className="h-9 rounded-lg bg-[var(--danger)] px-4 text-[11px] font-semibold text-white disabled:opacity-50"
                            >
                                {executandoExclusao ? "Desativando..." : "Confirmar desativação"}
                            </button>
                        </div>
                    </section>
                </div>
            )}

        </div>
    );
}
