// Submissions domain model. This is the "safest architectural investment":
// it describes WHAT a graded attempt is and the lifecycle it moves through,
// while staying agnostic about WHERE grading runs. Today the in-browser
// Java-subset interpreter (src/lib/java) fulfils Tier-1 "practice" grading;
// a future server worker (queue + containers + WPILib runtime) can fulfil
// Tier-2 "certification" grading by implementing the same `Grader` contract
// and driving submissions through the same states — no schema change needed.

/** Lifecycle of a single submission. Mirrors the event flow
 *  Submit → QUEUED → RUNNING → PASSED/FAILED, with terminal error/cancel. */
export type SubmissionState =
  | "DRAFT"      // saved but not yet submitted for grading
  | "SUBMITTED"  // learner asked to grade; about to be enqueued
  | "QUEUED"     // accepted, waiting for a grader (server tier)
  | "RUNNING"    // a grader is actively executing the code
  | "PASSED"     // all required checks/tests passed
  | "FAILED"     // ran cleanly but one or more checks/tests failed
  | "ERROR"      // grader could not produce a verdict (compile/infra error)
  | "CANCELLED"; // superseded or aborted before a verdict

/** States from which no further transition is allowed. */
export const TERMINAL_STATES: readonly SubmissionState[] = [
  "PASSED",
  "FAILED",
  "ERROR",
  "CANCELLED",
];

export function isTerminal(state: SubmissionState): boolean {
  return TERMINAL_STATES.includes(state);
}

/** Which execution tier produced (or will produce) the verdict. Kept on the
 *  submission so the same table serves both the browser interpreter and a
 *  future server grader without a discriminating schema. */
export type GradingTier = "practice" | "certification";

/** Outcome of one assertion within a run — a regex `check` or a runtime
 *  `test`/`state` case. Shape is intentionally engine-neutral. */
export interface TestResult {
  /** Stable identifier within the run (e.g. check index or method name). */
  id: string;
  /** Human-readable label shown to the learner. */
  label: string;
  passed: boolean;
  /** Kind of assertion, so the UI can group/badge results. */
  kind: "check" | "test" | "state";
  /** Optional expected/actual for value assertions (stringified for storage). */
  expected?: string;
  actual?: string;
  /** Optional message (failure reason, runtime error, …). */
  message?: string;
}

/** One execution of a submission's code by a grader. A submission can be
 *  re-run (e.g. flaky infra retry), so runs are a list under the submission. */
export interface SubmissionRun {
  id: string;
  submissionId: string;
  tier: GradingTier;
  /** Terminal verdict of this run. */
  state: Extract<SubmissionState, "PASSED" | "FAILED" | "ERROR">;
  results: TestResult[];
  /** Free-form grader logs (compile output, stack traces, interpreter notes). */
  log?: string;
  /** Wall-clock execution time in ms, when measured. */
  durationMs?: number;
  startedAt: number;
  finishedAt: number;
}

/** A learner's attempt at one coding exercise. The unit both tiers grade. */
export interface Submission {
  id: string;
  userId: string;
  /** The lesson + coding block this attempt belongs to. `blockIndex` lets a
   *  lesson hold several coding blocks without a separate exercise table. */
  lessonId: string;
  blockIndex: number;
  /** The code as submitted, snapshotted at submit time. */
  code: string;
  tier: GradingTier;
  state: SubmissionState;
  /** Verdict runs, newest last. Empty until first grade. */
  runs: SubmissionRun[];
  createdAt: number;
  updatedAt: number;
}

/** Payload the client posts to create/submit an attempt. */
export interface SubmissionInput {
  userId: string;
  lessonId: string;
  blockIndex: number;
  code: string;
  tier?: GradingTier;
  /** When true, the submission is created already SUBMITTED (ready to grade)
   *  rather than left as a DRAFT. */
  submit?: boolean;
}
