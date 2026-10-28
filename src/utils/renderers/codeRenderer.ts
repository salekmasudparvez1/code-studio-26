import { CodeCell } from "../../types/cell";
import { clamp } from "../math";
import { tokenizeLine } from "../syntaxHighlight";
import { drawNotebookOutput } from "./notebookOutputRenderer";

interface WrappedCodeLine {
  text: string;
  sourceLine: number;
}

function wrapCodeLines(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  maxWidth: number,
): WrappedCodeLine[] {
  const wrapped: WrappedCodeLine[] = [];

  lines.forEach((line, sourceLine) => {
    if (!line) {
      wrapped.push({ text: "", sourceLine });
      return;
    }

    let start = 0;
    while (start < line.length) {
      let end = start;
      let lastBreak = -1;

      while (
        end < line.length &&
        ctx.measureText(line.slice(start, end + 1)).width <= maxWidth
      ) {
        if (/\s/.test(line[end])) lastBreak = end + 1;
        end += 1;
      }

      if (end === line.length) {
        wrapped.push({ text: line.slice(start), sourceLine });
        break;
      }

      const breakAt = lastBreak > start ? lastBreak : Math.max(start + 1, end);
      wrapped.push({ text: line.slice(start, breakAt), sourceLine });
      start = breakAt;
    }
  });

  return wrapped;
}

export function drawCodeCell(
  ctx: CanvasRenderingContext2D,
  cell: CodeCell,
  localTime: number,
  globalTime: number,
  w: number,
): void {
  const speed = cell.speed || 18;
  const source = (cell.source || "").replace(/\r\n/g, "\n");
  const typeDuration = source.length / Math.max(1, speed);
  const visibleChars = Math.floor(clamp(localTime, 0, typeDuration) * speed);

  const text = source.slice(0, visibleChars);
  const lines = text.split("\n");
  const fontSize = 31;
  const lineHeight = 48;
  const left = 142;
  const top = 250;
  const maxLines = cell.output ? 9 : 15;
  const maxTextWidth = w - left - 90;

  ctx.font = `${fontSize}px "SFMono-Regular", Consolas, "Liberation Mono", monospace`;
  const wrappedLines = wrapCodeLines(ctx, lines, maxTextWidth);
  const activeVisualLine = Math.max(0, wrappedLines.length - 1);
  const firstVisibleLine = Math.max(0, activeVisualLine - maxLines + 1);
  const shownLines = wrappedLines.slice(
    firstVisibleLine,
    firstVisibleLine + maxLines,
  );
  const activeLineIndex = activeVisualLine - firstVisibleLine;

  ctx.fillStyle = "rgba(56, 139, 253, 0.09)";
  ctx.fillRect(113, top + activeLineIndex * lineHeight, w - 155, 45);

  ctx.textBaseline = "top";

  shownLines.forEach((wrappedLine, i) => {
    const y = top + i * lineHeight;

    ctx.fillStyle = "#6e7681";
    ctx.textAlign = "right";
    const lineNumber =
      i === 0 || wrappedLine.sourceLine !== shownLines[i - 1].sourceLine
        ? String(wrappedLine.sourceLine + 1)
        : "·";
    ctx.fillText(lineNumber, left - 35, y);

    const tokens = tokenizeLine(wrappedLine.text);
    let drawX = left;
    ctx.textAlign = "left";

    tokens.forEach((token) => {
      ctx.fillStyle = token.color;
      ctx.fillText(token.text, drawX, y);
      drawX += ctx.measureText(token.text).width;
    });
  });

  const cursorLine = activeLineIndex;
  const cursorText = shownLines[cursorLine]?.text || "";
  const cursorX = left + ctx.measureText(cursorText).width;
  const cursorY = top + cursorLine * lineHeight;
  const isCursorOn = Math.floor(globalTime * 2) % 2 === 0;

  if (isCursorOn) {
    ctx.fillStyle = "#e6edf3";
    ctx.fillRect(Math.min(cursorX, w - 80), cursorY + 2, 3, 34);
  }

  if (firstVisibleLine > 0) {
    ctx.fillStyle = "#8b949e";
    ctx.textAlign = "left";
    ctx.font = "18px system-ui, sans-serif";
    ctx.fillText("↑ scrolling", left, top - 18);
  }

  if (cell.output && localTime >= typeDuration) {
    drawNotebookOutput(ctx, cell.output, w);
  }
}
