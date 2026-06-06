import type { PerimetroKey } from "../types/perimetroKey";


function parseDecimal(value: string) {
    const normalized = value.replace(",", ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
}

export function calcularAreaCoxa(
    perimetros: Record<PerimetroKey, string>,
    resumoDobras: any
) {
    const c =
        (
            parseDecimal(perimetros.coxaMediaD)
            + parseDecimal(perimetros.coxaMediaE)
        ) / 2;

    const dobra =
        parseDecimal(
            resumoDobras?.mediaFinal?.coxaMedia ?? ""
        ) / 10;

    if (!c || !dobra) {
        return 0;
    }

    return (
        (
            c - Math.PI * dobra
        ) ** 2
        / (4 * Math.PI)
    );
}