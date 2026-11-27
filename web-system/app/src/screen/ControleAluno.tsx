import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    BsActivity,
    BsArrowLeft,
    BsArrowUpRight,
    BsBullseye,
    BsCalendar3,
    BsCheck2Circle,
    BsChatDots,
    BsClipboard2Pulse,
    BsClockHistory,
    BsExclamationTriangle,
    BsFileEarmarkText,
    BsGraphUp,
    BsHeartPulse,
    BsJournalText,
    BsPersonCheck,
    BsShieldCheck,
    BsStars,
} from "react-icons/bs";
import type { Avaliacao } from "../types/avaliacao";
import type { AlunoResumoApi } from "../service/cadastroService";
import type { PersonalResumoApi } from "../service/cadastroService";
import AlunoMonitoramentoPicker, { type AlunoMonitoramentoOption } from "../components/AlunoMonitoramentoPicker";
import AlunoVinculosPersonais from "../components/AlunoVinculosPersonais";
import ControleVolumeTreino from "./ControleVolumeTreino";
import ChatAlunoConversa from "../components/ChatAlunoConversa";
import AssessmentScheduleCalendar from "../components/AssessmentScheduleCalendar";
import ChecklistAluno from "../components/ChecklistAluno";
import { comunicacaoService } from "../service/comunicacaoService";

type AlunoControle = Pick<
    AlunoResumoApi,
    "id" | "nomeCompleto" | "email" | "telefone" | "criadoEm" | "possuiFichaTecnica" | "convidadoPorPersonalNome"
>;
const abas = [
    { id: "resumo", label: "Visão 360°", icon: <BsActivity /> },
    { id: "mensagens", label: "Mensagens", icon: <BsChatDots /> },
    { id: "treinos", label: "Treinos", icon: <BsClipboard2Pulse /> },
    { id: "volume", label: "Volume mensal", icon: <BsGraphUp /> },
    { id: "checkins", label: "Check-ins", icon: <BsHeartPulse /> },
    { id: "dor", label: "Dor e limitações", icon: <BsShieldCheck /> },
    { id: "evolucao", label: "Evolução", icon: <BsStars /> },
    { id: "periodizacao", label: "Periodização", icon: <BsCalendar3 /> },
    { id: "pendencias", label: "Pendências", icon: <BsExclamationTriangle /> },
    { id: "tarefas", label: "Checklist da equipe", icon: <BsClipboard2Pulse /> },
    { id: "diario", label: "Diário técnico", icon: <BsJournalText /> },
    { id: "metas", label: "Metas", icon: <BsBullseye /> },
    { id: "historico", label: "Histórico", icon: <BsClockHistory /> },
] as const;
type AbaId = (typeof abas)[number]["id"];

function dataPt(data?: string | null) {
    if (!data) return "Sem registro";
    const parsed = new Date(/^\d{4}-\d{2}-\d{2}$/.test(data) ? `${data}T12:00:00` : data);
    return Number.isNaN(parsed.getTime())
        ? "Sem registro"
        : parsed.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function dataHoraPt(data: string) {
    const parsed = new Date(/^\d{4}-\d{2}-\d{2}$/.test(data) ? `${data}T12:00:00` : data);
    return Number.isNaN(parsed.getTime()) ? "Data indisponível" : parsed.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function Vazio({ titulo, descricao }: { titulo: string; descricao: string }) {
    return (
        <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-secondary)] px-6 py-9 text-center">
            <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-[var(--surface-tertiary)] text-[var(--text-muted)]">
                <BsClipboard2Pulse className="text-lg" />
            </span>
            <h3 className="mt-3 text-[13px] font-semibold text-[var(--text-primary)]">{titulo}</h3>
            <p className="mx-auto mt-1 max-w-[470px] text-[12px] leading-5 text-[var(--text-muted)]">
                {descricao}
            </p>
        </div>
    );
}

function Metrica({
    titulo,
    valor,
    detalhe,
    icone,
}: {
    titulo: string;
    valor: string | number;
    detalhe: string;
    icone: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="flex items-start justify-between gap-3">
                <span className="text-[11px] font-medium text-[var(--text-muted)]">{titulo}</span>
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent-text)]">
                    {icone}
                </span>
            </div>
            <p className="mt-3 text-[25px] font-semibold tracking-[-0.05em] text-[var(--text-primary)]">
                {valor}
            </p>
            <p className="mt-1 text-[11px] text-[var(--text-muted)]">{detalhe}</p>
        </div>
    );
}

type EventoAluno = {
    id: string;
    data: string;
    titulo: string;
    detalhe: string;
    origem: "Cadastro" | "Ficha" | "Mobile" | "Controle" | "Equipe";
    autor?: string | null;
    status?: string | null;
    metodoHttp?: string;
    rota?: string;
};

function LinhaDoTempo({ eventos, compact = false }: { eventos: EventoAluno[]; compact?: boolean }) {
    const itens = compact ? eventos.slice(0, 5) : eventos;
    if (!itens.length) {
        return <Vazio titulo="Ainda não há movimentações" descricao="Quando a equipe atualizar a ficha, o aluno enviar dados pelo aplicativo ou uma tarefa for registrada, tudo aparecerá aqui em ordem cronológica." />;
    }
    return (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
            <div className="space-y-0">
                {itens.map((evento, index) => (
                    <div key={evento.id} className="relative flex gap-3 pb-4 last:pb-0">
                        <div className="flex w-3 shrink-0 flex-col items-center">
                            <span className="z-10 mt-1 h-2.5 w-2.5 rounded-full border-2 border-[var(--accent)] bg-[var(--surface)]" />
                            {index < itens.length - 1 ? <span className="absolute bottom-0 top-4 w-px bg-[var(--border)]" /> : null}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="text-[11px] font-semibold text-[var(--text-primary)]">{evento.titulo}</p>
                                <span className="rounded-full bg-[var(--surface-secondary)] px-2 py-0.5 text-[8px] font-semibold text-[var(--text-muted)]">{evento.origem}</span>
                                {evento.status ? <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[8px] font-semibold text-[var(--accent-text)]">{evento.status.replace(/_/g, " ")}</span> : null}
                            </div>
                            <p className="mt-1 text-[10px] leading-5 text-[var(--text-secondary)]">{evento.detalhe}</p>
                            <p className="mt-0.5 text-[9px] text-[var(--text-muted)]">{evento.autor ? `${evento.autor} · ` : ""}{dataHoraPt(evento.data)}</p>
                            {!compact && evento.rota ? <details className="mt-2"><summary className="cursor-pointer text-[9px] font-semibold text-[var(--accent-text)]">Detalhes técnicos</summary><p className="mt-1 break-all rounded-lg bg-[var(--surface-secondary)] p-2 text-[9px] text-[var(--text-muted)]">{evento.metodoHttp} {evento.rota}</p></details> : null}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function respostasFormulario(json?: string | null) {
    if (!json) return [] as Array<[string, string]>;
    try {
        const dados = JSON.parse(json) as Record<string, unknown>;
        return Object.entries(dados)
            .filter(([, valor]) => ["string", "number", "boolean"].includes(typeof valor) && String(valor).trim())
            .slice(0, 8)
            .map(([chave, valor]) => [chave.replace(/([A-Z])/g, " $1").replace(/[_-]/g, " "), String(valor)] as [string, string]);
    } catch {
        return [];
    }
}

export default function ControleAluno({
    aluno,
    alunosDisponiveis,
    ficha,
    alunoCarregando,
    onBack,
    onSelecionarAluno,
    onNavigate,
    canChat,
    isAdmin,
    personais,
}: {
    aluno: AlunoControle;
    alunosDisponiveis: AlunoMonitoramentoOption[];
    ficha: Avaliacao;
    alunoCarregando: boolean;
    onBack: () => void;
    onSelecionarAluno: (alunoId: string) => void;
    onNavigate: (section: string) => void;
    canChat: boolean;
    isAdmin: boolean;
    personais: PersonalResumoApi[];
}) {
    const [aba, setAba] = useState<AbaId>("resumo");
    const atividadesQuery = useQuery({
        queryKey: ["aluno", "contexto-auditoria", aluno.id],
        queryFn: () => comunicacaoService.obterContextoChatAluno(aluno.id),
        enabled: aba === "historico" || aba === "resumo",
    });
    const contexto = atividadesQuery.data;
    const mensagensNaoLidasAluno = alunosDisponiveis.find(item => item.id === aluno.id)?.mensagensNaoLidas ?? 0;
    const treinos = useMemo(
        () => ficha.treino.filter(t => t.nome.trim() || t.exercicios.some(e => e.exercicio.trim())),
        [ficha.treino],
    );
    const exercicios = treinos.flatMap(t => t.exercicios.filter(e => e.exercicio.trim()));
    const avaliacoes = ficha.avaliacoes.filter(a => a.ativo);
    const execucoes = ficha.seriesRIR;
    const semanas = ficha.periodizacao.semanas.filter(s =>
        s.dias.some(d => d.treinoIds.some(Boolean)),
    );
    const ultima = avaliacoes.at(-1);
    const objetivo =
        ultima?.anamnese.objetivo ||
        ficha.anamneseComparacao.objetivo ||
        "Objetivo ainda não definido";
    const pendencias = [
        ...(!aluno.possuiFichaTecnica ? ["Completar a ficha técnica do aluno"] : []),
        ...(!avaliacoes.length ? ["Registrar a avaliação física inicial"] : []),
        ...(!treinos.length ? ["Criar a primeira prescrição de treino"] : []),
        ...(!semanas.length ? ["Organizar as sessões da periodização"] : []),
    ];
    const eventosContexto = useMemo<EventoAluno[]>(() => {
        if (!contexto) return [];
        const eventos: EventoAluno[] = [];
        const adicionar = (evento: EventoAluno) => eventos.push(evento);
        if (aluno.criadoEm) adicionar({ id: "aluno-criado", data: aluno.criadoEm, titulo: "Conta do aluno criada", detalhe: aluno.convidadoPorPersonalNome ? `Cadastro originado pelo convite de ${aluno.convidadoPorPersonalNome}.` : "Início do registro do aluno na equipe.", origem: "Cadastro" });
        if (contexto.solicitacaoCadastro) {
            adicionar({ id: "cadastro-formulario", data: contexto.solicitacaoCadastro.enviadaEm, titulo: "Formulário de entrada enviado", detalhe: ["Respostas enviadas pelo aplicativo.", contexto.solicitacaoCadastro.observacaoAnalise, contexto.solicitacaoCadastro.avaliadorNome ? `Analisado por ${contexto.solicitacaoCadastro.avaliadorNome}.` : null].filter(Boolean).join(" "), origem: "Cadastro", autor: "Aluno", status: contexto.solicitacaoCadastro.statusAnalise });
            if (contexto.solicitacaoCadastro.analisadaEm) adicionar({ id: "cadastro-analisado", data: contexto.solicitacaoCadastro.analisadaEm, titulo: "Análise do cadastro concluída", detalhe: contexto.solicitacaoCadastro.observacaoAnalise || `Resultado: ${contexto.solicitacaoCadastro.statusAnalise.replace(/_/g, " ")}.`, origem: "Equipe", autor: contexto.solicitacaoCadastro.avaliadorNome, status: contexto.solicitacaoCadastro.statusAnalise });
        }
        if (contexto.ultimaAnamnese) adicionar({ id: "anamnese", data: contexto.ultimaAnamnese.criadoEm, titulo: "Anamnese registrada", detalhe: [contexto.ultimaAnamnese.tipo, contexto.ultimaAnamnese.objetivo].filter(Boolean).join(" · ") || "Dados iniciais de saúde e objetivos atualizados.", origem: "Ficha" });
        contexto.avaliacoes.forEach(item => adicionar({ id: `avaliacao-${item.id}`, data: item.realizadaEm, titulo: `Avaliação física #${item.numero}`, detalhe: [item.peso != null ? `${item.peso} kg` : null, item.percentualGordura != null ? `${item.percentualGordura}% de gordura` : null, item.objetivo].filter(Boolean).join(" · ") || "Avaliação física registrada.", origem: "Ficha", autor: item.criadaPorNome }));
        contexto.historicoAvaliacoes.forEach(item => adicionar({ id: `ficha-historico-${item.id}`, data: item.criadoEm, titulo: item.acao, detalhe: item.resumo, origem: "Ficha", autor: item.usuarioNome }));
        contexto.treinosAtuais.forEach(item => adicionar({ id: `treino-${item.id}`, data: item.criadoEm, titulo: `Prescrição criada: ${item.nome}`, detalhe: `${item.exercicios.length} exercícios cadastrados na prescrição.`, origem: "Ficha" }));
        contexto.periodizacoes.forEach(item => adicionar({ id: `periodizacao-${item.id}`, data: item.dataInicio, titulo: `Periodização: ${item.nome}`, detalhe: `${item.totalSemanas} semanas estruturadas.`, origem: "Ficha" }));
        contexto.execucoesRecentes.forEach(item => {
            const relatos = item.exercicios.filter(exercicio => exercicio.statusDor !== "none" || Boolean(exercicio.feedback)).length;
            adicionar({ id: `execucao-${item.id}`, data: item.inicio || item.data, titulo: `Treino realizado: ${item.treinoNome}`, detalhe: `${item.exercicios.length} exercícios registrados${relatos ? ` · ${relatos} exercício(s) com relato de dor/observação` : ""}${item.duracaoSegundos ? ` · ${Math.round(item.duracaoSegundos / 60)} min` : ""}.`, origem: "Mobile", autor: "Aluno" });
        });
        contexto.feedbacks.forEach((item, index) => adicionar({ id: `feedback-${index}-${item.criadoEm}`, data: item.criadoEm, titulo: `Feedback do aluno: ${item.categoria}`, detalhe: `Nota ${item.nota}/5 · ${item.comentario}${item.respostaEquipe ? ` · Resposta: ${item.respostaEquipe}` : ""}`, origem: "Mobile", autor: "Aluno", status: item.status }));
        contexto.solicitacoesAvaliacao.forEach((item, index) => adicionar({ id: `solicitacao-${index}-${item.criadaEm}`, data: item.criadaEm, titulo: "Solicitação de avaliação", detalhe: [item.motivo, `Data desejada: ${dataPt(item.dataDesejada)}`].filter(Boolean).join(" · "), origem: "Mobile", autor: "Aluno", status: item.status }));
        contexto.tarefas.forEach(item => adicionar({ id: `tarefa-${item.id}`, data: item.concluidaEm || item.atualizadaEm || item.criadaEm, titulo: `Tarefa: ${item.titulo}`, detalhe: [item.descricao, item.dataLimite ? `Prazo: ${dataPt(item.dataLimite)}` : null, `Prioridade: ${item.prioridade}`].filter(Boolean).join(" · "), origem: "Controle", autor: item.criadoPorNome, status: item.status }));
        contexto.atividades.forEach((item, index) => adicionar({ id: `auditoria-${index}-${item.criadoEm}`, data: item.criadoEm, titulo: item.resumo || item.acao, detalhe: `${item.acao} · ${item.resultado} · HTTP ${item.statusCode}`, origem: "Equipe", autor: `${item.usuarioNome} (${item.usuarioTipo})`, metodoHttp: item.metodoHttp, rota: item.rota }));
        return eventos.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    }, [contexto, aluno.criadoEm, aluno.convidadoPorPersonalNome]);

    const resumo = (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                <div><p className="text-[9px] font-bold uppercase tracking-[.15em] text-[var(--text-muted)]">Origem do cadastro</p><p className="mt-1 text-[11px] font-semibold text-[var(--text-primary)]">{aluno.convidadoPorPersonalNome || "Origem não registrada (cadastro legado)"}</p></div>
                <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[9px] font-bold text-[var(--accent-text)]">Acesso compartilhado</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Metrica
                    titulo="Treinos prescritos"
                    valor={treinos.length}
                    detalhe="Estruturas identificadas"
                    icone={<BsClipboard2Pulse />}
                />
                <Metrica
                    titulo="Exercícios cadastrados"
                    valor={exercicios.length}
                    detalhe="Na prescrição atual"
                    icone={<BsActivity />}
                />
                <Metrica
                    titulo="Execuções registradas"
                    valor={execucoes.length}
                    detalhe="Histórico disponível na ficha"
                    icone={<BsCheck2Circle />}
                />
                <Metrica
                    titulo="Avaliações ativas"
                    valor={avaliacoes.length}
                    detalhe="Registros físicos ativos"
                    icone={<BsPersonCheck />}
                />
            </div>
            {isAdmin ? (
                <AlunoVinculosPersonais
                    alunoId={aluno.id}
                    personais={personais}
                    convidadoPorPersonalNome={aluno.convidadoPorPersonalNome}
                />
            ) : null}
            {contexto?.solicitacaoCadastro ? (
                <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[.15em] text-[var(--accent-text)]">Entrada pelo aplicativo</p>
                            <h3 className="mt-1 text-[14px] font-semibold text-[var(--text-primary)]">Formulário de cadastro</h3>
                            <p className="mt-1 text-[10px] text-[var(--text-muted)]">Enviado em {dataPt(contexto.solicitacaoCadastro.enviadaEm)}{contexto.solicitacaoCadastro.avaliadorNome ? ` · Analisado por ${contexto.solicitacaoCadastro.avaliadorNome}` : ""}</p>
                        </div>
                        <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[9px] font-semibold text-[var(--accent-text)]">{contexto.solicitacaoCadastro.statusAnalise.replace(/_/g, " ")}</span>
                    </div>
                    {contexto.solicitacaoCadastro.observacaoAnalise ? <p className="mt-3 rounded-xl bg-[var(--surface-secondary)] p-3 text-[10px] leading-5 text-[var(--text-secondary)]">{contexto.solicitacaoCadastro.observacaoAnalise}</p> : null}
                    {respostasFormulario(contexto.solicitacaoCadastro.respostasJson).length ? (
                        <details className="mt-3">
                            <summary className="cursor-pointer text-[10px] font-semibold text-[var(--accent-text)]">Consultar respostas enviadas</summary>
                            <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                                {respostasFormulario(contexto.solicitacaoCadastro.respostasJson).map(([pergunta, resposta]) => <div key={pergunta} className="rounded-lg bg-[var(--surface-secondary)] p-3"><dt className="text-[9px] font-semibold uppercase text-[var(--text-muted)]">{pergunta}</dt><dd className="mt-1 text-[10px] leading-5 text-[var(--text-primary)]">{resposta}</dd></div>)}
                            </dl>
                        </details>
                    ) : null}
                </section>
            ) : null}
            <div className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
                <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[var(--accent-text)]">
                        Contexto do atendimento
                    </p>
                    <h3 className="mt-1 text-[15px] font-semibold text-[var(--text-primary)]">
                        Objetivo e situação atual
                    </h3>
                    <p className="mt-4 text-[13px] font-medium text-[var(--text-primary)]">
                        {objetivo}
                    </p>
                    <div className="mt-4 grid gap-3 border-t border-[var(--border)] pt-4 sm:grid-cols-3">
                        <div>
                            <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                                Última avaliação
                            </p>
                            <p className="mt-1 text-[12px] font-semibold text-[var(--text-primary)]">
                                {dataPt(ultima?.realizadaEm)}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                                Último treino
                            </p>
                            <p className="mt-1 text-[12px] font-semibold text-[var(--text-primary)]">
                                {dataPt(execucoes.at(-1)?.data)}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                                Periodização
                            </p>
                            <p className="mt-1 text-[12px] font-semibold text-[var(--text-primary)]">
                                {ficha.periodizacao.nome || "Não definida"}
                            </p>
                        </div>
                    </div>
                </section>
                <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[var(--accent-text)]">
                                Atenção do profissional
                            </p>
                            <h3 className="mt-1 text-[15px] font-semibold text-[var(--text-primary)]">
                                Pontos para revisar
                            </h3>
                        </div>
                        <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold text-amber-600">
                            {pendencias.length} itens
                        </span>
                    </div>
                    {pendencias.length ? (
                        <ul className="mt-4 space-y-3">
                            {pendencias.map(item => (
                                <li
                                    key={item}
                                    className="flex gap-2.5 text-[12px] leading-5 text-[var(--text-secondary)]"
                                >
                                    <BsExclamationTriangle className="mt-0.5 shrink-0 text-amber-500" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="mt-4 text-[12px] text-[var(--text-muted)]">
                            Nenhuma pendência estrutural detectada nos dados da ficha.
                        </p>
                    )}
                    <p className="mt-4 border-t border-[var(--border)] pt-3 text-[10px] leading-4 text-[var(--text-muted)]">
                        Alertas de adesão, recuperação e dor dependem da integração dos registros do
                        aplicativo.
                    </p>
                </section>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <button
                    onClick={() => setAba("treinos")}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left transition hover:border-[var(--accent)]"
                >
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-text)]">
                        <BsActivity />
                    </span>
                    <h3 className="mt-3 text-[12px] font-semibold text-[var(--text-primary)]">
                        Execução e prescrição
                    </h3>
                    <p className="mt-1 text-[11px] leading-5 text-[var(--text-muted)]">
                        Compare o que foi planejado com os registros do treino.
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--accent-text)]">
                        Abrir módulo <BsArrowUpRight />
                    </span>
                </button>
                <button
                    onClick={() => setAba("evolucao")}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left transition hover:border-[var(--accent)]"
                >
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-text)]">
                        <BsStars />
                    </span>
                    <h3 className="mt-3 text-[12px] font-semibold text-[var(--text-primary)]">
                        Evolução física
                    </h3>
                    <p className="mt-1 text-[11px] leading-5 text-[var(--text-muted)]">
                        Consulte avaliações, medidas e testes preservando o histórico.
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--accent-text)]">
                        Abrir módulo <BsArrowUpRight />
                    </span>
                </button>
                <button
                    onClick={() => setAba("volume")}
                    className="rounded-2xl border border-[var(--accent)]/35 bg-[var(--accent-soft)] p-4 text-left transition hover:border-[var(--accent)]"
                >
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--accent)] text-white">
                        <BsGraphUp />
                    </span>
                    <h3 className="mt-3 text-[12px] font-semibold text-[var(--text-primary)]">
                        Volume mensal
                    </h3>
                    <p className="mt-1 text-[11px] leading-5 text-[var(--text-muted)]">
                        Inicie um ciclo e acompanhe os registros mensais deste treino.
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--accent-text)]">
                        Abrir acompanhamento <BsArrowUpRight />
                    </span>
                </button>
                <button
                    onClick={() => onNavigate("chat")}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left transition hover:border-[var(--accent)]"
                >
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-text)]">
                        <BsJournalText />
                    </span>
                    <h3 className="mt-3 text-[12px] font-semibold text-[var(--text-primary)]">
                        Comunicação da equipe
                    </h3>
                    <p className="mt-1 text-[11px] leading-5 text-[var(--text-muted)]">
                        Acesse a central existente para tratar deste atendimento.
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--accent-text)]">
                        Abrir central <BsArrowUpRight />
                    </span>
                </button>
            </div>
            <section className="space-y-3">
                <div className="flex flex-wrap items-end justify-between gap-2">
                    <div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-[var(--accent-text)]">Movimentações recentes</p><h3 className="mt-1 text-[14px] font-semibold text-[var(--text-primary)]">O que aconteceu com este aluno</h3><p className="mt-1 text-[10px] text-[var(--text-muted)]">Ficha, aplicativo, tarefas e ações da equipe em uma única sequência.</p></div>
                    <button type="button" onClick={() => setAba("historico")} className="text-[10px] font-semibold text-[var(--accent-text)] hover:underline">Abrir histórico completo</button>
                </div>
                {atividadesQuery.isLoading ? <p className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-[10px] text-[var(--text-muted)]">Carregando movimentações...</p> : atividadesQuery.isError ? <p className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-[10px] text-[var(--danger)]">Não foi possível carregar o contexto recente.</p> : <LinhaDoTempo eventos={eventosContexto} compact />}
            </section>
        </div>
    );

    const treinosView = (
        <div className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">
                        Prescrição e execução
                    </h3>
                    <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                        A prescrição é a referência; a execução deve ser guardada como histórico
                        independente.
                    </p>
                </div>
                <button
                    onClick={() => onNavigate("avaliacoes")}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--border)] px-3 text-[11px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--row-hover)]"
                >
                    Abrir ficha técnica <BsArrowUpRight />
                </button>
            </div>
            {treinos.length ? (
                treinos.map((treino, index) => {
                    const itens = treino.exercicios.filter(e => e.exercicio.trim());
                    return (
                        <article
                            key={treino.id}
                            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-[10px] uppercase tracking-[.14em] text-[var(--text-muted)]">
                                        Treino {String.fromCharCode(65 + index)}
                                    </p>
                                    <h4 className="mt-1 text-[13px] font-semibold text-[var(--text-primary)]">
                                        {treino.nome || "Treino sem nome"}
                                    </h4>
                                </div>
                                <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[10px] font-semibold text-[var(--accent-text)]">
                                    {itens.length} exercícios
                                </span>
                            </div>
                            <div className="mt-4 divide-y divide-[var(--border)]">
                                {itens.map((e, i) => (
                                    <div
                                        key={e.id}
                                        className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[var(--surface-tertiary)] text-[10px] font-semibold text-[var(--text-muted)]">
                                                {String(i + 1).padStart(2, "0")}
                                            </span>
                                            <div className="min-w-0">
                                                <p className="truncate text-[12px] font-semibold text-[var(--text-primary)]">
                                                    {e.exercicio}
                                                </p>
                                                <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                                                    {e.variacoes?.length ?? 0} variações cadastradas
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3 text-[10px] text-[var(--text-secondary)]">
                                            <span>{e.series || "—"} séries</span>
                                            <span>{e.repeticoes || "—"} reps</span>
                                            <span>{e.carga || "—"} kg</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </article>
                    );
                })
            ) : (
                <Vazio
                    titulo="Nenhuma prescrição encontrada"
                    descricao="Quando o profissional cadastrar treinos na ficha técnica, cada sessão e seus exercícios serão apresentados aqui."
                />
            )}
            <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                <div className="flex items-center justify-between gap-3">
                    <h4 className="text-[12px] font-semibold text-[var(--text-primary)]">
                        Sessões executadas
                    </h4>
                    <span className="text-[11px] text-[var(--text-muted)]">
                        {execucoes.length} registros
                    </span>
                </div>
                {execucoes.length ? (
                    <div className="mt-3 space-y-2">
                        {execucoes.map((e, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between gap-3 rounded-xl bg-[var(--surface-secondary)] px-3 py-3"
                            >
                                <div>
                                    <p className="text-[11px] font-semibold text-[var(--text-primary)]">
                                        Sessão {index + 1}
                                    </p>
                                    <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                                        {e.exercicios.length} exercícios · {dataPt(e.data)}
                                    </p>
                                </div>
                                <span className="text-[11px] text-[var(--text-secondary)]">
                                    {e.exercicios.reduce(
                                        (sum, item) => sum + item.series.length,
                                        0,
                                    )}{" "}
                                    séries
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="mt-3 text-[11px] text-[var(--text-muted)]">
                        Ainda não existem execuções sincronizadas para este aluno.
                    </p>
                )}
            </section>
        </div>
    );

    const evolucaoView = (
        <div className="space-y-4">
            <div>
                <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">
                    Evolução física e desempenho
                </h3>
                <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                    Comparações cronológicas, preservando método, data e origem da medição.
                </p>
            </div>
            <AssessmentScheduleCalendar alunoId={aluno.id} avaliacoes={avaliacoes} />
            {avaliacoes.length ? (
                <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                    <div className="grid grid-cols-[1.2fr_repeat(3,minmax(70px,1fr))] gap-2 border-b border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                        <span>Avaliação</span>
                        <span>Peso</span>
                        <span>Altura</span>
                        <span>Gordura</span>
                    </div>
                    {avaliacoes.map(a => (
                        <div
                            key={a.id}
                            className="grid grid-cols-[1.2fr_repeat(3,minmax(70px,1fr))] gap-2 border-b border-[var(--border)] px-4 py-3 last:border-0"
                        >
                            <span>
                                <strong className="block text-[11px] text-[var(--text-primary)]">
                                    #{a.numero}
                                </strong>
                                <small className="text-[10px] text-[var(--text-muted)]">
                                    {dataPt(a.realizadaEm)}
                                </small>
                            </span>
                            <span className="self-center text-[11px] text-[var(--text-secondary)]">
                                {a.peso || "—"} kg
                            </span>
                            <span className="self-center text-[11px] text-[var(--text-secondary)]">
                                {a.altura || "—"} cm
                            </span>
                            <span className="self-center text-[11px] text-[var(--text-secondary)]">
                                {a.percentualGordura || "—"}%
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <Vazio
                    titulo="Histórico físico ainda vazio"
                    descricao="As avaliações futuras aparecerão em uma linha do tempo comparável, incluindo perímetros, dobras cutâneas e testes de carga."
                />
            )}
            <div className="grid gap-4 md:grid-cols-2">
                <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                    <h4 className="text-[12px] font-semibold text-[var(--text-primary)]">
                        Antropometria
                    </h4>
                    <p className="mt-1 text-[11px] leading-5 text-[var(--text-muted)]">
                        Peso, estatura, perímetros e dobras cutâneas com identificação da avaliação
                        e protocolo.
                    </p>
                </section>
                <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                    <h4 className="text-[12px] font-semibold text-[var(--text-primary)]">
                        Força e capacidade
                    </h4>
                    <p className="mt-1 text-[11px] leading-5 text-[var(--text-muted)]">
                        Testes de carga e desempenho comparados por exercício, carga, repetições e
                        condições do teste.
                    </p>
                </section>
            </div>
        </div>
    );

    const periodizacaoView = (
        <div className="space-y-4">
            <div>
                <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">
                    Planejamento de treinamento
                </h3>
                <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                    Visão do ciclo, semanas estruturadas, dias planejados e volume prescrito.
                </p>
            </div>
            <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                            Ciclo atual
                        </p>
                        <h4 className="mt-1 text-[14px] font-semibold text-[var(--text-primary)]">
                            {ficha.periodizacao.nome || "Periodização principal"}
                        </h4>
                    </div>
                    <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[10px] font-semibold text-[var(--accent-text)]">
                        {semanas.length} semanas com sessões
                    </span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {ficha.periodizacao.semanas.map((s, index) => {
                        const dias = s.dias.filter(d => d.treinoIds.some(Boolean)).length;
                        return (
                            <div
                                key={index}
                                className="rounded-xl border border-[var(--border)] p-3"
                            >
                                <p className="text-[10px] text-[var(--text-muted)]">
                                    Semana {s.numero}
                                </p>
                                <p className="mt-1 text-[16px] font-semibold text-[var(--text-primary)]">
                                    {dias}
                                    <span className="ml-1 text-[10px] font-normal text-[var(--text-muted)]">
                                        dias
                                    </span>
                                </p>
                                <div className="mt-2 h-1 overflow-hidden rounded-full bg-[var(--surface-tertiary)]">
                                    <div
                                        className="h-full rounded-full bg-[var(--accent)]"
                                        style={{ width: (dias / 7) * 100 + "%" }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>
            <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                <h4 className="text-[12px] font-semibold text-[var(--text-primary)]">
                    Volume semanal
                </h4>
                <div className="mt-3 space-y-2">
                    {ficha.volume.slice(0, 6).map(s => {
                        const total = s.grupos.reduce(
                            (sum, g) =>
                                sum + Number(g.seriesDiretas || 0) + Number(g.seriesLivres || 0),
                            0,
                        );
                        return (
                            <div
                                key={s.semana}
                                className="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-2 last:border-0"
                            >
                                <span className="text-[11px] text-[var(--text-secondary)]">
                                    Semana {s.semana}
                                </span>
                                <strong className="text-[12px] text-[var(--text-primary)]">
                                    {total} séries
                                </strong>
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    );

    const conteudo = (() => {
        if (aba === "resumo") return resumo;
        if (aba === "mensagens") return (
            <ChatAlunoConversa
                modo="personal"
                alunoId={aluno.id}
                onAbrirFicha={() => setAba("resumo")}
                onAbrirHistorico={() => setAba("historico")}
            />
        );
        if (aba === "treinos") return treinosView;
        if (aba === "volume") return <ControleVolumeTreino alunoId={aluno.id} treinos={treinos} />;
        if (aba === "evolucao") return evolucaoView;
        if (aba === "periodizacao") return periodizacaoView;
        if (aba === "pendencias")
            return (
                <div className="space-y-4">
                    <div>
                        <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">
                            Central de acompanhamento
                        </h3>
                        <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                            Pendências estruturais derivadas dos dados atuais. Alertas
                            comportamentais dependem dos registros do aplicativo.
                        </p>
                    </div>
                    {pendencias.length ? (
                        pendencias.map((item, index) => (
                            <div
                                key={item}
                                className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4"
                            >
                                <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-500/10 text-amber-600">
                                    <BsExclamationTriangle />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[12px] font-semibold text-[var(--text-primary)]">
                                        {item}
                                    </p>
                                    <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                                        Prioridade sugerida · item {index + 1}
                                    </p>
                                </div>
                                <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[9px] font-semibold text-amber-700">
                                    Pendente
                                </span>
                            </div>
                        ))
                    ) : (
                        <Vazio
                            titulo="Nenhuma pendência estrutural"
                            descricao="Os dados cadastrais e de prescrição estão presentes. O acompanhamento contínuo será alimentado pelos próximos módulos."
                        />
                    )}
                </div>
            );
        if (aba === "tarefas") return <ChecklistAluno alunoId={aluno.id} />;
        if (aba === "historico") {
            return (
                <div className="space-y-4">
                    <div>
                        <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">
                            Histórico completo do aluno
                        </h3>
                        <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                            Uma sequência cronológica que combina ficha técnica, dados enviados pelo aplicativo e atividades do controle da equipe.
                        </p>
                    </div>
                    {atividadesQuery.isError ? <p role="alert" className="text-[11px] text-[var(--danger)]">Não foi possível carregar o histórico. <button type="button" onClick={() => void atividadesQuery.refetch()} className="font-bold underline">Tentar novamente</button></p> : atividadesQuery.isLoading ? <p className="text-[11px] text-[var(--text-muted)]">Carregando histórico...</p> : <LinhaDoTempo eventos={eventosContexto} />}
                </div>
            );
        }
        const textos: Record<
            "checkins" | "dor" | "diario" | "metas",
            {
                titulo: string;
                descricao: string;
                itens: [string, string][];
                vazio: string;
                detalhe: string;
            }
        > = {
            checkins: {
                titulo: "Check-in diário e prontidão",
                descricao:
                    "Acompanhamento subjetivo para contextualizar a resposta ao treinamento, sem finalidade diagnóstica.",
                itens: [
                    ["Sono", "Duração, qualidade percebida e regularidade"],
                    ["Energia", "Disposição para iniciar e concluir a sessão"],
                    ["Fadiga", "Fadiga geral e sensação de recuperação"],
                    ["Estresse", "Percepção de estresse e carga externa"],
                    ["Motivação", "Motivação para treinar e aderência à rotina"],
                    ["Dor muscular tardia", "Região, intensidade e duração da sensibilidade"],
                ],
                vazio: "Aguardando check-ins do aplicativo",
                detalhe:
                    "A interface está preparada para receber respostas diárias, visualizar tendências por período e sinalizar mudanças relevantes. Nenhuma pontuação foi inventada.",
            },
            dor: {
                titulo: "Relatos de dor e limitações",
                descricao:
                    "Registros relatados pelo aluno e decisões documentadas pelo profissional. O sistema não realiza diagnóstico.",
                itens: [
                    ["Localização", "Região corporal e lado"],
                    ["Intensidade", "Escala relatada de 0 a 10"],
                    ["Contexto", "Exercício, movimento e momento do relato"],
                ],
                vazio: "Nenhum relato de dor sincronizado",
                detalhe:
                    "Quando o aluno enviar um relato, será possível registrar recorrência, evolução, orientação do personal, exercício pausado ou substituído e data de reavaliação.",
            },
            diario: {
                titulo: "Diário técnico",
                descricao:
                    "Anotações contextualizadas, com autoria e visibilidade claramente separadas.",
                itens: [
                    ["Interna da equipe", "Somente profissionais autorizados"],
                    ["Compartilhada", "Visível para toda a equipe"],
                    ["Orientação ao aluno", "Conteúdo aprovado para exibição no aplicativo"],
                ],
                vazio: "Diário sem anotações",
                detalhe:
                    "O histórico de notas deverá preservar autor, data, categoria e nível de visibilidade. Notas internas nunca serão exibidas ao aluno.",
            },
            metas: {
                titulo: "Metas e objetivos",
                descricao:
                    "Objetivos definidos em conjunto, com prazo, indicador de sucesso e revisões periódicas.",
                itens: [
                    ["Performance", "Carga, repetições, técnica e consistência"],
                    ["Aderência", "Sessões planejadas versus realizadas"],
                    ["Evolução física", "Medidas e indicadores definidos"],
                ],
                vazio: "Nenhuma meta cadastrada",
                detalhe:
                    "As metas poderão ser vinculadas a ciclos de treinamento, com marcos, progresso e registro de revisão pelo profissional.",
            },
        };
        const item = textos[aba as "checkins" | "dor" | "diario" | "metas"];
        return (
            <div className="space-y-4">
                <div>
                    <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">
                        {item.titulo}
                    </h3>
                    <p className="mt-1 text-[11px] text-[var(--text-muted)]">{item.descricao}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {item.itens.map(([titulo, descricao]) => (
                        <div
                            key={titulo}
                            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"
                        >
                            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent-text)]">
                                <BsHeartPulse />
                            </span>
                            <h4 className="mt-3 text-[12px] font-semibold text-[var(--text-primary)]">
                                {titulo}
                            </h4>
                            <p className="mt-1 text-[11px] leading-5 text-[var(--text-muted)]">
                                {descricao}
                            </p>
                        </div>
                    ))}
                </div>
                <Vazio titulo={item.vazio} descricao={item.detalhe} />
            </div>
        );
    })();

    return (
        <section className="w-full max-w-[1500px] space-y-5">
            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <button
                    onClick={onBack}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-[11px] font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--row-hover)]"
                >
                    <BsArrowLeft /> Voltar aos alunos
                </button>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <AlunoMonitoramentoPicker
                        compact
                        alunos={alunosDisponiveis}
                        selectedId={aluno.id}
                        loading={alunoCarregando}
                        onOpen={onSelecionarAluno}
                    />
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--success-soft)] px-3 py-1.5 text-[10px] font-semibold text-[var(--success)]">
                        <BsCheck2Circle /> Atendimento ativo
                    </span>
                </div>
            </div>
            <header className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7">
                <div className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full bg-[var(--accent)] opacity-[.07] blur-3xl" />
                <div className="relative flex flex-col justify-between gap-5 md:flex-row md:items-end">
                    <div className="flex min-w-0 items-center gap-4">
                        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[var(--accent)] text-xl font-semibold text-white">
                            {aluno.nomeCompleto.slice(0, 1).toUpperCase() || "A"}
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-[.17em] text-[var(--accent-text)]">
                                Acompanhamento individual · Aluno 360°
                            </p>
                            <h1 className="mt-1 truncate text-[22px] font-semibold tracking-[-.045em] text-[var(--text-primary)] sm:text-[27px]">
                                {aluno.nomeCompleto}
                            </h1>
                            <p className="mt-1 truncate text-[11px] text-[var(--text-muted)]">
                                {aluno.email}
                                {aluno.telefone ? " · " + aluno.telefone : ""}
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:min-w-[260px]">
                        <div className="rounded-xl bg-[var(--surface-secondary)] p-3">
                            <p className="text-[10px] text-[var(--text-muted)]">Cadastro desde</p>
                            <p className="mt-1 text-[12px] font-semibold text-[var(--text-primary)]">
                                {dataPt(aluno.criadoEm)}
                            </p>
                        </div>
                        <div className="rounded-xl bg-[var(--surface-secondary)] p-3">
                            <p className="text-[10px] text-[var(--text-muted)]">Ficha técnica</p>
                            <p className="mt-1 text-[12px] font-semibold text-[var(--text-primary)]">
                                {aluno.possuiFichaTecnica ? "Disponível" : "Incompleta"}
                            </p>
                        </div>
                    </div>
                </div>
            </header>
            {canChat && mensagensNaoLidasAluno > 0 && (
                <section className="flex flex-col gap-3 rounded-2xl border border-[var(--accent)]/25 bg-[var(--accent-soft)] p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-[11px] font-semibold text-[var(--text-primary)]">
                            {mensagensNaoLidasAluno} {mensagensNaoLidasAluno === 1 ? "nova mensagem" : "novas mensagens"} de {aluno.nomeCompleto}
                        </p>
                        <p className="mt-1 text-[9px] text-[var(--text-secondary)]">Abra a conversa ou confira a ficha e o histórico antes de responder.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => setAba("mensagens")} className="rounded-lg bg-[var(--accent)] px-3 py-2 text-[9px] font-semibold text-[var(--on-accent)]">Abrir chat</button>
                        <button type="button" onClick={() => setAba("resumo")} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[9px] font-semibold text-[var(--text-primary)]">Ver ficha</button>
                    </div>
                </section>
            )}
            <nav
                aria-label="Módulos de acompanhamento do aluno"
                className="sticky top-[60px] z-10 flex gap-1 overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)]/95 p-1.5 shadow-sm backdrop-blur-sm"
            >
                {abas.filter(item => item.id !== "mensagens" || canChat).map(item => (
                    <button
                        key={item.id}
                        onClick={() => setAba(item.id)}
                        aria-current={aba === item.id ? "page" : undefined}
                        className={
                            aba === item.id
                                ? "inline-flex min-h-9 shrink-0 items-center gap-2 rounded-xl bg-[var(--accent)] px-3 text-[11px] font-medium text-white shadow-sm"
                                : "inline-flex min-h-9 shrink-0 items-center gap-2 rounded-xl px-3 text-[11px] font-medium text-[var(--text-secondary)] transition hover:bg-[var(--row-hover)]"
                        }
                    >
                        <span className="text-[12px]">{item.icon}</span>
                        {item.label}
                        {item.id === "mensagens" && mensagensNaoLidasAluno > 0 && (
                            <span className="grid h-4 min-w-4 place-items-center rounded-full bg-white/20 px-1 text-[9px] font-bold">
                                {mensagensNaoLidasAluno}
                            </span>
                        )}
                    </button>
                ))}
            </nav>
            <div className="min-h-[360px]">{conteudo}</div>
            <p className="flex items-start gap-2 px-1 text-[10px] leading-4 text-[var(--text-muted)]">
                <BsFileEarmarkText className="mt-0.5 shrink-0" />
                O contexto reúne a ficha, o histórico de alterações e os registros enviados pelo
                aplicativo, como execuções de treino, feedbacks e solicitações de avaliação.
            </p>
        </section>
    );
}
