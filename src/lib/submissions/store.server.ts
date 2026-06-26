// Server-side submissions store. Route handlers talk to this interface only,
// so swapping the in-memory default for Postgres/Prisma/JPA is a one-file
// change — the HTTP contract and client stay identical. This is the same
// pluggable pattern used by the progress store (src/lib/progress/store.server).
//
// To go to production, implement `SubmissionDB` against your database (tables:
// submissions, submission_runs, test_results) and export it as `submissionDb`.

import { transition } from "./lifecycle";
import type {
  Submission,
  SubmissionInput,
  SubmissionRun,
  SubmissionState,
} from "./types";

export interface SubmissionDB {
  create(input: SubmissionInput): Promise<Submission>;
  get(id: string): Promise<Submission | null>;
  /** All submissions for a user, newest first; optionally scoped to a lesson. */
  list(userId: string, lessonId?: string): Promise<Submission[]>;
  /** Move a submission to `to`, enforcing the state machine. Throws on an
   *  illegal transition or unknown id. */
  setState(id: string, to: SubmissionState): Promise<Submission>;
  /** Append a finished grader run and advance the submission to its verdict. */
  recordRun(id: string, run: SubmissionRun): Promise<Submission>;
}

let counter = 0;
function genId(prefix: string): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter.toString(36)}`;
}

/** Default: in-process Map. Survives across requests within one running server
 *  process, resets on restart. Fine for local dev / demos; replace for prod. */
class InMemorySubmissionDB implements SubmissionDB {
  private rows = new Map<string, Submission>();

  async create(input: SubmissionInput): Promise<Submission> {
    const now = Date.now();
    const sub: Submission = {
      id: genId("sub"),
      userId: input.userId,
      lessonId: input.lessonId,
      blockIndex: input.blockIndex,
      code: input.code,
      tier: input.tier ?? "practice",
      state: input.submit ? "SUBMITTED" : "DRAFT",
      runs: [],
      createdAt: now,
      updatedAt: now,
    };
    this.rows.set(sub.id, sub);
    return sub;
  }

  async get(id: string): Promise<Submission | null> {
    return this.rows.get(id) ?? null;
  }

  async list(userId: string, lessonId?: string): Promise<Submission[]> {
    return [...this.rows.values()]
      .filter((s) => s.userId === userId && (!lessonId || s.lessonId === lessonId))
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  async setState(id: string, to: SubmissionState): Promise<Submission> {
    const sub = this.requireRow(id);
    const next: Submission = {
      ...sub,
      state: transition(sub.state, to), // throws on illegal edge
      updatedAt: Date.now(),
    };
    this.rows.set(id, next);
    return next;
  }

  async recordRun(id: string, run: SubmissionRun): Promise<Submission> {
    const sub = this.requireRow(id);
    // A run only lands from RUNNING; nudge through SUBMITTED/QUEUED if the
    // browser tier graded synchronously without an explicit queue hop.
    let state = sub.state;
    if (state === "SUBMITTED") state = transition(state, "RUNNING");
    if (state === "QUEUED") state = transition(state, "RUNNING");
    const next: Submission = {
      ...sub,
      state: transition(state, run.state),
      runs: [...sub.runs, run],
      updatedAt: Date.now(),
    };
    this.rows.set(id, next);
    return next;
  }

  private requireRow(id: string): Submission {
    const sub = this.rows.get(id);
    if (!sub) throw new Error(`submission not found: ${id}`);
    return sub;
  }
}

// Reuse across hot-reloads in dev (Next clears module state on edit otherwise).
const globalForDb = globalThis as unknown as { __frcSubmissionDb?: SubmissionDB };
export const submissionDb: SubmissionDB =
  globalForDb.__frcSubmissionDb ?? new InMemorySubmissionDB();
if (process.env.NODE_ENV !== "production") globalForDb.__frcSubmissionDb = submissionDb;

export { genId };
