import { MarkdownLineStyle, RichTextStyle } from "./markdownTypes";
import { decodeEntities } from "./htmlText";
import { isClosingTag, parseInlineStyle, tagName } from "./htmlStyle";

const TAG_SPLIT = /(<\/?[a-zA-Z][a-zA-Z0-9]*\b[^>]*>)/g;

interface DrawState {
  color: string;
  bold: boolean;
  italic: boolean;
  code: boolean;
  size: number;
}

function applyFont(ctx: CanvasRenderingContext2D, style: RichTextStyle, state: DrawState): void {
  if (state.code) {
    ctx.font = `normal normal ${state.size}px "SFMono-Regular", Consolas, monospace`;
    return;
  }
  const weight = state.bold ? "bold" : "normal";
  const slant = state.italic ? "italic" : "normal";
  ctx.font = `${weight} ${slant} ${state.size}px ${style.font}`;
}

function walkRichText(
  ctx: CanvasRenderingContext2D,
  html: string,
  x: number,
  y: number,
  defaultStyle: RichTextStyle,
  paint: boolean,
): number {
  const parts = html.split(TAG_SPLIT);
  const base: DrawState = {
    color: defaultStyle.color,
    bold: defaultStyle.weight === "bold",
    italic: defaultStyle.font.toLowerCase().includes("italic"),
    code: defaultStyle.font.includes("mono"),
    size: defaultStyle.size,
  };
  const stack: DrawState[] = [];
  let state = { ...base };
  let currentX = x;

  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  applyFont(ctx, defaultStyle, state);

  for (const part of parts) {
    if (!part) continue;

    if (part.startsWith("<") && part.endsWith(">")) {
      const name = tagName(part);
      if (isClosingTag(part)) {
        state = stack.pop() || { ...base };
        applyFont(ctx, defaultStyle, state);
        continue;
      }

      stack.push({ ...state });
      const css = parseInlineStyle(part);
      if (name === "b" || name === "strong" || css.fontWeight === "bold") state.bold = true;
      if (name === "i" || name === "em") state.italic = true;
      if (name === "code") {
        state.code = true;
        state.color = css.color || "#a5d6ff";
      }
      if (css.color) state.color = css.color;
      if (css.fontSize) state.size = Math.round(css.fontSize * (defaultStyle.size / 16));
      applyFont(ctx, defaultStyle, state);
      continue;
    }

    const text = decodeEntities(part);
    applyFont(ctx, defaultStyle, state);
    if (paint) {
      ctx.fillStyle = state.color;
      ctx.fillText(text, currentX, y);
    }
    currentX += ctx.measureText(text).width;
  }

  return currentX;
}

export function drawRichText(
  ctx: CanvasRenderingContext2D,
  html: string,
  x: number,
  y: number,
  defaultStyle: RichTextStyle,
): number {
  return walkRichText(ctx, html, x, y, defaultStyle, true);
}

export function measureRichText(
  ctx: CanvasRenderingContext2D,
  html: string,
  x: number,
  defaultStyle: RichTextStyle,
): number {
  return walkRichText(ctx, html, x, 0, defaultStyle, false);
}

export function markdownStyle(style: MarkdownLineStyle, overrides?: Partial<RichTextStyle>): RichTextStyle {
  let base: RichTextStyle;
  if (style === "heading") {
    base = {
      size: 38,
      weight: "bold",
      color: "#f0f6fc",
      font: "system-ui, sans-serif",
    };
  } else if (style === "code" || style === "math") {
    base = {
      size: 24,
      weight: "normal",
      color: "#a5d6ff",
      font: '"SFMono-Regular", Consolas, monospace',
    };
  } else if (style === "quote") {
    base = {
      size: 26,
      weight: "normal",
      color: "#a5b4fc",
      font: "system-ui, sans-serif",
    };
  } else if (style === "table") {
    base = {
      size: 20,
      weight: "normal",
      color: "#e6edf3",
      font: "system-ui, sans-serif",
    };
  } else {
    base = {
      size: 26,
      weight: "normal",
      color: "#c9d1d9",
      font: "system-ui, sans-serif",
    };
  }
  if (!overrides) return base;
  const clean = Object.fromEntries(
    Object.entries(overrides).filter(([, value]) => value !== undefined),
  ) as Partial<RichTextStyle>;
  return { ...base, ...clean };
}
