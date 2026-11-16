import {
    BsHouseDoor,
    BsPeople,
    BsClipboard2Pulse,
    BsCalendar3,
    BsBarChart,
    BsChatDots,
    BsBell,
    BsQuestionCircle,
    BsGear,
    BsFileEarmarkText,
    BsDownload,
    BsTrash3,
    BsPlusLg,
    BsSearch,
    BsThreeDots,
    BsPersonCircle,
    BsFiletypeJson,
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
} from "react-icons/bs";
import { FaPeopleGroup, FaRegCircleQuestion } from "react-icons/fa6";
import { VscFeedback } from "react-icons/vsc";
import { IoChatbubblesSharp } from "react-icons/io5";
import { TbUserStar } from "react-icons/tb";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAvaliacao } from "../context/avaliacaoContext";
import { useNavigate } from "react-router";
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
import SolicitacoesCadastro from "./SolicitacoesCadastro";
import CentralComunicacao from "./CentralComunicacao";
import { comunicacaoService } from "../service/comunicacaoService";
import { cadastroAlunoService } from "../service/cadastroAlunoService";
import AtividadesAdmin from "./AtividadesAdmin";
import Relatorios from "./Relatorios";
import ControleAluno from "./ControleAluno";
import ControleAvancado from "./ControleAvancado";
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
import ArquivosEquipe from "./ArquivosEquipe";
import TarefasPersonal from "./TarefasPersonal";
import FeedbackAlunos from "./FeedbackAlunos";
import IndicadoresEquipe from "./IndicadoresEquipe";
import ManutencaoSistema from "./ManutencaoSistema";

interface AlunoPainel {
    id: string;
    nome: string;
    email: string;
    telefone: string;
    criadoEm: string;
    statusCadastro: string;
    possuiFichaTecnica: boolean;
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
        grupo: "Workspace",
        icone: <BsHouseDoor />,
    },
    { id: "alunos", nome: "Alunos", grupo: "Workspace", icone: <BsPeople /> },
    { id: "solicitacoes", nome: "Solicitações", grupo: "Workspace", icone: <BsClipboard2Pulse /> },
    {
        id: "equipe",
        nome: "Equipe",
        grupo: "Workspace",
        icone: <FaPeopleGroup />,
    },
    { id: "indicadores", nome: "Indicadores da equipe", grupo: "Workspace", icone: <TbUserStar /> },
    {
        id: "avaliacoes",
        nome: "Avaliações",
        grupo: "Treinamento",
        icone: <BsClipboard2Pulse />,
    },
    {
        id: "periodizacao",
        nome: "Periodização",
        grupo: "Treinamento",
        icone: <BsCalendar3 />,
    },
    {
        id: "relatorios",
        nome: "Relatórios",
        grupo: "Treinamento",
        icone: <BsBarChart />,
    },
    {
        id: "chat",
        nome: "Central de mensagens",
        grupo: "Comunicação",
        icone: <IoChatbubblesSharp />,
    },
    { id: "emails", nome: "Central de e-mails", grupo: "Comunicação", icone: <BsEnvelope /> },
    { id: "arquivos", nome: "Arquivos da equipe", grupo: "Comunicação", icone: <BsFolder2Open /> },
    {
        id: "feedback",
        nome: "Feedback",
        grupo: "Comunicação",
        icone: <VscFeedback />,
    },
    {
        id: "ajuda",
        nome: "Central de ajuda",
        grupo: "Sistema",
        icone: <FaRegCircleQuestion />,
    },
    {
        id: "log",
        nome: "Atividades",
        grupo: "Sistema",
        icone: <BsFileEarmarkText />,
    },
    {
        id: "configuracoes",
        nome: "Configurações",
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
        nome: "Controle avançado",
        grupo: "Acompanhamento",
        icone: <BsCpu />,
    },
    {
        id: "tarefas",
        nome: "Agenda de tarefas",
        grupo: "Acompanhamento",
        icone: <BsClipboard2Pulse />,
    },
    { id: "manutencao", nome: "Manutenção", grupo: "Sistema", icone: <BsGear /> },
];

const gruposNavegacao = ["Workspace", "Treinamento", "Acompanhamento", "Comunicação", "Sistema"];

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
    const queryClient = useQueryClient();
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

    const [secaoAtual, setSecaoAtual] = useState("alunos");
    const alunosQuery = useQuery({
        queryKey: ["alunos"],
        queryFn: cadastroService.listarAlunos,
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
    const [personalSelecionadoId, setPersonalSelecionadoId] = useState("");
    const vinculosQuery = useQuery({
        queryKey: ["personal-alunos", personalSelecionadoId],
        queryFn: () => cadastroService.listarVinculos(personalSelecionadoId),
        enabled: user?.tipo === "ADMIN" && Boolean(personalSelecionadoId),
    });
    const [novoPersonalNome, setNovoPersonalNome] = useState("");
    const [novoPersonalEmail, setNovoPersonalEmail] = useState("");
    const [novoPersonalTelefone, setNovoPersonalTelefone] = useState("");
    const [novoPersonalSenha, setNovoPersonalSenha] = useState("");
    const [alunoParaVincularId, setAlunoParaVincularId] = useState("");
    const [erroEquipe, setErroEquipe] = useState("");
    const [sucessoEquipe, setSucessoEquipe] = useState("");
    const [salvandoEquipe, setSalvandoEquipe] = useState(false);
    const [personalParaExcluir, setPersonalParaExcluir] = useState<PersonalResumoApi | null>(null);
    const [resumoExclusaoPersonal, setResumoExclusaoPersonal] =
        useState<PersonalExclusaoResumoApi | null>(null);
    const [carregandoResumoExclusao, setCarregandoResumoExclusao] = useState(false);
    const [vinculoParaDesvincular, setVinculoParaDesvincular] = useState<{
        id: string;
        alunoNome: string;
        personalNome: string;
    } | null>(null);
    const [motivoExclusao, setMotivoExclusao] = useState("ENCERRAMENTO_ADMINISTRATIVO");
    const [detalheExclusao, setDetalheExclusao] = useState("");
    const [executandoExclusao, setExecutandoExclusao] = useState(false);
    const alunos: AlunoPainel[] = (alunosQuery.data ?? []).map((aluno: AlunoResumoApi) => ({
        id: aluno.id,
        nome: aluno.nomeCompleto,
        email: aluno.email,
        telefone: aluno.telefone ?? "",
        criadoEm: aluno.criadoEm ?? "",
        statusCadastro: aluno.statusCadastro ?? "APROVADO",
        possuiFichaTecnica: aluno.possuiFichaTecnica === true,
    }));
    const [alunoParaExcluir, setAlunoParaExcluir] = useState<AlunoPainel | null>(null);
    const [busca, setBusca] = useState("");
    const [filtroFicha, setFiltroFicha] = useState<"todos" | "sem-ficha" | "com-ficha">("todos");
    const [menuPerfilAberto, setMenuPerfilAberto] = useState(false);
    const [menuAlunoAberto, setMenuAlunoAberto] = useState<string | null>(null);
    const [menuMobileAberto, setMenuMobileAberto] = useState(false);
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

    const inputImportarRef = useRef<HTMLInputElement>(null);
    const menuPerfilRef = useRef<HTMLDivElement>(null);

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
        const personais = personaisQuery.data ?? [];
        if (!personais.some(personal => personal.id === personalSelecionadoId)) {
            setPersonalSelecionadoId(personais[0]?.id ?? "");
        }
    }, [personaisQuery.data, personalSelecionadoId]);

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
                setAlunoParaExcluir(null);
                setPersonalParaExcluir(null);
                setVinculoParaDesvincular(null);
            }
        }

        document.addEventListener("mousedown", fecharMenus);
        document.addEventListener("keydown", fecharComEscape);

        return () => {
            document.removeEventListener("mousedown", fecharMenus);
            document.removeEventListener("keydown", fecharComEscape);
        };
    }, []);

    const alunosFiltrados = useMemo(() => {
        const termo = busca.trim().toLocaleLowerCase("pt-BR");
        return alunos.filter(aluno => {
            const correspondeFicha =
                filtroFicha === "todos" ||
                (filtroFicha === "sem-ficha" && !aluno.possuiFichaTecnica) ||
                (filtroFicha === "com-ficha" && aluno.possuiFichaTecnica);
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
        setNovoNome("");
        setNovoEmail("");
        setNovoTelefone("");
        setNovaSenha("");
        setConfirmarNovaSenha("");
        setNovaDataNascimento("");
        setErroNovoAluno("");
        setInfoNovoAluno("");
        setDadosImportacao(null);
        setModalNovoAluno(true);
    }

    async function confirmarCriacaoAluno(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setErroNovoAluno("");
        if (novaSenha.length < 12) {
            setErroNovoAluno("A senha inicial deve possuir pelo menos 12 caracteres.");
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
        if (alunoSelecionadoId === aluno.id) {
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

        setCarregandoAlunoId(aluno.id);
        try {
            const [cadastro, grupos] = await Promise.all([
                cadastroService.obterCadastro(aluno.id),
                cadastroService.listarGruposMusculares(),
            ]);
            carregarAvaliacao(mapearCadastroParaAvaliacao(cadastro, grupos), aluno.id);
            if (destino === "ficha") navigate("/avaliacoes");
            else navegar("controleAluno");
        } catch (error) {
            alert(
                error instanceof ApiError
                    ? error.message
                    : "Não foi possível carregar a ficha do aluno.",
            );
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
            if (alunoSelecionadoId === alunoParaExcluir.id) setAlunoSelecionadoId(null);
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
                    : "Não foi possível consultar os alunos vinculados a este Personal.",
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
                queryClient.invalidateQueries({ queryKey: ["personal-alunos"] }),
                queryClient.invalidateQueries({ queryKey: ["comunicacao", "notificacoes"] }),
            ]);
            if (personalSelecionadoId === personalParaExcluir.id) setPersonalSelecionadoId("");
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
        if (novoPersonalSenha.length < 12) {
            setErroEquipe("A senha inicial do Personal deve possuir pelo menos 12 caracteres.");
            return;
        }

        setSalvandoEquipe(true);
        try {
            const personal = await cadastroService.criarPersonal({
                nomeCompleto: novoPersonalNome.trim(),
                email: novoPersonalEmail.trim(),
                telefone: novoPersonalTelefone.trim() || undefined,
                senha: novoPersonalSenha,
            });
            await queryClient.invalidateQueries({ queryKey: ["personais"] });
            setPersonalSelecionadoId(personal.id);
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

    async function vincularAlunoEquipe(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setErroEquipe("");
        setSucessoEquipe("");
        if (!personalSelecionadoId || !alunoParaVincularId) {
            setErroEquipe("Selecione um Personal e um aluno.");
            return;
        }

        setSalvandoEquipe(true);
        try {
            await cadastroService.vincularAluno(personalSelecionadoId, alunoParaVincularId);
            await queryClient.invalidateQueries({
                queryKey: ["personal-alunos", personalSelecionadoId],
            });
            setAlunoParaVincularId("");
            setSucessoEquipe("Aluno vinculado à equipe.");
        } catch (error) {
            setErroEquipe(
                error instanceof ApiError ? error.message : "Não foi possível criar o vínculo.",
            );
        } finally {
            setSalvandoEquipe(false);
        }
    }

    async function confirmarDesvinculacaoEquipe() {
        if (!vinculoParaDesvincular) return;
        setErroEquipe("");
        setSucessoEquipe("");
        setExecutandoExclusao(true);
        try {
            await cadastroService.desvincularAluno(vinculoParaDesvincular.id, {
                motivo: motivoExclusao,
                detalhe: detalheExclusao.trim() || undefined,
            });
            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey: ["personal-alunos", personalSelecionadoId],
                }),
                queryClient.invalidateQueries({ queryKey: ["comunicacao", "notificacoes"] }),
            ]);
            setVinculoParaDesvincular(null);
            setDetalheExclusao("");
            setSucessoEquipe(
                "Vínculo encerrado. O histórico foi preservado e os envolvidos foram notificados.",
            );
        } catch (error) {
            setErroEquipe(
                error instanceof ApiError ? error.message : "Não foi possível encerrar o vínculo.",
            );
        } finally {
            setExecutandoExclusao(false);
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
        Boolean(
            (user as unknown as { controleAvancadoHabilitado?: boolean } | null)
                ?.controleAvancadoHabilitado,
        );
    // Mantém os módulos em desenvolvimento fora da navegação principal.
    const secoesVisiveis = secoes.filter(
        secao =>
            secao.id === "inicio" ||
            secao.id === "alunos" ||
            secao.id === "solicitacoes" ||
            secao.id === "relatorios" ||
            secao.id === "chat" ||
            (secao.id === "emails" && (user?.tipo === "ADMIN" || user?.tipo === "PERSONAL")) ||
            (secao.id === "arquivos" && (user?.tipo === "ADMIN" || user?.tipo === "PERSONAL")) ||
            (secao.id === "feedback" && (user?.tipo === "ADMIN" || user?.tipo === "PERSONAL")) ||
            (secao.id === "indicadores" && user?.tipo === "ADMIN") ||
            (secao.id === "tarefas" && (user?.tipo === "ADMIN" || user?.tipo === "PERSONAL")) ||
            (secao.id === "manutencao" && (user?.tipo === "ADMIN" || user?.tipo === "PERSONAL")) ||
            (secao.id === "log" && user?.tipo === "ADMIN") ||
            (secao.id === "equipe" && user?.tipo === "ADMIN") ||
            (secao.id === "controleAluno" &&
                Boolean(alunoSelecionadoId) &&
                (user?.tipo === "ADMIN" || user?.tipo === "PERSONAL")) ||
            (secao.id === "controleAvancado" &&
                (user?.tipo === "ADMIN" || user?.tipo === "PERSONAL")),
    );

    function renderEquipe() {
        const personais = personaisQuery.data ?? [];
        const vinculos = vinculosQuery.data ?? [];
        const personalSelecionado = personais.find(
            personal => personal.id === personalSelecionadoId,
        );
        const alunosVinculados = vinculos
            .map(vinculo => ({
                vinculo,
                aluno: alunos.find(aluno => aluno.id === vinculo.alunoId),
            }))
            .filter(item => item.aluno);
        const alunosDisponiveis = alunos.filter(
            aluno => !vinculos.some(vinculo => vinculo.alunoId === aluno.id),
        );

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
                            Cadastre profissionais com login próprio e escolha quais alunos cada um
                            pode acompanhar. O acesso profissional é limitado aos alunos vinculados.
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
                                O profissional entra com este e-mail e senha. Ele não terá acesso à
                                administração nem aos alunos de outros profissionais.
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
                                    minLength={12}
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
                                Mínimo de 12 caracteres
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

                    <form
                        onSubmit={vincularAlunoEquipe}
                        autoComplete="off"
                        className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
                    >
                        <div>
                            <h2 className={"text-[15px] font-semibold " + cores.heading}>
                                Vincular aluno
                            </h2>
                            <p className={"mt-1 text-[11px] " + cores.bodyText}>
                                Um aluno pode ter até três Personais ativos.
                            </p>
                        </div>
                        <label className="grid gap-1.5">
                            <span className={"text-[10px] font-semibold " + cores.bodyText}>
                                Personal responsável
                            </span>
                            <select
                                required
                                value={personalSelecionadoId}
                                onChange={event => setPersonalSelecionadoId(event.target.value)}
                                className={"h-10 px-3 text-[12px] outline-none " + cores.input}
                                disabled={!personais.length}
                            >
                                <option value="">Selecione um Personal</option>
                                {personais.map(personal => (
                                    <option key={personal.id} value={personal.id}>
                                        {personal.nomeCompleto}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="grid gap-1.5">
                            <span className={"text-[10px] font-semibold " + cores.bodyText}>
                                Aluno
                            </span>
                            <select
                                required
                                value={alunoParaVincularId}
                                onChange={event => setAlunoParaVincularId(event.target.value)}
                                className={"h-10 px-3 text-[12px] outline-none " + cores.input}
                                disabled={!personalSelecionadoId || !alunosDisponiveis.length}
                            >
                                <option value="">Selecione um aluno</option>
                                {alunosDisponiveis.map(aluno => (
                                    <option key={aluno.id} value={aluno.id}>
                                        {aluno.nome} · {aluno.email}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
                            <span className={"text-[10px] " + cores.subtleText}>
                                {alunosDisponiveis.length} alunos disponíveis para este Personal
                            </span>
                            <button
                                disabled={
                                    salvandoEquipe || !personalSelecionadoId || !alunoParaVincularId
                                }
                                aria-busy={salvandoEquipe}
                                type="submit"
                                className={
                                    "h-9 px-4 text-[11px] font-semibold disabled:opacity-50 " +
                                    cores.primaryButton
                                }
                            >
                                Vincular aluno
                            </button>
                        </div>
                    </form>
                </div>

                <div className="grid gap-5 lg:grid-cols-[minmax(240px,0.75fr)_minmax(0,1.5fr)]">
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
                                {personais.map(personal => {
                                    const ativo = personal.id === personalSelecionadoId;
                                    return (
                                        <div
                                            key={personal.id}
                                            className={
                                                "flex items-center gap-2 px-3 py-2 transition " +
                                                (ativo
                                                    ? "bg-[var(--accent-soft)]"
                                                    : "hover:bg-[var(--row-hover)]")
                                            }
                                        >
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setPersonalSelecionadoId(personal.id)
                                                }
                                                className="min-w-0 flex-1 px-1 py-2 text-left"
                                            >
                                                <span
                                                    className={
                                                        "block truncate text-[12px] font-semibold " +
                                                        (ativo
                                                            ? "text-[var(--accent-text)]"
                                                            : cores.heading)
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
                                            </button>
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
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
                            <div>
                                <h2 className={"text-[12px] font-semibold " + cores.heading}>
                                    Alunos vinculados
                                </h2>
                                <p className={"mt-0.5 text-[10px] " + cores.subtleText}>
                                    {personalSelecionado?.nomeCompleto ??
                                        "Selecione um profissional"}
                                </p>
                            </div>
                            <span className={"text-[10px] " + cores.subtleText}>
                                {alunosVinculados.length} ativos
                            </span>
                        </div>
                        {vinculosQuery.isLoading && personalSelecionadoId ? (
                            <LoadingState
                                label="Carregando vínculos..."
                                className="justify-start p-4"
                            />
                        ) : vinculosQuery.isError ? (
                            <p role="alert" className="p-4 text-[11px] text-[var(--danger)]">
                                {vinculosQuery.error instanceof ApiError
                                    ? vinculosQuery.error.message
                                    : "Não foi possível carregar os vínculos."}
                            </p>
                        ) : alunosVinculados.length === 0 ? (
                            <p className={"p-4 text-[11px] " + cores.subtleText}>
                                Este Personal ainda não possui alunos ativos.
                            </p>
                        ) : (
                            <div className="divide-y divide-[var(--border)]">
                                {alunosVinculados.map(({ vinculo, aluno }) => (
                                    <div
                                        key={vinculo.id}
                                        className="flex flex-col justify-between gap-3 px-4 py-3 sm:flex-row sm:items-center"
                                    >
                                        <div className="min-w-0">
                                            <p
                                                className={
                                                    "truncate text-[12px] font-semibold " +
                                                    cores.heading
                                                }
                                            >
                                                {aluno!.nome}
                                            </p>
                                            <p
                                                className={
                                                    "mt-0.5 truncate text-[10px] " +
                                                    cores.subtleText
                                                }
                                            >
                                                {aluno!.email}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMotivoExclusao("ENCERRAMENTO_ADMINISTRATIVO");
                                                setDetalheExclusao("");
                                                setVinculoParaDesvincular({
                                                    id: vinculo.id,
                                                    alunoNome: aluno!.nome,
                                                    personalNome:
                                                        personalSelecionado?.nomeCompleto ??
                                                        "Personal",
                                                });
                                            }}
                                            className="self-start rounded-md border border-[var(--border)] px-3 py-2 text-[10px] font-semibold text-[var(--danger)] transition hover:bg-[var(--danger-soft)] sm:self-auto"
                                        >
                                            Desvincular aluno
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
                            Seus alunos
                        </h1>

                        <p className={`mt-2 text-[13px] ${cores.bodyText}`}>
                            Gerencie os cadastros, avaliações e fichas de acompanhamento.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
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
                            Importar
                        </button>

                        <button
                            onClick={criarAluno}
                            className={`inline-flex h-10 items-center justify-center gap-2 px-4 text-[11px] font-semibold ${cores.primaryButton}`}
                        >
                            <BsPlusLg />
                            Novo aluno
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
                        {(["todos", "sem-ficha", "com-ficha"] as const).map(filtro => (
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
                                      : "Com ficha técnica"}
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
                                    className="group flex flex-col gap-4 p-4 transition-colors hover:bg-[var(--row-hover)] sm:flex-row sm:items-center sm:justify-between sm:px-5"
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
                                                    <div className="absolute right-0 top-11 z-30 w-44 rounded-lg border border-[var(--border)] bg-[var(--menu-bg)] py-1 shadow-xl">
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
            .slice(0, 4);

        const ultimoCadastro = alunosRecentes[0];

        return (
            <section className="w-full max-w-[1440px] space-y-7">
                {/* Cabeçalho */}
                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                    <div>
                        <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-text)]">
                            <span>Workspace</span>
                            <span className="text-[var(--text-muted)]">/</span>
                            <span>Visão geral</span>
                        </div>

                        <h1
                            className={`text-[28px] font-semibold tracking-[-0.045em] ${cores.heading}`}
                        >
                            Seu espaço de trabalho.
                        </h1>

                        <p className={`mt-2 text-[13px] ${cores.bodyText}`}>
                            Gerencie seus alunos e acompanhe a organização dos seus treinamentos.
                        </p>
                    </div>

                    <button
                        onClick={criarAluno}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-5 text-[12px] font-semibold text-white transition hover:bg-[var(--accent-hover)]"
                    >
                        <BsPlusLg />
                        Novo aluno
                    </button>
                </div>

                {/* Indicadores */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                                Alunos cadastrados
                            </span>
                            <BsPeople className="text-lg text-[var(--accent)]" />
                        </div>

                        <p
                            className={`mt-4 text-[30px] font-semibold tracking-[-0.05em] ${cores.heading}`}
                        >
                            {alunos.length}
                        </p>

                        <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                            Registros na sua base
                        </p>
                    </div>

                    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                                Último cadastro
                            </span>
                            <BsPersonCircle className="text-lg text-[var(--accent)]" />
                        </div>

                        <p
                            className={`mt-4 truncate text-[17px] font-semibold tracking-[-0.03em] ${cores.heading}`}
                        >
                            {ultimoCadastro?.nome || "Nenhum cadastro"}
                        </p>

                        <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                            {ultimoCadastro
                                ? formatarData(ultimoCadastro.criadoEm)
                                : "Sua base ainda está vazia"}
                        </p>
                    </div>

                    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                                Armazenamento
                            </span>
                            <BsFolder2Open className="text-lg text-[var(--accent)]" />
                        </div>

                        <p
                            className={`mt-4 text-[17px] font-semibold tracking-[-0.03em] ${cores.heading}`}
                        >
                            Servidor
                        </p>

                        <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                            Dados sincronizados com o PostgreSQL
                        </p>
                    </div>
                </div>

                {/* Conteúdo principal */}
                <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
                    <div className="min-w-0 space-y-5">
                        {/* Ações */}
                        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                            <div className="border-b border-[var(--border)] px-5 py-4">
                                <h2 className={`text-[13px] font-semibold ${cores.heading}`}>
                                    Acesso rápido
                                </h2>
                                <p className={`mt-1 text-[11px] ${cores.subtleText}`}>
                                    Atalhos para suas principais atividades.
                                </p>
                            </div>

                            <div className="grid gap-3 p-4 sm:grid-cols-2">
                                <button
                                    onClick={criarAluno}
                                    className="group flex min-h-[120px] flex-col justify-between rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] p-4 text-left transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                                            <BsPlusLg className="text-lg" />
                                        </span>

                                        <BsArrowUpRight className="text-[13px] text-[var(--text-muted)] transition group-hover:text-[var(--accent)]" />
                                    </div>

                                    <div className="mt-4">
                                        <strong
                                            className={`block text-[12px] font-semibold ${cores.heading}`}
                                        >
                                            Cadastrar aluno
                                        </strong>
                                        <span
                                            className={`mt-1 block text-[10px] ${cores.bodyText}`}
                                        >
                                            Criar uma nova ficha de acompanhamento.
                                        </span>
                                    </div>
                                </button>

                                <button
                                    onClick={() => navegar("alunos")}
                                    className="group flex min-h-[120px] flex-col justify-between rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] p-4 text-left transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--surface-tertiary)] text-[var(--text-secondary)]">
                                            <BsPeople className="text-lg" />
                                        </span>

                                        <BsArrowUpRight className="text-[13px] text-[var(--text-muted)] transition group-hover:text-[var(--accent)]" />
                                    </div>

                                    <div className="mt-4">
                                        <strong
                                            className={`block text-[12px] font-semibold ${cores.heading}`}
                                        >
                                            Gerenciar alunos
                                        </strong>
                                        <span
                                            className={`mt-1 block text-[10px] ${cores.bodyText}`}
                                        >
                                            Consultar e administrar sua base.
                                        </span>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Alunos recentes */}
                        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                            <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
                                <div>
                                    <h2 className={`text-[13px] font-semibold ${cores.heading}`}>
                                        Cadastros recentes
                                    </h2>
                                    <p className={`mt-1 text-[11px] ${cores.subtleText}`}>
                                        Últimos alunos adicionados.
                                    </p>
                                </div>

                                <button
                                    onClick={() => navegar("alunos")}
                                    className="inline-flex shrink-0 items-center gap-1 rounded-md text-[11px] font-semibold text-[var(--accent-text)] hover:underline"
                                >
                                    Ver todos <BsArrowUpRight />
                                </button>
                            </div>

                            {alunosRecentes.length === 0 ? (
                                <div className="px-5 py-10 text-center">
                                    <BsPeople className="mx-auto text-2xl text-[var(--text-muted)]" />
                                    <p
                                        className={`mt-3 text-[12px] font-semibold ${cores.heading}`}
                                    >
                                        Nenhum aluno cadastrado
                                    </p>
                                    <p className={`mt-1 text-[11px] ${cores.subtleText}`}>
                                        Seus próximos cadastros aparecerão aqui.
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y divide-[var(--border)]">
                                    {alunosRecentes.map(aluno => (
                                        <div
                                            key={aluno.id}
                                            className="flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-[var(--row-hover)]"
                                        >
                                            <div className="flex min-w-0 items-center gap-3">
                                                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-[12px] font-semibold text-[var(--accent-text)]">
                                                    {aluno.nome?.charAt(0)?.toUpperCase() || "A"}
                                                </span>

                                                <div className="min-w-0">
                                                    <p
                                                        className={`truncate text-[12px] font-semibold ${cores.heading}`}
                                                    >
                                                        {aluno.nome}
                                                    </p>
                                                    <p
                                                        className={`mt-0.5 text-[10px] ${cores.subtleText}`}
                                                    >
                                                        {formatarData(aluno.criadoEm)}
                                                    </p>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => abrirAluno(aluno)}
                                                className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 text-[10px] font-semibold text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--accent-text)]"
                                            >
                                                {user?.tipo === "PERSONAL" ? "Assumir" : "Abrir"}{" "}
                                                <BsArrowUpRight />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Painel lateral */}
                    <aside className="space-y-4">
                        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-[var(--warning)]" />
                                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                                    MVP disponível
                                </span>
                            </div>

                            <h2 className={`mt-4 text-[15px] font-semibold ${cores.heading}`}>
                                Sua rotina de treinamento em um só lugar.
                            </h2>

                            <p className={`mt-2 text-[11px] leading-5 ${cores.bodyText}`}>
                                Cadastre alunos, monte avaliações físicas, prescreva treinos,
                                organize a periodização e acompanhe a execução das séries.
                            </p>

                            <div className="mt-5 border-t border-[var(--border)] pt-4">
                                <span className="text-[10px] text-[var(--text-muted)]">
                                    Módulos disponíveis
                                </span>
                                <p className={`mt-1 text-[11px] font-semibold ${cores.heading}`}>
                                    Ficha completa e equipe
                                </p>
                            </div>
                        </div>

                        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
                            <div className="flex items-center gap-2">
                                <BsFiletypeJson className="text-[var(--accent)]" />
                                <h3 className={`text-[12px] font-semibold ${cores.heading}`}>
                                    Importação e exportação
                                </h3>
                            </div>

                            <p className={`mt-2 text-[11px] leading-5 ${cores.bodyText}`}>
                                Transfira fichas entre dispositivos utilizando arquivos JSON.
                            </p>

                            <button
                                onClick={() => navegar("alunos")}
                                className="mt-4 rounded-md text-[11px] font-semibold text-[var(--accent-text)] hover:underline"
                            >
                                Acessar gerenciamento →
                            </button>
                        </div>
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
                    className={`max-w-3xl rounded-xl border ${cores.divider} bg-[var(--surface)] p-5 sm:p-6`}
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
            case "relatorios":
                return <Relatorios />;
            case "configuracoes":
                return renderConfiguracoes();
            case "controleAluno": {
                const aluno = alunos.find(item => item.id === alunoSelecionadoId);
                if (!aluno || !alunoSelecionadoId)
                    return renderSecaoVazia(
                        "Controle do aluno",
                        "Selecione um aluno no diretório para abrir o acompanhamento individual.",
                        <BsActivity />,
                    );
                return (
                    <ControleAluno
                        aluno={{
                            id: aluno.id,
                            nomeCompleto: aluno.nome,
                            email: aluno.email,
                            telefone: aluno.telefone,
                            criadoEm: aluno.criadoEm,
                            possuiFichaTecnica: aluno.possuiFichaTecnica,
                        }}
                        ficha={fichaAtual}
                        onBack={() => navegar("alunos")}
                        onNavigate={navegar}
                    />
                );
            }
            case "controleAvancado":
                return (
                    <ControleAvancado
                        isAdmin={user?.tipo === "ADMIN"}
                        autorizado={acessoControleAvancado}
                        personais={personaisQuery.data ?? []}
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
            <aside className="sticky top-0 hidden h-screen max-h-screen w-[232px] shrink-0 self-start flex-col overflow-hidden border-r border-[var(--border)] bg-[var(--sidebar)] lg:flex">
                <div className="flex h-[76px] items-center gap-3 border-b border-[var(--border)] px-5">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--accent)] text-[12px] font-bold tracking-[-0.08em] text-white">
                        GF
                    </div>
                    <div>
                        <p className={`text-[12px] font-bold tracking-[-0.02em] ${cores.heading}`}>
                            G. Fernando
                        </p>
                        <p className={`mt-0.5 text-[10px] ${cores.subtleText}`}>
                            Training workspace
                        </p>
                    </div>
                </div>

                <div className={`border-b ${cores.divider} px-4 py-4`}>
                    <div
                        className={`flex items-center gap-2 rounded-md px-2 text-[10px] font-semibold uppercase tracking-[0.12em] ${cores.subtleText}`}
                    >
                        <BsPersonCircle className="text-[13px]" /> Área profissional
                    </div>
                    <p className={`mt-2 px-2 text-[12px] font-semibold ${cores.heading}`}>
                        Gestão de treinamento
                    </p>
                </div>

                <nav
                    aria-label="Navegação principal"
                    className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4"
                >
                    {gruposNavegacao
                        .filter(grupo => secoesVisiveis.some(secao => secao.grupo === grupo))
                        .map(grupo => (
                            <div key={grupo} className="mb-5">
                                <p className="mb-2 px-2 text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                                    {grupo}
                                </p>

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
                                                    className={`relative flex min-h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[11px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--accent)] ${
                                                        ativo
                                                            ? "bg-[var(--accent-soft)] text-[var(--accent-text)]"
                                                            : "text-[var(--text-secondary)] hover:bg-[var(--row-hover)] hover:text-[var(--text-primary)]"
                                                    }`}
                                                >
                                                    {ativo && (
                                                        <span className="absolute inset-y-1 left-0 w-[2px] rounded-full bg-[var(--accent)]" />
                                                    )}
                                                    <span
                                                        className={`text-[14px] ${ativo ? "text-[var(--accent)]" : "text-[var(--text-muted)]"}`}
                                                    >
                                                        {secao.icone}
                                                    </span>
                                                    {secao.nome}
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

                <div className={`border-t ${cores.divider} px-5 py-3`}>
                    <div className={`flex items-center gap-2 text-[10px] ${cores.bodyText}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
                        {import.meta.env.DEV ? "Ambiente local" : "Ambiente publicado"}
                    </div>
                    <p className={`mt-1 text-[9px] ${cores.subtleText}`}>
                        {import.meta.env.DEV ? "Versão de desenvolvimento" : "Versão de produção"}
                    </p>
                </div>
            </aside>

            <div className="flex min-h-screen min-w-0 flex-1 flex-col">
                <header className="sticky top-0 z-20 flex h-[60px] shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--header)]/95 px-4 backdrop-blur-sm sm:px-7">
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
                                Workspace
                            </p>
                            <p className={`truncate text-[13px] font-semibold ${cores.heading}`}>
                                {secaoSelecionada.nome}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
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
                                        onClick={() => void logout()}
                                        className="flex w-full items-center gap-2 rounded-md px-4 py-2.5 text-left text-[11px] text-[var(--danger)] hover:bg-[var(--danger-soft)]"
                                    >
                                        <BsX /> Sair da conta
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

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
                                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--accent)] text-[11px] font-bold text-white">
                                        GF
                                    </span>
                                    <span className={`text-[12px] font-bold ${cores.heading}`}>
                                        G. Fernando
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
                                        <p className="mb-2 px-2 text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                                            {grupo}
                                        </p>

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
                    className="flex-1 px-4 py-6 transition-colors duration-200 sm:px-7 sm:py-8 xl:px-10"
                    style={{ backgroundColor: "var(--surface-secondary)" }}
                >
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
                                Cadastro no servidor
                            </p>
                            <h2
                                id="titulo-novo-aluno"
                                className={`mt-1 text-[20px] font-semibold ${cores.heading}`}
                            >
                                Novo aluno
                            </h2>
                            <p className={`mt-2 text-[11px] leading-5 ${cores.bodyText}`}>
                                A conta será criada no PostgreSQL. Para um Personal, o vínculo com
                                sua equipe será feito automaticamente.
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
                                    minLength={12}
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
                                    minLength={12}
                                    autoComplete="new-password"
                                    value={confirmarNovaSenha}
                                    onChange={event => setConfirmarNovaSenha(event.target.value)}
                                    className={`h-10 px-3 text-[12px] outline-none ${cores.input}`}
                                />
                            </label>
                        </div>

                        <p className={`mt-3 text-[10px] ${cores.subtleText}`}>
                            A senha inicial deve ter ao menos 12 caracteres. Combine a senha com o
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
                                label="Consultando alunos vinculados..."
                                className="min-h-28"
                            />
                        ) : resumoExclusaoPersonal ? (
                            <>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="rounded-lg border border-[var(--border)] p-3">
                                        <p className={`text-[10px] ${cores.subtleText}`}>
                                            Alunos vinculados
                                        </p>
                                        <p
                                            className={`mt-1 text-xl font-semibold ${cores.heading}`}
                                        >
                                            {resumoExclusaoPersonal.totalAlunos}
                                        </p>
                                    </div>
                                    <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-3">
                                        <p className="text-[10px] text-amber-700">
                                            Ficarão sem Personal
                                        </p>
                                        <p className="mt-1 text-xl font-semibold text-amber-700">
                                            {resumoExclusaoPersonal.alunosQueFicaraoSemPersonal}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-3 min-h-0 flex-1 overflow-y-auto rounded-lg border border-[var(--border)]">
                                    <div className="sticky top-0 border-b border-[var(--border)] bg-[var(--surface)] px-3 py-2">
                                        <p
                                            className={`text-[10px] font-semibold ${cores.bodyText}`}
                                        >
                                            Alunos afetados por esta desativação
                                        </p>
                                    </div>
                                    {resumoExclusaoPersonal.alunos.length === 0 ? (
                                        <p className={`p-3 text-[11px] ${cores.subtleText}`}>
                                            Este Personal não possui alunos ativos vinculados.
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
                                                    <span
                                                        className={`shrink-0 text-right text-[9px] ${aluno.outrosPersonaisAtivos > 0 ? "text-[var(--success)]" : "text-amber-700"}`}
                                                    >
                                                        {aluno.outrosPersonaisAtivos > 0
                                                            ? `${aluno.outrosPersonaisAtivos} outro(s) Personal(is)`
                                                            : "Sem outro Personal"}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                                <p className={`mt-3 text-[10px] leading-5 ${cores.bodyText}`}>
                                    A conta e os vínculos ativos serão desativados, mas fichas,
                                    avaliações, treinos e histórico permanecerão no banco. Alunos
                                    que ficarem sem acompanhamento e a administração receberão
                                    alertas.
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

            {vinculoParaDesvincular && (
                <div
                    className="ui-modal-backdrop fixed inset-0 z-[70] flex items-center justify-center bg-[var(--overlay)] p-4"
                    role="presentation"
                    onMouseDown={event => {
                        if (event.target === event.currentTarget && !executandoExclusao)
                            setVinculoParaDesvincular(null);
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="titulo-desvincular-aluno"
                        className="w-full max-w-[440px] rounded-2xl border border-[var(--border)] bg-[var(--modal-bg)] p-6 shadow-2xl"
                    >
                        <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--danger)]">
                            Encerramento de vínculo
                        </p>
                        <h2
                            id="titulo-desvincular-aluno"
                            className={`mt-1 text-[19px] font-semibold ${cores.heading}`}
                        >
                            Desvincular aluno?
                        </h2>
                        <p className={`mt-3 text-[11px] leading-5 ${cores.bodyText}`}>
                            <strong>{vinculoParaDesvincular.alunoNome}</strong> deixará a carteira
                            de <strong>{vinculoParaDesvincular.personalNome}</strong>. Se este for o
                            último Personal ativo do aluno, ele e a administração receberão um
                            alerta de falta de acompanhamento. O histórico e a ficha técnica serão
                            preservados.
                        </p>
                        <div className="mt-4 grid gap-2">
                            <label
                                className={`grid gap-1.5 text-[10px] font-semibold ${cores.bodyText}`}
                            >
                                Motivo
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
                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                disabled={executandoExclusao}
                                onClick={() => setVinculoParaDesvincular(null)}
                                className={`h-9 px-4 text-[11px] font-semibold ${cores.secondaryButton}`}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={() => void confirmarDesvinculacaoEquipe()}
                                disabled={
                                    executandoExclusao ||
                                    (motivoExclusao === "OUTRO" && !detalheExclusao.trim())
                                }
                                aria-busy={executandoExclusao}
                                className="h-9 rounded-lg bg-[var(--danger)] px-4 text-[11px] font-semibold text-white disabled:opacity-50"
                            >
                                {executandoExclusao ? "Encerrando..." : "Confirmar desvinculação"}
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}
