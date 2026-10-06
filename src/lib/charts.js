import { Chart, registerables } from "chart.js";
import { C, fmt } from "./utils";

Chart.register(...registerables);
Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif';
Chart.defaults.font.weight = 400;
Chart.defaults.color = "#64748b";
Chart.defaults.maintainAspectRatio = false;
Chart.defaults.plugins.legend.labels.boxWidth = 10;
Chart.defaults.plugins.title.font = { weight: 500, size: 13 };
Chart.defaults.plugins.tooltip.backgroundColor = C.ink;
Chart.defaults.plugins.tooltip.padding = 10;
Chart.defaults.plugins.tooltip.cornerRadius = 8;

/** Standard x/y axes with light grid; pass a y tick formatter. */
export const axes = (yFmt = (v) => fmt(v)) => ({
  x: { grid: { display: false }, border: { display: false } },
  y: { grid: { color: C.grid }, border: { display: false }, ticks: { callback: yFmt } },
});

export const rightAxis = (cb) => ({ position: "right", grid: { display: false }, border: { display: false }, ticks: { callback: cb } });

export const noLegend = { legend: { display: false } };

export const sparkOptions = {
  responsive: true,
  plugins: { legend: { display: false }, tooltip: { enabled: false } },
  scales: { x: { display: false }, y: { display: false } },
  elements: { point: { radius: 0 } },
};

export const gauge = { rotation: -90, circumference: 180, cutout: "75%", plugins: { legend: { display: false }, tooltip: { enabled: false } } };
