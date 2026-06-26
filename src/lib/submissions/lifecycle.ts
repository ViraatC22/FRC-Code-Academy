// The submission state machine, kept separate from storage and transport so
// every tier (browser interpreter today, server worker later) enforces the
// same legal transitions. Pure functions — easy to unit-test, no I/O.

import { isTerminal, type SubmissionState, type SubmissionRun } from "./types";

/** Legal next-states for each state. A grader drives a submission down one of
 *  these edges; anything else is a programming error and is rejected. */
const TRANSITIONS: Record<SubmissionState, readonly SubmissionState[]> = {
  DRAFT: ["SUBMITTED", "CANCELLED"],
  SUBMITTED: ["QUEUED", "RUNNING", "CANCELLED"],
  QUEUED: ["RUNNING", "CANCELLED"],
  RUNNING: ["PASSED", "FAILED", "ERROR", "CANCELLED"],
  PASSED: [],
  FAILED: [],
  ERROR: [],
  CANCELLED: [],
};

export function canTransition(from: SubmissionState, to: SubmissionState): boolean {
  return TRANSITIONS[from].includes(to);
}

export class IllegalTransitionError extends Error {
  constructor(
    public readonly from: SubmissionState,
    public readonly to: SubmissionState,
  ) {
    super(`illegal submission transition: ${from} → ${to}`);
    this.name = "IllegalTransitionError";
  }
}

/** Robust check for an illegal-transition error. Uses `name` rather than
 *  `instanceof` so it survives Next.js bundling the route and store into
 *  separate server bundles (where class identity wouldn't match). */
export function isIllegalTransition(err: unknown): err is IllegalTransitionError {
  return err instanceof Error && err.name === "IllegalTransitionError";
}

/** Assert + return the target state, throwing on an illegal edge. */
export function transition(from: SubmissionState, to: SubmissionState): SubmissionState {
  if (!canTransition(from, to)) throw new IllegalTransitionError(from, to);
  return to;
}

/** Derive the terminal submission state implied by a finished run's verdict.
 *  Centralises the run-verdict → submission-state mapping so a future
 *  multi-run policy (e.g. "best of N") only changes here. */
export function stateForRun(run: SubmissionRun): SubmissionState {
  return run.state; // PASSED | FAILED | ERROR already align with submission states
}

/**
 * A grader: anything that can execute a submission's code and return a verdict
 * run. The in-browser interpreter wraps its existing check/test logic in this
 * shape; a server worker pulling from a queue implements the same interface.
 * Lifecycle code depends only on this — never on a concrete engine.
 */
export interface Grader {
  readonly tier: "practice" | "certification";
  grade(input: { submissionId: string; code: string }): Promise<SubmissionRun>;
}

/** True once the submission has reached a state that accepts no more work. */
export const isDone = isTerminal;
