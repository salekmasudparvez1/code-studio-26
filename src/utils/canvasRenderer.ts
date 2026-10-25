import { Cell, CodeCell, GraphCell, DelayCell, NotebookOutput } from '../types/cell';
import { getCellAtTime, getGraphDuration } from './duration';
import { clamp } from './math';
import { tokenizeLine } from './syntaxHighlight';
import { drawDecisionBoundary } from './renderers/decisionBoundaryRenderer';
import { drawNeuralNetwork } from './renderers/neuralNetworkRenderer';
import { drawClustering } from './renderers/clusteringRenderer';
import { drawGradientDescent } from './renderers/gradientDescentRenderer';
import { drawCnn } from './renderers/cnnRenderer';
import { drawRnn } from './renderers/rnnRenderer';
import { drawLstm } from './renderers/lstmRenderer';
import { drawYolo } from './renderers/yoloRenderer';
import { drawMatplotlib } from './renderers/matplotlibRenderer';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../constants/defaults';
import { Overlay } from '../types/overlay';
import { drawOverlays } from './renderers/overlayRenderer';

export function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill?: string,
  stroke?: string
): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

export function drawWindowFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  title: string
): void {
  // Clear and background
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, w, h);

  // Main container window
  drawRoundRect(ctx, 36, 34, w - 72, h - 68, 22, '#161b22', '#30363d');

  // Traffic lights
  const lights = [
    { x: 76, color: '#ff5f57' },
    { x: 108, color: '#febc2e' },
    { x: 140, color: '#28c840' },
  ];
  lights.forEach((l) => {
    ctx.fillStyle = l.color;
    ctx.beginPath();
    ctx.arc(l.x, 75, 10, 0, Math.PI * 2);
    ctx.fill();
  });

  // Window title / filename
  ctx.fillStyle = '#8b949e';
  ctx.font = '26px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, w / 2, 76);

  // Top header separator line
  ctx.strokeStyle = '#30363d';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(37, 118);
  ctx.lineTo(w - 37, 118);
  ctx.stroke();
}

export function drawSidebarDecoration(
  ctx: CanvasRenderingContext2D,
  h: number,
  cell: Cell
): void {
  // Left activity bar
  ctx.fillStyle = '#10151d';
  ctx.fillRect(38, 119, 74, h - 158);

  ctx.fillStyle = '#8b949e';
  ctx.font = '22px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('≡', 75, 158);

  // File type badge
  ctx.fillStyle = '#1f6feb';
  ctx.fillRect(38, 190, 74, 54);
  ctx.fillStyle = '#c9d1d9';
  ctx.font = '19px system-ui, sans-serif';

  let tag = 'TXT';
  if (cell.type === 'code') {
    const ext = cell.name.split('.').pop()?.toUpperCase() || 'CODE';
    tag = ext.slice(0, 3);
  } else if (cell.type === 'graph') {
    if (cell.graphType === 'decision-boundary') tag = 'SVM';
    else if (cell.graphType === 'ann' || cell.graphType === 'neural-network') tag = 'ANN';
    else if (cell.graphType === 'cnn') tag = 'CNN';
    else if (cell.graphType === 'rnn') tag = 'RNN';
    else if (cell.graphType === 'lstm') tag = 'LSTM';
    else if (cell.graphType === 'yolo') tag = 'YOLO';
    else if (cell.graphType === 'matplotlib') tag = 'PLT';
    else if (cell.graphType === 'clustering') tag = 'TSNE';
    else if (cell.graphType === 'gradient-descent') tag = 'OPT';
    else tag = 'VIZ';
  }
  ctx.fillText(tag, 75, 217);
}

export function drawCodeCell(
  ctx: CanvasRenderingContext2D,
  cell: CodeCell,
  localTime: number,
  globalTime: number,
  w: number
): void {
  const speed = cell.speed || 18;
  const source = (cell.source || '').replace(/\r\n/g, '\n');
  const typeDuration = source.length / Math.max(1, speed);
  const visibleChars = Math.floor(clamp(localTime, 0, typeDuration) * speed);

  const text = source.slice(0, visibleChars);
  const lines = text.split('\n');
  const fontSize = 31;
  const lineHeight = 48;
  const left = 142;
  const top = 250;
  const maxLines = cell.output ? 9 : 15;
  const maxTextWidth = w - left - 90;

  ctx.font = `${fontSize}px "SFMono-Regular", Consolas, "Liberation Mono", monospace`;
  const wrappedLines = wrapCodeLines(ctx, lines, maxTextWidth);
  // Keep the active line in view, just like an editor scrolls while typing.
  const activeVisualLine = Math.max(0, wrappedLines.length - 1);
  const firstVisibleLine = Math.max(0, activeVisualLine - maxLines + 1);
  const shownLines = wrappedLines.slice(firstVisibleLine, firstVisibleLine + maxLines);
  const activeLineIndex = activeVisualLine - firstVisibleLine;

  // Highlight active line
  ctx.fillStyle = 'rgba(56, 139, 253, 0.09)';
  ctx.fillRect(113, top + activeLineIndex * lineHeight, w - 155, 45);

  ctx.textBaseline = 'top';

  shownLines.forEach((wrappedLine, i) => {
    const y = top + i * lineHeight;

    // Line number
    ctx.fillStyle = '#6e7681';
    ctx.textAlign = 'right';
    const lineNumber =
      i === 0 || wrappedLine.sourceLine !== shownLines[i - 1].sourceLine
        ? String(wrappedLine.sourceLine + 1)
        : '·';
    ctx.fillText(lineNumber, left - 35, y);

    // Syntax highlighted code tokens
    const tokens = tokenizeLine(wrappedLine.text);
    let drawX = left;
    ctx.textAlign = 'left';

    tokens.forEach((token) => {
      ctx.fillStyle = token.color;
      ctx.fillText(token.text, drawX, y);
      drawX += ctx.measureText(token.text).width;
    });
  });

  // Blinking cursor
  const cursorLine = activeLineIndex;
  const cursorText = shownLines[cursorLine]?.text || '';
  const cursorX = left + ctx.measureText(cursorText).width;
  const cursorY = top + cursorLine * lineHeight;
  const isCursorOn = Math.floor(globalTime * 2) % 2 === 0;

  if (isCursorOn) {
    ctx.fillStyle = '#e6edf3';
    ctx.fillRect(Math.min(cursorX, w - 80), cursorY + 2, 3, 34);
  }

  interface WrappedCodeLine {
    text: string;
    sourceLine: number;
  }

  function wrapCodeLines(
    ctx: CanvasRenderingContext2D,
    lines: string[],
    maxWidth: number
  ): WrappedCodeLine[] {
    const wrapped: WrappedCodeLine[] = [];

    lines.forEach((line, sourceLine) => {
      if (!line) {
        wrapped.push({ text: '', sourceLine });
        return;
      }

      let start = 0;
      while (start < line.length) {
        let end = start;
        let lastBreak = -1;

        while (end < line.length && ctx.measureText(line.slice(start, end + 1)).width <= maxWidth) {
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

  if (firstVisibleLine > 0) {
    ctx.fillStyle = '#8b949e';
    ctx.textAlign = 'left';
    ctx.font = '18px system-ui, sans-serif';
    ctx.fillText('↑ scrolling', left, top - 18);
  }

  if (cell.output && localTime >= typeDuration) {
    drawNotebookOutput(ctx, cell.output, w);
  }
}

function drawMarkdownCell(
  ctx: CanvasRenderingContext2D,
  cell: CodeCell,
  localTime: number,
  globalTime: number,
  w: number
): void {
  const speed = cell.speed || 18;
  const source = (cell.source || '').replace(/\r\n/g, '\n');
  const typeDuration = source.length / Math.max(1, speed);
  const visibleChars = Math.floor(clamp(localTime, 0, typeDuration) * speed);
  const visibleSource = source.slice(0, visibleChars);
  const sourceLines = visibleSource.split('\n');
  const left = 150;
  const top = 235;
  const maxWidth = w - left - 170;
  const lineHeight = 42;
  const visualLines: MarkdownVisualLine[] = [];

  sourceLines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      visualLines.push({ text: '', style: 'paragraph' });
      return;
    }

    if (/^```/.test(trimmed)) {
      visualLines.push({ text: trimmed === '```' ? '' : trimmed.slice(3), style: 'code' });
    } else if (/^#{1,6}\s+/.test(trimmed)) {
      visualLines.push({
        text: trimmed.replace(/^#{1,6}\s+/, ''),
        style: 'heading',
      });
    } else if (/^>\s?/.test(trimmed)) {
      visualLines.push({ text: trimmed.replace(/^>\s?/, ''), style: 'quote' });
    } else if (/^[-*+]\s+/.test(trimmed)) {
      visualLines.push({ text: `• ${trimmed.replace(/^[-*+]\s+/, '')}`, style: 'bullet' });
    } else if (/^\d+\.\s+/.test(trimmed)) {
      visualLines.push({ text: trimmed, style: 'bullet' });
    } else {
      visualLines.push({ text: trimmed, style: 'paragraph' });
    }
  });

  const wrapped = visualLines.flatMap((line) => {
    const style = markdownStyle(line.style);
    ctx.font = `${style.weight} ${style.size}px ${style.font}`;
    return wrapMarkdownLine(ctx, line, maxWidth);
  });
  const maxLines = 16;
  const firstVisibleLine = Math.max(0, wrapped.length - maxLines);
  const shownLines = wrapped.slice(firstVisibleLine, firstVisibleLine + maxLines);

  shownLines.forEach((line, index) => {
    const y = top + index * lineHeight;
    const style = markdownStyle(line.style);
    ctx.font = `${style.weight} ${style.size}px ${style.font}`;
    ctx.fillStyle = style.color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    if (line.style === 'quote') {
      ctx.fillStyle = '#7c9cff';
      ctx.fillRect(left - 16, y + 3, 4, style.size + 8);
      ctx.fillStyle = style.color;
    }
    if (line.style === 'code') {
      ctx.fillStyle = '#0b111f';
      ctx.fillRect(left - 12, y - 5, maxWidth + 24, style.size + 16);
      ctx.fillStyle = '#a5d6ff';
    }
    ctx.fillText(line.text, left, y);
  });

  if (firstVisibleLine > 0) {
    ctx.fillStyle = '#8b949e';
    ctx.font = '18px system-ui, sans-serif';
    ctx.fillText('↑ scrolling', left, top - 24);
  }

  if (cell.output && localTime >= typeDuration) {
    drawNotebookOutput(ctx, cell.output, w);
  }

  if (Math.floor(globalTime * 2) % 2 === 0 && shownLines.length > 0) {
    const last = shownLines[shownLines.length - 1];
    const style = markdownStyle(last.style);
    ctx.font = `${style.weight} ${style.size}px ${style.font}`;
    const cursorX = Math.min(
      left + ctx.measureText(last.text).width + 3,
      w - 80
    );
    const cursorY = top + (shownLines.length - 1) * lineHeight;
    ctx.fillStyle = '#e6edf3';
    ctx.fillRect(cursorX, cursorY + 2, 3, style.size + 5);
  }
}

interface MarkdownVisualLine {
  text: string;
  style: 'heading' | 'paragraph' | 'bullet' | 'quote' | 'code';
}

function wrapMarkdownLine(
  ctx: CanvasRenderingContext2D,
  line: MarkdownVisualLine,
  maxWidth: number
): MarkdownVisualLine[] {
  if (!line.text) return [line];
  const result: MarkdownVisualLine[] = [];
  let current = '';

  for (const word of line.text.split(/\s+/)) {
    if (!word) continue;

    if (ctx.measureText(word).width > maxWidth) {
      if (current) {
        result.push({ ...line, text: current });
        current = '';
      }

      let remaining = word;
      while (remaining.length > 0) {
        let splitAt = remaining.length;
        while (
          splitAt > 1 &&
          ctx.measureText(remaining.slice(0, splitAt)).width > maxWidth
        ) {
          splitAt -= 1;
        }
        result.push({ ...line, text: remaining.slice(0, splitAt) });
        remaining = remaining.slice(splitAt);
      }
      continue;
    }

    const candidate = current ? `${current} ${word}` : word;
    if (current && ctx.measureText(candidate).width > maxWidth) {
      result.push({ ...line, text: current });
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) result.push({ ...line, text: current });
  return result;
}

function markdownStyle(style: MarkdownVisualLine['style']): {
  size: number;
  weight: string;
  color: string;
  font: string;
} {
  if (style === 'heading') {
    return { size: 38, weight: 'bold', color: '#f0f6fc', font: 'system-ui, sans-serif' };
  }
  if (style === 'code') {
    return {
      size: 24,
      weight: 'normal',
      color: '#a5d6ff',
      font: '"SFMono-Regular", Consolas, monospace',
    };
  }
  if (style === 'quote') {
    return { size: 26, weight: 'normal', color: '#a5b4fc', font: 'system-ui, sans-serif' };
  }
  return { size: 26, weight: 'normal', color: '#c9d1d9', font: 'system-ui, sans-serif' };
}

const outputImages = new Map<string, HTMLImageElement>();

function drawNotebookOutput(
  ctx: CanvasRenderingContext2D,
  output: NotebookOutput,
  w: number
): void {
  const x = 142;
  const y = 735;
  const width = w - 280;
  const height = 210;

  ctx.fillStyle = '#0b111f';
  ctx.strokeStyle = '#30363d';
  ctx.lineWidth = 2;
  ctx.fillRect(x, y, width, height);
  ctx.strokeRect(x, y, width, height);

  ctx.fillStyle = '#7ee787';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('Output', x + 18, y + 14);

  if (output.imageDataUrl) {
    let image = outputImages.get(output.imageDataUrl);
    if (!image) {
      image = new Image();
      image.src = output.imageDataUrl;
      outputImages.set(output.imageDataUrl, image);
    }
    if (image.complete && image.naturalWidth > 0) {
      const scale = Math.min(
        (width - 36) / image.naturalWidth,
        (height - 54) / image.naturalHeight,
        1
      );
      const imageWidth = image.naturalWidth * scale;
      const imageHeight = image.naturalHeight * scale;
      ctx.drawImage(image, x + 18, y + 48, imageWidth, imageHeight);
    } else {
      ctx.fillStyle = '#8b949e';
      ctx.font = '20px system-ui, sans-serif';
      ctx.fillText('Loading image output…', x + 18, y + 65);
    }
  }

  if (output.text) {
    ctx.fillStyle = '#c9d1d9';
    ctx.font = '20px "SFMono-Regular", Consolas, monospace';
    const lines = output.text.split(/\r?\n/);
    const maxLines = 6;
    lines.slice(0, maxLines).forEach((line, index) => {
      ctx.fillText(line.slice(0, 110), x + 18, y + 52 + index * 25);
    });
    if (lines.length > maxLines) {
      ctx.fillStyle = '#8b949e';
      ctx.fillText('… more output', x + 18, y + 52 + maxLines * 25);
    }
  }
}

export function drawBarChart(
  ctx: CanvasRenderingContext2D,
  cell: GraphCell,
  progress: number,
  w: number,
  _h: number
): void {
  const data = cell.data && cell.data.length > 0 ? cell.data : [10, 20, 30];
  const n = data.length;
  const maxVal = Math.max(...data, 1);
  const barColor = cell.barColor || '#7c9cff';

  // Title
  ctx.fillStyle = '#e6edf3';
  ctx.font = 'bold 42px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(cell.name || 'Graph', w / 2, 200);

  // Chart area
  const chartX = 200;
  const chartY = 280;
  const chartW = w - 400;
  const chartH = 480;

  // Background horizontal grid lines
  ctx.strokeStyle = '#30363d';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = chartY + chartH * (i / 4);
    ctx.beginPath();
    ctx.moveTo(chartX, y);
    ctx.lineTo(chartX + chartW, y);
    ctx.stroke();

    ctx.fillStyle = '#8b949e';
    ctx.font = '20px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
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

    // Bar rectangle
    drawRoundRect(ctx, x, y, barW, barH, 6, barColor);

    // Value label
    if (barH > 8) {
      ctx.fillStyle = '#e6edf3';
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(String(data[i]), x + barW / 2, y - 8);
    }

    // X-axis label
    ctx.fillStyle = '#8b949e';
    ctx.font = '18px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`Item ${i + 1}`, x + barW / 2, chartY + chartH + 20);
  }

  // Axes
  ctx.strokeStyle = '#484f58';
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
  h: number
): void {
  const graphDur = getGraphDuration(cell);
  const progress = clamp(localTime / Math.max(0.01, graphDur), 0, 1);

  switch (cell.graphType) {
    case 'decision-boundary':
      drawDecisionBoundary(ctx, cell, progress, w, h);
      break;
    case 'ann':
    case 'neural-network':
      drawNeuralNetwork(ctx, cell, progress, w, h);
      break;
    case 'cnn':
      drawCnn(ctx, cell, progress, w, h);
      break;
    case 'rnn':
      drawRnn(ctx, cell, progress, w, h);
      break;
    case 'lstm':
      drawLstm(ctx, cell, progress, w, h);
      break;
    case 'yolo':
      drawYolo(ctx, cell, progress, w, h);
      break;
    case 'matplotlib':
      drawMatplotlib(ctx, cell, progress, w, h);
      break;
    case 'clustering':
      drawClustering(ctx, cell, progress, w, h);
      break;
    case 'gradient-descent':
      drawGradientDescent(ctx, cell, progress, w, h);
      break;
    case 'bar':
    default:
      drawBarChart(ctx, cell, progress, w, h);
      break;
  }
}

export function drawDelayCell(
  ctx: CanvasRenderingContext2D,
  cell: DelayCell,
  localTime: number,
  w: number,
  h: number
): void {
  const dur = cell.seconds || 3;
  const progress = clamp(localTime / Math.max(0.1, dur), 0, 1);
  const remain = Math.max(0, Math.ceil((1 - progress) * dur));

  ctx.fillStyle = '#e6edf3';
  ctx.font = 'bold 64px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⏸ Pause', w / 2, h / 2 - 40);

  ctx.font = '120px ui-monospace, monospace';
  ctx.fillStyle = '#7c9cff';
  ctx.fillText(`${remain}s`, w / 2, h / 2 + 80);
}

export function drawStatusBar(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  globalTime: number,
  fps: number
): void {
  ctx.fillStyle = '#1f6feb';
  ctx.fillRect(38, h - 82, w - 76, 44);

  ctx.fillStyle = '#ffffff';
  ctx.font = '20px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('●  Animation Preview', 58, h - 60);

  ctx.textAlign = 'right';
  const frames = Math.round(globalTime * fps);
  ctx.fillText(`${frames} frames`, w - 58, h - 60);
}

export function renderCanvasStage(
  canvas: HTMLCanvasElement,
  cells: Cell[],
  globalTime: number,
  fps: number,
  overlays: Overlay[] = []
): void {
  const ctx = canvas.getContext('2d');
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
    drawOverlays(ctx, overlays, globalTime);
    return;
  }

  const { cell, localTime } = result;

  // Window title
  let headerTitle = cell.name || 'main.py';
  if (cell.type === 'delay') headerTitle = '⏸ Delay';

  // 1. Window Frame & Chrome
  drawWindowFrame(ctx, w, h, headerTitle);

  // 2. Sidebar decoration (for code / graph)
  if (cell.type !== 'delay') {
    drawSidebarDecoration(ctx, h, cell);
  }

  // 3. Cell-specific graphics
  if (cell.type === 'code') {
    if (/\.md$/i.test(cell.name)) {
      drawMarkdownCell(ctx, cell, localTime, globalTime, w);
    } else {
      drawCodeCell(ctx, cell, localTime, globalTime, w);
    }
  } else if (cell.type === 'graph') {
    drawGraphCell(ctx, cell, localTime, w, h);
  } else if (cell.type === 'delay') {
    drawDelayCell(ctx, cell, localTime, w, h);
  }

  // 4. Bottom status bar
  drawStatusBar(ctx, w, h, globalTime, fps);

  // 5. Non-destructive overlays (preview + export share this pass)
  drawOverlays(ctx, overlays, globalTime);
}
