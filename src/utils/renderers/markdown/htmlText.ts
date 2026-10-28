const VOID_TAGS = new Set(["br", "hr", "img", "input", "meta", "link", "source"]);

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

export function decodeEntities(text: string): string {
  return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (_, code: string) => {
    if (code[0] === "#") {
      const hex = code[1] === "x" || code[1] === "X";
      const value = Number.parseInt(hex ? code.slice(2) : code.slice(1), hex ? 16 : 10);
      return Number.isFinite(value) ? String.fromCodePoint(value) : _;
    }
    return ENTITIES[code] ?? _;
  });
}

export function stripHtml(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, ""));
}

export function dropIncompleteTag(html: string): string {
  const lastLt = html.lastIndexOf("<");
  const lastGt = html.lastIndexOf(">");
  if (lastLt > lastGt) return html.slice(0, lastLt);
  return html;
}

export function closeOpenTags(html: string): string {
  const stack: string[] = [];
  const re = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*\/?>/g;
  let match: RegExpExecArray | null;

  while ((match = re.exec(html))) {
    const name = match[1].toLowerCase();
    const raw = match[0];
    const isClose = raw.startsWith("</");
    const isSelf = /\/\s*>$/.test(raw) || VOID_TAGS.has(name);

    if (isClose) {
      const idx = stack.lastIndexOf(name);
      if (idx >= 0) stack.splice(idx, 1);
    } else if (!isSelf) {
      stack.push(name);
    }
  }

  return html + stack.reverse().map((tag) => `</${tag}>`).join("");
}

export function sliceTypedHtml(source: string, visibleChars: number): string {
  return closeOpenTags(dropIncompleteTag(source.slice(0, visibleChars)));
}

export function normalizeBlockHtml(source: string): string {
  return source
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|blockquote|pre|tr)>/gi, "\n")
    .replace(/<(ul|ol|table|thead|tbody)\b[^>]*>/gi, "")
    .replace(/<\/(ul|ol|table|thead|tbody)>/gi, "\n")
    .replace(/<li\b[^>]*>/gi, "• ");
}
