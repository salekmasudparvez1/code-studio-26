const SUB: Record<string, string> = {
  "0": "₀",
  "1": "₁",
  "2": "₂",
  "3": "₃",
  "4": "₄",
  "5": "₅",
  "6": "₆",
  "7": "₇",
  "8": "₈",
  "9": "₉",
  a: "ₐ",
  e: "ₑ",
  h: "ₕ",
  i: "ᵢ",
  j: "ⱼ",
  k: "ₖ",
  l: "ₗ",
  m: "ₘ",
  n: "ₙ",
  o: "ₒ",
  p: "ₚ",
  r: "ᵣ",
  s: "ₛ",
  t: "ₜ",
  u: "ᵤ",
  v: "ᵥ",
  x: "ₓ",
  A: "ₐ",
  B: "ᵦ",
  C: "c",
  Q: "Q",
  K: "K",
  V: "V",
  O: "O",
};

const SUPER: Record<string, string> = {
  "0": "⁰",
  "1": "¹",
  "2": "²",
  "3": "³",
  "4": "⁴",
  "5": "⁵",
  "6": "⁶",
  "7": "⁷",
  "8": "⁸",
  "9": "⁹",
  "+": "⁺",
  "-": "⁻",
  T: "ᵀ",
  t: "ᵗ",
};

function mapChars(value: string, table: Record<string, string>): string {
  return value
    .split("")
    .map((ch) => table[ch] || ch)
    .join("");
}

export function latexToText(tex: string): string {
  let text = tex.replace(/\s+/g, " ").trim();

  text = text.replace(/\\operatorname\{([^}]+)\}/g, "$1");
  text = text.replace(/\\mathrm\{([^}]+)\}/g, "$1");
  text = text.replace(/\\text\{([^}]+)\}/g, "$1");
  text = text.replace(/\\left|\\right/g, "");
  text = text.replace(/\\qquad/g, "    ");
  text = text.replace(/\\quad/g, "  ");
  text = text.replace(/\\,/g, " ");
  text = text.replace(/\\;/g, " ");
  text = text.replace(/\\alpha/g, "α");
  text = text.replace(/\\beta/g, "β");
  text = text.replace(/\\gamma/g, "γ");
  text = text.replace(/\\theta/g, "θ");
  text = text.replace(/\\sigma/g, "σ");
  text = text.replace(/\\sum/g, "Σ");
  text = text.replace(/\\infty/g, "∞");
  text = text.replace(/\\times/g, "×");
  text = text.replace(/\\cdot/g, "·");
  text = text.replace(/\\ldots/g, "…");
  text = text.replace(/\\dots/g, "…");
  text = text.replace(/\\top/g, "T");
  text = text.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1 / $2)");
  text = text.replace(/\\sqrt\{([^}]+)\}/g, "√($1)");

  text = text.replace(/\^\{([^}]+)\}/g, (_, value: string) => mapChars(value, SUPER));
  text = text.replace(/\^([A-Za-z0-9])/g, (_, value: string) => SUPER[value] || value);
  text = text.replace(/_\{([^}]+)\}/g, (_, value: string) => mapChars(value, SUB));
  text = text.replace(/_([A-Za-z0-9])/g, (_, value: string) => SUB[value] || `_${value}`);

  text = text.replace(/\\_/g, "_");
  text = text.replace(/\\\\/g, " ");
  text = text.replace(/\\/g, "");
  return text.replace(/\s+/g, " ").trim();
}

export function replaceLatex(source: string): string {
  return source
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, tex: string) => `\n%%MATH%%${latexToText(tex)}%%ENDMATH%%\n`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, tex: string) => latexToText(tex));
}
