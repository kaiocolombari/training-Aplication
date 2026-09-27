import navTool from "../components/navTool";
import { useState } from "react";
import { useAvaliacao } from "../context/avaliacaoContext";
import { FaSearch } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import { LuOctagonAlert } from "react-icons/lu";

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

    const puxarDadosSemanaAnterior = () => {
        try {
            // Não existe semana anterior para a primeira semana
            if (semanaAtual === 0) {
                return;
            }

            setAvaliacao((prev: any) => {
                const volume = [...prev.volume];

                const gruposAnterior = volume[semanaAtual - 1].grupos;

                const novosGrupos = gruposAnterior.map((grupo: any) => ({
                    ...grupo
                }));

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
            console.log("Erro ao puxar dados da semana anterior:", err);
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
        <main className="min-h-full bg-[#ececec] p-3 md:p-5">

            <hr className="mb-5 my-4 rounded-2xl border-[3px] border-zinc-400" />

            <header className="flex flex-col gap-2 border-b-2 border-[#b88b8b] pb-3">

                <h1 className="text-3xl font-bold italic text-zinc-600">
                    Volume - Intensidade
                </h1>

                <p className="text-sm font-bold uppercase tracking-wide text-[#a85f60]">
                    Volume semanal por região muscular
                </p>

            </header>

            <section className="mt-6 border-2 border-zinc-700 bg-white p-4">

                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                    <div>

                        <span className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                            Semana selecionada
                        </span>

                        <h2 className="text-2xl font-bold italic uppercase text-[#a85f60]">
                            Semana {semanaAtual + 1} / 12
                        </h2>

                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">

                        <button
                            onClick={() => {
                                setSemanaAtual((semana) =>
                                    Math.max(0, semana - 1)
                                )

                            }
                            }
                            disabled={semanaAtual === 0}
                            className="h-10 border-2 border-zinc-700 bg-zinc-700 px-4 text-sm font-bold uppercase text-white hover:cursor-pointer hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Semana anterior
                        </button>

                        <button
                            onClick={() => {
                                setSemanaAtual((semana) =>
                                    Math.min(11, semana + 1)
                                );
                            }
                            }
                            disabled={semanaAtual === 11}
                            className="h-10 border-2 border-zinc-700 bg-zinc-700 px-4 text-sm font-bold uppercase text-white hover:cursor-pointer hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Próxima semana
                        </button>

                        {semanaAtual > 0 && (
                            <button
                                onClick={puxarDadosSemanaAnterior}
                                className="flex h-10 items-center justify-center gap-2 border-2 border-[#a85f60] bg-white px-4 text-sm font-bold uppercase text-[#a85f60] hover:cursor-pointer hover:bg-[#f7eeee]"

                            >
                                Puxar Dados Da Semana Anterior
                            </button>
                        )}


                        <button
                            onClick={abrirModal}
                            className="flex h-10 items-center justify-center gap-2 border-2 border-[#a85f60] bg-white px-4 text-sm font-bold uppercase text-[#a85f60] hover:cursor-pointer hover:bg-[#f7eeee]"
                        >
                            <span>Setar valores</span>
                            <FaSearch size={14} />
                        </button>

                    </div>

                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-4">

                    <div className="border border-zinc-300 bg-[#f7f7f7] p-3">

                        <span className="text-xs font-bold uppercase text-zinc-500">
                            Total da semana
                        </span>

                        <p className="text-2xl font-bold text-zinc-800">
                            {totalSemana}
                        </p>

                    </div>

                    <div className="border border-zinc-300 bg-[#f7f7f7] p-3">

                        <span className="text-xs font-bold uppercase text-zinc-500">
                            Séries diretas
                        </span>

                        <p className="text-2xl font-bold text-zinc-800">
                            {totalDiretasSemana}
                        </p>

                    </div>

                    <div className="border border-zinc-300 bg-[#f7f7f7] p-3">

                        <span className="text-xs font-bold uppercase text-zinc-500">
                            Séries livres
                        </span>

                        <p className="text-2xl font-bold text-zinc-800">
                            {totalLivresSemana}
                        </p>

                    </div>

                    <div className="border border-zinc-300 bg-[#f7f7f7] p-3">

                        <span className="text-xs font-bold uppercase text-zinc-500">
                            Grupos preenchidos
                        </span>

                        <p className="text-2xl font-bold text-zinc-800">
                            {gruposPreenchidos}
                        </p>

                    </div>

                </div>

            </section>

            <section className="mt-5 grid gap-4 xl:grid-cols-2">

                {regioesMusculares.map((regiao) => {

                    const totalRegiao =
                        calcularTotalRegiao(
                            semana.grupos,
                            regiao.ids
                        );

                    return (
                        <article
                            key={regiao.titulo}
                            className="border-2 border-zinc-700 bg-white p-4"
                        >

                            <div className="mb-3 flex items-center justify-between border-b-2 border-[#b88b8b] pb-2">

                                <h3 className="text-lg font-bold italic uppercase tracking-wide text-[#a85f60]">
                                    {regiao.titulo}
                                </h3>

                                <span className="bg-[#ececec] px-3 py-1 text-sm font-bold uppercase text-zinc-700">
                                    Total {totalRegiao}
                                </span>

                            </div>

                            <div className="mb-2 grid grid-cols-[1fr_90px_90px_70px] gap-2 px-3">

                                <span />

                                <span className="text-center text-[10px] font-bold uppercase text-zinc-500">
                                    Diretas
                                </span>

                                <span className="text-center text-[10px] font-bold uppercase text-zinc-500">
                                    Livres
                                </span>

                                <span className="text-center text-[10px] font-bold uppercase text-zinc-500">
                                    Total
                                </span>

                            </div>

                            <div className="grid gap-2">

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
                                            className="grid grid-cols-[1fr_90px_90px_70px] items-center gap-2 border border-zinc-300 bg-[#f7f7f7] px-3 py-2"
                                        >

                                            <span className="text-sm font-bold uppercase tracking-wide text-zinc-700">
                                                {grupo.grupo}
                                            </span>

                                            <input
                                                type="number"
                                                min={0}
                                                className="h-10 w-full border-2 border-[#b88b8b] bg-white px-1 text-center text-lg font-bold text-[#a85f60] outline-none focus:border-[#a85f60]"
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
                                                className="h-10 w-full border-2 border-[#b88b8b] bg-white px-1 text-center text-lg font-bold text-[#a85f60] outline-none focus:border-[#a85f60]"
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
                                            <span className="text-center text-lg font-bold text-zinc-700">
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

                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

                    <div className="w-full max-w-md border-2 border-zinc-700 bg-white p-6 shadow-xl">

                        <h2 className="mb-5 border-b-2 border-[#b88b8b] pb-2 text-2xl font-bold italic uppercase text-[#a85f60]">
                            Definir valores específicos
                        </h2>

                        <label className="mb-3 block">

                            <span className="mb-1 block text-xs font-bold uppercase text-zinc-500">
                                Grupo muscular
                            </span>

                            <select
                                className="h-11 w-full border-2 border-zinc-300 bg-white px-3 font-bold text-zinc-700 outline-none focus:border-[#a85f60]"
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

                        <label className="mb-3 block">

                            <span className="mb-1 block text-xs font-bold uppercase text-zinc-500">
                                Semana
                            </span>

                            <select
                                className="h-11 w-full border-2 border-zinc-300 bg-white px-3 font-bold text-zinc-700 outline-none focus:border-[#a85f60]"
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

                        <label className="mb-3 block">

                            <span className="mb-1 block text-xs font-bold uppercase text-zinc-500">
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
                                className="h-11 w-full border-2 border-zinc-300 bg-white px-3 font-bold text-zinc-700 outline-none focus:border-[#a85f60]"
                                placeholder="Digite as séries diretas"
                            />

                        </label>

                        <label className="mb-5 block">

                            <span className="mb-1 block text-xs font-bold uppercase text-zinc-500">
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
                                className="h-11 w-full border-2 border-zinc-300 bg-white px-3 font-bold text-zinc-700 outline-none focus:border-[#a85f60]"
                                placeholder="Digite as séries livres"
                            />

                        </label>

                        <div className="mb-5 border border-zinc-300 bg-[#f7f7f7] p-3">

                            <span className="text-xs font-bold uppercase text-zinc-500">
                                Volume total
                            </span>

                            <p className="text-2xl font-bold text-zinc-800">
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

                        <div className="flex justify-end gap-2">

                            <button
                                onClick={() =>
                                    setModalAberto(false)
                                }
                                className="h-10 border-2 border-red-500 bg-white px-4 text-sm font-bold uppercase text-red-500 hover:cursor-pointer hover:bg-red-50"
                            >
                                Cancelar
                            </button>

                            <button
                                onClick={aplicarValor}
                                className="h-10 border-2 border-green-600 bg-green-600 px-4 text-sm font-bold uppercase text-white hover:cursor-pointer hover:bg-green-500"
                            >
                                Aplicar
                            </button>

                        </div>

                    </div>

                </div>
            )}

            <div className="mt-10">
                {navTool()}
            </div>

        </main >
    );
}