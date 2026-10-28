import { CodeCell } from "../../types/cell";
import { clamp } from "../math";
import { sliceTypedHtml } from "./markdown/htmlText";
import { MarkdownVisualLine } from "./markdown/markdownTypes";
import { parseMarkdownLines } from "./markdown/parseMarkdownLines";
import { drawRichText, markdownStyle, measureRichText } from "./markdown/richText";
import { wrapMarkdownLine } from "./markdown/wrapHtmlLine";
import { drawNotebookOutput } from "./notebookOutputRenderer";

const markdownImages = new Map<string, HTMLImageElement>();

function drawMarkdownImage(ctx: CanvasRenderingContext2D, line: MarkdownVisualLine, x: number, y: number, maxWidth: number): void {
  if (!line.imageSrc) return;
  let image = markdownImages.get(line.imageSrc);
  if (!image) {
    image = new Image();
    image.onload = () => window.dispatchEvent(new Event("codestudio:image-loaded"));
    image.onerror = () => window.dispatchEvent(new Event("codestudio:image-loaded"));
    image.src = line.imageSrc;
    markdownImages.set(line.imageSrc, image);
  }
  if (image.complete && image.naturalWidth > 0) {
    const scale = Math.min(maxWidth / image.naturalWidth, 150 / image.naturalHeight, 1);
    ctx.drawImage(image, x, y, image.naturalWidth * scale, image.naturalHeight * scale);
  } else {
    ctx.fillStyle = "#8b949e";
    ctx.font = "16px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("Loading image" + (line.imageAlt ? ": " + line.imageAlt : "…"), x, y + 8);
  }
}

function wrapVisualLine(
  ctx: CanvasRenderingContext2D,
  line: MarkdownVisualLine,
  maxWidth: number,
): MarkdownVisualLine[] {
  if (line.style === "hr" || line.style === "image") return [line];
  if (line.style === "table" && line.tableCells?.length) {
    const colW = maxWidth / line.tableCells.length;
    const wrappedCols = line.tableCells.map((cell) =>
      wrapMarkdownLine(
        ctx,
        { ...line, text: cell.text, style: "table", tableCells: undefined },
        Math.max(80, colW - 16),
      ),
    );
    const rowCount = Math.max(...wrappedCols.map((col) => col.length), 1);
    const rows: MarkdownVisualLine[] = [];
    for (let row = 0; row < rowCount; row += 1) {
      rows.push({
        ...line,
        box: line.box
          ? {
              ...line.box,
              first: Boolean(line.box.first && row === 0),
              last: Boolean(line.box.last && row === rowCount - 1),
            }
          : undefined,
        tableCells: line.tableCells.map((cell, col) => ({
          text: wrappedCols[col][row]?.text || "",
          header: cell.header,
        })),
      });
    }
    return rows;
  }

  const style = markdownStyle(line.style, {
    size: line.size,
    color: line.color,
  });
  ctx.font = `${style.weight} ${style.size}px ${style.font}`;
  return wrapMarkdownLine(ctx, line, maxWidth);
}

function drawCallout(
  ctx: CanvasRenderingContext2D,
  line: MarkdownVisualLine,
  x: number,
  y: number,
  width: number,
  lineHeight: number,
): void {
  if (!line.box) return;
  const top = y - (line.box.first ? 10 : 2);
  const height = lineHeight + (line.box.last ? 12 : 6);
  ctx.fillStyle = line.box.background;
  ctx.fillRect(x, top, width, height);
  if (line.box.border) {
    ctx.fillStyle = line.box.border;
    ctx.fillRect(x, top, 6, height);
  }
}

function drawTableLine(
  ctx: CanvasRenderingContext2D,
  line: MarkdownVisualLine,
  x: number,
  y: number,
  width: number,
  lineHeight: number,
): void {
  const cells = line.tableCells || [];
  if (!cells.length) return;
  const colW = width / cells.length;
  cells.forEach((cell, index) => {
    const cellX = x + index * colW;
    ctx.fillStyle = cell.header ? "rgba(56, 139, 253, 0.22)" : "rgba(22, 27, 34, 0.9)";
    ctx.fillRect(cellX, y - 4, colW - 6, lineHeight - 2);
    ctx.strokeStyle = "#30363d";
    ctx.lineWidth = 1;
    ctx.strokeRect(cellX, y - 4, colW - 6, lineHeight - 2);
    const style = markdownStyle("table", {
      weight: cell.header ? "bold" : "normal",
      color: cell.header ? "#f0f6fc" : "#c9d1d9",
    });
    drawRichText(ctx, cell.text, cellX + 8, y, style);
  });
}

export function drawMarkdownCell(
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
  const visibleSource = sliceTypedHtml(source, visibleChars);
  const left = 150;
  const top = 210;
  const maxWidth = w - left - 150;
  const lineHeight = 40;

  const visualLines = parseMarkdownLines(visibleSource);
  const wrapped = visualLines.flatMap((line) => wrapVisualLine(ctx, line, maxWidth));

  const maxLines = 18;
  const firstVisibleLine = Math.max(0, wrapped.length - maxLines);
  const shownLines = wrapped.slice(firstVisibleLine, firstVisibleLine + maxLines);

  shownLines.forEach((line, index) => {
    const y = top + index * lineHeight;
    const boxPad = line.box ? 18 : 0;
    drawCallout(ctx, line, left - 24, y, maxWidth + 48, lineHeight);

    if (line.style === "image") {\n      drawMarkdownImage(ctx, line, left, y, maxWidth);\n      return;\n    }\n\n    if (line.style === "hr") {
      ctx.strokeStyle = "#30363d";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(left, y + lineHeight / 2);
      ctx.lineTo(left + maxWidth, y + lineHeight / 2);
      ctx.stroke();
      return;
    }

    if (line.style === "table") {
      drawTableLine(ctx, line, left, y, maxWidth, lineHeight);
      return;
    }

    const style = markdownStyle(line.style, {
      size: line.size,
      color: line.color,
    });

    if (line.style === "quote") {
      ctx.fillStyle = "#7c9cff";
      ctx.fillRect(left - 16 + boxPad, y + 3, 4, style.size + 8);
    }
    if (line.style === "code" || line.style === "math") {
      ctx.fillStyle = "#0b111f";
      ctx.fillRect(left - 12, y - 5, maxWidth + 24, style.size + 16);
    }

    drawRichText(ctx, line.text, left + boxPad, y, style);
  });

  if (firstVisibleLine > 0) {
    ctx.fillStyle = "#8b949e";
    ctx.font = "18px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("↑ scrolling", left, top - 24);
  }

  if (cell.output && localTime >= typeDuration) {
    drawNotebookOutput(ctx, cell.output, w);
  }

  if (Math.floor(globalTime * 2) % 2 === 0 && shownLines.length > 0) {
    const last = shownLines[shownLines.length - 1];
    const style = markdownStyle(last.style, { size: last.size, color: last.color });
    const boxPad = last.box ? 18 : 0;
    const cursorX = Math.min(
      last.style === "table"
        ? left + maxWidth
        : measureRichText(ctx, last.text, left + boxPad, style) + 3,
      w - 80,
    );
    const cursorY = visualY - (last.style === "image" ? 170 : lineHeight);
    ctx.fillStyle = "#e6edf3";
    ctx.fillRect(cursorX, cursorY + 2, 3, (last.size || style.size) + 5);
  }
}
