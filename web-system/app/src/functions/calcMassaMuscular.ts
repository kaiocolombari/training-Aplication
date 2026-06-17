export function calcularMassaMuscular(
    massa: number,
    gorduraKg: number,
    genero: string,
    idade: number,
    areaBraco: number,
    areaCoxa: number,
    imc?: number
) {
    const masculino =
        genero.toLowerCase() === "masculino";

    const massaMagra =
        massa - gorduraKg;

    const fatorBase =
        masculino ? 0.54 : 0.47;

    let massaMuscular =
        massaMagra * fatorBase;

    let fatorIdade = 1;

    if (idade >= 60) {
        fatorIdade = 0.90;
    } else if (idade >= 50) {
        fatorIdade = 0.94;
    } else if (idade >= 40) {
        fatorIdade = 0.97;
    }

    massaMuscular *= fatorIdade;

    const areaTotal =
        areaBraco + areaCoxa;

    const referenciaArea =
        masculino ? 260 : 220;

    const ajusteArea =
        areaTotal / referenciaArea;

    const ajusteAreaLimitado =
        Math.min(
            Math.max(ajusteArea, 0.85),
            1.15
        );

    massaMuscular *=
        ajusteAreaLimitado;

    if (imc) {
        if (imc < 18.5) {
            massaMuscular *= 0.96;
        } else if (
            imc >= 25 &&
            imc < 30
        ) {
            massaMuscular *= 1.02;
        }
    }

    return Number(
        massaMuscular.toFixed(2)
    );
}