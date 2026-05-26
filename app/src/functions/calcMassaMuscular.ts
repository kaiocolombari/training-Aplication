export function calcularMassaMuscular(
    massa: number,
    gorduraKg: number,
    genero: string
) {
    const massaMagra =
        massa - gorduraKg;

    const fator =
        genero === "masculino"
            ? 0.54
            : 0.47;

    return massaMagra * fator;
}