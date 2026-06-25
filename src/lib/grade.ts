import type { CodeCheck } from "./types";

/** Collapse all whitespace so checks are forgiving about formatting. */
export function normalize(code: string): string {
  return code.replace(/\s+/g, " ").trim();
}

export interface CheckResult {
  label: string;
  passed: boolean;
}

/** Run every check against the (normalized) submission.
 *  Matching is case-SENSITIVE because Java identifiers are case-sensitive —
 *  `motor.Set(...)` or `math.abs(...)` are wrong and must not pass. */
export function gradeCode(code: string, checks: CodeCheck[]): CheckResult[] {
  const haystack = normalize(code);
  return checks.map((c) => {
    let found = false;
    try {
      found = new RegExp(c.pattern).test(haystack);
    } catch {
      found = false;
    }
    return { label: c.label, passed: c.negate ? !found : found };
  });
}

export function allPassed(code: string, checks: CodeCheck[]): boolean {
  return gradeCode(code, checks).every((r) => r.passed);
}
