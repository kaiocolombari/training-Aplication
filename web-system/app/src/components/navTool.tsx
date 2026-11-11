import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router";
import { tabs } from "../routes/tabRoutes";
import {
  BsLayoutSidebar,
  BsLayoutTextWindow,
  BsGrid3X3Gap,
  BsArrowsAngleExpand,
  BsArrowsAngleContract,
  BsChevronDown,
  BsCheck2,
} from "react-icons/bs";
import { useAvaliacao } from "../context/avaliacaoContext";
import type { TelaAvaliacao } from "../context/avaliacaoContext";

type LayoutNavegacao = "bottom" | "side";

const CHAVE_LAYOUT = "avaliacao_nav_layout";
const CHAVE_EXPANDIDO = "avaliacao_nav_expandido";

export default function NavTool() {
  const location = useLocation();
  const { alteracoesPorTela } = useAvaliacao();
  const chavePorRota: Record<string, TelaAvaliacao> = {
    "/avaliacao1": "avaliacao1",
    "/avaliacao2": "avaliacao2",
    "/comparacao": "comparacao",
    "/prescricao": "prescricao",
    "/periodizacao": "periodizacao",
    "/volume": "volume",
    "/intensidade": "intensidade",
  };

  const [layout, setLayout] = useState<LayoutNavegacao>(() => {
    if (typeof window === "undefined") return "bottom";

    return localStorage.getItem(CHAVE_LAYOUT) === "side" ? "side" : "bottom";
  });

  const [expandido, setExpandido] = useState(() => {
    if (typeof window === "undefined") return true;

    return localStorage.getItem(CHAVE_EXPANDIDO) !== "false";
  });

  useEffect(() => {
    localStorage.setItem(CHAVE_LAYOUT, layout);
  }, [layout]);

  useEffect(() => {
    localStorage.setItem(CHAVE_EXPANDIDO, String(expandido));
  }, [expandido]);

  const modoInferior = layout === "bottom";

  const etapaAtual = tabs.findIndex((tab) => {
    const destino = tab.rota === "/" ? "/" : `/${tab.rota}`;
    return location.pathname === destino;
  });

  function alternarLayout() {
    setLayout((atual) => (atual === "bottom" ? "side" : "bottom"));
  }

  function confirmarNavegacao(rota: string) {
    if (rota !== "/") return true;

    return window.confirm(
      "Você está saindo da avaliação.\n\n" +
        "Certifique-se de que todas as alterações foram salvas antes de continuar.\n\n" +
        "Deseja voltar ao Painel de Controle?",
    );
  }

  // Variáveis compatíveis com os dois sistemas de tema.
  const corFundo = "var(--surface, var(--surface-raised, #ffffff))";
  const corFundoSecundario =
    "var(--surface-secondary, var(--surface-sunken, #f3f4f6))";
  const corBorda = "var(--border, #e5e7eb)";
  const corTexto = "var(--text-primary, var(--text, #242424))";
  const corSecundaria = "var(--text-secondary, #525252)";
  const corMuted = "var(--text-muted, #888888)";
  const corDestaque = "var(--accent, #5558d9)";
  const corDestaqueSuave = "var(--accent-soft, #eeeeff)";
  const corDestaqueTexto = "var(--accent-text, var(--accent, #5558d9))";

  const botaoClasse =
    "grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-all duration-200 hover:bg-[var(--surface-sunken)]";

  return (
    <nav
      aria-label="Navegação entre etapas da avaliação"
      className={`
        z-40 shrink-0
        ${
          modoInferior
            ? `fixed bottom-3 left-1/2 -translate-x-1/2 ${
                expandido ? "w-[min(96%,900px)]" : "w-auto"
              }`
            : "sticky top-0 h-screen self-start"
        }
      `}
      style={
        !modoInferior
          ? {
              width: expandido ? "230px" : "60px",
              minWidth: expandido ? "230px" : "60px",
              height: "100vh",
              transition: "width 200ms ease, min-width 200ms ease",
            }
          : undefined
      }
    >
      <div
        className={`
          flex flex-col overflow-hidden border shadow-xl
          ${
            modoInferior
              ? expandido
                ? "rounded-2xl"
                : "rounded-full"
              : "h-full rounded-none border-y-0 border-l-0 border-r"
          }
        `}
        style={{
          height: modoInferior ? "auto" : "100%",
          backgroundColor: corFundo,
          color: corTexto,
          borderColor: corBorda,
          boxShadow: modoInferior
            ? "0 8px 32px var(--shadow-color, rgb(0 0 0 / 14%))"
            : "4px 0 24px var(--shadow-color, rgb(0 0 0 / 5%))",
        }}
      >
        {/* CABEÇALHO */}
        <div
          className={`
            flex shrink-0 items-center justify-between
            ${modoInferior ? "px-3 py-2" : "px-4 py-5"}
            ${!expandido && !modoInferior ? "justify-center px-1" : ""}
            ${modoInferior && !expandido ? "gap-2 px-2 py-1.5" : ""}
          `}
          style={{
            borderBottom:
              expandido && !modoInferior ? `1px solid ${corBorda}` : "none",
          }}
        >
          {expandido && (
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
                style={{
                  backgroundColor: corDestaqueSuave,
                  color: corDestaque,
                }}
              >
                <BsGrid3X3Gap size={17} />
              </div>

              <div className="min-w-0">
                <span
                  className="block text-[11px] font-bold uppercase tracking-[0.13em]"
                  style={{ color: corTexto }}
                >
                  Avaliação
                </span>
                <span
                  className="mt-0.5 block text-[10px]"
                  style={{ color: corMuted }}
                >
                  Navegação por etapas
                </span>
              </div>
            </div>
          )}

          {/* Identificação da etapa atual na bottom minimizada */}
          {modoInferior && !expandido && (
            <div className="flex items-center gap-2 pl-1">
              <span
                className="grid h-7 w-7 place-items-center rounded-full text-[10px] font-bold"
                style={{
                  backgroundColor: corDestaque,
                  color: "#ffffff",
                }}
              >
                {etapaAtual >= 0 ? etapaAtual + 1 : "—"}
              </span>

              <span
                className="max-w-[130px] truncate text-[11px] font-semibold"
                style={{ color: corTexto }}
              >
                {etapaAtual >= 0 ? tabs[etapaAtual].nome : "Avaliação"}
              </span>
            </div>
          )}

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={alternarLayout}
              title={
                modoInferior ? "Mover para lateral" : "Mover para inferior"
              }
              className={botaoClasse}
              style={{ color: corSecundaria }}
            >
              {modoInferior ? (
                <BsLayoutSidebar size={15} />
              ) : (
                <BsLayoutTextWindow size={15} />
              )}
            </button>

            <button
              type="button"
              onClick={() => setExpandido((atual) => !atual)}
              title={expandido ? "Recolher navegação" : "Expandir navegação"}
              className={botaoClasse}
              style={{ color: corSecundaria }}
            >
              {expandido ? (
                <BsArrowsAngleContract size={14} />
              ) : (
                <BsArrowsAngleExpand size={14} />
              )}
            </button>
          </div>
        </div>

        {/* ETAPAS */}
        {(expandido || !modoInferior) && (
          <div
            className={`
              min-h-0
              ${
                modoInferior
                  ? "grid grid-cols-[repeat(auto-fit,minmax(85px,1fr))] gap-1.5 px-2 pb-2"
                  : "flex flex-1 flex-col gap-1 overflow-y-auto px-2.5 py-4"
              }
            `}
          >
            {!modoInferior && expandido && (
              <span
                className="mb-2 px-2 text-[9px] font-bold uppercase tracking-[0.16em]"
                style={{ color: corMuted }}
              >
                Fluxo de avaliação
              </span>
            )}

            {tabs.map((tab, index) => (
              <NavLink
                key={tab.rota}
                to={tab.rota}
                onClick={(evento) => {
                  if (!confirmarNavegacao(tab.rota)) {
                    evento.preventDefault();
                  }
                }}
                title={tab.nome}
                className={({ isActive }) => `
                  group relative flex min-w-0 items-center
                  transition-all duration-200
                  ${
                    modoInferior
                      ? "min-h-[36px] justify-center gap-1.5 rounded-lg px-1.5 py-1"
                      : `min-h-[48px] rounded-xl ${
                          expandido ? "gap-3 px-3 py-2" : "justify-center px-1"
                        }`
                  }
                `}
                style={({ isActive }) => ({
                  backgroundColor: isActive ? corDestaqueSuave : "transparent",
                  color: isActive ? corDestaqueTexto : corSecundaria,
                })}
              >
                {({ isActive }) => {
                  const chave = chavePorRota[tab.rota];
                  const alterado = chave ? alteracoesPorTela[chave] : false;

                  return (
                    <>
                      <span className="relative grid shrink-0 place-items-center">
                        <span
                          className={`
                                        grid place-items-center font-bold
                                        transition-all duration-200
                                        ${
                                          modoInferior
                                            ? "h-6 w-6 rounded-md text-[10px]"
                                            : "h-8 w-8 rounded-lg text-[11px]"
                                        }
                                    `}
                          style={{
                            backgroundColor: isActive
                              ? corDestaque
                              : corFundoSecundario,
                            color: isActive ? "#ffffff" : corSecundaria,
                          }}
                        >
                          {isActive ? <BsCheck2 size={14} /> : index + 1}
                        </span>

                        {alterado && (
                          <span
                            className="
                                            absolute -right-1 -top-1
                                            h-2.5 w-2.5 rounded-full
                                            border-2
                                        "
                            style={{
                              backgroundColor: "#e5a23b",
                              borderColor: corFundo,
                            }}
                          />
                        )}
                      </span>

                      {expandido && (
                        <span
                          className={`
                                        min-w-0 font-medium leading-tight
                                        ${
                                          modoInferior
                                            ? "text-center text-[10px]"
                                            : "flex-1 text-[11px]"
                                        }
                                    `}
                          style={{
                            color: isActive ? corDestaqueTexto : corTexto,
                            overflowWrap: "anywhere",
                          }}
                        >
                          {tab.nome}

                          {alterado && !modoInferior && (
                            <span
                              className="mt-1 block text-[9px] font-medium"
                              style={{ color: "#d69a35" }}
                            >
                              Alterações pendentes
                            </span>
                          )}
                        </span>
                      )}

                      {!expandido && (
                        <span className="sr-only">
                          {tab.nome}
                          {alterado ? " - Alterações pendentes" : ""}
                        </span>
                      )}

                      {isActive && !modoInferior && expandido && (
                        <span
                          className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: corDestaque }}
                        />
                      )}

                      {isActive && !modoInferior && !expandido && (
                        <span
                          className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full"
                          style={{ backgroundColor: corDestaque }}
                        />
                      )}

                      {isActive && modoInferior && (
                        <span
                          className="absolute bottom-0.5 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full"
                          style={{ backgroundColor: corDestaque }}
                        />
                      )}
                    </>
                  );
                }}
              </NavLink>
            ))}
          </div>
        )}

        {/* RODAPÉ LATERAL */}
        {!modoInferior && (
          <div
            className={`
              flex shrink-0 items-center border-t
              ${
                expandido
                  ? "justify-between px-4 py-3"
                  : "justify-center px-1 py-3"
              }
            `}
            style={{ borderColor: corBorda }}
          >
            {expandido && (
              <div className="min-w-0">
                <span
                  className="block text-[10px] font-semibold"
                  style={{ color: corTexto }}
                >
                  {tabs.length} etapas
                </span>
                <span
                  className="mt-0.5 block text-[9px]"
                  style={{ color: corMuted }}
                >
                  {etapaAtual >= 0
                    ? `Etapa ${etapaAtual + 1} de ${tabs.length}`
                    : "Selecione uma etapa"}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setExpandido((atual) => !atual)}
              className={botaoClasse}
              style={{ color: corSecundaria }}
              title={expandido ? "Recolher" : "Expandir"}
            >
              {expandido ? (
                <BsArrowsAngleContract size={14} />
              ) : (
                <BsArrowsAngleExpand size={14} />
              )}
            </button>
          </div>
        )}

        {/* RODAPÉ DA BOTTOM EXPANDIDA */}
        {modoInferior && expandido && (
          <div
            className="flex shrink-0 items-center justify-between border-t px-3 py-1.5"
            style={{ borderColor: corBorda }}
          >
            <span className="text-[9px]" style={{ color: corMuted }}>
              {etapaAtual >= 0
                ? `Etapa ${etapaAtual + 1} de ${tabs.length}`
                : `${tabs.length} etapas`}
            </span>

            <button
              type="button"
              onClick={() => setExpandido(false)}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[9px] font-medium transition-colors hover:bg-[var(--surface-sunken)]"
              style={{ color: corSecundaria }}
            >
              Recolher
              <BsChevronDown size={11} />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
