"use client";

import Highcharts from "highcharts";
import HighchartsReactModule from "highcharts-react-official";

const HighchartsReact =
    (HighchartsReactModule as any).default ||
    HighchartsReactModule;

const valorSeguro = (valor: any) => {
    if (valor === undefined || valor === null || valor === "") {
        return null;
    }

    const numero = Number(valor);

    return isNaN(numero) ? null : numero;
};

export function GraficoForca({
    resultadoRmAV1,
    resultadoRmAV2,
}: any) {

    const options: Highcharts.Options = {
        chart: {
            type: "column",
            backgroundColor: "transparent",
            height: 220,
        },

        title: {
            text: undefined,
        },

        credits: {
            enabled: false,
        },

        xAxis: {
            categories: ["1ª AV", "2ª AV"],
            lineColor: "#ccc",
        },

        yAxis: {
            title: {
                text: undefined,
            },
            gridLineColor: "#e5e5e5",
        },

        legend: {
            align: "left",
            verticalAlign: "top",
            layout: "vertical",
            itemStyle: {
                fontSize: "11px",
            },
        },

        plotOptions: {
            column: {
                pointWidth: 28,
                borderRadius: 2,
                dataLabels: {
                    enabled: true,
                    format: "{y}",
                },
            },
        },

        series: [
            {
                name: "Supino",
                type: "column",
                color: "#c75c5c",
                data: [
                    valorSeguro(resultadoRmAV1?.supino?.rm),
                    valorSeguro(resultadoRmAV2?.supino?.rm),
                ],
            },
            {
                name: "Agachamento",
                type: "column",
                color: "#4a90e2",
                data: [
                    valorSeguro(resultadoRmAV1?.agachamento?.rm),
                    valorSeguro(resultadoRmAV2?.agachamento?.rm),
                ],
            },
            {
                name: "Remada",
                type: "column",
                color: "#98b95f",
                data: [
                    valorSeguro(resultadoRmAV1?.remada?.rm),
                    valorSeguro(resultadoRmAV2?.remada?.rm),
                ],
            },
            {
                name: "Terra",
                type: "column",
                color: "#d8b04a",
                data: [
                    valorSeguro(resultadoRmAV1?.terra?.rm),
                    valorSeguro(resultadoRmAV2?.terra?.rm),
                ],
            },
        ],
    };

    return <HighchartsReact highcharts={Highcharts} options={options} />;
}