import type { useMemo } from "react";
import type { ExamData } from "../types/examData";

function parseDecimal(value: string) {
    const normalized = value.replace(",", ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
}

export function calcularMassaAdiposa(
    data: ExamData,
    resumeDobras: any
) {
    const massa = parseDecimal(data.massa);
    const idade = Number(data.idade);

    const somaDobras = parseDecimal(resumeDobras.somatorio);

    if (!massa || !idade || !somaDobras) {
        return 0;
    }

    const masculino =
        data.genero === "masculino";

    const densidade = masculino
        ? 1.112
        - 0.00043499 * somaDobras
        + 0.00000055 * somaDobras ** 2
        - 0.00028826 * idade
        : 1.097
        - 0.00046971 * somaDobras
        + 0.00000056 * somaDobras ** 2
        - 0.00012828 * idade;

    const gordura =
        (495 / densidade) - 450;

    return massa * (gordura / 100);
}

