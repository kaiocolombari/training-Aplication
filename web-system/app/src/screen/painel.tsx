import {
    BsFillHouseDoorFill,
    BsSliders,
    BsPeopleFill,
    BsClipboard2PulseFill,
    BsBarChartFill,
    BsGearFill,
    BsPersonPlusFill,
    BsFiletypeJson,
    BsBoxArrowUpRight,
    BsDownload,
    BsFolder2Open,
    BsTrash3Fill,

} from "react-icons/bs";

import {
    FaDumbbell,
    FaCalendarAlt,
    FaFileImport,
    FaPlus,
    FaSearch,
    FaSignOutAlt,
    FaCog,
    FaUser
} from "react-icons/fa";

import { FaPeopleGroup } from "react-icons/fa6";

import warn from "../assets/preditiva1.gif";
import manutencao from "../assets/manutencao.gif";
import { useEffect, useRef, useState } from "react";
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

export default function Painel() {

    // const {
    //     avaliacao,
    //     carregarAvaliacao
    // } = useAvaliacao();

    const navigate = useNavigate();

    const [porcento, setPorcento] = useState(0);

    const [secaoAtual, setSecaoAtual] = useState("alunos");

    const [alunos, setAlunos] = useState<AlunoPainel[]>([]);

    const [alunoParaExcluir, setAlunoParaExcluir] =
        useState<AlunoPainel | null>(null);

    const inputImportarRef = useRef<HTMLInputElement>(null);

    const [isOpen, setIsOpen] = useState(false);

    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const numero = Math.floor(Math.random() * 100) + 1;
        setPorcento(numero);
        carregarAlunos();
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);



    // =========================================================
    // ALUNOS
    // =========================================================

    function carregarAlunos() {
        try {
            const dadosSalvos = localStorage.getItem(CHAVE_ALUNOS);

            if (!dadosSalvos) {
                setAlunos([]);
                return;
            }

            const dados: AlunoPainel[] = JSON.parse(dadosSalvos);

            setAlunos(dados);
        } catch (erro) {
            console.error("Erro ao carregar alunos:", erro);
            setAlunos([]);
        }
    }
    function criarAvaliacaoInicial(): Avaliacao {
        const nova = structuredClone(initialState);

        nova.treino = nova.treino.map(treino => ({
            ...treino,
            id: crypto.randomUUID()
        }));

        return nova;
    }

    function excluirAluno() {

        if (!alunoParaExcluir) {
            return;
        }

        const novaLista = alunos.filter(
            aluno => aluno.id !== alunoParaExcluir.id
        );

        salvarAlunos(novaLista);

        // Se o aluno excluído estava selecionado,
        // remove a seleção atual.
        const alunoSelecionado =
            localStorage.getItem("aluno_selecionado_id");

        if (
            alunoSelecionado === alunoParaExcluir.id
        ) {
            localStorage.removeItem(
                "aluno_selecionado_id"
            );

            localStorage.removeItem(
                "avaliacao_temp"
            );
        }

        setAlunoParaExcluir(null);
    }

    function salvarAlunos(lista: AlunoPainel[]) {
        localStorage.setItem(
            CHAVE_ALUNOS,
            JSON.stringify(lista)
        );

        setAlunos(lista);
    }

    function criarAluno() {

        const dadosIniciais = criarAvaliacaoInicial();

        dadosIniciais.aluno.nomeCompleto = "Novo aluno";

        const novoAluno: AlunoPainel = {
            id: crypto.randomUUID(),
            nome: "Novo aluno",
            criadoEm: new Date().toISOString(),
            dados: dadosIniciais
        };

        salvarAlunos([
            ...alunos,
            novoAluno
        ]);

        setSecaoAtual("alunos");
    }

    function importarAluno(
        evento: React.ChangeEvent<HTMLInputElement>
    ) {

        const arquivo = evento.target.files?.[0];

        if (!arquivo) {
            return;
        }

        const leitor = new FileReader();

        leitor.onload = (e) => {

            try {

                const texto = e.target?.result;

                if (typeof texto !== "string") {
                    throw new Error("Arquivo inválido.");
                }

                const dados = JSON.parse(texto);

                const nome =
                    dados?.aluno?.nome ||
                    "Aluno sem nome";

                const novoAluno: AlunoPainel = {
                    id: crypto.randomUUID(),
                    nome,
                    dados,
                    criadoEm: new Date().toISOString()
                };

                salvarAlunos([
                    ...alunos,
                    novoAluno
                ]);

                setSecaoAtual("alunos");

            } catch (erro) {

                console.error(
                    "Erro ao importar aluno:",
                    erro
                );

                alert(
                    "Não foi possível importar o arquivo JSON."
                );
            }
        };

        leitor.readAsText(arquivo);

        // Permite importar o mesmo arquivo novamente
        evento.target.value = "";
    }

    function exportarAluno(aluno: AlunoPainel) {

        const json = JSON.stringify(
            aluno.dados,
            null,
            2
        );

        const blob = new Blob(
            [json],
            {
                type: "application/json"
            }
        );

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;

        link.download =
            `${aluno.nome || "aluno"}.json`;

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    }

    function abrirAluno(aluno: AlunoPainel) {

        localStorage.setItem(
            "aluno_selecionado_id",
            aluno.id
        );

        // carregarAvaliacao(
        //     aluno.dados as Avaliacao
        // );

        console.log(
            "Aluno aberto:",
            aluno
        );

        navigate("/");
    }

    // =========================================================
    // NAVEGAÇÃO
    // =========================================================

    const secoes = [
        {
            id: "inicio",
            nome: "Início",
            icone: <BsFillHouseDoorFill />
        },
        {
            id: "alunos",
            nome: "Alunos",
            icone: <BsPeopleFill />
        },
        {
            id: "equipe",
            nome: "Equipe",
            icone: <FaPeopleGroup />
        },
        {
            id: "avaliacoes",
            nome: "Avaliações",
            icone: <BsClipboard2PulseFill />
        },
        {
            id: "periodizacao",
            nome: "Periodização",
            icone: <FaCalendarAlt />
        },
        {
            id: "relatorios",
            nome: "Relatórios",
            icone: <BsBarChartFill />
        },
        {
            id: "configuracoes",
            nome: "Configurações",
            icone: <BsGearFill />
        }
    ];

    function navegar(secao: string) {
        setSecaoAtual(secao);
    }

    // =========================================================
    // INÍCIO
    // =========================================================

    function renderInicio() {

        return (
            <section className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-yellow-300/30 bg-gradient-to-br from-yellow-50 via-white to-orange-50 p-10 shadow-xl">

                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-yellow-300/20 blur-2xl" />

                <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-orange-300/20 blur-2xl" />

                <div className="absolute left-0 top-0 w-full overflow-hidden">
                    <div className="bg-yellow-400 py-2 text-center text-sm font-black tracking-[0.3em] text-yellow-950">
                        ⚠️ ÁREA EM MANUTENÇÃO ⚠️
                    </div>
                </div>

                <div className="relative flex flex-col items-center gap-8 pt-8">

                    <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">

                        <img
                            src={warn}
                            alt="Aviso"
                            className="h-52 w-52 object-contain drop-shadow-lg transition-transform duration-300 hover:rotate-3 hover:scale-105"
                        />

                        <img
                            src={manutencao}
                            alt="Em manutenção"
                            className="h-52 w-52 object-contain drop-shadow-lg transition-transform duration-300 hover:-rotate-3 hover:scale-105"
                        />

                    </div>

                    <div className="max-w-2xl space-y-4">

                        <h1 className="text-4xl font-black text-gray-800 sm:text-5xl">
                            Opa! 👷‍♂️
                        </h1>

                        <h2 className="text-2xl font-bold text-yellow-600">
                            Essa parte está em manutenção!
                        </h2>

                        <p className="text-base leading-relaxed text-gray-600 sm:text-lg">
                            Não tive tempo nem paciência para terminar tudo isso, porém quando fizer minha tatuagem posso acabar rapidamente o site inteiro.
                        </p>

                        <p className="font-semibold text-gray-500">
                            Em breve estará tudo funcionando novamente (talvez). 🚧
                        </p>

                    </div>

                    <div className="flex flex-wrap justify-center gap-3">

                        <span className="rounded-full bg-yellow-100 px-4 py-2 text-sm font-bold text-yellow-700">
                            🔧 Ajustando algumas coisas
                        </span>

                        <span className="rounded-full bg-orange-100 px-4 py-2 text-sm font-bold text-orange-700">
                            ☕ Café sendo preparado
                        </span>

                        <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-bold text-green-700">
                            🚀 Voltaremos em breve
                        </span>

                    </div>

                    <div className="w-full max-w-md">

                        <div className="mb-2 flex justify-between text-xs font-bold text-gray-500">

                            <span>
                                Consertando...
                            </span>

                            <span>
                                {porcento}%
                            </span>

                        </div>

                        <div className="h-3 overflow-hidden rounded-full bg-gray-200">

                            <div
                                className="h-full animate-pulse rounded-full bg-gradient-to-r from-yellow-400 to-orange-400"
                                style={{
                                    width: `${porcento}%`
                                }}
                            />

                        </div>

                    </div>

                    <div className="rounded-2xl bg-gray-900 px-6 py-4 text-center text-sm text-gray-200 shadow-lg">

                        <span className="font-mono">
                            &gt; Pagar o Kaio
                        </span>

                        <div className="mt-1 text-gray-400">
                            "Talvez Funcione Mais Rapido"
                        </div>

                    </div>

                </div>

            </section>
        );
    }

    // =========================================================
    // ALUNOS
    // =========================================================

    function renderAlunos() {

        return (
            <section className="w-full max-w-6xl">

                {/* Cabeçalho */}

                <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                    <div>

                        <h1 className="text-3xl font-black text-slate-800">
                            Alunos
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Gerencie os alunos cadastrados no sistema.
                        </p>

                    </div>

                    <div className="flex flex-wrap gap-3">

                        <input
                            ref={inputImportarRef}
                            type="file"
                            accept=".json,application/json"
                            className="hidden"
                            onChange={importarAluno}
                        />

                        <button
                            onClick={() =>
                                inputImportarRef.current?.click()
                            }
                            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:cursor-pointer hover:bg-slate-50 hover:shadow"
                        >
                            <FaFileImport />

                            Importar JSON
                        </button>

                        <button
                            onClick={criarAluno}
                            className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:cursor-pointer hover:bg-slate-800"
                        >
                            <FaPlus />

                            Criar aluno
                        </button>

                    </div>

                </div>


                {/* Informações rápidas */}

                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                        <div className="mb-2 flex items-center gap-3 text-slate-400">
                            <BsPeopleFill />

                            <span className="text-xs font-bold uppercase tracking-wider">
                                Total de alunos
                            </span>
                        </div>

                        <p className="text-3xl font-black text-slate-800">
                            {alunos.length}
                        </p>

                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                        <div className="mb-2 flex items-center gap-3 text-slate-400">
                            <BsFiletypeJson />

                            <span className="text-xs font-bold uppercase tracking-wider">
                                Formato
                            </span>
                        </div>

                        <p className="text-lg font-black text-slate-800">
                            JSON
                        </p>

                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                        <div className="mb-2 flex items-center gap-3 text-slate-400">
                            <BsFolder2Open />

                            <span className="text-xs font-bold uppercase tracking-wider">
                                Armazenamento
                            </span>
                        </div>

                        <p className="text-lg font-black text-slate-800">
                            Local
                        </p>

                    </div>

                </div>


                {/* Lista */}

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                    <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">

                        <h2 className="font-black text-slate-700">
                            Lista de alunos
                        </h2>

                    </div>


                    {alunos.length === 0 ? (

                        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">

                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-400">
                                <BsPeopleFill />
                            </div>

                            <h3 className="text-lg font-black text-slate-700">
                                Nenhum aluno cadastrado
                            </h3>

                            <p className="mt-1 max-w-md text-sm text-slate-500">
                                Crie um novo aluno ou importe um arquivo JSON para começar.
                            </p>

                        </div>

                    ) : (

                        <div className="divide-y divide-slate-100">

                            {alunos.map((aluno) => (

                                <div
                                    key={aluno.id}
                                    className="flex flex-col gap-4 px-6 py-5 transition hover:bg-slate-50 md:flex-row md:items-center md:justify-between"
                                >

                                    <div className="flex min-w-0 items-center gap-4">

                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 font-black text-white">
                                            {aluno.nome
                                                ?.charAt(0)
                                                ?.toUpperCase() || "A"}
                                        </div>

                                        <div className="min-w-0">

                                            <h3 className="truncate font-black text-slate-800">
                                                {aluno.nome}
                                            </h3>

                                            <p className="text-xs text-slate-400">
                                                ID: {aluno.id}
                                            </p>

                                        </div>

                                    </div>


                                    <div className="flex shrink-0 gap-2">

                                        <button
                                            onClick={() =>
                                                abrirAluno(aluno)
                                            }
                                            className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:cursor-pointer hover:bg-slate-800"
                                        >
                                            <BsBoxArrowUpRight />

                                            Abrir
                                        </button>

                                        <button
                                            onClick={() =>
                                                exportarAluno(aluno)
                                            }
                                            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:cursor-pointer hover:bg-slate-50"
                                        >
                                            <BsDownload />

                                            Exportar
                                        </button>

                                        <button
                                            onClick={() =>
                                                setAlunoParaExcluir(aluno)
                                            }
                                            className="flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-600 transition hover:cursor-pointer hover:bg-red-50"
                                        >
                                            <BsTrash3Fill />

                                            Excluir
                                        </button>

                                    </div>

                                </div>

                            ))}

                        </div>

                    )}

                </div>

            </section>
        );
    }

    // =========================================================
    // SEÇÕES TEMPORÁRIAS
    // =========================================================

    function renderSecaoVazia(
        titulo: string,
        descricao: string,
        icone: React.ReactNode
    ) {

        return (
            <section className="flex w-full max-w-5xl items-center justify-center">

                <div className="w-full rounded-3xl border border-slate-200 bg-white p-16 text-center shadow-sm">

                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100 text-3xl text-slate-400">
                        {icone}
                    </div>

                    <h1 className="text-3xl font-black text-slate-800">
                        {titulo}
                    </h1>

                    <p className="mx-auto mt-3 max-w-lg text-slate-500">
                        {descricao}
                    </p>

                    <span className="mt-6 inline-block rounded-full bg-yellow-100 px-4 py-2 text-xs font-black uppercase tracking-wider text-yellow-700">
                        Em desenvolvimento
                    </span>

                </div>

            </section>
        );
    }

    // =========================================================
    // CONTEÚDO
    // =========================================================

    function renderConteudo() {

        switch (secaoAtual) {

            case "inicio":
                return renderInicio();

            case "alunos":
                return renderAlunos();

            case "equipe":
                return renderSecaoVazia(
                    "Equipe",
                    "Aqui ficará a lista de profissionais, treinadores e demais membros da equipe. E dará controle e gestão ampla a usuarios administrativos. Demais usuários terão acesso apenas a seus alunos e avaliações.",
                    <FaPeopleGroup />
                );

            case "avaliacoes":
                return renderSecaoVazia(
                    "Avaliações",
                    "Aqui ficarão as avaliações físicas, anamneses, medidas, dobras cutâneas e demais informações dos alunos.",
                    <BsClipboard2PulseFill />
                );

            case "periodizacao":
                return renderSecaoVazia(
                    "Periodização",
                    "Aqui ficará o planejamento das semanas, dias, sessões e distribuição de volume.",
                    <FaCalendarAlt />
                );

            case "relatorios":
                return renderSecaoVazia(
                    "Relatórios",
                    "Aqui ficarão os relatórios e indicadores dos alunos.",
                    <BsBarChartFill />
                );

            case "configuracoes":
                return renderSecaoVazia(
                    "Configurações",
                    "Aqui ficarão as configurações gerais do sistema.",
                    <BsGearFill />
                );

            default:
                return renderInicio();
        }
    }

    // =========================================================
    // RENDER
    // =========================================================

    return (

        <div className="flex h-screen overflow-hidden bg-gray-100">

            {/* =================================================
                SIDEBAR
            ================================================= */}

            <aside className="flex w-64 shrink-0 flex-col bg-slate-900 text-white">

                {/* Logo */}

                <div className="border-b border-slate-800 p-5">

                    <div className="text-xl font-black">
                        Gabriel Fernando
                    </div>

                    <div className="mt-1 text-xs font-medium text-slate-500">
                        Gestão de Academia
                    </div>

                </div>


                {/* Navegação */}

                <nav className="flex-1 overflow-y-auto p-4">

                    <div className="mb-3 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                        Menu
                    </div>

                    <div className="space-y-1">

                        {secoes.map((secao) => {

                            const selecionada =
                                secaoAtual === secao.id;

                            return (

                                <button
                                    key={secao.id}
                                    onClick={() =>
                                        navegar(secao.id)
                                    }
                                    className={`
                                        flex w-full items-center gap-4 rounded-xl px-4 py-3
                                        text-left text-sm font-bold
                                        hover: cursor-pointer
                                        transition
                                        ${selecionada
                                            ? "bg-slate-700 text-white shadow-sm"
                                            : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                        }
                                    `}
                                >

                                    <span className="text-base">
                                        {secao.icone}
                                    </span>

                                    <span>
                                        {secao.nome}
                                    </span>

                                </button>

                            );

                        })}

                    </div>

                </nav>


                {/* Rodapé */}

                <div className="border-t border-slate-800 p-4">

                    <button
                        className="w-full rounded-xl px-4 py-3 text-left text-sm font-bold text-slate-400 transition hover:bg-slate-800 hover:text-white"
                    >
                        Sair
                    </button>

                </div>

            </aside>


            {/* =================================================
                ÁREA PRINCIPAL
            ================================================= */}

            <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">

                {/* Topbar */}

                <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/90 px-8 backdrop-blur">

                    <div>

                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Painel
                        </p>

                        <h2 className="font-black text-slate-800">
                            {secoes.find(
                                (secao) =>
                                    secao.id === secaoAtual
                            )?.nome}
                        </h2>

                    </div>

                    <div className="flex items-center gap-3">

                        <div className="hidden text-right sm:block">

                            <p className="text-sm font-black text-slate-700">
                                Personal
                            </p>


                            <p className="text-xs text-slate-400">
                                Administrador
                            </p>

                        </div>

                        <div ref={menuRef} className="relative">
                            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 font-black text-white hover:cursor-pointer hover:bg-slate-800"
                                onClick={() => { setIsOpen(!isOpen) }}>
                                P
                            </button>

                            {isOpen && (
                                <div
                                    className="
                absolute right-0 top-full z-50 mt-3
                w-64
                origin-top-right
                overflow-visible
                rounded-2xl
                border border-slate-200
                bg-white
                shadow-[0_12px_35px_rgba(0,0,0,0.12)]
                ring-1 ring-black/5
            "
                                >
                                    {/* SETA */}
                                    <div
                                        className="
                    absolute -top-2 right-3
                    h-4 w-4
                    rotate-45
                    border-l border-t border-slate-200
                    bg-white
                "
                                    />

                                    {/* Cabeçalho */}
                                    <div className="relative px-4 pt-4 pb-3">
                                        <div className="flex items-center gap-3">

                                            {/* Avatar */}
                                            <div
                                                className="
                            flex h-11 w-11 shrink-0
                            items-center justify-center
                            rounded-full
                            bg-slate-700
                            text-white
                            shadow-sm
                        "
                                            >
                                                <FaUser className="text-sm" />
                                            </div>

                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-bold text-slate-800">
                                                    Personal
                                                </p>

                                                <p className="truncate text-xs text-slate-500">
                                                    personal@example.com
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Separador */}
                                    <div className="mx-3 border-t border-slate-100" />

                                    {/* Opções */}
                                    <div className="p-2">

                                        {/* Perfil */}
                                        <a
                                            href="#perfil"
                                            className="
                        group flex items-center gap-3
                        rounded-xl px-3 py-2.5
                        text-sm font-medium text-slate-700
                        transition-all duration-150
                        hover:bg-[#E8F1F2]
                        hover:text-[#1B98E0]
                    "
                                        >
                                            <div
                                                className="
                            flex h-9 w-9 items-center justify-center
                            rounded-lg
                            bg-slate-100
                            text-slate-500
                            transition-colors
                            group-hover:bg-white
                            group-hover:text-[#1B98E0]
                        "
                                            >
                                                <FaUser className="text-sm" />
                                            </div>

                                            <div className="flex-1">
                                                <p>Meu Perfil</p>
                                                <span className="text-[11px] font-normal text-slate-400">
                                                    Visualizar seu perfil
                                                </span>
                                            </div>

                                            <span className="text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[#1B98E0]">
                                                →
                                            </span>
                                        </a>

                                        {/* Configurações */}
                                        <a
                                            href="#configuracoes"
                                            className="
                        group flex items-center gap-3
                        rounded-xl px-3 py-2.5
                        text-sm font-medium text-slate-700
                        transition-all duration-150
                        hover:bg-[#E8F1F2]
                        hover:text-[#1B98E0]
                    "
                                        >
                                            <div
                                                className="
                            flex h-9 w-9 items-center justify-center
                            rounded-lg
                            bg-slate-100
                            text-slate-500
                            transition-colors
                            group-hover:bg-white
                            group-hover:text-[#1B98E0]
                        "
                                            >
                                                <FaCog className="text-sm" />
                                            </div>

                                            <div className="flex-1">
                                                <p>Configurações</p>
                                                <span className="text-[11px] font-normal text-slate-400">
                                                    Preferências da conta
                                                </span>
                                            </div>

                                            <span className="text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[#1B98E0]">
                                                →
                                            </span>
                                        </a>
                                    </div>

                                    {/* Separador */}
                                    <div className="mx-3 border-t border-slate-100" />

                                    {/* Sair */}
                                    <div className="p-2">
                                        <button
                                            onClick={() => {
                                                alert("Saindo...");
                                                setIsOpen(false);
                                            }}
                                            className="
                        group flex w-full items-center gap-3
                        rounded-xl px-3 py-2.5
                        text-left text-sm font-medium
                        text-red-500
                        transition-all duration-150
                        hover:bg-red-50
                        hover:text-red-600
                    "
                                        >
                                            <div
                                                className="
                            flex h-9 w-9 items-center justify-center
                            rounded-lg
                            bg-red-50
                            text-red-400
                            transition-colors
                            group-hover:bg-white
                            group-hover:text-red-500
                        "
                                            >
                                                <FaSignOutAlt className="text-sm" />
                                            </div>

                                            <div>
                                                <p>Sair da conta</p>
                                                <span className="text-[11px] font-normal text-red-300">
                                                    Encerrar sessão
                                                </span>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>

                </header>


                {/* Conteúdo */}

                <div className="flex min-h-full justify-center p-8">

                    {renderConteudo()}

                    {alunoParaExcluir && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">

                            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

                                <div className="mb-5 flex items-center gap-4">

                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-xl text-red-600">
                                        <BsTrash3Fill />
                                    </div>

                                    <div>
                                        <h2 className="text-xl font-black text-slate-800">
                                            Excluir aluno?
                                        </h2>

                                        <p className="text-sm text-slate-500">
                                            Esta ação não poderá ser desfeita.
                                        </p>
                                    </div>

                                </div>

                                <div className="mb-6 rounded-xl bg-slate-50 p-4">

                                    <p className="text-sm text-slate-500">
                                        Você está prestes a excluir:
                                    </p>

                                    <p className="mt-1 font-black text-slate-800">
                                        {alunoParaExcluir.nome}
                                    </p>

                                </div>

                                <p className="mb-6 text-sm leading-relaxed text-slate-500">
                                    Todos os dados armazenados deste aluno serão
                                    removidos da lista de alunos deste navegador.
                                </p>

                                <div className="flex justify-end gap-3">

                                    <button
                                        onClick={() =>
                                            setAlunoParaExcluir(null)
                                        }
                                        className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:cursor-pointer hover:bg-slate-50"
                                    >
                                        Cancelar
                                    </button>

                                    <button
                                        onClick={excluirAluno}
                                        className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:cursor-pointer hover:bg-red-700"
                                    >
                                        <BsTrash3Fill />
                                        Sim, excluir
                                    </button>

                                </div>

                            </div>

                        </div>
                    )}

                </div>

            </main>

        </div>
    );
}