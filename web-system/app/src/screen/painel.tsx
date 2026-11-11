import {
  BsHouseDoor,
  BsPeople,
  BsClipboard2Pulse,
  BsCalendar3,
  BsBarChart,
  BsChatDots,
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
} from "react-icons/bs";
import { FaPeopleGroup, FaRegCircleQuestion } from "react-icons/fa6";
import { VscFeedback } from "react-icons/vsc";
import { IoChatbubblesSharp } from "react-icons/io5";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAvaliacao, initialState } from "../context/avaliacaoContext";
import type { Avaliacao } from "../types/avaliacao";
import { useNavigate } from "react-router";

interface AlunoPainel {
  id: string;
  nome: string;
  dados: Avaliacao;
  criadoEm: string;
}

const CHAVE_ALUNOS = "painel_alunos";

const secoes = [
  {
    id: "inicio",
    nome: "Visão geral",
    grupo: "Workspace",
    icone: <BsHouseDoor />,
  },
  { id: "alunos", nome: "Alunos", grupo: "Workspace", icone: <BsPeople /> },
  {
    id: "equipe",
    nome: "Equipe",
    grupo: "Workspace",
    icone: <FaPeopleGroup />,
  },
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
];

const gruposNavegacao = ["Workspace", "Treinamento", "Comunicação", "Sistema"];

const cores = {
  primaryButton:
    "rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]",
  secondaryButton:
    "rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--row-hover)]",
  input:
    "rounded-lg border border-[var(--border-strong)] bg-[var(--input-bg)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15",
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
  const { carregarAvaliacao } = useAvaliacao();
  const navigate = useNavigate();

  const [tema, setTema] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    return localStorage.getItem("painel_tema") === "dark" ? "dark" : "light";
  });

  const [secaoAtual, setSecaoAtual] = useState("alunos");
  const [alunos, setAlunos] = useState<AlunoPainel[]>([]);
  const [alunoParaExcluir, setAlunoParaExcluir] = useState<AlunoPainel | null>(
    null,
  );
  const [busca, setBusca] = useState("");
  const [menuPerfilAberto, setMenuPerfilAberto] = useState(false);
  const [menuAlunoAberto, setMenuAlunoAberto] = useState<string | null>(null);
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);

  const inputImportarRef = useRef<HTMLInputElement>(null);
  const menuPerfilRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    carregarAlunos();
  }, []);

  useEffect(() => {
    localStorage.setItem("painel_tema", tema);
  }, [tema]);

  useEffect(() => {
    function fecharMenus(event: MouseEvent) {
      if (
        menuPerfilRef.current &&
        !menuPerfilRef.current.contains(event.target as Node)
      ) {
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
    if (!termo) return alunos;

    return alunos.filter(
      (aluno) =>
        aluno.nome.toLocaleLowerCase("pt-BR").includes(termo) ||
        aluno.id.toLowerCase().includes(termo),
    );
  }, [alunos, busca]);

  function carregarAlunos() {
    try {
      const dadosSalvos = localStorage.getItem(CHAVE_ALUNOS);
      setAlunos(dadosSalvos ? (JSON.parse(dadosSalvos) as AlunoPainel[]) : []);
    } catch (erro) {
      console.error("Erro ao carregar alunos:", erro);
      setAlunos([]);
    }
  }

  function salvarAlunos(lista: AlunoPainel[]) {
    localStorage.setItem(CHAVE_ALUNOS, JSON.stringify(lista));
    setAlunos(lista);
  }

  function criarAvaliacaoInicial(): Avaliacao {
    const nova = structuredClone(initialState);
    nova.treino = nova.treino.map((treino) => ({
      ...treino,
      id: crypto.randomUUID(),
    }));
    return nova;
  }

  function criarAluno() {
    const dadosIniciais = criarAvaliacaoInicial();
    dadosIniciais.aluno.nomeCompleto = "Novo aluno";

    const novoAluno: AlunoPainel = {
      id: crypto.randomUUID(),
      nome: "Novo aluno",
      criadoEm: new Date().toISOString(),
      dados: dadosIniciais,
    };

    salvarAlunos([...alunos, novoAluno]);
    setSecaoAtual("alunos");
    setBusca("");
  }

  function importarAluno(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;

    const leitor = new FileReader();

    leitor.onload = (e) => {
      try {
        const texto = e.target?.result;
        if (typeof texto !== "string") throw new Error("Arquivo inválido.");

        const dados = JSON.parse(texto);
        const nome =
          dados?.aluno?.nome || dados?.aluno?.nomeCompleto || "Aluno sem nome";

        const novoAluno: AlunoPainel = {
          id: crypto.randomUUID(),
          nome,
          dados,
          criadoEm: new Date().toISOString(),
        };

        salvarAlunos([...alunos, novoAluno]);
        setSecaoAtual("alunos");
        setBusca("");
      } catch (erro) {
        console.error("Erro ao importar aluno:", erro);
        alert("Não foi possível importar o arquivo JSON.");
      }
    };

    leitor.readAsText(arquivo);
    evento.target.value = "";
  }

  function exportarAluno(aluno: AlunoPainel) {
    const blob = new Blob([JSON.stringify(aluno.dados, null, 2)], {
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
  }

  function abrirAluno(aluno: AlunoPainel) {
    localStorage.setItem("aluno_selecionado_id", aluno.id);
    carregarAvaliacao(aluno.dados as Avaliacao);
    navigate("/avaliacao1");
  }

  function excluirAluno() {
    if (!alunoParaExcluir) return;

    const novaLista = alunos.filter(
      (aluno) => aluno.id !== alunoParaExcluir.id,
    );

    salvarAlunos(novaLista);

    const alunoSelecionado = localStorage.getItem("aluno_selecionado_id");
    if (alunoSelecionado === alunoParaExcluir.id) {
      localStorage.removeItem("aluno_selecionado_id");
      localStorage.removeItem("avaliacao_temp");
    }

    setAlunoParaExcluir(null);
  }

  function navegar(secao: string) {
    setSecaoAtual(secao);
    setMenuMobileAberto(false);
    setMenuPerfilAberto(false);
  }

  const secaoSelecionada =
    secoes.find((secao) => secao.id === secaoAtual) ?? secoes[1];

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

        {/* Indicadores */}
        <div className="mb-7 grid gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
              <BsPeople className="text-lg" />
            </span>

            <div>
              <p className="text-[10px] text-[var(--text-muted)]">
                Total de alunos
              </p>
              <p
                className={`mt-0.5 text-[20px] font-semibold tracking-[-0.04em] ${cores.heading}`}
              >
                {alunos.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--surface-tertiary)] text-[var(--text-secondary)]">
              <BsFiletypeJson className="text-lg" />
            </span>

            <div>
              <p className="text-[10px] text-[var(--text-muted)]">
                Formato de intercâmbio
              </p>
              <p className={`mt-1 text-[13px] font-semibold ${cores.heading}`}>
                JSON
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--surface-tertiary)] text-[var(--text-secondary)]">
              <BsFolder2Open className="text-lg" />
            </span>

            <div>
              <p className="text-[10px] text-[var(--text-muted)]">
                Armazenamento
              </p>
              <p className={`mt-1 text-[13px] font-semibold ${cores.heading}`}>
                Neste dispositivo
              </p>
            </div>
          </div>
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
                Selecione um aluno para acessar sua ficha.
              </p>
            </div>

            <label className="relative block w-full sm:w-[290px]">
              <BsSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[var(--text-muted)]" />

              <input
                type="search"
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar aluno..."
                aria-label="Buscar alunos"
                className={`h-10 w-full pl-9 pr-3 text-[11px] outline-none transition ${cores.input}`}
              />
            </label>
          </div>

          {/* Lista vazia */}
          {alunos.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center px-5 py-10 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                <BsPeople className="text-2xl" />
              </span>

              <h3 className={`mt-4 text-[15px] font-semibold ${cores.heading}`}>
                Sua base começa aqui.
              </h3>

              <p
                className={`mt-2 max-w-sm text-[12px] leading-5 ${cores.bodyText}`}
              >
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
            <div className="divide-y divide-[var(--border)]">
              {alunosFiltrados.map((aluno) => (
                <article
                  key={aluno.id}
                  className="group flex flex-col gap-4 p-4 transition-colors hover:bg-[var(--row-hover)] sm:flex-row sm:items-center sm:justify-between sm:px-5"
                >
                  {/* Identificação */}
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-[14px] font-semibold text-[var(--accent-text)]">
                      {aluno.nome?.charAt(0)?.toLocaleUpperCase("pt-BR") || "A"}
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

                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--success-soft)] px-2.5 py-1.5 text-[10px] font-medium text-[var(--success)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
                      Salvo
                    </span>

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        onClick={() => abrirAluno(aluno)}
                        className="inline-flex h-9 min-w-[112px] items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-[11px] font-semibold text-white transition hover:bg-[var(--accent-hover)]"
                      >
                        Abrir ficha
                        <BsArrowUpRight />
                      </button>

                      <div className="relative" data-aluno-menu>
                        <button
                          aria-label={`Mais opções para ${aluno.nome}`}
                          aria-expanded={menuAlunoAberto === aluno.id}
                          onClick={() =>
                            setMenuAlunoAberto(
                              menuAlunoAberto === aluno.id ? null : aluno.id,
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

                            <div className="my-1 border-t border-[var(--border)]" />

                            <button
                              onClick={() => {
                                setAlunoParaExcluir(aluno);
                                setMenuAlunoAberto(null);
                              }}
                              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-[11px] text-[var(--danger)] hover:bg-[var(--danger-soft)]"
                            >
                              <BsTrash3 />
                              Excluir aluno
                            </button>
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
          <span>Os registros são armazenados localmente neste navegador.</span>

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
      .sort(
        (a, b) =>
          new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime(),
      )
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
              Gerencie seus alunos e acompanhe a organização dos seus
              treinamentos.
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
              Local
            </p>

            <p className="mt-1 text-[10px] text-[var(--text-muted)]">
              Dados neste navegador
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
                  {alunosRecentes.map((aluno) => (
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
                        Abrir <BsArrowUpRight />
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
                  Desenvolvimento
                </span>
              </div>

              <h2 className={`mt-4 text-[15px] font-semibold ${cores.heading}`}>
                Seu workspace está evoluindo.
              </h2>

              <p className={`mt-2 text-[11px] leading-5 ${cores.bodyText}`}>
                Novas funcionalidades de gestão, acompanhamento e análise de
                desempenho serão disponibilizadas gradualmente.
              </p>

              <div className="mt-5 border-t border-[var(--border)] pt-4">
                <span className="text-[10px] text-[var(--text-muted)]">
                  Estado atual
                </span>
                <p
                  className={`mt-1 text-[11px] font-semibold ${cores.heading}`}
                >
                  Gestão de alunos disponível
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

  function renderSecaoVazia(
    titulo: string,
    descricao: string,
    icone: React.ReactNode,
  ) {
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

  function renderConteudo() {
    switch (secaoAtual) {
      case "inicio":
        return renderInicio();
      case "alunos":
        return renderAlunos();
      case "equipe":
        return renderSecaoVazia(
          "Equipe",
          "Gestão de profissionais, treinadores e permissões de acesso.",
          <FaPeopleGroup />,
        );
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
        return renderSecaoVazia(
          "Feedback",
          "Sugestões, críticas e retornos enviados pelos alunos.",
          <VscFeedback />,
        );
      case "log":
        return renderSecaoVazia(
          "Atividades",
          "Histórico de ações, alterações e eventos do sistema.",
          <BsFileEarmarkText />,
        );
      case "chat":
        return renderSecaoVazia(
          "Central de mensagens",
          "Comunicação com alunos por canais integrados.",
          <BsChatDots />,
        );
      case "periodizacao":
        return renderSecaoVazia(
          "Periodização",
          "Planejamento de semanas, dias, sessões e distribuição de volume.",
          <BsCalendar3 />,
        );
      case "relatorios":
        return renderSecaoVazia(
          "Relatórios",
          "Indicadores e relatórios de acompanhamento dos alunos.",
          <BsBarChart />,
        );
      case "configuracoes":
        return renderSecaoVazia(
          "Configurações",
          "Preferências e parâmetros gerais da plataforma.",
          <BsGear />,
        );
      default:
        return renderInicio();
    }
  }

  return (
    <div
      data-theme={tema}
      className="painel-theme flex min-h-screen bg-[var(--surface-secondary)] text-[var(--text-primary)]"
    >
      {/* Sidebar desktop */}
      <aside className="hidden w-[232px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--sidebar)] lg:flex">
        <div className="flex h-[76px] items-center gap-3 border-b border-[var(--border)] px-5">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--accent)] text-[12px] font-bold tracking-[-0.08em] text-white">
            GF
          </div>
          <div>
            <p
              className={`text-[12px] font-bold tracking-[-0.02em] ${cores.heading}`}
            >
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
          className="flex-1 overflow-y-auto px-3 py-4"
        >
          {gruposNavegacao.map((grupo) => (
            <div key={grupo} className="mb-5">
              <p className="mb-2 px-2 text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                {grupo}
              </p>

              <div className="space-y-0.5">
                {secoes
                  .filter((secao) => secao.grupo === grupo)
                  .map((secao) => {
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
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </nav>

        <div className={`border-t ${cores.divider} px-5 py-3`}>
          <div
            className={`flex items-center gap-2 text-[10px] ${cores.bodyText}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
            Ambiente local
          </div>
          <p className={`mt-1 text-[9px] ${cores.subtleText}`}>
            Versão de desenvolvimento
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
                G. Fernando{" "}
                <span className="px-1 text-[var(--text-muted)]">/</span>{" "}
                Workspace
              </p>
              <p
                className={`truncate text-[13px] font-semibold ${cores.heading}`}
              >
                {secaoSelecionada.nome}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                setTema((atual) => (atual === "light" ? "dark" : "light"))
              }
              aria-label={
                tema === "light" ? "Ativar tema escuro" : "Ativar tema claro"
              }
              aria-pressed={tema === "dark"}
              title={
                tema === "light" ? "Ativar tema escuro" : "Ativar tema claro"
              }
              className={`inline-flex h-8 items-center gap-2 px-3 text-[11px] font-medium transition-colors ${cores.secondaryButton}`}
            >
              {tema === "light" ? (
                <BsMoonStars size={14} />
              ) : (
                <BsSun size={14} />
              )}
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
                  P
                </span>
                <span
                  className={`hidden text-[11px] font-semibold sm:block ${cores.bodyText}`}
                >
                  Personal
                </span>
              </button>

              {menuPerfilAberto && (
                <div className="absolute right-0 top-10 z-40 w-56 rounded-xl border border-[var(--border)] bg-[var(--menu-bg)] py-2 shadow-lg">
                  <div className="border-b border-[var(--border)] px-4 pb-3">
                    <p className={`text-[12px] font-semibold ${cores.heading}`}>
                      Personal
                    </p>
                    <p className={`mt-0.5 text-[10px] ${cores.subtleText}`}>
                      Administrador
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      navegar("configuracoes");
                      setMenuPerfilAberto(false);
                    }}
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
                </div>
              )}
            </div>
          </div>
        </header>

        {menuMobileAberto && (
          <div
            className="fixed inset-0 z-30 bg-[var(--overlay)] lg:hidden"
            onClick={() => setMenuMobileAberto(false)}
          >
            <nav
              aria-label="Navegação móvel"
              onClick={(event) => event.stopPropagation()}
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

              {gruposNavegacao.map((grupo) => (
                <div key={grupo} className="mb-5">
                  <p className="mb-2 px-2 text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    {grupo}
                  </p>

                  {secoes
                    .filter((secao) => secao.grupo === grupo)
                    .map((secao) => {
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
            {renderConteudo()}
          </div>
        </main>

        <footer className="flex min-h-9 items-center justify-between border-t border-[var(--border)] bg-[var(--header)] px-4 text-[9px] text-[var(--text-muted)] sm:px-7">
          <span>G. Fernando · Gestão de treinamento</span>
          <span>Dados armazenados localmente</span>
        </footer>
      </div>

      {alunoParaExcluir && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay)] p-4"
          role="presentation"
          onMouseDown={(event) => {
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
                  Ação permanente
                </p>
                <h2
                  id="titulo-excluir-aluno"
                  className={`mt-1 text-[19px] font-semibold tracking-[-0.03em] ${cores.heading}`}
                >
                  Excluir aluno?
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
                Os dados deste aluno serão removidos da lista armazenada neste
                navegador. Esta ação não poderá ser desfeita.
              </p>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setAlunoParaExcluir(null)}
                className={`h-9 px-4 text-[11px] font-semibold ${cores.secondaryButton}`}
              >
                Cancelar
              </button>
              <button
                onClick={excluirAluno}
                className="h-9 rounded-lg bg-[var(--danger)] px-4 text-[11px] font-semibold text-white hover:brightness-95"
              >
                Excluir registro
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
