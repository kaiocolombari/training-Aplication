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

    // 1. massa magra
    const massaMagra =
        massa - gorduraKg;

    // 2. fator base por sexo
    const fatorBase =
        masculino ? 0.54 : 0.47;

    let massaMuscular =
        massaMagra * fatorBase;

    // 3. ajuste pela idade
    // perda muscular progressiva
    let fatorIdade = 1;

    if (idade >= 60) {
        fatorIdade = 0.90;
    } else if (idade >= 50) {
        fatorIdade = 0.94;
    } else if (idade >= 40) {
        fatorIdade = 0.97;
    }

    massaMuscular *= fatorIdade;

    // 4. ajuste por áreas musculares
    const areaTotal =
        areaBraco + areaCoxa;

    // referências aproximadas
    const referenciaArea =
        masculino ? 260 : 220;

    const ajusteArea =
        areaTotal / referenciaArea;

    // limitar extremos
    const ajusteAreaLimitado =
        Math.min(
            Math.max(ajusteArea, 0.85),
            1.15
        );

    massaMuscular *=
        ajusteAreaLimitado;

    // 5. ajuste leve por IMC
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