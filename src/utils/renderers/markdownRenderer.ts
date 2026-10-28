import { CodeCell } from "../../types/cell";
import { clamp } from "../math";
import { sliceTypedHtml } from "./markdown/htmlText";
import { MarkdownVisualLine } from "./markdown/markdownTypes";
import { parseMarkdownLines } from "./markdown/parseMarkdownLines";
import { drawRichText, markdownStyle, measureRichText } from "./markdown/richText";
import { wrapMarkdownLine } from "./markdown/wrapHtmlLine";
import { drawNotebookOutput } from "./notebookOutputRenderer";

const markdownImages = new Map<string, HTMLImageElement>();

// Compact large Base64 images while typing so their payload is never rendered as text.
function compactBase64Images(source: string): {
  compactSource: string;
  restore: (visibleSource: string) => string;
} {
  const images: string[] = [];
  const compactSource = source.replace(
    /!\[([^\]]*)\]\((data:image\/[a-zA-Z0-9.+-]+;base64,[^\s)]*)\)/g,
    (_match, alt: string, dataUrl: string) => {
      const index = images.push("![" + alt + "](" + dataUrl + ")") - 1;
      return "\uE000" + index + "\uE001";
    },
  );

  return {
    compactSource,
    restore: (visibleSource: string) =>
      visibleSource
        .replace(/\uE000(\d+)\uE001/g, (_token, index: string) => images[Number(index)] ?? "")
        .replace(/\uE000[^\n]*$/g, ""),
  };
}

function drawMarkdownImage(ctx: CanvasRenderingContext2D, line: MarkdownVisualLine, x: number, y: number, maxWidth: number): number {
  if (!line.imageSrc) return 40; // Return default line height
  let image = markdownImages.get(line.imageSrc);
  if (!image) {
    image = new Image();
    image.onload = () => window.dispatchEvent(new Event("codestudio:image-loaded"));
    image.onerror = () => window.dispatchEvent(new Event("codestudio:image-loaded"));
    image.src = line.imageSrc;
    markdownImages.set(line.imageSrc, image);
  }
  if (image.complete && image.naturalWidth > 0) {
    // Scale image to fit within bounds, maintaining aspect ratio
    const maxImageHeight = 400; // Maximum height for images
    const scale = Math.min(maxWidth / image.naturalWidth, maxImageHeight / image.naturalHeight);
    const scaledWidth = image.naturalWidth * scale;
    const scaledHeight = image.naturalHeight * scale;
    ctx.drawImage(image, x, y, scaledWidth, scaledHeight);
    return scaledHeight + 20; // Return actual height + padding
  } else {
    ctx.fillStyle = "#8b949e";
    ctx.font = "16px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("Loading image" + (line.imageAlt ? ": " + line.imageAlt : "…"), x, y + 8);
    return 40; // Return default line height while loading
  }
}

function wrapVisualLine(
  ctx: CanvasRenderingContext2D,
  line: MarkdownVisualLine,
  maxWidth: number,
): MarkdownVisualLine[] {
  if (line.style === "hr") return [line];
  if (line.style === "image") {
    // Calculate image height for proper scrolling
    if (line.imageSrc) {
      let image = markdownImages.get(line.imageSrc);
      if (image && image.complete && image.naturalWidth > 0) {
        const maxImageHeight = 400;
        const scale = Math.min(maxWidth / image.naturalWidth, maxImageHeight / image.naturalHeight);
        const scaledHeight = image.naturalHeight * scale;
        line.height = scaledHeight + 20; // Store height for scrolling
      } else {
        line.height = 40; // Default height while loading
      }
    }
    return [line];
  }
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
  const top = y - (line.box.first ? 12 : 4);
  const height = lineHeight + (line.box.last ? 16 : 8);
  ctx.fillStyle = line.box.background;
  ctx.fillRect(x, top, width, height);
  if (line.box.border) {
    ctx.fillStyle = line.box.border;
    ctx.fillRect(x, top, 4, height);
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
  const compacted = compactBase64Images(source);
  const typeDuration = compacted.compactSource.length / Math.max(1, speed);
  const visibleChars = Math.floor(clamp(localTime, 0, typeDuration) * speed);
  const typedSource = sliceTypedHtml(compacted.compactSource, visibleChars);
  const visibleSource = compacted.restore(typedSource);
  const left = 150;
  const top = 210;
  const maxWidth = w - left - 150;
  const lineHeight = 40;

  const visualLines = parseMarkdownLines(visibleSource);
  const wrapped = visualLines.flatMap((line) => wrapVisualLine(ctx, line, maxWidth));

  // Calculate total height and find visible lines with proper image handling
  const maxDisplayHeight = 18 * lineHeight; // Maximum visible area
  let totalHeight = 0;
  const lineHeights = wrapped.map((line) => {
    const height = line.style === "image" ? (line.height || 40) : lineHeight;
    totalHeight += height;
    return height;
  });

  // Find which lines to show based on total height (show last N lines that fit)
  let visibleHeight = 0;
  const shownLines: { line: MarkdownVisualLine; y: number; height: number }[] = [];

  // Start from the end and work backwards to show the most recent content
  for (let i = wrapped.length - 1; i >= 0; i--) {
    const lineHeight_i = lineHeights[i];
    if (visibleHeight + lineHeight_i > maxDisplayHeight && shownLines.length > 0) {
      // Cannot fit more lines
      break;
    }
    shownLines.unshift({
      line: wrapped[i],
      y: 0, // Will be calculated after
      height: lineHeight_i,
    });
    visibleHeight += lineHeight_i;
  }

  // Calculate y positions
  let currentY = top;
  shownLines.forEach((item) => {
    item.y = currentY;
    currentY += item.height;
  });

  // Show scroll indicator if there are more lines
  const hasMoreLines = totalHeight > maxDisplayHeight;

  shownLines.forEach(({ line, y, height }) => {
    const boxPad = line.box ? 16 : 0;
    drawCallout(ctx, line, left - 20, y, maxWidth + 40, height);

    if (line.style === "image") {
      drawMarkdownImage(ctx, line, left, y, maxWidth);
      return;
    }

    if (line.style === "hr") {
      ctx.strokeStyle = "#30363d";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(left, y + height / 2);
      ctx.lineTo(left + maxWidth, y + height / 2);
      ctx.stroke();
      return;
    }

    if (line.style === "table") {
      drawTableLine(ctx, line, left, y, maxWidth, height);
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

  if (hasMoreLines) {
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
    const style = markdownStyle(last.line.style, { size: last.line.size, color: last.line.color });
    const boxPad = last.line.box ? 16 : 0;
    const cursorX = Math.min(
      last.line.style === "table"
        ? left + maxWidth
        : measureRichText(ctx, last.line.text, left + boxPad, style) + 3,
      w - 80,
    );
    const cursorY = last.y;
    if (last.line.style !== "image") {
      ctx.fillStyle = "#e6edf3";
      ctx.fillRect(cursorX, cursorY + 2, 3, (last.line.size || style.size) + 5);
    }
  }
}
