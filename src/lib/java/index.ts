// Public facade for the Java-subset runtime.
//
// This is intentionally a *bounded* interpreter: it actually executes the
// algorithmic exercises (variables, math, loops, methods, arrays, simple
// classes) so learners see real console output and real pass/fail — a big step
// up from regex-only grading. Constructs it can't handle fail gracefully
// (`ok: false`), and the caller falls back to the existing regex checks, so
// nothing regresses. A full WASM JVM + WPILib shim can replace this module
// later behind the same `runJava` / `RunResult` surface.

import { parse, ParseError } from "./parser";
import { LexError } from "./lexer";
import { Interpreter, JavaRuntimeError, javaStr, type RunResult } from "./interpreter";

export type { RunResult } from "./interpreter";
export { javaStr } from "./interpreter";

/** Parse + run loose statements / main(). Never throws — errors come back in the result. */
export function runJava(source: string): RunResult {
  let interp: Interpreter;
  try {
    interp = new Interpreter(parse(source));
  } catch (e) {
    return { output: "", ok: false, error: describe(e) };
  }
  return interp.run();
}

export interface TestCase {
  /** Method to invoke (must be defined in the source). */
  method: string;
  /** Arguments passed to the method. */
  args: unknown[];
  /** Expected return value (compared with Java-ish equality). */
  expected: unknown;
  /** Optional human label; defaults to `method(args) → expected`. */
  label?: string;
  /** Floating-point tolerance for numeric comparison (default 1e-6). */
  tolerance?: number;
}

export interface TestOutcome {
  label: string;
  passed: boolean;
  detail?: string;
}

/** Run a batch of method-level test cases against the learner's code. */
export function runTests(source: string, cases: TestCase[]): { compiled: boolean; error?: string; outcomes: TestOutcome[] } {
  let interp: Interpreter;
  try {
    interp = new Interpreter(parse(source));
  } catch (e) {
    return { compiled: false, error: describe(e), outcomes: [] };
  }

  const outcomes: TestOutcome[] = [];
  for (const tc of cases) {
    const label = tc.label ?? `${tc.method}(${tc.args.map((a) => javaStr(a)).join(", ")}) → ${javaStr(tc.expected)}`;
    // Fresh interpreter per case so state never leaks between tests.
    let runtime: Interpreter;
    try {
      runtime = new Interpreter(parse(source));
    } catch (e) {
      return { compiled: false, error: describe(e), outcomes: [] };
    }
    const res = runtime.callMethod(tc.method, tc.args);
    if (!res.ok) {
      outcomes.push({ label, passed: false, detail: res.error });
      continue;
    }
    const ok = compare(res.returnValue, tc.expected, tc.tolerance ?? 1e-6);
    outcomes.push({
      label,
      passed: ok,
      detail: ok ? undefined : `got ${javaStr(res.returnValue)}`,
    });
  }
  void interp;
  return { compiled: true, outcomes };
}

// ---- Stateful (sequenced) tests ----
// Construct one instance of a user class, then drive it through a series of
// method calls that share state — needed for controllers with an integral
// term, slew-rate limiters, motion-profile integrators, debouncers, etc.

export interface SequenceStep {
  /** Instance method to call. */
  method: string;
  args: unknown[];
  /** If set, the call's return value is checked against this. */
  expected?: number | string | boolean;
  tolerance?: number;
  /** Optional label override for this step. */
  label?: string;
}

export interface SequenceTest {
  /** User class to instantiate. */
  className: string;
  /** Constructor arguments. */
  ctorArgs?: unknown[];
  steps: SequenceStep[];
  label?: string;
}

export function runSequences(
  source: string,
  tests: SequenceTest[],
): { compiled: boolean; error?: string; outcomes: TestOutcome[] } {
  try {
    new Interpreter(parse(source)); // compile check
  } catch (e) {
    return { compiled: false, error: describe(e), outcomes: [] };
  }

  const outcomes: TestOutcome[] = [];
  for (const test of tests) {
    let runtime: Interpreter;
    let instance;
    try {
      runtime = new Interpreter(parse(source));
      instance = runtime.newInstance(test.className, test.ctorArgs ?? []);
    } catch (e) {
      return { compiled: false, error: describe(e), outcomes: [] };
    }
    test.steps.forEach((step, i) => {
      const res = runtime.invokeInstance(instance, step.method, step.args);
      if (step.expected === undefined) {
        // a "drive" step that only advances state; surface failures only
        if (!res.ok) {
          outcomes.push({ label: step.label ?? `${step.method}(...)`, passed: false, detail: res.error });
        }
        return;
      }
      const label =
        step.label ??
        `${test.label ? test.label + ": " : ""}${step.method}(${step.args.map((a) => javaStr(a)).join(", ")}) → ${javaStr(step.expected)}`;
      if (!res.ok) {
        outcomes.push({ label, passed: false, detail: res.error });
        return;
      }
      const ok = compare(res.returnValue, step.expected, step.tolerance ?? 1e-6);
      outcomes.push({ label, passed: ok, detail: ok ? undefined : `got ${javaStr(res.returnValue)} (step ${i + 1})` });
    });
  }
  return { compiled: true, outcomes };
}

function compare(actual: unknown, expected: unknown, tol: number): boolean {
  if (typeof expected === "number" && typeof actual === "number") {
    return Math.abs(actual - expected) <= tol;
  }
  return actual === expected;
}

function describe(e: unknown): string {
  if (e instanceof ParseError) return `Syntax error: ${e.message}`;
  if (e instanceof LexError) return `Syntax error: ${e.message}`;
  if (e instanceof JavaRuntimeError) return e.message;
  return e instanceof Error ? e.message : String(e);
}
