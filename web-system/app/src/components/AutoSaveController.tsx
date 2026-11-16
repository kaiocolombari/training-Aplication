import { useEffect, useRef, useState } from "react";
import { useAvaliacao } from "../context/avaliacaoContext";
import { useAuth } from "../context/authContext";
import { salvarFichaAutosave } from "../service/cadastroService";
import { ApiError } from "../service/api";

export default function AutoSaveController() {
    const {
        avaliacao,
        alunoSelecionadoId,
        alteracoesPendentes,
        autoSaveEnabled,
        autoSaveDelayMs,
        autoSaveStatus,
        marcarComoSalvo,
        setAutoSaveStatus,
        setAutoSaveLastSavedAt,
        setAutoSaveError,
    } = useAvaliacao();
    const { user } = useAuth();
    const [retryVersion, setRetryVersion] = useState(0);
    const inFlight = useRef(false);
    const pendingAfterFlight = useRef(false);
    const lastFailed = useRef<{ userId: string; alunoId: string; payload: string } | null>(null);
    const currentUserId = useRef(user?.usuarioId ?? null);
    const currentAlunoId = useRef(alunoSelecionadoId);

    currentUserId.current = user?.usuarioId ?? null;
    currentAlunoId.current = alunoSelecionadoId;

    useEffect(() => {
        lastFailed.current = null;
        setAutoSaveStatus("idle");
        setAutoSaveLastSavedAt(null);
        setAutoSaveError(null);
    }, [user?.usuarioId, alunoSelecionadoId, setAutoSaveStatus, setAutoSaveLastSavedAt, setAutoSaveError]);

    useEffect(() => {
        if (autoSaveStatus === "idle" || autoSaveStatus === "saved") lastFailed.current = null;
    }, [autoSaveStatus]);

    useEffect(() => {
        const userId = user?.usuarioId;
        const alunoId = alunoSelecionadoId;

        if (
            !autoSaveEnabled ||
            !userId ||
            !alunoId ||
            !alteracoesPendentes ||
            (user?.tipo !== "ADMIN" && user?.tipo !== "PERSONAL")
        ) {
            if (
                !autoSaveEnabled ||
                !alunoId ||
                (!alteracoesPendentes && (autoSaveStatus === "waiting" || autoSaveStatus === "error"))
            ) {
                setAutoSaveStatus("idle");
                setAutoSaveError(null);
            }
            return;
        }

        // Manual save and automatic save share the same status to avoid concurrent PUTs.
        if (inFlight.current) {
            pendingAfterFlight.current = true;
            return;
        }
        if (autoSaveStatus === "saving") return;

        const snapshot = JSON.parse(JSON.stringify(avaliacao)) as typeof avaliacao;
        const payload = JSON.stringify(snapshot);
        const falhaAnterior = lastFailed.current;

        if (falhaAnterior?.userId === userId && falhaAnterior.alunoId === alunoId && falhaAnterior.payload === payload) {
            return;
        }

        setAutoSaveStatus("waiting");
        setAutoSaveError(null);

        const timeout = window.setTimeout(() => {
            if (inFlight.current) return;

            inFlight.current = true;
            setAutoSaveStatus("saving");

            void (async () => {
                try {
                    await salvarFichaAutosave(alunoId, snapshot);
                    lastFailed.current = null;

                    if (currentUserId.current === userId && currentAlunoId.current === alunoId) {
                        marcarComoSalvo(snapshot, alunoId);
                        setAutoSaveLastSavedAt(new Date());
                        setAutoSaveError(null);
                        setAutoSaveStatus("saved");
                    }
                } catch (error) {
                    lastFailed.current = { userId, alunoId, payload };
                    if (currentUserId.current === userId && currentAlunoId.current === alunoId) {
                        setAutoSaveError(
                            error instanceof ApiError
                                ? error.message
                                : "Não foi possível salvar automaticamente. Verifique a conexão e tente salvar manualmente.",
                        );
                        setAutoSaveStatus("error");
                    }
                } finally {
                    inFlight.current = false;
                    if (pendingAfterFlight.current) {
                        pendingAfterFlight.current = false;
                        setRetryVersion((current) => current + 1);
                    }
                }
            })();
        }, autoSaveDelayMs);

        return () => window.clearTimeout(timeout);
    }, [
        avaliacao,
        alunoSelecionadoId,
        alteracoesPendentes,
        autoSaveEnabled,
        autoSaveDelayMs,
        autoSaveStatus,
        retryVersion,
        user?.usuarioId,
        user?.tipo,
        marcarComoSalvo,
        setAutoSaveStatus,
        setAutoSaveLastSavedAt,
        setAutoSaveError,
    ]);

    return null;
}
