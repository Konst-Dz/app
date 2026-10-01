export const HIGHLIGHT_START = '\u0001';
export const HIGHLIGHT_END = '\u0002';

export const MIN_QUERY_LENGTH = 2;
export const MAX_QUERY_TOKENS = 10;

export interface SnippetSegment {
  text: string;
  isHighlighted: boolean;
}

const TOKEN_WITH_CHARACTER = /[\p{L}\p{N}]/u;

function sanitizeToken(token: string): string {
  return token.replace(/["*]/g, '');
}

export function buildMatchExpression(query: string): string | null {
  if (query.trim().length < MIN_QUERY_LENGTH) {
    return null;
  }

  const tokens: string[] = [];
  for (const rawToken of query.split(/\s+/)) {
    const token = sanitizeToken(rawToken);
    if (token === '' || !TOKEN_WITH_CHARACTER.test(token)) {
      continue;
    }
    if (!tokens.includes(token)) {
      tokens.push(token);
    }
    if (tokens.length === MAX_QUERY_TOKENS) {
      break;
    }
  }

  if (tokens.length === 0) {
    return null;
  }
  return tokens.map((token) => `"${token}"*`).join(' ');
}

export function splitSnippet(snippet: string): SnippetSegment[] {
  const segments: SnippetSegment[] = [];
  let isHighlighted = false;
  let buffer = '';

  for (const char of snippet) {
    if (char === HIGHLIGHT_START || char === HIGHLIGHT_END) {
      if (buffer !== '') {
        segments.push({ text: buffer, isHighlighted });
        buffer = '';
      }
      isHighlighted = char === HIGHLIGHT_START;
      continue;
    }
    buffer += char;
  }

  if (buffer !== '') {
    segments.push({ text: buffer, isHighlighted });
  }
  return segments;
}
