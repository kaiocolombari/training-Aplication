import type { useMemo } from "react";
import type { PerimetroKey } from "../types/perimetroKey";

function parseDecimal(value: string) {
    const normalized = value.replace(",", ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
}
export function calcularAreaBraco(
    perimetros: Record<PerimetroKey, string>,
    resumoDobras: any
) {
    const c =
        (
            parseDecimal(perimetros.bracoD)
            + parseDecimal(perimetros.bracoE)
        ) / 2;

    const triceps =
        parseDecimal(
            resumoDobras?.mediaFinal?.triceps ?? ""
        ) / 10;

    if (!c || !triceps) {
        return 0;
    }

    const valor =
        (
            c - Math.PI * triceps
        ) ** 2
        / (4 * Math.PI);

    return valor;
}