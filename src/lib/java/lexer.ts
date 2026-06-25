// A small hand-written lexer for the Java subset the academy exercises use.
// Scope is deliberately bounded (see parser.ts) — enough to actually RUN the
// algorithmic exercises (variables, math, loops, methods, arrays), not to be a
// full JLS-compliant compiler. A real WASM JVM can replace this later.

export type TokenType =
  | "num"
  | "string"
  | "char"
  | "ident"
  | "keyword"
  | "op"
  | "punc"
  | "eof";

export interface Token {
  type: TokenType;
  value: string;
  /** 1-based source line, for error messages. */
  line: number;
  col: number;
}

const KEYWORDS = new Set([
  "int", "long", "double", "float", "boolean", "char", "String", "var",
  "void", "return", "if", "else", "for", "while", "do", "break", "continue",
  "true", "false", "null", "new", "static", "public", "private", "protected",
  "final", "class", "this",
]);

// Multi-char operators, longest first so the scanner is greedy.
const MULTI_OPS = [
  ">>>=", "<<=", ">>=", ">>>",
  "===", "!==",
  "==", "!=", "<=", ">=", "&&", "||",
  "++", "--",
  "+=", "-=", "*=", "/=", "%=", "&=", "|=", "^=",
  "<<", ">>",
];

const SINGLE_OPS = new Set([
  "+", "-", "*", "/", "%", "=", "<", ">", "!", "&", "|", "^", "~", "?", ":",
]);

const PUNC = new Set(["(", ")", "{", "}", "[", "]", ",", ";", "."]);

export class LexError extends Error {}

export function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let line = 1;
  let col = 1;
  const n = src.length;

  const push = (type: TokenType, value: string, c: number) =>
    tokens.push({ type, value, line, col: c });

  while (i < n) {
    const ch = src[i];

    // Newlines / whitespace
    if (ch === "\n") {
      i++; line++; col = 1; continue;
    }
    if (ch === " " || ch === "\t" || ch === "\r") {
      i++; col++; continue;
    }

    // Comments
    if (ch === "/" && src[i + 1] === "/") {
      while (i < n && src[i] !== "\n") i++;
      continue;
    }
    if (ch === "/" && src[i + 1] === "*") {
      i += 2; col += 2;
      while (i < n && !(src[i] === "*" && src[i + 1] === "/")) {
        if (src[i] === "\n") { line++; col = 1; } else col++;
        i++;
      }
      i += 2; col += 2;
      continue;
    }

    // Numbers (int, long suffix, double, hex)
    if (isDigit(ch) || (ch === "." && isDigit(src[i + 1]))) {
      const start = i;
      const startCol = col;
      if (ch === "0" && (src[i + 1] === "x" || src[i + 1] === "X")) {
        i += 2;
        while (i < n && /[0-9a-fA-F_]/.test(src[i])) i++;
      } else {
        while (i < n && /[0-9_]/.test(src[i])) i++;
        if (src[i] === ".") { i++; while (i < n && /[0-9_]/.test(src[i])) i++; }
        if (src[i] === "e" || src[i] === "E") {
          i++;
          if (src[i] === "+" || src[i] === "-") i++;
          while (i < n && isDigit(src[i])) i++;
        }
      }
      // optional type suffix
      if (i < n && /[lLfFdD]/.test(src[i])) i++;
      const raw = src.slice(start, i).replace(/_/g, "");
      col = startCol + (i - start);
      tokens.push({ type: "num", value: raw, line, col: startCol });
      continue;
    }

    // String literal
    if (ch === '"') {
      const startCol = col;
      i++; col++;
      let s = "";
      while (i < n && src[i] !== '"') {
        if (src[i] === "\\") { s += unescape(src[i + 1]); i += 2; col += 2; }
        else { if (src[i] === "\n") { line++; col = 1; } else col++; s += src[i]; i++; }
      }
      i++; col++;
      tokens.push({ type: "string", value: s, line, col: startCol });
      continue;
    }

    // Char literal
    if (ch === "'") {
      const startCol = col;
      i++; col++;
      let c: string;
      if (src[i] === "\\") { c = unescape(src[i + 1]); i += 2; col += 2; }
      else { c = src[i]; i++; col++; }
      i++; col++; // closing quote
      tokens.push({ type: "char", value: c, line, col: startCol });
      continue;
    }

    // Identifier / keyword
    if (isIdentStart(ch)) {
      const start = i;
      const startCol = col;
      while (i < n && isIdentPart(src[i])) i++;
      const word = src.slice(start, i);
      col = startCol + (i - start);
      push(KEYWORDS.has(word) ? "keyword" : "ident", word, startCol);
      continue;
    }

    // Multi-char operators
    let matched = false;
    for (const op of MULTI_OPS) {
      if (src.startsWith(op, i)) {
        push("op", op, col);
        i += op.length; col += op.length;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    // Single-char operators
    if (SINGLE_OPS.has(ch)) { push("op", ch, col); i++; col++; continue; }
    if (PUNC.has(ch)) { push("punc", ch, col); i++; col++; continue; }

    throw new LexError(`Unexpected character '${ch}' at line ${line}`);
  }

  tokens.push({ type: "eof", value: "", line, col });
  return tokens;
}

function isDigit(c: string) { return c >= "0" && c <= "9"; }
function isIdentStart(c: string) { return /[A-Za-z_$]/.test(c); }
function isIdentPart(c: string) { return /[A-Za-z0-9_$]/.test(c); }

function unescape(c: string): string {
  switch (c) {
    case "n": return "\n";
    case "t": return "\t";
    case "r": return "\r";
    case "0": return "\0";
    case "\\": return "\\";
    case '"': return '"';
    case "'": return "'";
    default: return c;
  }
}

export { KEYWORDS };
