export interface Token {
  text: string;
  color: string;
}

// Token color theme (VS Code Dark Modern / Dark+)
export const THEME_COLORS = {
  comment: '#8b949e',
  string: '#a5d6ff',
  number: '#79c0ff',
  keyword: '#ff7b72',
  function: '#d2a8ff',
  operator: '#79c0ff',
  default: '#c9d1d9',
};

const TOKEN_PATTERN =
  /(#[^\n]*|\/\/[^\n]*|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`[^`]*`|\b(?:import|from|as|const|let|var|function|return|if|else|for|while|class|def|print|true|false|True|False|None|null|async|await|new|export|default|try|catch|except|finally|in|is|lambda|with|yield|self|this)\b|\b\d+(?:\.\d+)?\b)/g;

/**
 * Tokenizes a single line of code into colored tokens for canvas rendering.
 */
export function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = [];
  let cursor = 0;

  for (const match of line.matchAll(TOKEN_PATTERN)) {
    const index = match.index ?? 0;
    const tokenStr = match[0];

    // Plain text before token
    if (index > cursor) {
      tokens.push({
        text: line.slice(cursor, index),
        color: THEME_COLORS.default,
      });
    }

    // Determine token category color
    let color = THEME_COLORS.default;
    if (tokenStr.startsWith('#') || tokenStr.startsWith('//')) {
      color = THEME_COLORS.comment;
    } else if (
      tokenStr.startsWith('"') ||
      tokenStr.startsWith("'") ||
      tokenStr.startsWith('`')
    ) {
      color = THEME_COLORS.string;
    } else if (/^\d/.test(tokenStr)) {
      color = THEME_COLORS.number;
    } else {
      color = THEME_COLORS.keyword;
    }

    tokens.push({ text: tokenStr, color });
    cursor = index + tokenStr.length;
  }

  // Trailing text after last token
  if (cursor < line.length) {
    tokens.push({
      text: line.slice(cursor),
      color: THEME_COLORS.default,
    });
  }

  return tokens;
}

