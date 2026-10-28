import {
  CalloutBox,
  MarkdownVisualLine,
  TableCell,
} from "./markdownTypes";
import {
  borderAccent,
  isDarkColor,
  isLightColor,
  parseInlineStyle,
} from "./htmlStyle";
import { replaceLatex } from "./latexToText";

function applyInlineMarkdown(html: string): string {
  return html
    .split(/(<[^>]+>)/)
    .map((part) => {
      if (!part || part.startsWith("<")) return part;
      return part
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/(^|[^\*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");
    })
    .join("");
}

function unwrap(tagName: string, html: string): { attrs: string; inner: string } | null {
  const open = html.match(new RegExp(`^<${tagName}\\b([^>]*)>([\\s\\S]*)$`, "i"));
  if (!open) return null;
  return { attrs: open[1] || "", inner: open[2].replace(new RegExp(`</${tagName}\\s*>$`, "i"), "") };
}

function readableColor(color: string | undefined, box?: CalloutBox): string | undefined {
  if (!color) return undefined;
  if (box && isLightColor(box.background)) return color;
  if (isDarkColor(color) && !isLightColor(box?.background)) return undefined;
  return color;
}

function headingSize(level: number): number {
  if (level <= 1) return 40;
  if (level === 2) return 34;
  return 28;
}

function parseTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => applyInlineMarkdown(cell.trim()));
}

function isTableSep(line: string): boolean {
  return /^\s*\|?(\s*:?-{3,}:?\s*\|)+\s*:?-{3,}:?\s*\|?\s*$/.test(line);
}

function isTableRow(line: string): boolean {
  return /^\s*\|.+\|\s*$/.test(line);
}

function classifyLine(
  rawLine: string,
  box?: CalloutBox,
): MarkdownVisualLine {
  const trimmed = rawLine.trim();
  if (!trimmed) return { text: "", style: "paragraph", box };

  const mdImage = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
  const htmlImage = trimmed.match(/^<img\b([^>]*)\/?\s*>$/i);
  const inlineMdImage = trimmed.match(/!\[([^\]]*)\]\((data:image\/[a-zA-Z0-9.+-]+;base64,[^\s)]+)\)/);

  if (mdImage) {
    return { text: mdImage[1], style: "image", imageSrc: mdImage[2].trim().replace(/^<|>$/g, ""), imageAlt: mdImage[1], box };
  }
  if (inlineMdImage) {
    // Extract inline base64 image and return as image line
    const alt = inlineMdImage[1];
    const src = inlineMdImage[2];
    const matchIndex = inlineMdImage.index ?? 0;
    const beforeImage = trimmed.substring(0, matchIndex);
    const afterImage = trimmed.substring(matchIndex + inlineMdImage[0].length);
    // If there's text before or after, prioritize the image for rendering
    return { text: alt || "", style: "image", imageSrc: src, imageAlt: alt, box };
  }
  if (htmlImage) {
    const src = htmlImage[1].match(/\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const alt = htmlImage[1].match(/\balt\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    if (src) {
      const imageSrc = src[1] || src[2] || src[3];
      const imageAlt = alt?.[1] || alt?.[2] || alt?.[3] || "";
      return { text: imageAlt, style: "image", imageSrc, imageAlt, box };
    }
  }

  if (trimmed === "%%MATH%%" || trimmed.startsWith("%%MATH%%")) {
    const text = trimmed.replace(/^%%MATH%%/, "").replace(/%%ENDMATH%%$/, "");
    return { text, style: "math", box };
  }

  if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
    return { text: "", style: "hr", box };
  }

  const htmlHeading = unwrap("h1", trimmed) || unwrap("h2", trimmed) || unwrap("h3", trimmed)
    || unwrap("h4", trimmed) || unwrap("h5", trimmed) || unwrap("h6", trimmed);
  if (htmlHeading) {
    const tag = trimmed.match(/^<h([1-6])\b[^>]*>/i);
    const level = tag ? Number(tag[1]) : 2;
    const color = readableColor(parseInlineStyle(tag?.[0] || "").color, box);
    return {
      text: applyInlineMarkdown(htmlHeading.inner),
      style: "heading",
      headingLevel: level,
      size: headingSize(level),
      color,
      box,
    };
  }

  const htmlQuote = unwrap("blockquote", trimmed);
  if (htmlQuote) {
    return { text: applyInlineMarkdown(htmlQuote.inner), style: "quote", box };
  }

  const htmlP = unwrap("p", trimmed);
  if (htmlP) {
    const open = trimmed.match(/^<p\b[^>]*>/i)?.[0] || "";
    const color = readableColor(parseInlineStyle(open).color, box);
    return { text: applyInlineMarkdown(htmlP.inner), style: "paragraph", color, box };
  }

  if (/^```/.test(trimmed)) {
    return {
      text: trimmed === "```" ? "" : trimmed.slice(3),
      style: "code",
      box,
    };
  }

  const mdHeading = trimmed.match(/^(#{1,6})\s+([\s\S]+)$/);
  if (mdHeading) {
    const level = mdHeading[1].length;
    const inner = applyInlineMarkdown(mdHeading[2]);
    const font = unwrap("font", inner.trim());
    const color = font
      ? readableColor(parseInlineStyle(`<font ${font.attrs}>`).color, box)
      : undefined;
    return {
      text: inner,
      style: "heading",
      headingLevel: level,
      size: headingSize(level),
      color,
      box,
    };
  }

  if (/^>\s?/.test(trimmed)) {
    return {
      text: applyInlineMarkdown(trimmed.replace(/^>\s?/, "")),
      style: "quote",
      box,
    };
  }

  if (/^[-*+]\s+/.test(trimmed) || /^•\s+/.test(trimmed)) {
    return {
      text: applyInlineMarkdown(`• ${trimmed.replace(/^([-*+]|•)\s+/, "")}`),
      style: "bullet",
      box,
    };
  }

  if (/^\d+\.\s+/.test(trimmed)) {
    return { text: applyInlineMarkdown(trimmed), style: "bullet", box };
  }

  return { text: applyInlineMarkdown(trimmed), style: "paragraph", box };
}

function markBoxEdges(lines: MarkdownVisualLine[]): MarkdownVisualLine[] {
  return lines.map((line, index) => {
    if (!line.box) return line;
    const prev = lines[index - 1]?.box;
    const next = lines[index + 1]?.box;
    const samePrev = prev && prev.background === line.box.background;
    const sameNext = next && next.background === line.box.background;
    return {
      ...line,
      box: {
        ...line.box,
        first: !samePrev,
        last: !sameNext,
      },
    };
  });
}

export function parseMarkdownLines(source: string): MarkdownVisualLine[] {
  const prepared = replaceLatex(source.replace(/\r\n/g, "\n").replace(/<br\s*\/?>/gi, "\n"));
  const rawLines = prepared.split("\n");
  const visual: MarkdownVisualLine[] = [];
  let box: CalloutBox | undefined;

  for (let i = 0; i < rawLines.length; i += 1) {
    let line = rawLines[i];

    const openDiv = line.match(/<div\b[^>]*>/i);
    if (openDiv) {
      const style = parseInlineStyle(openDiv[0]);
      box = {
        background: style.background || "rgba(30, 41, 59, 0.6)",
        border: borderAccent(style.borderLeft),
        first: true,
        last: false,
      };
      line = line.replace(/<div\b[^>]*>/i, "");
      if (!line.trim() && /<\/div>/i.test(rawLines[i + 1] || "") === false) {
        continue;
      }
    }

    const closeDiv = /<\/div>/i.test(line);
    if (closeDiv) line = line.replace(/<\/div>/gi, "");

    if (isTableRow(line) && !isTableSep(line)) {
      const rows: string[][] = [parseTableRow(line)];
      let header = true;
      while (i + 1 < rawLines.length && (isTableRow(rawLines[i + 1]) || isTableSep(rawLines[i + 1]))) {
        i += 1;
        if (isTableSep(rawLines[i])) {
          header = false;
          continue;
        }
        rows.push(parseTableRow(rawLines[i]));
      }
      rows.forEach((cells, rowIndex) => {
        visual.push({
          text: cells.join("   "),
          style: "table",
          tableCells: cells.map((text): TableCell => ({
            text,
            header: rowIndex === 0 && (header || rows.length > 1),
          })),
          box,
        });
      });
      if (closeDiv) box = undefined;
      continue;
    }

    if (line.trim() || box) {
      visual.push(classifyLine(line, box));
    }

    if (closeDiv) box = undefined;
  }

  return markBoxEdges(visual);
}
