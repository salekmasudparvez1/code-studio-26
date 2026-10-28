import { GraphCell } from "../../types/cell";
import { getGraphDuration } from "../duration";
import { clamp } from "../math";
import { drawRoundRect } from "./chromeRenderer";
import { drawCnn } from "./cnnRenderer";
import { drawClustering } from "./clusteringRenderer";
import { drawDecisionBoundary } from "./decisionBoundaryRenderer";
import { drawGradientDescent } from "./gradientDescentRenderer";
import { drawLstm } from "./lstmRenderer";
import { drawMatplotlib } from "./matplotlibRenderer";
import { drawNeuralNetwork } from "./neuralNetworkRenderer";
import { drawRnn } from "./rnnRenderer";
import { drawYolo } from "./yoloRenderer";

export function drawBarChart(
  ctx: CanvasRenderingContext2D,
  cell: GraphCell,
  progress: number,
  w: number,
  _h: number,
): void {
  const data = cell.data && cell.data.length > 0 ? cell.data : [10, 20, 30];
  const n = data.length;
  const maxVal = Math.max(...data, 1);
  const barColor = cell.barColor || "#7c9cff";

  ctx.fillStyle = "#e6edf3";
  ctx.font = "bold 42px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(cell.name || "Graph", w / 2, 200);

  const chartX = 200;
  const chartY = 280;
  const chartW = w - 400;
  const chartH = 480;

  ctx.strokeStyle = "#30363d";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = chartY + chartH * (i / 4);
    ctx.beginPath();
    ctx.moveTo(chartX, y);
    ctx.lineTo(chartX + chartW, y);
    ctx.stroke();

    ctx.fillStyle = "#8b949e";
    ctx.font = "20px system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(String(Math.round(maxVal * (1 - i / 4))), chartX - 20, y);
  }

  const barW = (chartW / n) * 0.6;
  const gap = (chartW / n) * 0.4;
  const animBars = Math.floor(progress * n + 0.001);

  for (let i = 0; i < n; i++) {
    const x = chartX + i * (barW + gap) + gap / 2;
    const fullH = (data[i] / maxVal) * chartH;
    let barH = 0;

    if (i < animBars) {
      barH = fullH;
    } else if (i === animBars) {
      const frac = progress * n - animBars;
      barH = fullH * frac;
    }

    const y = chartY + chartH - barH;
    drawRoundRect(ctx, x, y, barW, barH, 6, barColor);

    if (barH > 8) {
      ctx.fillStyle = "#e6edf3";
      ctx.font = "bold 22px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(String(data[i]), x + barW / 2, y - 8);
    }

    ctx.fillStyle = "#8b949e";
    ctx.font = "18px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(`Item ${i + 1}`, x + barW / 2, chartY + chartH + 20);
  }

  ctx.strokeStyle = "#484f58";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(chartX, chartY);
  ctx.lineTo(chartX, chartY + chartH);
  ctx.lineTo(chartX + chartW, chartY + chartH);
  ctx.stroke();
}

export function drawGraphCell(
  ctx: CanvasRenderingContext2D,
  cell: GraphCell,
  localTime: number,
  w: number,
  h: number,
): void {
  const graphDur = getGraphDuration(cell);
  const progress = clamp(localTime / Math.max(0.01, graphDur), 0, 1);

  switch (cell.graphType) {
    case "decision-boundary":
      drawDecisionBoundary(ctx, cell, progress, w, h);
      break;
    case "ann":
    case "neural-network":
      drawNeuralNetwork(ctx, cell, progress, w, h);
      break;
    case "cnn":
      drawCnn(ctx, cell, progress, w, h);
      break;
    case "rnn":
      drawRnn(ctx, cell, progress, w, h);
      break;
    case "lstm":
      drawLstm(ctx, cell, progress, w, h);
      break;
    case "yolo":
      drawYolo(ctx, cell, progress, w, h);
      break;
    case "matplotlib":
      drawMatplotlib(ctx, cell, progress, w, h);
      break;
    case "clustering":
      drawClustering(ctx, cell, progress, w, h);
      break;
    case "gradient-descent":
      drawGradientDescent(ctx, cell, progress, w, h);
      break;
    case "bar":
    default:
      drawBarChart(ctx, cell, progress, w, h);
      break;
  }
}
