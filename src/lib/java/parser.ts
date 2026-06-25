import { tokenize, type Token } from "./lexer";
import type { Expr, Stmt, Program } from "./ast";

export class ParseError extends Error {}

const TYPE_KEYWORDS = new Set([
  "int", "long", "double", "float", "boolean", "char", "String", "var", "void",
]);

// Operator precedence for binary/logical operators (higher binds tighter).
const PRECEDENCE: Record<string, number> = {
  "||": 1,
  "&&": 2,
  "|": 3, "^": 4, "&": 5,
  "==": 6, "!=": 6,
  "<": 7, ">": 7, "<=": 7, ">=": 7,
  "<<": 8, ">>": 8, ">>>": 8,
  "+": 9, "-": 9,
  "*": 10, "/": 10, "%": 10,
};
const LOGICAL = new Set(["&&", "||"]);
const ASSIGN_OPS = new Set([
  "=", "+=", "-=", "*=", "/=", "%=", "&=", "|=", "^=", "<<=", ">>=", ">>>=",
]);

export function parse(src: string): Program {
  const tokens = tokenize(src);
  return new Parser(tokens).parseProgram();
}

class Parser {
  private pos = 0;
  constructor(private toks: Token[]) {}

  private peek(o = 0): Token { return this.toks[this.pos + o]; }
  private next(): Token { return this.toks[this.pos++]; }
  private atEnd(): boolean { return this.peek().type === "eof"; }

  private is(value: string): boolean {
    const t = this.peek();
    return (t.type === "op" || t.type === "punc" || t.type === "keyword") && t.value === value;
  }
  private eat(value: string): boolean {
    if (this.is(value)) { this.pos++; return true; }
    return false;
  }
  private expect(value: string): Token {
    if (!this.is(value)) {
      const t = this.peek();
      throw new ParseError(`Expected '${value}' but found '${t.value || "end of input"}' (line ${t.line})`);
    }
    return this.next();
  }

  parseProgram(): Program {
    const classes: Program["classes"] = [];
    const methods: Program["methods"] = [];
    const statements: Stmt[] = [];

    while (!this.atEnd()) {
      // Skip stray import/package lines that learners sometimes paste.
      if (this.peek().type === "ident" && (this.peek().value === "import" || this.peek().value === "package")) {
        while (!this.atEnd() && !this.eat(";")) this.next();
        continue;
      }
      const stmt = this.parseTopLevel();
      if (stmt.kind === "class") classes.push(stmt);
      else if (stmt.kind === "method") methods.push(stmt);
      else statements.push(stmt);
    }
    return { classes, methods, statements };
  }

  private skipModifiers(): boolean {
    let isStatic = false;
    while (
      this.is("public") || this.is("private") || this.is("protected") ||
      this.is("final") || this.is("static")
    ) {
      if (this.is("static")) isStatic = true;
      this.next();
    }
    return isStatic;
  }

  private parseTopLevel(): Stmt {
    const isStatic = this.skipModifiers();
    if (this.is("class")) return this.parseClass();
    // method-or-field-or-statement disambiguation
    const member = this.tryParseMember(isStatic);
    if (member) return member;
    return this.parseStatement();
  }

  private parseClass(): Stmt {
    this.expect("class");
    const name = this.next().value;
    // skip extends/implements clauses
    while (!this.is("{") && !this.atEnd()) this.next();
    this.expect("{");
    const members: Stmt[] = [];
    const fields: { type: string; name: string; init?: Expr }[] = [];
    while (!this.is("}") && !this.atEnd()) {
      const isStatic = this.skipModifiers();
      if (this.is("class")) { members.push(this.parseClass()); continue; }
      const m = this.tryParseMember(isStatic, name);
      if (m) {
        if (m.kind === "method") members.push(m);
        else if (m.kind === "varDecl") {
          for (const d of m.decls) fields.push({ type: m.varType, name: d.name, init: d.init });
        }
      } else {
        // unknown — skip a statement defensively
        this.parseStatement();
      }
    }
    this.expect("}");
    return { kind: "class", name, members, fields };
  }

  // Returns a method or field decl if the upcoming tokens look like one,
  // otherwise null (caller falls back to statement parsing).
  private tryParseMember(isStatic: boolean, className?: string): Stmt | null {
    const start = this.pos;
    // Constructor: Ident '(' ...  with same name as class
    if (className && this.peek().type === "ident" && this.peek().value === className && this.peek(1).value === "(") {
      const name = this.next().value;
      const params = this.parseParams();
      const body = this.parseBlockBody();
      return { kind: "method", name: "<init>" + name, params, body, isStatic: false };
    }

    const type = this.tryParseType();
    if (type !== null) {
      // method:  Type name '('
      if (this.peek().type === "ident" && this.peek(1).value === "(") {
        const name = this.next().value;
        const params = this.parseParams();
        const body = this.parseBlockBody();
        return { kind: "method", name, params, body, isStatic };
      }
      // field/var:  Type name ('=' expr)? (',' ...)* ';'
      if (this.peek().type === "ident") {
        const decls = this.parseVarDeclarators();
        this.expect(";");
        return { kind: "varDecl", varType: type, decls };
      }
    }
    this.pos = start;
    return null;
  }

  private parseParams(): { type: string; name: string }[] {
    this.expect("(");
    const params: { type: string; name: string }[] = [];
    while (!this.is(")") && !this.atEnd()) {
      this.skipModifiers();
      const type = this.tryParseType() ?? "var";
      const name = this.next().value;
      params.push({ type, name });
      if (!this.eat(",")) break;
    }
    this.expect(")");
    return params;
  }

  private parseBlockBody(): Stmt[] {
    this.expect("{");
    const body: Stmt[] = [];
    while (!this.is("}") && !this.atEnd()) body.push(this.parseStatement());
    this.expect("}");
    return body;
  }

  // ---- Types ----

  private tryParseType(): string | null {
    const start = this.pos;
    const t = this.peek();
    let base: string;
    if (t.type === "keyword" && TYPE_KEYWORDS.has(t.value)) base = this.next().value;
    else if (t.type === "ident" && /^[A-Z]/.test(t.value)) base = this.next().value;
    else return null;

    // generics: skip <...>
    if (this.is("<")) {
      let depth = 0;
      do {
        if (this.is("<")) depth++;
        else if (this.is(">")) depth--;
        this.next();
      } while (depth > 0 && !this.atEnd());
    }
    // array dims
    let dims = "";
    while (this.is("[") && this.peek(1).value === "]") { this.next(); this.next(); dims += "[]"; }

    // A bare uppercase ident not followed by an ident/var-context is probably
    // an expression (e.g. `Math.abs(...)`), so reject.
    const after = this.peek();
    const looksLikeDecl =
      after.type === "ident" || dims.length > 0 ||
      TYPE_KEYWORDS.has(base);
    if (!looksLikeDecl) { this.pos = start; return null; }
    return base + dims;
  }

  // ---- Statements ----

  parseStatement(): Stmt {
    if (this.is("{")) return { kind: "block", body: this.parseBlockBody() };
    if (this.is("if")) return this.parseIf();
    if (this.is("for")) return this.parseFor();
    if (this.is("while")) return this.parseWhile();
    if (this.is("do")) return this.parseDoWhile();
    if (this.is("return")) {
      this.next();
      if (this.eat(";")) return { kind: "return" };
      const value = this.parseExpr();
      this.expect(";");
      return { kind: "return", value };
    }
    if (this.is("break")) { this.next(); this.expect(";"); return { kind: "break" }; }
    if (this.is("continue")) { this.next(); this.expect(";"); return { kind: "continue" }; }
    if (this.eat(";")) return { kind: "block", body: [] };

    // local class
    this.skipModifiers();
    if (this.is("class")) return this.parseClass();

    // variable declaration?
    const start = this.pos;
    const type = this.tryParseType();
    if (type !== null && this.peek().type === "ident") {
      const decls = this.parseVarDeclarators();
      this.expect(";");
      return { kind: "varDecl", varType: type, decls };
    }
    this.pos = start;

    // expression statement
    const expr = this.parseExpr();
    this.expect(";");
    return { kind: "exprStmt", expr };
  }

  private parseVarDeclarators(): { name: string; init?: Expr }[] {
    const decls: { name: string; init?: Expr }[] = [];
    do {
      const name = this.next().value;
      // allow array brackets after name: int a[]
      while (this.is("[") && this.peek(1).value === "]") { this.next(); this.next(); }
      let init: Expr | undefined;
      if (this.eat("=")) init = this.parseExpr();
      decls.push({ name, init });
    } while (this.eat(","));
    return decls;
  }

  private parseIf(): Stmt {
    this.expect("if");
    this.expect("(");
    const cond = this.parseExpr();
    this.expect(")");
    const then = this.parseStatement();
    let els: Stmt | undefined;
    if (this.eat("else")) els = this.parseStatement();
    return { kind: "if", cond, then, else: els };
  }

  private parseWhile(): Stmt {
    this.expect("while");
    this.expect("(");
    const cond = this.parseExpr();
    this.expect(")");
    const body = this.parseStatement();
    return { kind: "while", cond, body };
  }

  private parseDoWhile(): Stmt {
    this.expect("do");
    const body = this.parseStatement();
    this.expect("while");
    this.expect("(");
    const cond = this.parseExpr();
    this.expect(")");
    this.expect(";");
    return { kind: "doWhile", cond, body };
  }

  private parseFor(): Stmt {
    this.expect("for");
    this.expect("(");
    // for-each:  Type name : iterable
    const start = this.pos;
    const t = this.tryParseType();
    if (t !== null && this.peek().type === "ident" && this.peek(1).value === ":") {
      const name = this.next().value;
      this.expect(":");
      const iterable = this.parseExpr();
      this.expect(")");
      const body = this.parseStatement();
      return { kind: "forEach", varType: t, name, iterable, body };
    }
    this.pos = start;

    // classic for
    let init: Stmt | undefined;
    if (!this.is(";")) {
      const tt = this.tryParseType();
      if (tt !== null && this.peek().type === "ident") {
        const decls = this.parseVarDeclarators();
        init = { kind: "varDecl", varType: tt, decls };
      } else {
        init = { kind: "exprStmt", expr: this.parseExpr() };
      }
    }
    this.expect(";");
    const cond = this.is(";") ? undefined : this.parseExpr();
    this.expect(";");
    const update = this.is(")") ? undefined : this.parseExpr();
    this.expect(")");
    const body = this.parseStatement();
    return { kind: "for", init, cond, update, body };
  }

  // ---- Expressions (precedence climbing) ----

  parseExpr(): Expr { return this.parseAssignment(); }

  private parseAssignment(): Expr {
    const left = this.parseTernary();
    const t = this.peek();
    if (t.type === "op" && ASSIGN_OPS.has(t.value)) {
      this.next();
      const value = this.parseAssignment();
      return { kind: "assign", op: t.value, target: left, value };
    }
    return left;
  }

  private parseTernary(): Expr {
    const cond = this.parseBinary(0);
    if (this.eat("?")) {
      const then = this.parseAssignment();
      this.expect(":");
      const els = this.parseAssignment();
      return { kind: "ternary", cond, then, else: els };
    }
    return cond;
  }

  private parseBinary(minPrec: number): Expr {
    let left = this.parseUnary();
    for (;;) {
      const t = this.peek();
      if (t.type !== "op") break;
      const prec = PRECEDENCE[t.value];
      if (prec === undefined || prec < minPrec) break;
      this.next();
      const right = this.parseBinary(prec + 1);
      left = LOGICAL.has(t.value)
        ? { kind: "logical", op: t.value, left, right }
        : { kind: "binary", op: t.value, left, right };
    }
    return left;
  }

  private parseUnary(): Expr {
    const t = this.peek();
    if (t.type === "op" && (t.value === "!" || t.value === "-" || t.value === "+" || t.value === "~")) {
      this.next();
      return { kind: "unary", op: t.value, prefix: true, arg: this.parseUnary() };
    }
    if (t.type === "op" && (t.value === "++" || t.value === "--")) {
      this.next();
      return { kind: "unary", op: t.value, prefix: true, arg: this.parseUnary() };
    }
    // cast: ( Type ) unary  — only for primitive casts to keep it unambiguous
    if (this.is("(")) {
      const start = this.pos;
      this.next();
      const ty = this.peek();
      if (ty.type === "keyword" && TYPE_KEYWORDS.has(ty.value) && this.peek(1).value === ")") {
        this.next(); // type
        this.next(); // )
        return { kind: "cast", type: ty.value, arg: this.parseUnary() };
      }
      this.pos = start;
    }
    return this.parsePostfix();
  }

  private parsePostfix(): Expr {
    let e = this.parsePrimary();
    for (;;) {
      if (this.is(".")) {
        this.next();
        const prop = this.next().value;
        if (this.is("(")) {
          const args = this.parseArgs();
          e = { kind: "call", callee: { kind: "member", obj: e, prop }, args };
        } else {
          e = { kind: "member", obj: e, prop };
        }
      } else if (this.is("(")) {
        const args = this.parseArgs();
        e = { kind: "call", callee: e, args };
      } else if (this.is("[")) {
        this.next();
        const index = this.parseExpr();
        this.expect("]");
        e = { kind: "index", obj: e, index };
      } else if (this.is("++") || this.is("--")) {
        const op = this.next().value;
        e = { kind: "unary", op, prefix: false, arg: e };
      } else break;
    }
    return e;
  }

  private parseArgs(): Expr[] {
    this.expect("(");
    const args: Expr[] = [];
    while (!this.is(")") && !this.atEnd()) {
      args.push(this.parseExpr());
      if (!this.eat(",")) break;
    }
    this.expect(")");
    return args;
  }

  private parsePrimary(): Expr {
    const t = this.peek();

    if (t.type === "num") {
      this.next();
      const isInt = !/[.eEfFdD]/.test(t.value) || /[lL]$/.test(t.value);
      const clean = t.value.replace(/[lLfFdD]$/, "");
      const value = clean.startsWith("0x") || clean.startsWith("0X")
        ? parseInt(clean, 16)
        : Number(clean);
      return { kind: "num", value, isInt: isInt && !/[.eE]/.test(clean) };
    }
    if (t.type === "string") { this.next(); return { kind: "str", value: t.value }; }
    if (t.type === "char") { this.next(); return { kind: "char", value: t.value }; }
    if (this.is("true")) { this.next(); return { kind: "bool", value: true }; }
    if (this.is("false")) { this.next(); return { kind: "bool", value: false }; }
    if (this.is("null")) { this.next(); return { kind: "null" }; }
    if (this.is("this")) { this.next(); return { kind: "this" }; }

    if (this.is("new")) return this.parseNew();

    if (this.is("(")) {
      this.next();
      const e = this.parseExpr();
      this.expect(")");
      return e;
    }

    // array literal in initializer position: { a, b, c }
    if (this.is("{")) return this.parseArrayLiteral();

    if (t.type === "ident" || (t.type === "keyword" && t.value === "String")) {
      this.next();
      return { kind: "name", id: t.value };
    }

    throw new ParseError(`Unexpected token '${t.value || "end of input"}' (line ${t.line})`);
  }

  private parseArrayLiteral(): Expr {
    this.expect("{");
    const elements: Expr[] = [];
    while (!this.is("}") && !this.atEnd()) {
      elements.push(this.is("{") ? this.parseArrayLiteral() : this.parseExpr());
      if (!this.eat(",")) break;
    }
    this.expect("}");
    return { kind: "arrayLit", elements };
  }

  private parseNew(): Expr {
    this.expect("new");
    const typeTok = this.next();
    const elemType = typeTok.value;
    // skip generics
    if (this.is("<")) { while (!this.is(">") && !this.atEnd()) this.next(); this.eat(">"); }

    if (this.is("[")) {
      const sizes: Expr[] = [];
      while (this.is("[")) {
        this.next();
        if (this.is("]")) { this.next(); break; }
        sizes.push(this.parseExpr());
        this.expect("]");
      }
      let init: Expr[] | undefined;
      if (this.is("{")) {
        const lit = this.parseArrayLiteral();
        init = lit.kind === "arrayLit" ? lit.elements : [];
      }
      return { kind: "newArray", elemType, sizes, init };
    }
    // new array via initializer only: new int[]{...} handled above; object ctor:
    const args = this.parseArgs();
    return { kind: "newObject", className: elemType, args };
  }
}
