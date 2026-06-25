// AST node definitions for the Java-subset interpreter.

export type Expr =
  | { kind: "num"; value: number; isInt: boolean }
  | { kind: "str"; value: string }
  | { kind: "char"; value: string }
  | { kind: "bool"; value: boolean }
  | { kind: "null" }
  | { kind: "name"; id: string }
  | { kind: "this" }
  | { kind: "unary"; op: string; prefix: boolean; arg: Expr }
  | { kind: "binary"; op: string; left: Expr; right: Expr }
  | { kind: "logical"; op: string; left: Expr; right: Expr }
  | { kind: "assign"; op: string; target: Expr; value: Expr }
  | { kind: "ternary"; cond: Expr; then: Expr; else: Expr }
  | { kind: "call"; callee: Expr; args: Expr[] }
  | { kind: "member"; obj: Expr; prop: string }
  | { kind: "index"; obj: Expr; index: Expr }
  | { kind: "newArray"; elemType: string; sizes: Expr[]; init?: Expr[] }
  | { kind: "arrayLit"; elements: Expr[] }
  | { kind: "newObject"; className: string; args: Expr[] }
  | { kind: "cast"; type: string; arg: Expr };

export type Stmt =
  | { kind: "varDecl"; varType: string; decls: { name: string; init?: Expr }[] }
  | { kind: "exprStmt"; expr: Expr }
  | { kind: "block"; body: Stmt[] }
  | { kind: "if"; cond: Expr; then: Stmt; else?: Stmt }
  | { kind: "while"; cond: Expr; body: Stmt }
  | { kind: "doWhile"; cond: Expr; body: Stmt }
  | { kind: "for"; init?: Stmt; cond?: Expr; update?: Expr; body: Stmt }
  | { kind: "forEach"; varType: string; name: string; iterable: Expr; body: Stmt }
  | { kind: "return"; value?: Expr }
  | { kind: "break" }
  | { kind: "continue" }
  | { kind: "method"; name: string; params: { type: string; name: string }[]; body: Stmt[]; isStatic: boolean }
  | { kind: "class"; name: string; members: Stmt[]; fields: { type: string; name: string; init?: Expr }[] };

export interface Program {
  // Top-level: classes, loose methods, and loose statements (the academy
  // exercises are often just a method body or a few statements).
  classes: Extract<Stmt, { kind: "class" }>[];
  methods: Extract<Stmt, { kind: "method" }>[];
  statements: Stmt[];
}
