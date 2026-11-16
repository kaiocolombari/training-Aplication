import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAvaliacao } from "../context/avaliacaoContext";
import {
  cadastroService,
  mapearAvaliacaoApiParaFisica,
  type AvaliacaoHistoricoApi,
} from "../service/cadastroService";

const formatarData = (data?: string | null) => {
  if (!data) return "—";
  const parsed = new Date(data);
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(parsed);
};

const formatarDataHora = (data: string) => {
  const parsed = new Date(data);
  if (Number.isNaN(parsed.getTime())) return "Data indisponível";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(parsed);
};

const nomeAcao = (acao: string) => {
  switch (acao.toUpperCase()) {
    case "CRIADA": return "Avaliação criada";
    case "ATUALIZADA": return "Avaliação atualizada";
    case "ARQUIVADA": return "Avaliação arquivada";
    default: return acao;
  }
};

export default function Avaliacoes() {
  const navigate = useNavigate();
  const {
    avaliacao,
    alunoSelecionadoId,
    carregarAvaliacao,
    alteracoesPendentes,
  } = useAvaliacao();

  const [criando, setCriando] = useState(false);
  const [historicoId, setHistoricoId] = useState<string | null>(null);
  const [historico, setHistorico] = useState<AvaliacaoHistoricoApi[]>([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const [erroHistorico, setErroHistorico] = useState("");

  const avaliacoes = [...avaliacao.avaliacoes].sort((a, b) => b.numero - a.numero);
  const selecionadaHistorico = avaliacoes.find(item => item.id === historicoId);

  useEffect(() => {
    if (!historicoId) {
      setHistorico([]);
      setErroHistorico("");
      return;
    }

    let ativo = true;
    setCarregandoHistorico(true);
    setErroHistorico("");

    cadastroService.listarHistoricoAvaliacao(historicoId)
      .then(registros => {
        if (ativo) setHistorico(registros);
      })
      .catch(error => {
        if (!ativo) return;
        setErroHistorico(error instanceof Error ? error.message : "Não foi possível carregar o histórico.");
      })
      .finally(() => {
        if (ativo) setCarregandoHistorico(false);
      });

    return () => { ativo = false; };
  }, [historicoId]);

  const criarAvaliacao = async () => {
    if (!alunoSelecionadoId || criando) return;
    if (alteracoesPendentes) {
      window.alert("Salve as alterações atuais da ficha antes de criar uma nova avaliação.");
      return;
    }

    try {
      setCriando(true);
      const registro = await cadastroService.criarAvaliacao(alunoSelecionadoId);
      const novaAvaliacao = mapearAvaliacaoApiParaFisica(registro);
      const novaFicha = {
        ...avaliacao,
        avaliacoes: [...avaliacao.avaliacoes, novaAvaliacao].sort((a, b) => a.numero - b.numero),
      };
      carregarAvaliacao(novaFicha, alunoSelecionadoId);
      navigate(`/avaliacoes/${novaAvaliacao.id}`);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Não foi possível criar a avaliação.");
    } finally {
      setCriando(false);
    }
  };

  const arquivarAvaliacao = async (id: string, numero: number) => {
    if (alteracoesPendentes) {
      window.alert("Salve as alterações da ficha antes de arquivar uma avaliação.");
      return;
    }
    if (!window.confirm(`Arquivar a avaliação #${numero}? Ela sairá da lista e da comparação, mas o histórico será preservado.`)) return;

    try {
      await cadastroService.arquivarAvaliacao(id);
      carregarAvaliacao({
        ...avaliacao,
        avaliacoes: avaliacao.avaliacoes.filter(item => item.id !== id),
      }, alunoSelecionadoId ?? undefined);
      if (historicoId === id) setHistoricoId(null);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Não foi possível arquivar a avaliação.");
    }
  };

  if (!alunoSelecionadoId) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-xl font-bold">Nenhum aluno selecionado</h1>
        <p className="text-sm text-[var(--text-muted)]">Volte ao painel e abra um aluno para gerenciar as avaliações.</p>
        <button onClick={() => navigate("/")} className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--on-accent)]">
          Voltar ao painel
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen space-y-6 bg-[var(--surface-sunken)] px-4 py-6 text-[var(--text)] md:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col justify-between gap-4 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Ficha do aluno</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">Avaliações físicas</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {avaliacao.aluno.nomeCompleto || "Aluno"} · {avaliacoes.length} {avaliacoes.length === 1 ? "avaliação cadastrada" : "avaliações cadastradas"}
            </p>
          </div>
          <button
            type="button"
            onClick={criarAvaliacao}
            disabled={criando}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--on-accent)] transition hover:bg-[var(--accent-hover)] disabled:cursor-wait disabled:opacity-60"
          >
            <span aria-hidden="true">＋</span>
            {criando ? "Criando..." : "Nova avaliação"}
          </button>
        </header>

        {avaliacoes.length === 0 ? (
          <section className="rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-raised)] px-6 py-14 text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-[var(--accent-soft)] text-xl text-[var(--accent)]">＋</div>
            <h2 className="text-lg font-semibold">Nenhuma avaliação registrada</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--text-muted)]">
              Crie a primeira avaliação física. Você poderá adicionar quantas avaliações forem necessárias ao longo do acompanhamento.
            </p>
            <button onClick={criarAvaliacao} disabled={criando} className="mt-5 rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--on-accent)] disabled:opacity-60">
              Criar primeira avaliação
            </button>
          </section>
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {avaliacoes.map(item => (
              <article key={item.id} className="flex flex-col rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Registro #{item.numero}</p>
                    <h2 className="mt-1 text-lg font-bold">Avaliação física</h2>
                  </div>
                  <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--accent)]">Ativa</span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-[var(--surface-sunken)] p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Realizada em</p>
                    <p className="mt-1 text-sm font-semibold">{formatarData(item.realizadaEm)}</p>
                  </div>
                  <div className="rounded-lg bg-[var(--surface-sunken)] p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Peso</p>
                    <p className="mt-1 text-sm font-semibold">{item.peso ? `${item.peso} kg` : "Não informado"}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-xs text-[var(--text-secondary)]">
                  {item.criadaPorEmail ? (
                    <p><span className="font-semibold">Criada por:</span> {item.criadaPorEmail} · {formatarDataHora(item.criadaEm ?? "")}</p>
                  ) : (
                    <p className="text-[var(--text-muted)]">Registro legado: autor e data de criação originais não foram registrados.</p>
                  )}
                  {item.atualizadaEm && (
                    <p><span className="font-semibold">Última alteração:</span> {item.atualizadaPorEmail ?? "Usuário não identificado"} · {formatarDataHora(item.atualizadaEm)}</p>
                  )}
                </div>

                <div className="mt-auto flex gap-2 pt-5">
                  <button
                    type="button"
                    onClick={() => navigate(`/avaliacoes/${item.id}`)}
                    className="flex-1 rounded-md bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-[var(--on-accent)] hover:bg-[var(--accent-hover)]"
                  >
                    Abrir avaliação
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistoricoId(item.id)}
                    className="rounded-md border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
                  >
                    Histórico
                  </button>
                  <button
                    type="button"
                    onClick={() => void arquivarAvaliacao(item.id, item.numero)}
                    className="rounded-md border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--danger)] hover:bg-[var(--danger-soft)]"
                    aria-label={`Arquivar avaliação ${item.numero}`}
                    title="Arquivar avaliação"
                  >
                    Arquivar
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>

      {historicoId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setHistoricoId(null)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Histórico da avaliação"
            className="max-h-[80vh] w-full max-w-xl overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-5 shadow-xl"
            onClick={event => event.stopPropagation()}
          >
            <header className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Auditoria</p>
                <h2 className="mt-1 text-lg font-bold">Histórico · Avaliação #{selecionadaHistorico?.numero ?? ""}</h2>
              </div>
              <button onClick={() => setHistoricoId(null)} className="rounded-md px-2 py-1 text-sm text-[var(--text-muted)] hover:bg-[var(--surface-hover)]" aria-label="Fechar histórico">✕</button>
            </header>

            {carregandoHistorico ? (
              <p className="py-8 text-center text-sm text-[var(--text-muted)]">Carregando histórico...</p>
            ) : erroHistorico ? (
              <p className="py-8 text-center text-sm text-red-500">{erroHistorico}</p>
            ) : historico.length === 0 ? (
              <p className="py-8 text-center text-sm text-[var(--text-muted)]">Nenhum evento foi registrado antes da ativação da auditoria.</p>
            ) : (
              <ol className="space-y-4 py-5">
                {historico.map(evento => (
                  <li key={evento.id} className="relative border-l-2 border-[var(--accent)] pl-4">
                    <p className="text-sm font-semibold">{nomeAcao(evento.acao)}</p>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">{evento.resumo}</p>
                    <p className="mt-2 text-xs text-[var(--text-muted)]">
                      {evento.usuarioEmail} · {evento.usuarioTipo} · {formatarDataHora(evento.criadoEm)}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
