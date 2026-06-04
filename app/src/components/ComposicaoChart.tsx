"use client";

import { useMemo } from "react";
import Highcharts from "highcharts";
import HighchartsReactModule from "highcharts-react-official";

const HighchartsReact =
    (HighchartsReactModule as any).default || HighchartsReactModule;

type Props = {
    massaMuscular?: number;
    massaLivre?: number;
    massaAdiposa?: number;
    massaTotal?: number;
};

function safeNumber(value?: number) {
    return Number(value ?? 0);
}

function formatPt(value: number) {
    return value.toFixed(1).replace(".", ",");
}

function makeGradient(base: string): Highcharts.ColorType {
    return {
        linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
        stops: [
            [0, String(Highcharts.color(base).brighten(0.25).get("rgb"))],
            [1, base],
        ],
    };
}

export default function ComposicaoCorporalChart(props: Props) {
    const chartData = useMemo(
        () => [
            {
                name: "MASSA MUSCULAR (KG)",
                y: safeNumber(props.massaMuscular),
                baseColor: "#19e31d",
                color: makeGradient("#19e31d"),
            },
            {
                name: "MASSA LIVRE DE GORDURA (KG)",
                y: safeNumber(props.massaLivre),
                baseColor: "#3d6df0",
                color: makeGradient("#3d6df0"),
            },
            {
                name: "MASSA ADIPOSA (KG)",
                y: safeNumber(props.massaAdiposa),
                baseColor: "#f42323",
                color: makeGradient("#f42323"),
            },
            {
                name: "MASSA TOTAL (KG)",
                y: safeNumber(props.massaTotal),
                baseColor: "#e9ea18",
                color: makeGradient("#e9ea18"),
            },
        ],
        [props.massaMuscular, props.massaLivre, props.massaAdiposa, props.massaTotal]
    );

    const maxY = Math.max(...chartData.map((item) => item.y), 100);

    const options: Highcharts.Options = useMemo(
        () => ({
            chart: {
                type: "column",
                backgroundColor: "transparent",
                height: 280,
                spacingTop: 12,
                spacingBottom: 20,
                spacingLeft: 0,
                spacingRight: 0,
            },

            title: { text: undefined },

            credits: { enabled: false },

            legend: { enabled: false },

            xAxis: {
                categories: chartData.map(() => ""),
                lineWidth: 0,
                tickLength: 0,
                labels: { enabled: false },
            },

            yAxis: {
                min: 0,
                max: Math.ceil(maxY / 10) * 10,
                title: { text: undefined },
                gridLineColor: "#e4e4e7",
                labels: { enabled: false },
            },

            tooltip: {
                enabled: false,
            },

            plotOptions: {
                column: {
                    borderWidth: 0,
                    borderRadius: 18,
                    pointPadding: 0.01,
                    groupPadding: 0,
                    pointWidth: 90,
                    shadow: {
                        color: "rgba(0,0,0,.18)",
                        offsetX: 0,
                        offsetY: 5,
                        opacity: 0.12,
                        width: 8,
                    },
                    dataLabels: {
                        enabled: true,
                        crop: false,
                        overflow: "allow",
                        formatter() {
                            return formatPt(Number(this.y));
                        },
                        y: -10,
                        style: {
                            color: "#3f3f46",
                            fontSize: "24px",
                            fontWeight: "700",
                            textOutline: "none",
                        },
                    },
                },
            },

            series: [
                {
                    type: "column",
                    data: chartData.map((item) => ({
                        y: item.y,
                        color: item.color,
                    })),
                },
            ],
        }),
        [chartData, maxY]
    );

    return (
        <div className="relative grid w-[300px] grid-cols-[320px_1fr] items-center gap-6">
            <div className="space-y-2 pt-3">
                {chartData.map((item) => (
                    <div
                        key={item.name}
                        className="flex items-center gap-3 text-lg font-semibold text-zinc-700"
                    >
                        <span
                            className="h-3 w-3 rounded-sm border border-zinc-700/20"
                            style={{ backgroundColor: item.baseColor }}
                        />
                        {item.name}
                    </div>
                ))}
            </div>

            <div className="rounded-2xl bg-white/40 p-3">
                <HighchartsReact
                    highcharts={Highcharts}
                    options={options}
                />
            </div>
        </div>
    );
}