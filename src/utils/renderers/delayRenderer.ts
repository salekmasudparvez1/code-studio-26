import { DelayCell } from "../../types/cell";
import { clamp } from "../math";

export function drawDelayCell(
  ctx: CanvasRenderingContext2D,
  cell: DelayCell,
  localTime: number,
  w: number,
  h: number,
): void {
  const dur = cell.seconds || 3;
  const progress = clamp(localTime / Math.max(0.1, dur), 0, 1);
  const remain = Math.max(0, Math.ceil((1 - progress) * dur));

  ctx.fillStyle = "#e6edf3";
  ctx.font = "bold 64px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("⏸ Pause", w / 2, h / 2 - 40);

  ctx.font = "120px ui-monospace, monospace";
  ctx.fillStyle = "#7c9cff";
  ctx.fillText(`${remain}s`, w / 2, h / 2 + 80);
}
