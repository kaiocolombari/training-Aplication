import { useState } from "react";
import { useAvaliacao } from "../context/avaliacaoContext";
import { FaSearch, FaRegTrashAlt, FaTrashAlt, FaRunning } from "react-icons/fa";

const regioesMusculares = [
    {
        titulo: "Braços",
        ids: ["biceps", "triceps"],
    },
    {
        titulo: "Costas",
        ids: ["costasUpper", "costasLower", "lombar"],
    },
    {
        titulo: "Peitoral",
        ids: ["clavicular", "esterocostal"],
    },
    {
        titulo: "Ombros",
        ids: ["deltoideAnterior", "deltoideLateral", "deltoidePosterior"],
    },
    {
        titulo: "Perna",
        ids: ["adutores", "posteriores", "vastos", "retoFemoral"],
    },
    {
        titulo: "Glúteos",
        ids: ["gluteoMaximo", "gluteoMedio", "gluteoMinimo"],
    },
    {
        titulo: "Complementares",
        ids: ["antebraco", "panturrilhas", "abdomen"],
    },
];

function calcularTotalGrupo(grupo: any) {
    return (
        Number(grupo?.seriesDiretas || 0) +
        Number(grupo?.seriesLivres || 0)
    );
}

function calcularTotalRegiao(grupos: any[], ids: string[]) {
    return ids.reduce((total, id) => {
        const grupo = grupos.find((item) => item.id === id);

        return total + calcularTotalGrupo(grupo);
    }, 0);
}

export default function Volume() {
    const { avaliacao, setAvaliacao } = useAvaliacao();

    const [semanaAtual, setSemanaAtual] = useState(0);

    const [animandoSemana, setAnimandoSemana] = useState(false);

    const [direcao, setDirecao] =
        useState<"esquerda" | "direita">("direita");

    const [modalAberto, setModalAberto] = useState(false);

    const [grupoSelecionado, setGrupoSelecionado] = useState(
        avaliacao.volume[0].grupos[0].id
    );

    const [semanaModal, setSemanaModal] = useState(
        semanaAtual + 1
    );

    const [seriesDiretasModal, setSeriesDiretasModal] = useState("");
    const [seriesLivresModal, setSeriesLivresModal] = useState("");

    const semana = avaliacao.volume[semanaAtual];

    const totalDiretasSemana = semana.grupos.reduce(
        (total: number, grupo: any) =>
            total + Number(grupo.seriesDiretas || 0),
        0
    );

    const trocarSemana = (novaSemana: number) => {
        if (novaSemana === semanaAtual || animandoSemana) return;

        setDirecao(
            novaSemana > semanaAtual
                ? "direita"
                : "esquerda"
        );

        setAnimandoSemana(true);

        setTimeout(() => {
            setSemanaAtual(novaSemana);

            setTimeout(() => {
                setAnimandoSemana(false);
            }, 50);

        }, 200);
    };

    const totalLivresSemana = semana.grupos.reduce(
        (total: number, grupo: any) =>
            total + Number(grupo.seriesLivres || 0),
        0
    );

    const totalSemana =
        totalDiretasSemana + totalLivresSemana;

    const gruposPreenchidos = semana.grupos.filter(
        (grupo: any) =>
            calcularTotalGrupo(grupo) > 0
    ).length;

    const aplicarValor = () => {
        const indiceGrupo =
            avaliacao.volume[0].grupos.findIndex(
                (grupo: any) =>
                    grupo.id === grupoSelecionado
            );

        if (indiceGrupo === -1) return;

        setAvaliacao((prev: any) => {
            const volume = [...prev.volume];

            const grupos = [
                ...volume[semanaModal - 1].grupos,
            ];

            grupos[indiceGrupo] = {
                ...grupos[indiceGrupo],

                seriesDiretas:
                    Number(seriesDiretasModal) || 0,

                seriesLivres:
                    Number(seriesLivresModal) || 0,
            };

            volume[semanaModal - 1] = {
                ...volume[semanaModal - 1],
                grupos,
            };

            return {
                ...prev,
                volume,
            };
        });

        setModalAberto(false);

        setSeriesDiretasModal("");
        setSeriesLivresModal("");
    };

    const atualizarVolume = (
        grupoIndex: number,
        tipo: "seriesDiretas" | "seriesLivres",
        valor: number
    ) => {
        setAvaliacao((prev: any) => {
            const volume = [...prev.volume];

            const grupos = [
                ...volume[semanaAtual].grupos,
            ];

            grupos[grupoIndex] = {
                ...grupos[grupoIndex],
                [tipo]: valor,
            };

            volume[semanaAtual] = {
                ...volume[semanaAtual],
                grupos,
            };

            return {
                ...prev,
                volume,
            };
        });
    };

    const limparRegiao = (idsRegiao: string[]) => {
        setAvaliacao((prev: any) => {
            const volume = [...prev.volume];

            const grupos = volume[semanaAtual].grupos.map((grupo: any) => {
                if (idsRegiao.includes(grupo.id)) {
                    return {
                        ...grupo,
                        seriesDiretas: 0,
                        seriesLivres: 0,
                    };
                }

                return grupo;
            });

            volume[semanaAtual] = {
                ...volume[semanaAtual],
                grupos,
            };

            return {
                ...prev,
                volume,
            };
        });
    };

    const puxarDadosSemanaAnterior = () => {
        try {
            if (semanaAtual === 0) {
                return;
            }

            setAvaliacao((prev: any) => {
                const volume = [...prev.volume];

                const gruposAnterior =
                    volume[semanaAtual - 1].grupos;

                const novosGrupos = gruposAnterior.map(
                    (grupo: any) => ({
                        ...grupo
                    })
                );

                volume[semanaAtual] = {
                    ...volume[semanaAtual],
                    grupos: novosGrupos
                };

                return {
                    ...prev,
                    volume
                };
            });

        } catch (err) {
            console.log(
                "Erro ao puxar dados da semana anterior:",
                err
            );
        }
    };

    const abrirModal = () => {
        const grupo = avaliacao.volume[
            semanaAtual
        ].grupos.find(
            (grupo: any) =>
                grupo.id === grupoSelecionado
        );

        setSemanaModal(semanaAtual + 1);

        setSeriesDiretasModal(
            String(grupo?.seriesDiretas || "")
        );

        setSeriesLivresModal(
            String(grupo?.seriesLivres || "")
        );

        setModalAberto(true);
    };

    return (
        <main className="min-h-full bg-[var(--surface-sunken)] p-3 md:p-5 text-[var(--text-primary)] transition-colors duration-200">

            <div className="
                mb-6
                flex flex-col gap-4
                rounded-3xl
                border border-[var(--border)]
                bg-[var(--surface-raised)]
                p-6
                shadow-[0_4px_18px_rgba(0,0,0,0.06)]
                md:flex-row
                md:items-center
                md:justify-between
            ">

                <div className="flex items-center gap-4">

                    <div>

                        <p className="
                            mb-1
                            text-xs
                            font-bold
                            uppercase
                            tracking-[0.2em]
                            text-[var(--accent-text)]
                        ">
                            Volume
                        </p>

                        <h1 className="
                            text-2xl
                            font-black
                            tracking-tight
                            text-[var(--text-primary)]
                            md:text-3xl
                        ">
                            Volume - Intensidade
                        </h1>

                        <p className="
                            mt-1
                            text-sm
                            text-[var(--text-muted)]
                        ">
                            Configure o volume para cada músculo
                            dos conjuntos musculares.
                        </p>

                    </div>

                </div>

                <div className="
                    flex items-center gap-3
                    rounded-2xl
                    border border-[var(--border)]
                    bg-[var(--surface-secondary)]
                    px-4 py-3
                ">

                    <div className="
                        flex h-10 w-10
                        items-center justify-center
                        rounded-xl
                        bg-[var(--accent)]
                        text-[var(--on-accent)]
                    ">
                        <FaRunning />
                    </div>

                    <div>

                        <p className="
                            text-xs
                            font-semibold
                            uppercase
                            tracking-wide
                            text-[var(--text-muted)]
                        ">
                            Treinos
                        </p>

                        <p className="
                            text-sm
                            font-black
                            text-[var(--text-primary)]
                        ">
                            12 disponíveis
                        </p>

                    </div>

                </div>

            </div>

            <section className="
                mt-5
                overflow-hidden
                rounded-3xl
                border border-[var(--border)]
                bg-[var(--surface-raised)]
                shadow-[0_4px_18px_rgba(0,0,0,0.06)]
            ">

                <div className="
                    border-b
                    border-[var(--border)]
                    bg-[var(--surface-secondary)]
                    p-5
                ">

                    <div className="
                        flex flex-col gap-4
                        lg:flex-row
                        lg:items-center
                        lg:justify-between
                    ">

                        <div>

                            <span className="
                                text-xs
                                font-bold
                                uppercase
                                tracking-wide
                                text-[var(--text-muted)]
                            ">
                                Semana selecionada
                            </span>

                            <h2 className="
                                mt-1
                                text-2xl
                                font-black
                                italic
                                uppercase
                                tracking-tight
                                text-[var(--accent-text)]
                            ">
                                Semana {semanaAtual + 1} / 12
                            </h2>

                            <div className="
                                mt-3
                                h-2
                                w-full
                                max-w-xs
                                overflow-hidden
                                rounded-full
                                bg-[var(--border-strong)]
                            ">
                                <div
                                    className="
                                        h-full
                                        rounded-full
                                        bg-[var(--accent)]
                                        transition-all
                                        duration-500
                                    "
                                    style={{
                                        width: `${((semanaAtual + 1) / 12) * 100}%`
                                    }}
                                />
                            </div>

                        </div>

                        <div className="
                            flex flex-wrap
                            gap-2
                        ">

                            <button
                                onClick={() => {
                                    trocarSemana(
                                        semanaAtual - 1
                                    );
                                }}
                                disabled={semanaAtual === 0}
                                className="
                                    h-10
                                    rounded-xl
                                    border
                                    border-[var(--border-strong)]
                                    bg-[var(--surface-tertiary)]
                                    px-4
                                    text-sm
                                    font-bold
                                    uppercase
                                    text-[var(--text-primary)]
                                    transition-all
                                    hover:cursor-pointer
                                    hover:bg-[var(--surface-hover)]
                                    hover:shadow-sm
                                    disabled:cursor-not-allowed
                                    disabled:opacity-40
                                "
                            >
                                Semana anterior
                            </button>

                            <button
                                onClick={() => {
                                    trocarSemana(
                                        semanaAtual + 1
                                    );
                                }}
                                disabled={semanaAtual === 11}
                                className="
                                    h-10
                                    rounded-xl
                                    border
                                    border-[var(--border-strong)]
                                    bg-[var(--surface-tertiary)]
                                    px-4
                                    text-sm
                                    font-bold
                                    uppercase
                                    text-[var(--text-primary)]
                                    transition-all
                                    hover:cursor-pointer
                                    hover:bg-[var(--surface-hover)]
                                    hover:shadow-sm
                                    disabled:cursor-not-allowed
                                    disabled:opacity-40
                                "
                            >
                                Próxima semana
                            </button>

                            {semanaAtual > 0 && (
                                <button
                                    onClick={
                                        puxarDadosSemanaAnterior
                                    }
                                    className="
                                        flex
                                        h-10
                                        items-center
                                        justify-center
                                        gap-2
                                        rounded-xl
                                        border
                                        border-[var(--accent-border)]
                                        bg-[var(--accent-soft)]
                                        px-4
                                        text-sm
                                        font-bold
                                        uppercase
                                        text-[var(--accent-text)]
                                        transition-all
                                        hover:cursor-pointer
                                        hover:bg-[var(--accent-soft)]
                                    "
                                >
                                    Puxar dados
                                </button>
                            )}

                            <button
                                onClick={abrirModal}
                                className="
                                    flex
                                    h-10
                                    items-center
                                    justify-center
                                    gap-2
                                    rounded-xl
                                    border
                                    border-[var(--accent-border)]
                                    bg-[var(--accent)]
                                    px-4
                                    text-sm
                                    font-bold
                                    uppercase
                                    text-[var(--on-accent)]
                                    transition-all
                                    hover:cursor-pointer
                                    hover:bg-[var(--accent-hover)]
                                    hover:shadow-sm
                                "
                            >
                                <span>
                                    Setar valores
                                </span>

                                <FaSearch size={14} />
                            </button>

                        </div>

                    </div>

                </div>

                <div className="
                    grid
                    gap-3
                    p-5
                    sm:grid-cols-2
                    xl:grid-cols-4
                ">

                    <div className="
                        rounded-2xl
                        border
                        border-[var(--border)]
                        bg-[var(--surface-secondary)]
                        p-4
                    ">

                        <span className="
                            text-xs
                            font-bold
                            uppercase
                            tracking-wide
                            text-[var(--text-muted)]
                        ">
                            Total da semana
                        </span>

                        <p className="
                            mt-1
                            text-2xl
                            font-black
                            text-[var(--text-primary)]
                        ">
                            {totalSemana}
                        </p>

                    </div>

                    <div className="
                        rounded-2xl
                        border
                        border-[var(--border)]
                        bg-[var(--surface-secondary)]
                        p-4
                    ">

                        <span className="
                            text-xs
                            font-bold
                            uppercase
                            tracking-wide
                            text-[var(--text-muted)]
                        ">
                            Séries diretas
                        </span>

                        <p className="
                            mt-1
                            text-2xl
                            font-black
                            text-[var(--accent-text)]
                        ">
                            {totalDiretasSemana}
                        </p>

                    </div>

                    <div className="
                        rounded-2xl
                        border
                        border-[var(--border)]
                        bg-[var(--surface-secondary)]
                        p-4
                    ">

                        <span className="
                            text-xs
                            font-bold
                            uppercase
                            tracking-wide
                            text-[var(--text-muted)]
                        ">
                            Séries livres
                        </span>

                        <p className="
                            mt-1
                            text-2xl
                            font-black
                            text-[var(--accent-text)]
                        ">
                            {totalLivresSemana}
                        </p>

                    </div>

                    <div className="
                        rounded-2xl
                        border
                        border-[var(--border)]
                        bg-[var(--surface-secondary)]
                        p-4
                    ">

                        <span className="
                            text-xs
                            font-bold
                            uppercase
                            tracking-wide
                            text-[var(--text-muted)]
                        ">
                            Grupos preenchidos
                        </span>

                        <p className="
                            mt-1
                            text-2xl
                            font-black
                            text-[var(--text-primary)]
                        ">
                            {gruposPreenchidos}
                        </p>

                    </div>

                </div>

            </section>

            <section
                className={`
                    mt-5
                    grid
                    gap-4
                    xl:grid-cols-2
                    transition-all
                    duration-200
                    ease-in-out
                    ${animandoSemana
                        ? direcao === "direita"
                            ? "translate-x-8 opacity-0"
                            : "-translate-x-8 opacity-0"
                        : "translate-x-0 opacity-100"
                    }
                `}
            >

                {regioesMusculares.map((regiao) => {

                    const totalRegiao =
                        calcularTotalRegiao(
                            semana.grupos,
                            regiao.ids
                        );

                    return (
                        <article
                            key={regiao.titulo}
                            className="
                                overflow-hidden
                                rounded-3xl
                                border
                                border-[var(--border)]
                                bg-[var(--surface-raised)]
                                shadow-[0_4px_18px_rgba(0,0,0,0.06)]
                                transition-shadow
                                duration-200
                                hover:shadow-[0_6px_24px_rgba(0,0,0,0.09)]
                            "
                        >

                            <div className="
                                flex
                                items-center
                                justify-between
                                border-b
                                border-[var(--border)]
                                bg-[var(--surface-secondary)]
                                px-5
                                py-4
                            ">

                                <div className="
                                    flex
                                    items-center
                                    gap-2
                                ">

                                    <h3 className="
                                        text-lg
                                        font-black
                                        italic
                                        uppercase
                                        tracking-wide
                                        text-[var(--accent-text)]
                                    ">
                                        {regiao.titulo}
                                    </h3>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            limparRegiao(
                                                regiao.ids
                                            )
                                        }
                                        title={`Limpar ${regiao.titulo}`}
                                        className="
                                            group
                                            rounded-lg
                                            p-1.5
                                            text-[var(--text-muted)]
                                            transition-all
                                            hover:cursor-pointer
                                            hover:bg-[var(--danger-soft)]
                                            hover:text-[var(--accent-text)]
                                        "
                                    >

                                        <FaRegTrashAlt
                                            size={15}
                                            className="
                                                block
                                                transition-all
                                                duration-150
                                                group-hover:hidden
                                            "
                                        />

                                        <FaTrashAlt
                                            size={15}
                                            className="
                                                hidden
                                                transition-all
                                                duration-150
                                                group-hover:block
                                            "
                                        />

                                    </button>

                                </div>

                                <span className="
                                    rounded-xl
                                    border
                                    border-[var(--border)]
                                    bg-[var(--surface-tertiary)]
                                    px-3
                                    py-1.5
                                    text-xs
                                    font-black
                                    uppercase
                                    tracking-wide
                                    text-[var(--text-primary)]
                                ">
                                    Total {totalRegiao}
                                </span>

                            </div>

                            <div className="
                                grid
                                grid-cols-[1fr_90px_90px_70px]
                                gap-2
                                px-5
                                pt-4
                                pb-2
                            ">

                                <span />

                                <span className="
                                    text-center
                                    text-[10px]
                                    font-black
                                    uppercase
                                    tracking-wide
                                    text-[var(--text-muted)]
                                ">
                                    Diretas
                                </span>

                                <span className="
                                    text-center
                                    text-[10px]
                                    font-black
                                    uppercase
                                    tracking-wide
                                    text-[var(--text-muted)]
                                ">
                                    Livres
                                </span>

                                <span className="
                                    text-center
                                    text-[10px]
                                    font-black
                                    uppercase
                                    tracking-wide
                                    text-[var(--text-muted)]
                                ">
                                    Total
                                </span>

                            </div>

                            <div className="
                                grid
                                gap-2
                                px-5
                                pb-5
                            ">

                                {regiao.ids.map((id) => {

                                    const grupoIndex =
                                        semana.grupos.findIndex(
                                            (grupo: any) =>
                                                grupo.id === id
                                        );

                                    const grupo =
                                        semana.grupos[
                                        grupoIndex
                                        ];

                                    if (!grupo) return null;

                                    const totalGrupo =
                                        calcularTotalGrupo(
                                            grupo
                                        );

                                    return (
                                        <div
                                            key={`${semanaAtual}-${grupo.id}`}
                                            className="
                                                grid
                                                grid-cols-[1fr_90px_90px_70px]
                                                items-center
                                                gap-2
                                                rounded-xl
                                                border
                                                border-[var(--border)]
                                                bg-[var(--surface-secondary)]
                                                px-3
                                                py-2
                                                transition-colors
                                                hover:border-[var(--border-strong)]
                                                hover:bg-[var(--surface-hover)]
                                            "
                                        >

                                            <span className="
                                                text-sm
                                                font-bold
                                                uppercase
                                                tracking-wide
                                                text-[var(--text-primary)]
                                            ">
                                                {grupo.grupo}
                                            </span>

                                            <input
                                                type="number"
                                                min={0}
                                                className="
                                                    h-10
                                                    w-full
                                                    rounded-lg
                                                    border
                                                    border-[var(--border-strong)]
                                                    bg-[var(--surface-raised)]
                                                    px-1
                                                    text-center
                                                    text-lg
                                                    font-black
                                                    text-[var(--accent-text)]
                                                    outline-none
                                                    transition-all
                                                    hover:border-[var(--accent-border)]
                                                    focus:border-[var(--accent-border)]
                                                    focus:bg-[var(--accent-soft)]
                                                    focus:ring-2
                                                    focus:ring-[var(--ring)]
                                                "
                                                value={
                                                    grupo.seriesDiretas ?? 0
                                                }
                                                onChange={(evento) =>
                                                    atualizarVolume(
                                                        grupoIndex,
                                                        "seriesDiretas",
                                                        Number(
                                                            evento
                                                                .target
                                                                .value
                                                        )
                                                    )
                                                }
                                            />

                                            <input
                                                type="number"
                                                min={0}
                                                className="
                                                    h-10
                                                    w-full
                                                    rounded-lg
                                                    border
                                                    border-[var(--border-strong)]
                                                    bg-[var(--surface-raised)]
                                                    px-1
                                                    text-center
                                                    text-lg
                                                    font-black
                                                    text-[var(--accent-text)]
                                                    outline-none
                                                    transition-all
                                                    hover:border-[var(--accent-border)]
                                                    focus:border-[var(--accent-border)]
                                                    focus:bg-[var(--accent-soft)]
                                                    focus:ring-2
                                                    focus:ring-[var(--ring)]
                                                "
                                                value={
                                                    grupo.seriesLivres ?? 0
                                                }
                                                onChange={(evento) =>
                                                    atualizarVolume(
                                                        grupoIndex,
                                                        "seriesLivres",
                                                        Number(
                                                            evento
                                                                .target
                                                                .value
                                                        )
                                                    )
                                                }
                                            />

                                            <span className="
                                                text-center
                                                text-lg
                                                font-black
                                                text-[var(--text-primary)]
                                            ">
                                                {totalGrupo}
                                            </span>

                                        </div>
                                    );
                                })}

                            </div>

                        </article>
                    );
                })}

            </section>

            {modalAberto && (

                <div className="
                    fixed
                    inset-0
                    z-50
                    flex
                    items-center
                    justify-center
                    bg-black/50
                    p-4
                    backdrop-blur-[2px]
                ">

                    <div className="
                        w-full
                        max-w-md
                        overflow-hidden
                        rounded-3xl
                        border
                        border-[var(--border)]
                        bg-[var(--surface-raised)]
                        shadow-[0_12px_40px_rgba(0,0,0,0.20)]
                    ">

                        <div className="
                            border-b
                            border-[var(--border)]
                            bg-[var(--surface-secondary)]
                            px-6
                            py-5
                        ">

                            <h2 className="
                                text-2xl
                                font-black
                                italic
                                uppercase
                                tracking-tight
                                text-[var(--accent-text)]
                            ">
                                Definir valores específicos
                            </h2>

                            <p className="
                                mt-1
                                text-sm
                                text-[var(--text-muted)]
                            ">
                                Selecione o grupo e a semana
                                que deseja configurar.
                            </p>

                        </div>


                        <div className="p-6">

                            <label className="
                                mb-4
                                block
                            ">

                                <span className="
                                    mb-1.5
                                    block
                                    text-xs
                                    font-black
                                    uppercase
                                    tracking-wide
                                    text-[var(--text-muted)]
                                ">
                                    Grupo muscular
                                </span>

                                <select
                                    className="
                                        h-11
                                        w-full
                                        rounded-xl
                                        border
                                        border-[var(--border-strong)]
                                        bg-[var(--surface-secondary)]
                                        px-3
                                        font-bold
                                        text-[var(--text-primary)]
                                        outline-none
                                        transition-all
                                        focus:border-[var(--accent-border)]
                                        focus:bg-[var(--accent-soft)]
                                        focus:ring-2
                                        focus:ring-[var(--ring)]
                                    "
                                    value={grupoSelecionado}
                                    onChange={(evento) => {

                                        const novoGrupo =
                                            evento.target.value;

                                        setGrupoSelecionado(
                                            novoGrupo
                                        );

                                        const grupo =
                                            avaliacao.volume[
                                                semanaModal - 1
                                            ].grupos.find(
                                                (grupo: any) =>
                                                    grupo.id ===
                                                    novoGrupo
                                            );

                                        setSeriesDiretasModal(
                                            String(
                                                grupo?.seriesDiretas ||
                                                ""
                                            )
                                        );

                                        setSeriesLivresModal(
                                            String(
                                                grupo?.seriesLivres ||
                                                ""
                                            )
                                        );
                                    }}
                                >

                                    {avaliacao.volume[
                                        0
                                    ].grupos.map(
                                        (grupo: any) => (
                                            <option
                                                key={grupo.id}
                                                value={grupo.id}
                                            >
                                                {grupo.grupo}
                                            </option>
                                        )
                                    )}

                                </select>

                            </label>


                            <label className="
                                mb-4
                                block
                            ">

                                <span className="
                                    mb-1.5
                                    block
                                    text-xs
                                    font-black
                                    uppercase
                                    tracking-wide
                                    text-[var(--text-muted)]
                                ">
                                    Semana
                                </span>

                                <select
                                    className="
                                        h-11
                                        w-full
                                        rounded-xl
                                        border
                                        border-[var(--border-strong)]
                                        bg-[var(--surface-secondary)]
                                        px-3
                                        font-bold
                                        text-[var(--text-primary)]
                                        outline-none
                                        transition-all
                                        focus:border-[var(--accent-border)]
                                        focus:bg-[var(--accent-soft)]
                                        focus:ring-2
                                        focus:ring-[var(--ring)]
                                    "
                                    value={semanaModal}
                                    onChange={(evento) => {

                                        const novaSemana =
                                            Number(
                                                evento.target.value
                                            );

                                        setSemanaModal(
                                            novaSemana
                                        );

                                        const grupo =
                                            avaliacao.volume[
                                                novaSemana - 1
                                            ].grupos.find(
                                                (grupo: any) =>
                                                    grupo.id ===
                                                    grupoSelecionado
                                            );

                                        setSeriesDiretasModal(
                                            String(
                                                grupo?.seriesDiretas ||
                                                ""
                                            )
                                        );

                                        setSeriesLivresModal(
                                            String(
                                                grupo?.seriesLivres ||
                                                ""
                                            )
                                        );
                                    }}
                                >

                                    {avaliacao.volume.map(
                                        (
                                            _: any,
                                            index: number
                                        ) => (
                                            <option
                                                key={index}
                                                value={index + 1}
                                            >
                                                Semana {index + 1}
                                            </option>
                                        )
                                    )}

                                </select>

                            </label>


                            <label className="
                                mb-4
                                block
                            ">

                                <span className="
                                    mb-1.5
                                    block
                                    text-xs
                                    font-black
                                    uppercase
                                    tracking-wide
                                    text-[var(--text-muted)]
                                ">
                                    Séries diretas
                                </span>

                                <input
                                    type="number"
                                    min={0}
                                    value={seriesDiretasModal}
                                    onChange={(evento) =>
                                        setSeriesDiretasModal(
                                            evento.target.value
                                        )
                                    }
                                    className="
                                        h-11
                                        w-full
                                        rounded-xl
                                        border
                                        border-[var(--border-strong)]
                                        bg-[var(--surface-secondary)]
                                        px-3
                                        font-black
                                        text-[var(--accent-text)]
                                        outline-none
                                        transition-all
                                        placeholder:text-zinc-400
                                        focus:border-[var(--accent-border)]
                                        focus:bg-[var(--accent-soft)]
                                        focus:ring-2
                                        focus:ring-[var(--ring)]
                                    "
                                    placeholder="Digite as séries diretas"
                                />

                            </label>


                            <label className="
                                mb-5
                                block
                            ">

                                <span className="
                                    mb-1.5
                                    block
                                    text-xs
                                    font-black
                                    uppercase
                                    tracking-wide
                                    text-[var(--text-muted)]
                                ">
                                    Séries livres
                                </span>

                                <input
                                    type="number"
                                    min={0}
                                    value={seriesLivresModal}
                                    onChange={(evento) =>
                                        setSeriesLivresModal(
                                            evento.target.value
                                        )
                                    }
                                    className="
                                        h-11
                                        w-full
                                        rounded-xl
                                        border
                                        border-[var(--border-strong)]
                                        bg-[var(--surface-secondary)]
                                        px-3
                                        font-black
                                        text-[var(--accent-text)]
                                        outline-none
                                        transition-all
                                        placeholder:text-zinc-400
                                        focus:border-[var(--accent-border)]
                                        focus:bg-[var(--accent-soft)]
                                        focus:ring-2
                                        focus:ring-[var(--ring)]
                                    "
                                    placeholder="Digite as séries livres"
                                />

                            </label>

                            <div className="
                                mb-5
                                rounded-2xl
                                border
                                border-[var(--border)]
                                bg-[var(--surface-secondary)]
                                p-4
                            ">

                                <span className="
                                    text-xs
                                    font-black
                                    uppercase
                                    tracking-wide
                                    text-[var(--text-muted)]
                                ">
                                    Volume total
                                </span>

                                <p className="
                                    mt-1
                                    text-3xl
                                    font-black
                                    text-[var(--accent-text)]
                                ">
                                    {
                                        (Number(
                                            seriesDiretasModal
                                        ) || 0) +
                                        (Number(
                                            seriesLivresModal
                                        ) || 0)
                                    }
                                </p>

                            </div>

                            <div className="
                                flex
                                justify-end
                                gap-2
                            ">

                                <button
                                    onClick={() =>
                                        setModalAberto(false)
                                    }
                                    className="
                                        h-10
                                        rounded-xl
                                        border
                                        border-[var(--border-strong)]
                                        bg-[var(--surface-secondary)]
                                        px-4
                                        text-sm
                                        font-bold
                                        uppercase
                                        text-[var(--text-secondary)]
                                        transition-all
                                        hover:cursor-pointer
                                        hover:border-[var(--danger)]
                                        hover:bg-[var(--danger-soft)]
                                        hover:text-[var(--danger)]
                                    "
                                >
                                    Cancelar
                                </button>

                                <button
                                    onClick={aplicarValor}
                                    className="
                                        h-10
                                        rounded-xl
                                        border
                                        border-[var(--accent-border)]
                                        bg-[var(--accent)]
                                        px-5
                                        text-sm
                                        font-bold
                                        uppercase
                                        text-[var(--on-accent)]
                                        transition-all
                                        hover:cursor-pointer
                                        hover:bg-[var(--accent-hover)]
                                        hover:shadow-sm
                                    "
                                >
                                    Aplicar
                                </button>

                            </div>

                        </div>

                    </div>

                </div>
            )}
        </main>
    );
}