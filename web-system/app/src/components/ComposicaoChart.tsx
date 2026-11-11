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
      [0, String(Highcharts.color(base).brighten(0.2).get("rgb"))],
      [1, base],
    ],
  };
}

export default function ComposicaoCorporalChart(props: Props) {
  const chartData = useMemo(
    () => [
      {
        name: "MASSA MUSCULAR",
        y: safeNumber(props.massaMuscular),
        baseColor: "#34D399",
        color: makeGradient("#34D399"),
      },
      {
        name: "MASSA LIVRE DE GORDURA",
        y: safeNumber(props.massaLivre),
        baseColor: "#60A5FA",
        color: makeGradient("#60A5FA"),
      },
      {
        name: "MASSA ADIPOSA",
        y: safeNumber(props.massaAdiposa),
        baseColor: "#FB7185",
        color: makeGradient("#FB7185"),
      },
      {
        name: "MASSA TOTAL",
        y: safeNumber(props.massaTotal),
        baseColor: "#FBBF24",
        color: makeGradient("#FBBF24"),
      },
    ],
    [
      props.massaMuscular,
      props.massaLivre,
      props.massaAdiposa,
      props.massaTotal,
    ],
  );

  const options: Highcharts.Options = useMemo(
    () => ({
      chart: {
        type: "column",
        backgroundColor: "transparent",
        height: 280,
        style: {
          fontFamily: "Inter, sans-serif",
        },
      },

      title: { text: undefined },
      credits: { enabled: false },

      legend: {
        enabled: false,
      },

      xAxis: {
        labels: {
          style: {
            color: "#FFFFFF",
            fontSize: "12px",
            fontWeight: "700",
          },
        },
        lineColor: "rgba(146, 147, 255, 0.35)",
        tickColor: "transparent",
      },

      yAxis: {
        min: 0,
        gridLineColor: "rgba(146, 147, 255, 0.16)",
        gridLineDashStyle: "Dash",
        labels: {
          style: {
            color: "#FFFFFF",
            fontSize: "11px",
            fontWeight: "600",
          },
        },
        title: {
          text: undefined,
        },
      },

      tooltip: {
        backgroundColor: "#172033",
        borderColor: "#334155",
        borderRadius: 10,
        shadow: true,
        style: {
          color: "#F8FAFC",
          fontSize: "12px",
        },
        pointFormat:
          '<span style="color:{point.color}">●</span> {series.name}: <b>{point.y:.1f} kg</b>',
      },

      plotOptions: {
        column: {
          borderWidth: 0,
          borderRadius: 10,
          pointPadding: 0.08,
          groupPadding: 0.12,
          pointWidth: 58,
          shadow: {
            color: "rgba(0,0,0,.16)",
            offsetX: 0,
            offsetY: 4,
            opacity: 0.12,
            width: 6,
          },
          dataLabels: {
            enabled: true,
            crop: false,
            overflow: "allow",
            formatter() {
              return formatPt(Number(this.y));
            },
            y: -8,
            style: {
              color: "#FFFFFF",
              fontSize: "16px",
              fontWeight: "800",
              textOutline: "2px contrast",
            },
          },
        },
      },

      series: [
        {
          type: "column",
          name: "Composição corporal",
          data: chartData.map((item) => ({
            y: item.y,
            color: item.color,
          })),
        },
      ],
    }),
    [chartData],
  );

  return (
    <div className="grid w-full min-w-0 grid-cols-1 items-center gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
      {/* REFERÊNCIAS */}
      <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
        {chartData.map((item) => (
          <div
            key={item.name}
            className="
              flex min-w-0 items-center gap-3 rounded-xl p-3
              border border-[var(--border)]
              bg-[var(--surface-raised)]
              transition-all duration-200
            "
            style={{
              borderLeft: `4px solid ${item.baseColor}`,
            }}
          >
            <div className="flex min-w-0 flex-col gap-1">
              <span
                className="
                  break-words text-[10px] font-extrabold
                  leading-tight tracking-wide
                "
                style={{ color: "var(--text-primary)" }}
              >
                {item.name}
              </span>

              <span
                className="text-xl font-extrabold tabular-nums"
                style={{ color: item.baseColor }}
              >
                {formatPt(item.y)}
                <span
                  className="ml-1 text-xs font-bold"
                  style={{ color: "var(--text-secondary)" }}
                >
                  kg
                </span>
              </span>
            </div>
          </div>
        ))}
      </div>

      <div
        className="
          w-full min-w-0 overflow-hidden rounded-2xl p-3
          border border-[var(--border)]
          bg-[var(--surface-raised)]
        "
      >
        <HighchartsReact
          highcharts={Highcharts}
          options={options}
          containerProps={{
            style: {
              width: "100%",
              minWidth: 0,
            },
          }}
        />
      </div>
    </div>
  );
}
