// Browser-side bridge between the Tier-1 in-browser grader (regex checks +
// interpreter test cases) and the submissions API. Fire-and-forget and
// offline-tolerant, exactly like the progress RemoteBackend: a failed POST
// never blocks or breaks the learner's grading experience.

import type { CheckResult } from "../grade";
import type { TestOutcome } from "../java";
import type { GradingTier, SubmissionRun, TestResult } from "./types";

/** Map the local grader's check + test outputs into the stored TestResult[]. */
export function toTestResults(
  checks: CheckResult[],
  tests: TestOutcome[] | null,
): TestResult[] {
  const out: TestResult[] = checks.map((c, i) => ({
    id: `check:${i}`,
    label: c.label,
    passed: c.passed,
    kind: "check",
  }));
  if (tests) {
    for (const [i, t] of tests.entries()) {
      out.push({
        id: `test:${i}`,
        label: t.label,
        passed: t.passed,
        kind: "test",
        message: t.passed ? undefined : t.detail,
      });
    }
  }
  return out;
}

/** Build the verdict run for a synchronously-graded practice attempt. */
function buildRun(submissionId: string, results: TestResult[], tier: GradingTier): SubmissionRun {
  const now = Date.now();
  const passed = results.length > 0 && results.every((r) => r.passed);
  return {
    id: `run_${now.toString(36)}`,
    submissionId,
    tier,
    state: passed ? "PASSED" : "FAILED",
    results,
    startedAt: now,
    finishedAt: now,
  };
}

export interface PersistArgs {
  userId: string;
  lessonId: string;
  blockIndex: number;
  code: string;
  results: TestResult[];
  tier?: GradingTier;
}

/**
 * Persist a graded practice attempt: create the submission (already SUBMITTED)
 * then PATCH the verdict run, which drives it to PASSED/FAILED through the
 * server-enforced state machine. Resolves to the submission id, or null if the
 * network call failed (caller ignores — local grading already succeeded).
 */
export async function persistGradedSubmission(args: PersistArgs): Promise<string | null> {
  const tier = args.tier ?? "practice";
  try {
    const createRes = await fetch("/api/submissions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        userId: args.userId,
        lessonId: args.lessonId,
        blockIndex: args.blockIndex,
        code: args.code,
        tier,
        submit: true,
      }),
    });
    if (!createRes.ok) return null;
    const { id } = (await createRes.json()) as { id: string };

    await fetch(`/api/submissions/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ run: buildRun(id, args.results, tier) }),
    });
    return id;
  } catch {
    return null; // offline / server down → local grading stands
  }
}
