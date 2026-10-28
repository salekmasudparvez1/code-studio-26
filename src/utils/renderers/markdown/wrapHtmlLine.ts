import { MarkdownVisualLine } from "./markdownTypes";
import { stripHtml } from "./htmlText";

export function wrapMarkdownLine(
  ctx: CanvasRenderingContext2D,
  line: MarkdownVisualLine,
  maxWidth: number,
): MarkdownVisualLine[] {
  if (!line.text) return [line];

  const tokens = line.text.match(/<[^>]+>|[^<\s]+|\s+/g) || [];
  const result: MarkdownVisualLine[] = [];
  let currentRaw = "";
  let currentVisible = "";

  const widthOf = (text: string) => ctx.measureText(text).width;

  for (const token of tokens) {
    const isSpace = /^\s+$/.test(token);
    const visible = isSpace ? (currentVisible ? " " : "") : stripHtml(token);

    if (isSpace && !currentRaw) continue;

    if (!isSpace && visible && widthOf(visible) > maxWidth) {
      if (currentRaw) {
        result.push({ ...line, text: currentRaw });
        currentRaw = "";
        currentVisible = "";
      }
      result.push({ ...line, text: token });
      continue;
    }

    const nextVisible = currentVisible + visible;
    if (currentRaw && widthOf(nextVisible) > maxWidth) {
      result.push({ ...line, text: currentRaw });
      currentRaw = isSpace ? "" : token;
      currentVisible = isSpace ? "" : visible;
    } else {
      currentRaw += isSpace ? " " : token;
      currentVisible = nextVisible;
    }
  }

  if (currentRaw) result.push({ ...line, text: currentRaw });
  const lines = result.length ? result : [line];
  return lines.map((item, index) => {
    if (!item.box) return item;
    return {
      ...item,
      box: {
        ...item.box,
        first: Boolean(item.box.first && index === 0),
        last: Boolean(item.box.last && index === lines.length - 1),
      },
    };
  });
}
