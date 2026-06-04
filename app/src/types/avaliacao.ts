export interface Avaliacao {
    aluno: {
        nomeCompleto: string;
        genero: string;
        idade: string;
        etnia: string;
        estatura: string;
        femur: string;
        tibia: string;
        una: string;
        umero: string;
    };

    anamnese: {
        objetivo: string;
        observacoes: string;
    };

    avaliacao1: {
        peso: string;
        altura: string;
        percentualGordura: string;
        perimetros: {
            bracoD: string;
            bracoE: string;
            antebracoD: string;
            antebracoE: string;
            torax: string;
            cintura: string;
            abdomen: string;
            quadril: string;
            coxaSupD: string;
            coxaSupE: string;
            coxaMediaD: string;
            coxaMediaE: string;
            panturrilhaD: string;
            panturrilhaE: string;
        }
        dobrasCutaneas: {
            triceps: string;
            subescapular: string;
            biceps: string;
            iliaca: string;
            supraespinhal: string;
            abdominal: string;
            coxaMedia: string;
            panturrilha: string;
        }
    };

    avaliacao2: {
        peso: string;
        percentualGordura: string;
        perimetros: {
            bracoD: string;
            bracoE: string;
            antebracoD: string;
            antebracoE: string;
            torax: string;
            cintura: string;
            abdomen: string;
            quadril: string;
            coxaSupD: string;
            coxaSupE: string;
            coxaMediaD: string;
            coxaMediaE: string;
            panturrilhaD: string;
            panturrilhaE: string;
        }
        dobrasCutaneas: {
            triceps: string;
            subescapular: string;
            biceps: string;
            iliaca: string;
            supraespinhal: string;
            abdominal: string;
            coxaMedia: string;
            panturrilha: string;
        }
    };

    testeCarga: {
        supino: {
            carga: string;
            repeticoes: string;
        };

        legPress: {
            carga: string;
            repeticoes: string;
        };

        remada: {
            carga: string;
            repeticoes: string;
        };
    };
}