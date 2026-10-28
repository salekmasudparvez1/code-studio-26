export interface InlineStyle {
  color?: string;
  background?: string;
  fontSize?: number;
  fontWeight?: string;
  borderLeft?: string;
}

function readCss(style: string, prop: string): string | undefined {
  const match = style.match(new RegExp(`${prop}\\s*:\\s*([^;]+)`, "i"));
  return match?.[1]?.trim();
}

export function parseInlineStyle(tag: string): InlineStyle {
  const styleMatch = tag.match(/style\s*=\s*["']([^"']*)["']/i);
  const css = styleMatch?.[1] || "";
  const colorAttr = tag.match(/\bcolor\s*=\s*["']?([^"'\s>]+)/i);
  const fontSizeRaw = readCss(css, "font-size");
  const fontSize = fontSizeRaw ? Number.parseFloat(fontSizeRaw) : undefined;

  return {
    color: readCss(css, "color") || colorAttr?.[1],
    background: readCss(css, "background-color") || readCss(css, "background"),
    fontSize: Number.isFinite(fontSize) ? fontSize : undefined,
    fontWeight: readCss(css, "font-weight"),
    borderLeft: readCss(css, "border-left"),
  };
}

export function parseRgb(color: string): { r: number; g: number; b: number } | null {
  const hex = color.trim();
  const short = hex.match(/^#([0-9a-fA-F]{3})$/);
  if (short) {
    const [r, g, b] = short[1].split("").map((ch) => Number.parseInt(ch + ch, 16));
    return { r, g, b };
  }
  const long = hex.match(/^#([0-9a-fA-F]{6})$/);
  if (long) {
    return {
      r: Number.parseInt(long[1].slice(0, 2), 16),
      g: Number.parseInt(long[1].slice(2, 4), 16),
      b: Number.parseInt(long[1].slice(4, 6), 16),
    };
  }
  const rgb = hex.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgb) {
    return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]) };
  }
  return null;
}

export function luminance(color: string): number | null {
  const rgb = parseRgb(color);
  if (!rgb) return null;
  return (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
}

export function isLightColor(color?: string): boolean {
  if (!color) return false;
  const lum = luminance(color);
  return lum !== null && lum >= 0.5;
}

export function isDarkColor(color?: string): boolean {
  if (!color) return false;
  const lum = luminance(color);
  return lum !== null && lum < 0.5;
}

export function borderAccent(borderLeft?: string): string | undefined {
  if (!borderLeft) return undefined;
  const hex = borderLeft.match(/#[0-9a-fA-F]{3,8}/);
  if (hex) return hex[0];
  const rgb = borderLeft.match(/rgba?\([^)]+\)/i);
  return rgb?.[0];
}

export function tagName(tag: string): string {
  return tag.match(/<\/?([a-zA-Z][a-zA-Z0-9]*)/)?.[1]?.toLowerCase() || "";
}

export function isClosingTag(tag: string): boolean {
  return /^<\s*\//.test(tag);
}
