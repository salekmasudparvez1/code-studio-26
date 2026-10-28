import { BoardCell } from "../../types/cell";

export function drawBoardCell(
  ctx: CanvasRenderingContext2D,
  cell: BoardCell,
  w: number,
  h: number,
): void {
  ctx.fillStyle = cell.bgColor || "#000000";
  ctx.fillRect(0, 0, w, h);
}
