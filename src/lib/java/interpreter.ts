import type { Expr, Stmt, Program } from "./ast";

// ---- Runtime value model ----
// Numbers carry an `int` flag so we can honour Java's integer division and
// int-truncation-on-assignment, which are common "gotchas" the lessons teach.

export interface JArray { __array: true; elems: unknown[]; elemInt: boolean }
export interface JObject {
  __object: true;
  className: string;
  fields: Map<string, { value: unknown; int: boolean }>;
  /** Recorded calls for mock objects (WPILib shim feel). */
  calls?: { method: string; args: unknown[] }[];
  mock?: boolean;
}

interface Val { value: unknown; int: boolean }

const v = (value: unknown, int = false): Val => ({ value, int });
const VOID: Val = { value: undefined, int: false };

class ReturnSignal { constructor(public val: Val) {} }
class BreakSignal {}
class ContinueSignal {}

export class JavaRuntimeError extends Error {}

class Scope {
  vars = new Map<string, { value: unknown; int: boolean }>();
  constructor(public parent?: Scope) {}
  lookup(name: string): { value: unknown; int: boolean } | undefined {
    return this.vars.get(name) ?? this.parent?.lookup(name);
  }
  assign(name: string, value: unknown, int: boolean): boolean {
    const slot = this.vars.get(name);
    if (slot) { slot.value = value; slot.int = int; return true; }
    return this.parent ? this.parent.assign(name, value, int) : false;
  }
  declare(name: string, value: unknown, int: boolean) {
    this.vars.set(name, { value, int });
  }
}

export interface RunResult {
  output: string;
  ok: boolean;
  error?: string;
  /** Value returned by an invoked entry method, if any. */
  returnValue?: unknown;
}

const MAX_STEPS = 2_000_000;

export class Interpreter {
  private out: string[] = [];
  private steps = 0;
  private methods = new Map<string, Extract<Stmt, { kind: "method" }>>();
  private classes = new Map<string, Extract<Stmt, { kind: "class" }>>();
  private globals = new Scope();

  constructor(private program: Program) {
    for (const m of program.methods) this.methods.set(m.name, m);
    for (const c of program.classes) {
      this.classes.set(c.name, c);
      for (const m of c.members) {
        if (m.kind === "method" && m.isStatic) this.methods.set(m.name, m);
      }
    }
  }

  /** Run loose top-level statements (and any `public static void main`). */
  run(): RunResult {
    try {
      for (const s of this.program.statements) this.execStmt(s, this.globals);
      const main = this.findMain();
      if (main) this.invoke(main, [], this.globals);
      return { output: this.out.join(""), ok: true };
    } catch (e) {
      return this.fail(e);
    }
  }

  /** Invoke a named method with raw JS args (used by runtime test cases). */
  callMethod(name: string, args: unknown[]): RunResult {
    try {
      const m = this.methods.get(name);
      if (!m) return { output: this.out.join(""), ok: false, error: `No method named '${name}' found.` };
      const argv: Val[] = args.map((a) => marshal(a));
      const ret = this.invoke(m, argv, this.globals);
      return { output: this.out.join(""), ok: true, returnValue: ret.value };
    } catch (e) {
      return this.fail(e);
    }
  }

  /** Construct an instance of a user class (runs field inits + constructor).
   *  Returns a persistent JObject so a sequence of calls can share state. */
  newInstance(className: string, args: unknown[]): JObject {
    const cdef = this.classes.get(className);
    if (!cdef) throw new JavaRuntimeError(`No class named '${className}' found.`);
    const obj: JObject = { __object: true, className, fields: new Map() };
    for (const f of cdef.fields) {
      obj.fields.set(f.name, {
        value: f.init ? this.evalExpr(f.init, this.globals).value : defaultValue(f.type),
        int: isIntType(f.type),
      });
    }
    const ctor = cdef.members.find(
      (m) => m.kind === "method" && m.name.startsWith("<init>"),
    ) as Extract<Stmt, { kind: "method" }> | undefined;
    if (ctor) this.invoke(ctor, args.map(marshal), this.globals, obj);
    return obj;
  }

  /** Invoke an instance method on a previously-constructed object, preserving
   *  its field state across calls (used by stateful test sequences). */
  invokeInstance(obj: JObject, method: string, args: unknown[]): RunResult {
    try {
      const cdef = this.classes.get(obj.className);
      const m = cdef?.members.find(
        (mm) => mm.kind === "method" && mm.name === method,
      ) as Extract<Stmt, { kind: "method" }> | undefined;
      if (!m) return { output: this.out.join(""), ok: false, error: `No method '${method}' on class '${obj.className}'.` };
      const ret = this.invoke(m, args.map(marshal), this.globals, obj);
      return { output: this.out.join(""), ok: true, returnValue: ret.value };
    } catch (e) {
      return this.fail(e);
    }
  }

  private fail(e: unknown): RunResult {
    const msg = e instanceof Error ? e.message : String(e);
    return { output: this.out.join(""), ok: false, error: msg };
  }

  private findMain() {
    for (const c of this.program.classes) {
      for (const m of c.members) {
        if (m.kind === "method" && m.name === "main") return m;
      }
    }
    return this.methods.get("main");
  }

  private tick() {
    if (++this.steps > MAX_STEPS) {
      throw new JavaRuntimeError("Execution stopped: too many steps (possible infinite loop).");
    }
  }

  // ---- Statements ----

  private execStmt(s: Stmt, scope: Scope): void {
    this.tick();
    switch (s.kind) {
      case "varDecl": {
        const declInt = isIntType(s.varType);
        for (const d of s.decls) {
          if (d.init) {
            const val = this.evalExpr(d.init, scope);
            scope.declare(d.name, this.coerce(val, s.varType), declInt);
          } else {
            scope.declare(d.name, defaultValue(s.varType), declInt);
          }
        }
        return;
      }
      case "exprStmt": this.evalExpr(s.expr, scope); return;
      case "block": {
        const inner = new Scope(scope);
        for (const st of s.body) this.execStmt(st, inner);
        return;
      }
      case "if":
        if (truthy(this.evalExpr(s.cond, scope))) this.execStmt(s.then, scope);
        else if (s.else) this.execStmt(s.else, scope);
        return;
      case "while":
        while (truthy(this.evalExpr(s.cond, scope))) {
          this.tick();
          try { this.execStmt(s.body, scope); }
          catch (e) { if (e instanceof BreakSignal) break; if (e instanceof ContinueSignal) continue; throw e; }
        }
        return;
      case "doWhile":
        do {
          this.tick();
          try { this.execStmt(s.body, scope); }
          catch (e) { if (e instanceof BreakSignal) break; if (e instanceof ContinueSignal) continue; throw e; }
        } while (truthy(this.evalExpr(s.cond, scope)));
        return;
      case "for": {
        const inner = new Scope(scope);
        if (s.init) this.execStmt(s.init, inner);
        while (s.cond ? truthy(this.evalExpr(s.cond, inner)) : true) {
          this.tick();
          try { this.execStmt(s.body, inner); }
          catch (e) {
            if (e instanceof BreakSignal) break;
            if (!(e instanceof ContinueSignal)) throw e;
          }
          if (s.update) this.evalExpr(s.update, inner);
        }
        return;
      }
      case "forEach": {
        const it = this.evalExpr(s.iterable, scope);
        const arr = asArray(it.value);
        const inner = new Scope(scope);
        inner.declare(s.name, defaultValue(s.varType), isIntType(s.varType));
        for (const el of arr.elems) {
          this.tick();
          inner.assign(s.name, el, arr.elemInt);
          try { this.execStmt(s.body, inner); }
          catch (e) {
            if (e instanceof BreakSignal) break;
            if (!(e instanceof ContinueSignal)) throw e;
          }
        }
        return;
      }
      case "return":
        throw new ReturnSignal(s.value ? this.evalExpr(s.value, scope) : VOID);
      case "break": throw new BreakSignal();
      case "continue": throw new ContinueSignal();
      case "class": this.classes.set(s.name, s); return;
      case "method": this.methods.set(s.name, s); return;
    }
  }

  // ---- Method invocation ----

  private invoke(m: Extract<Stmt, { kind: "method" }>, args: Val[], _scope: Scope, self?: JObject): Val {
    const local = new Scope(this.globals);
    if (self) local.declare("this", self, false);
    m.params.forEach((p, i) => {
      const a = args[i] ?? v(defaultValue(p.type), isIntType(p.type));
      local.declare(p.name, this.coerce(a, p.type), isIntType(p.type));
    });
    try {
      for (const st of m.body) this.execStmt(st, local);
    } catch (e) {
      if (e instanceof ReturnSignal) return e.val;
      throw e;
    }
    return VOID;
  }

  // ---- Expressions ----

  private evalExpr(e: Expr, scope: Scope): Val {
    this.tick();
    switch (e.kind) {
      case "num": return v(e.value, e.isInt);
      case "str": return v(e.value);
      case "char": return v(e.value);
      case "bool": return v(e.value);
      case "null": return v(null);
      case "this": {
        const t = scope.lookup("this");
        if (!t) throw new JavaRuntimeError("'this' is not available here.");
        return v(t.value, false);
      }
      case "name": {
        const slot = scope.lookup(e.id);
        if (slot) return v(slot.value, slot.int);
        // Implicit `this.field` — bare field names inside instance methods.
        const self = scope.lookup("this");
        if (self && isObject(self.value)) {
          const f = self.value.fields.get(e.id);
          if (f) return v(f.value, f.int);
        }
        // Bare class names (Math, System, Integer...) resolve lazily in member access.
        return v({ __builtinClass: e.id });
      }
      case "arrayLit": {
        const elems = e.elements.map((el) => this.evalExpr(el, scope).value);
        const elemInt = e.elements.every((el) => this.evalExpr(el, scope).int);
        return v({ __array: true, elems, elemInt } as JArray);
      }
      case "unary": return this.evalUnary(e, scope);
      case "binary": return this.evalBinary(e, scope);
      case "logical": {
        const l = this.evalExpr(e.left, scope);
        if (e.op === "&&") return truthy(l) ? this.evalExpr(e.right, scope) : v(false);
        return truthy(l) ? v(true) : this.evalExpr(e.right, scope);
      }
      case "ternary":
        return truthy(this.evalExpr(e.cond, scope)) ? this.evalExpr(e.then, scope) : this.evalExpr(e.else, scope);
      case "assign": return this.evalAssign(e, scope);
      case "cast": {
        const val = this.evalExpr(e.arg, scope);
        return this.coerceVal(val, e.type);
      }
      case "index": {
        const obj = this.evalExpr(e.obj, scope);
        const idx = this.evalExpr(e.index, scope);
        const arr = asArray(obj.value);
        const i = Math.trunc(Number(idx.value));
        if (i < 0 || i >= arr.elems.length) {
          throw new JavaRuntimeError(`ArrayIndexOutOfBoundsException: Index ${i} out of bounds for length ${arr.elems.length}`);
        }
        return v(arr.elems[i], arr.elemInt);
      }
      case "member": return this.evalMember(e, scope);
      case "call": return this.evalCall(e, scope);
      case "newArray": return this.evalNewArray(e, scope);
      case "newObject": return this.evalNewObject(e, scope);
    }
  }

  private evalUnary(e: Extract<Expr, { kind: "unary" }>, scope: Scope): Val {
    if (e.op === "++" || e.op === "--") {
      const cur = this.evalExpr(e.arg, scope);
      const delta = e.op === "++" ? 1 : -1;
      const raw = Number(cur.value) + delta;
      const nextVal = v(cur.int ? Math.trunc(raw) : raw, cur.int);
      this.storeTo(e.arg, nextVal, scope);
      return e.prefix ? nextVal : cur;
    }
    const arg = this.evalExpr(e.arg, scope);
    switch (e.op) {
      case "-": return v(-Number(arg.value), arg.int);
      case "+": return v(+Number(arg.value), arg.int);
      case "!": return v(!truthy(arg));
      case "~": return v(~Math.trunc(Number(arg.value)), true);
    }
    throw new JavaRuntimeError(`Unsupported unary operator ${e.op}`);
  }

  private evalBinary(e: Extract<Expr, { kind: "binary" }>, scope: Scope): Val {
    const l = this.evalExpr(e.left, scope);
    const r = this.evalExpr(e.right, scope);
    const op = e.op;

    // String concatenation with +
    if (op === "+" && (typeof l.value === "string" || typeof r.value === "string")) {
      return v(javaStr(l.value) + javaStr(r.value));
    }

    const a = Number(l.value);
    const b = Number(r.value);
    const bothInt = l.int && r.int;
    switch (op) {
      case "+": return v(bothInt ? Math.trunc(a + b) : a + b, bothInt);
      case "-": return v(bothInt ? Math.trunc(a - b) : a - b, bothInt);
      case "*": return v(bothInt ? Math.trunc(a * b) : a * b, bothInt);
      case "/":
        if (bothInt) {
          if (b === 0) throw new JavaRuntimeError("ArithmeticException: / by zero");
          return v(Math.trunc(a / b), true);
        }
        return v(a / b, false);
      case "%":
        if (bothInt && b === 0) throw new JavaRuntimeError("ArithmeticException: / by zero");
        return v(a % b, bothInt);
      case "<": return v(a < b);
      case ">": return v(a > b);
      case "<=": return v(a <= b);
      case ">=": return v(a >= b);
      case "==": return v(looseEquals(l.value, r.value));
      case "!=": return v(!looseEquals(l.value, r.value));
      case "&": return v(Math.trunc(a) & Math.trunc(b), true);
      case "|": return v(Math.trunc(a) | Math.trunc(b), true);
      case "^": return v(Math.trunc(a) ^ Math.trunc(b), true);
      case "<<": return v(Math.trunc(a) << Math.trunc(b), true);
      case ">>": return v(Math.trunc(a) >> Math.trunc(b), true);
      case ">>>": return v(Math.trunc(a) >>> Math.trunc(b), true);
    }
    throw new JavaRuntimeError(`Unsupported operator ${op}`);
  }

  private evalAssign(e: Extract<Expr, { kind: "assign" }>, scope: Scope): Val {
    let newVal: Val;
    if (e.op === "=") {
      newVal = this.evalExpr(e.value, scope);
    } else {
      const cur = this.evalExpr(e.target, scope);
      const rhs = this.evalExpr(e.value, scope);
      const binOp = e.op.slice(0, -1);
      newVal = this.evalBinary({ kind: "binary", op: binOp, left: literal(cur), right: literal(rhs) }, scope);
    }
    // honour the declared int-ness of the target slot
    const targetInt = this.targetIsInt(e.target, scope);
    if (targetInt && typeof newVal.value === "number") newVal = v(Math.trunc(newVal.value), true);
    this.storeTo(e.target, newVal, scope);
    return newVal;
  }

  private targetIsInt(target: Expr, scope: Scope): boolean {
    if (target.kind === "name") return scope.lookup(target.id)?.int ?? false;
    if (target.kind === "index") {
      const arr = asArray(this.evalExpr(target.obj, scope).value);
      return arr.elemInt;
    }
    return false;
  }

  private storeTo(target: Expr, val: Val, scope: Scope): void {
    if (target.kind === "name") {
      if (scope.assign(target.id, val.value, val.int)) return;
      // Implicit `this.field` assignment inside instance methods.
      const self = scope.lookup("this");
      if (self && isObject(self.value) && self.value.fields.has(target.id)) {
        self.value.fields.set(target.id, { value: val.value, int: val.int });
        return;
      }
      scope.declare(target.id, val.value, val.int);
      return;
    }
    if (target.kind === "index") {
      const arr = asArray(this.evalExpr(target.obj, scope).value);
      const i = Math.trunc(Number(this.evalExpr(target.index, scope).value));
      if (i < 0 || i >= arr.elems.length) {
        throw new JavaRuntimeError(`ArrayIndexOutOfBoundsException: Index ${i} out of bounds for length ${arr.elems.length}`);
      }
      arr.elems[i] = arr.elemInt && typeof val.value === "number" ? Math.trunc(val.value) : val.value;
      return;
    }
    if (target.kind === "member") {
      const obj = this.evalExpr(target.obj, scope).value;
      if (isObject(obj)) {
        obj.fields.set(target.prop, { value: val.value, int: val.int });
        return;
      }
    }
    throw new JavaRuntimeError("Invalid assignment target.");
  }

  private evalMember(e: Extract<Expr, { kind: "member" }>, scope: Scope): Val {
    const objVal = this.evalExpr(e.obj, scope);
    const obj = objVal.value;
    // array.length
    if (isArray(obj) && e.prop === "length") return v(obj.elems.length, true);
    // string.length is a method in Java, not a field — handled in call
    if (isObject(obj)) {
      const f = obj.fields.get(e.prop);
      if (f) return v(f.value, f.int);
    }
    // Class constants: Math.PI, Math.E, Integer.MAX_VALUE
    const cls = builtinClassName(obj);
    if (cls === "System" && (e.prop === "out" || e.prop === "err")) {
      return v({ __out: true });
    }
    if (cls === "Math") {
      if (e.prop === "PI") return v(Math.PI);
      if (e.prop === "E") return v(Math.E);
    }
    if (cls === "Integer") {
      if (e.prop === "MAX_VALUE") return v(2147483647, true);
      if (e.prop === "MIN_VALUE") return v(-2147483648, true);
    }
    if (cls === "Double") {
      if (e.prop === "MAX_VALUE") return v(Number.MAX_VALUE);
      if (e.prop === "POSITIVE_INFINITY") return v(Infinity);
      if (e.prop === "NEGATIVE_INFINITY") return v(-Infinity);
    }
    // Unknown member on a mock → return a chainable mock value (0)
    if (isObject(obj) && obj.mock) return v(0, false);
    return v(undefined);
  }

  private evalCall(e: Extract<Expr, { kind: "call" }>, scope: Scope): Val {
    // Member call: obj.method(args) or Class.staticMethod(args)
    if (e.callee.kind === "member") {
      const recvExpr = e.callee.obj;
      const method = e.callee.prop;
      const args = e.args.map((a) => this.evalExpr(a, scope));

      const recv = this.evalExpr(recvExpr, scope);
      const cls = builtinClassName(recv.value);

      const builtin = this.tryBuiltinCall(recv, cls, method, args);
      if (builtin) return builtin;

      // User object method
      if (isObject(recv.value)) {
        const obj = recv.value;
        if (obj.mock) {
          obj.calls?.push({ method, args: args.map((a) => a.value) });
          return v(0, false);
        }
        const cdef = this.classes.get(obj.className);
        const m = cdef?.members.find((mm) => mm.kind === "method" && mm.name === method) as
          | Extract<Stmt, { kind: "method" }> | undefined;
        if (m) return this.invoke(m, args, scope, obj);
      }
      throw new JavaRuntimeError(`Unknown method '${method}'.`);
    }

    // Plain function call: name(args) → user/static method
    if (e.callee.kind === "name") {
      const args = e.args.map((a) => this.evalExpr(a, scope));
      const m = this.methods.get(e.callee.id);
      if (m) return this.invoke(m, args, scope);
      throw new JavaRuntimeError(`Unknown function '${e.callee.id}'.`);
    }

    throw new JavaRuntimeError("Unsupported call form.");
  }

  // System.out.*, Math.*, Integer.*, Double.*, String.*, etc.
  private tryBuiltinCall(recv: Val, cls: string | null, method: string, args: Val[]): Val | null {
    const nums = args.map((a) => Number(a.value));

    // System.out.print / println / printf
    if (recv.value && typeof recv.value === "object" && (recv.value as { __out?: boolean }).__out) {
      if (method === "println") { this.out.push((args.length ? javaStr(args[0].value) : "") + "\n"); return VOID; }
      if (method === "print") { this.out.push(args.length ? javaStr(args[0].value) : ""); return VOID; }
      if (method === "printf" || method === "format") {
        this.out.push(formatf(javaStr(args[0]?.value ?? ""), args.slice(1)));
        return VOID;
      }
    }

    if (cls === "Math") {
      switch (method) {
        case "abs": return v(Math.abs(nums[0]), args[0].int);
        case "max": return v(Math.max(nums[0], nums[1]), args[0].int && args[1].int);
        case "min": return v(Math.min(nums[0], nums[1]), args[0].int && args[1].int);
        case "sqrt": return v(Math.sqrt(nums[0]));
        case "cbrt": return v(Math.cbrt(nums[0]));
        case "pow": return v(Math.pow(nums[0], nums[1]));
        case "hypot": return v(Math.hypot(nums[0], nums[1]));
        case "floor": return v(Math.floor(nums[0]));
        case "ceil": return v(Math.ceil(nums[0]));
        case "round": return v(Math.round(nums[0]), true);
        case "signum": return v(Math.sign(nums[0]));
        case "sin": return v(Math.sin(nums[0]));
        case "cos": return v(Math.cos(nums[0]));
        case "tan": return v(Math.tan(nums[0]));
        case "atan": return v(Math.atan(nums[0]));
        case "atan2": return v(Math.atan2(nums[0], nums[1]));
        case "toRadians": return v(nums[0] * Math.PI / 180);
        case "toDegrees": return v(nums[0] * 180 / Math.PI);
        case "exp": return v(Math.exp(nums[0]));
        case "log": return v(Math.log(nums[0]));
        case "random": return v(Math.random());
      }
    }
    if (cls === "Integer") {
      if (method === "parseInt") return v(Math.trunc(parseInt(String(args[0].value), nums[1] || 10)), true);
      if (method === "valueOf") return v(Math.trunc(nums[0]), true);
      if (method === "toString") return v(String(Math.trunc(nums[0])));
      if (method === "max") return v(Math.max(nums[0], nums[1]), true);
      if (method === "min") return v(Math.min(nums[0], nums[1]), true);
    }
    if (cls === "Double") {
      if (method === "parseDouble") return v(parseFloat(String(args[0].value)));
      if (method === "valueOf") return v(nums[0]);
      if (method === "toString") return v(javaStr(nums[0]));
      if (method === "isNaN") return v(Number.isNaN(nums[0]));
    }
    if (cls === "String") {
      if (method === "valueOf") return v(javaStr(args[0].value));
      if (method === "format") return v(formatf(javaStr(args[0]?.value ?? ""), args.slice(1)));
    }

    // String instance methods
    if (typeof recv.value === "string") {
      const s = recv.value;
      switch (method) {
        case "length": return v(s.length, true);
        case "charAt": return v(s.charAt(Math.trunc(nums[0])));
        case "substring": return v(args.length > 1 ? s.substring(Math.trunc(nums[0]), Math.trunc(nums[1])) : s.substring(Math.trunc(nums[0])));
        case "indexOf": return v(s.indexOf(String(args[0].value)), true);
        case "toUpperCase": return v(s.toUpperCase());
        case "toLowerCase": return v(s.toLowerCase());
        case "trim": case "strip": return v(s.trim());
        case "equals": return v(s === args[0].value);
        case "equalsIgnoreCase": return v(s.toLowerCase() === String(args[0].value).toLowerCase());
        case "contains": return v(s.includes(String(args[0].value)));
        case "startsWith": return v(s.startsWith(String(args[0].value)));
        case "endsWith": return v(s.endsWith(String(args[0].value)));
        case "replace": return v(s.split(String(args[0].value)).join(String(args[1].value)));
        case "isEmpty": return v(s.length === 0);
        case "concat": return v(s + String(args[0].value));
      }
    }

    return null;
  }

  private evalNewArray(e: Extract<Expr, { kind: "newArray" }>, scope: Scope): Val {
    const elemInt = isIntType(e.elemType);
    if (e.init) {
      const elems = e.init.map((el) => this.evalExpr(el, scope).value);
      return v({ __array: true, elems, elemInt } as JArray);
    }
    const size = Math.trunc(Number(this.evalExpr(e.sizes[0], scope).value));
    const def = defaultValue(e.elemType);
    const elems = new Array(size).fill(def);
    return v({ __array: true, elems, elemInt } as JArray);
  }

  private evalNewObject(e: Extract<Expr, { kind: "newObject" }>, scope: Scope): Val {
    const cdef = this.classes.get(e.className);
    if (cdef) {
      const obj: JObject = { __object: true, className: e.className, fields: new Map() };
      for (const f of cdef.fields) {
        obj.fields.set(f.name, {
          value: f.init ? this.evalExpr(f.init, scope).value : defaultValue(f.type),
          int: isIntType(f.type),
        });
      }
      const ctor = cdef.members.find(
        (m) => m.kind === "method" && m.name.startsWith("<init>"),
      ) as Extract<Stmt, { kind: "method" }> | undefined;
      if (ctor) this.invoke(ctor, e.args.map((a) => this.evalExpr(a, scope)), scope, obj);
      return v(obj);
    }
    // Unknown class (e.g. SparkMax, PIDController) → mock that records calls.
    const mock: JObject = { __object: true, className: e.className, fields: new Map(), calls: [], mock: true };
    // evaluate args for side effects
    e.args.forEach((a) => this.evalExpr(a, scope));
    return v(mock);
  }

  private coerce(val: Val, type: string): unknown {
    return this.coerceVal(val, type).value;
  }
  private coerceVal(val: Val, type: string): Val {
    if (typeof val.value === "number") {
      if (isIntType(type)) return v(Math.trunc(val.value), true);
      if (type === "double" || type === "float") return v(val.value, false);
    }
    return val;
  }
}

// ---- helpers ----

/** Convert a raw JS test-case argument into a runtime Val (arrays → JArray). */
function marshal(a: unknown): Val {
  if (Array.isArray(a)) {
    const elemInt = a.every((x) => typeof x === "number" && Number.isInteger(x));
    return v({ __array: true, elems: a.map((x) => (Array.isArray(x) ? marshal(x).value : x)), elemInt } as JArray);
  }
  return v(a, typeof a === "number" && Number.isInteger(a));
}

function literal(val: Val): Expr {
  if (typeof val.value === "number") return { kind: "num", value: val.value, isInt: val.int };
  if (typeof val.value === "string") return { kind: "str", value: val.value };
  if (typeof val.value === "boolean") return { kind: "bool", value: val.value };
  return { kind: "null" };
}

function isIntType(t: string): boolean {
  return t === "int" || t === "long" || t === "short" || t === "byte" || t === "char";
}

function defaultValue(type: string): unknown {
  if (type.endsWith("[]")) return null;
  if (isIntType(type)) return 0;
  if (type === "double" || type === "float") return 0;
  if (type === "boolean") return false;
  return null;
}

function truthy(val: Val): boolean {
  return val.value === true;
}

function looseEquals(a: unknown, b: unknown): boolean {
  return a === b;
}

function isArray(x: unknown): x is JArray {
  return !!x && typeof x === "object" && (x as JArray).__array === true;
}
function isObject(x: unknown): x is JObject {
  return !!x && typeof x === "object" && (x as JObject).__object === true;
}
function asArray(x: unknown): JArray {
  if (isArray(x)) return x;
  if (x === null) throw new JavaRuntimeError("NullPointerException");
  throw new JavaRuntimeError("Value is not an array.");
}

function builtinClassName(x: unknown): string | null {
  if (x && typeof x === "object" && "__builtinClass" in (x as object)) {
    return (x as { __builtinClass: string }).__builtinClass;
  }
  return null;
}

export function javaStr(x: unknown): string {
  if (x === null || x === undefined) return "null";
  if (typeof x === "boolean") return x ? "true" : "false";
  if (typeof x === "number") {
    if (Number.isInteger(x)) return String(x);
    return String(x);
  }
  if (isArray(x)) return "[" + x.elems.map(javaStr).join(", ") + "]";
  return String(x);
}

// Minimal printf: handles %d %f %.Nf %s %b %% (enough for lesson output).
function formatf(fmt: string, args: Val[]): string {
  let i = 0;
  return fmt.replace(/%(-?\d+)?(\.\d+)?([dfsbn%])/g, (_m, _w, prec, conv) => {
    if (conv === "%") return "%";
    if (conv === "n") return "\n";
    const a = args[i++];
    const val = a?.value;
    if (conv === "d") return String(Math.trunc(Number(val)));
    if (conv === "f") {
      const digits = prec ? parseInt(prec.slice(1), 10) : 6;
      return Number(val).toFixed(digits);
    }
    if (conv === "b") return val ? "true" : "false";
    return javaStr(val);
  });
}
