import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useAuth } from "../context/authContext";
import { comunicacaoService } from "../service/comunicacaoService";
import FeedbackAlunoPortal from "./FeedbackAlunoPortal";
import AcompanhamentoVolumePortal from "./AcompanhamentoVolumePortal";
import ChatAlunoConversa from "../components/ChatAlunoConversa";

export default function CadastroApp() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const notificacoesQuery = useQuery({
        queryKey: ["comunicacao", "notificacoes"],
        queryFn: comunicacaoService.listarNotificacoes,
        enabled: user?.tipo === "ALUNO",
        refetchInterval: 30_000,
    });
    const marcarLida = useMutation({
        mutationFn: comunicacaoService.marcarNotificacaoLida,
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: ["comunicacao", "notificacoes"] }),
    });
    const notificacoes = notificacoesQuery.data ?? [];
    const naoLidas = notificacoes.filter(item => !item.lidaEm).length;

    return (
        <main className="grid min-h-screen place-items-center bg-[#111312] px-5 py-12 text-white">
            <section className="w-full max-w-xl text-center">
                <span className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-emerald-400/10 text-3xl text-emerald-300">
                    ✓
                </span>
                <p className="mt-8 text-[10px] font-bold uppercase tracking-[.24em] text-emerald-300">
                    Perfil aprovado
                </p>
                <h1 className="mt-3 text-3xl font-semibold">Tudo pronto, {user?.nome}.</h1>
                <p className="mt-4 text-sm leading-7 text-white/60">
                    Seu cadastro foi aprovado. Agora você pode acessar o aplicativo e acompanhar
                    seus treinos.
                </p>
                <section
                    aria-live="polite"
                    className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[.035] text-left"
                >
                    <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
                        <div>
                            <h2 className="text-sm font-semibold text-white">
                                Avisos de acompanhamento
                            </h2>
                            <p className="mt-1 text-[11px] text-white/45">
                                Atualizações importantes sobre sua equipe e seu acompanhamento.
                            </p>
                        </div>
                        <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white/70">
                            {naoLidas} não lidas
                        </span>
                    </div>
                    {notificacoesQuery.isLoading ? (
                        <div
                            role="status"
                            className="flex items-center gap-2 px-4 py-5 text-xs text-white/50"
                        >
                            <span className="ui-spinner" aria-hidden="true" />
                            Verificando avisos...
                        </div>
                    ) : notificacoesQuery.isError ? (
                        <p role="alert" className="px-4 py-5 text-xs text-rose-300">
                            Não foi possível carregar seus avisos. Tente novamente em instantes.
                        </p>
                    ) : notificacoes.length === 0 ? (
                        <p className="px-4 py-5 text-xs text-white/45">
                            Você não possui avisos no momento.
                        </p>
                    ) : (
                        <div className="divide-y divide-white/10">
                            {notificacoes.slice(0, 8).map(notificacao => (
                                <button
                                    key={notificacao.id}
                                    type="button"
                                    disabled={Boolean(marcarLida.isPending)}
                                    aria-busy={marcarLida.isPending && !notificacao.lidaEm}
                                    onClick={() => {
                                        if (!notificacao.lidaEm) marcarLida.mutate(notificacao.id);
                                    }}
                                    className={`block w-full px-4 py-4 text-left transition hover:bg-white/[.04] ${
                                        notificacao.lidaEm ? "opacity-65" : "bg-emerald-300/[.035]"
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="text-xs font-semibold text-white">
                                            {notificacao.titulo}
                                        </span>
                                        {!notificacao.lidaEm && (
                                            <span className="shrink-0 rounded-full bg-emerald-300/10 px-2 py-0.5 text-[9px] font-semibold text-emerald-200">
                                                Nova
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-1.5 text-[11px] leading-5 text-white/60">
                                        {notificacao.mensagem}
                                    </p>
                                    <span className="mt-2 block text-[9px] text-white/35">
                                        {new Date(notificacao.criadaEm).toLocaleString("pt-BR")}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </section>
                {import.meta.env.VITE_MOBILE_APP_URL ? (
                    <a
                        href={import.meta.env.VITE_MOBILE_APP_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-8 inline-flex rounded-xl bg-[#a85f60] px-6 py-3 text-sm font-bold text-white"
                    >
                        Abrir aplicativo mobile ↗
                    </a>
                ) : (
                    <p className="mt-8 text-xs text-white/40">
                        O link do aplicativo será disponibilizado em breve.
                    </p>
                )}
                {user?.tipo === "ALUNO" && (
                    <>
                        <AcompanhamentoVolumePortal alunoId={user.alunoId ?? null} />
                        <section className="mt-10 space-y-3 text-left">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[.2em] text-emerald-300">Comunicação direta</p>
                                <h2 className="mt-2 text-xl font-semibold">Converse com seu personal</h2>
                                <p className="mt-2 text-xs leading-6 text-white/55">Mensagens privadas com confirmação de leitura para manter seu acompanhamento organizado.</p>
                            </div>
                            <div className="[--surface:#171c19] [--surface-secondary:#121714] [--surface-tertiary:#252d28] [--input-bg:#121714] [--text-primary:#f5f7f5] [--text-secondary:#c1c9c2] [--text-muted:#7f8a81] [--border:rgba(255,255,255,.1)] [--accent:#6ee7a8] [--accent-soft:rgba(110,231,168,.12)] [--accent-text:#9af0c0] [--on-accent:#102019] [--accent-hover:#8af0b8] [--success:#6ee7a8] [--success-soft:rgba(110,231,168,.12)] [--danger:#fda4af] [--danger-soft:rgba(244,63,94,.12)]">
                                <ChatAlunoConversa modo="aluno" />
                            </div>
                        </section>
                    </>
                )}
                <FeedbackAlunoPortal />
                <button
                    onClick={() => {
                        void logout()
                            .catch(() => undefined)
                            .then(() => navigate("/register", { replace: true }));
                    }}
                    className="mx-auto mt-5 block text-xs text-white/45 hover:text-white"
                >
                    Sair da conta
                </button>
            </section>
        </main>
    );
}
