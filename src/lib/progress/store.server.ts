// Server-side progress store. The route handlers talk to this interface, so
// swapping the in-memory default for a real database is a one-file change.
//
// To go to production, implement `ProgressDB` against Supabase / Postgres /
// KV (one row per userId holding the JSON snapshot) and export it as `db`
// below. The HTTP contract in src/app/api/progress/[userId]/route.ts stays
// identical, and the client RemoteBackend keeps working unchanged.

import { mergeSnapshots, type ProgressSnapshot } from "./backend";

export interface ProgressDB {
  get(userId: string): Promise<ProgressSnapshot | null>;
  /** Merge the incoming snapshot with what's stored (progress only moves
   *  forward) and return the persisted result. */
  put(userId: string, snapshot: ProgressSnapshot): Promise<ProgressSnapshot>;
  /** Remove all stored progress for a user. */
  del(userId: string): Promise<void>;
}

/** Default: in-process Map. Survives across requests within one running server
 *  process, resets on restart. Fine for local dev / demos; replace for prod. */
class InMemoryProgressDB implements ProgressDB {
  private rows = new Map<string, ProgressSnapshot>();

  async get(userId: string): Promise<ProgressSnapshot | null> {
    return this.rows.get(userId) ?? null;
  }

  async put(userId: string, snapshot: ProgressSnapshot): Promise<ProgressSnapshot> {
    const existing = this.rows.get(userId) ?? { completed: [], activity: {} };
    const merged = mergeSnapshots(existing, snapshot);
    this.rows.set(userId, merged);
    return merged;
  }

  async del(userId: string): Promise<void> {
    this.rows.delete(userId);
  }
}

// Reuse across hot-reloads in dev (Next clears module state on edit otherwise).
const globalForDb = globalThis as unknown as { __frcProgressDb?: ProgressDB };
export const db: ProgressDB = globalForDb.__frcProgressDb ?? new InMemoryProgressDB();
if (process.env.NODE_ENV !== "production") globalForDb.__frcProgressDb = db;
