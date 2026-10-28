import { Cell } from "../types/cell";
import { Overlay } from "../types/overlay";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../constants/defaults";
import { getCellAtTime } from "./duration";
import { drawBoardCell } from "./renderers/boardRenderer";
import {
  drawSidebarDecoration,
  drawStatusBar,
  drawWindowFrame,
} from "./renderers/chromeRenderer";
import { drawCodeCell } from "./renderers/codeRenderer";
import { drawDelayCell } from "./renderers/delayRenderer";
import { drawGraphCell } from "./renderers/graphRenderer";
import { drawMarkdownCell } from "./renderers/markdownRenderer";
import { drawOverlays } from "./renderers/overlayRenderer";

export { drawRoundRect, drawWindowFrame } from "./renderers/chromeRenderer";
export { drawBarChart } from "./renderers/graphRenderer";

export function renderCanvasStage(
  canvas: HTMLCanvasElement,
  cells: Cell[],
  globalTime: number,
  fps: number,
  overlays: Overlay[] = [],
  hiddenOverlayIds?: ReadonlySet<string> | string[] | null,
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const w = CANVAS_WIDTH;
  const h = CANVAS_HEIGHT;
  const scale = canvas.width / CANVAS_WIDTH;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.scale(scale, scale);

  const result = getCellAtTime(cells, globalTime);
  if (!result) {
    ctx.clearRect(0, 0, w, h);
    drawOverlays(ctx, overlays, globalTime, hiddenOverlayIds);
    return;
  }

  const { cell, localTime } = result;

  if (cell.type === "board") {
    drawBoardCell(ctx, cell, w, h);
    drawOverlays(ctx, overlays, globalTime, hiddenOverlayIds);
    return;
  }

  let headerTitle = cell.name || "main.py";
  if (cell.type === "delay") headerTitle = "⏸ Delay";

  drawWindowFrame(ctx, w, h, headerTitle);

  if (cell.type !== "delay") {
    drawSidebarDecoration(ctx, h, cell);
  }

  if (cell.type === "code") {
    if (/\.md$/i.test(cell.name)) {
      drawMarkdownCell(ctx, cell, localTime, globalTime, w);
    } else {
      drawCodeCell(ctx, cell, localTime, globalTime, w);
    }
  } else if (cell.type === "graph") {
    drawGraphCell(ctx, cell, localTime, w, h);
  } else if (cell.type === "delay") {
    drawDelayCell(ctx, cell, localTime, w, h);
  }

  drawStatusBar(ctx, w, h, globalTime, fps);
  drawOverlays(ctx, overlays, globalTime, hiddenOverlayIds);
}
