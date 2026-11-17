const PREFIX = "treino_ultimo_salvamento";

function storageKey(usuarioId: string, alunoId: string) {
    return `${PREFIX}_${usuarioId}_${alunoId}`;
}

export function lerUltimoSalvamento(usuarioId?: string | null, alunoId?: string | null): Date | null {
    if (!usuarioId || !alunoId || typeof window === "undefined") return null;

    try {
        const valor = window.localStorage.getItem(storageKey(usuarioId, alunoId));
        if (!valor) return null;
        const data = new Date(valor);
        return Number.isNaN(data.getTime()) ? null : data;
    } catch {
        return null;
    }
}

export function registrarUltimoSalvamento(
    usuarioId: string | null | undefined,
    alunoId: string | null | undefined,
    data: Date | null,
) {
    if (!usuarioId || !alunoId || !data || typeof window === "undefined") return;

    try {
        window.localStorage.setItem(storageKey(usuarioId, alunoId), data.toISOString());
    } catch {
        // A data continua disponível em memória mesmo se o navegador bloquear o storage.
    }
}
