// Progress persistence is abstracted behind a small async interface so the
// storage layer can evolve (localStorage today → real cloud backend later)
// without touching the React state logic in ProgressProvider.

export interface ProgressSnapshot {
  completed: string[];
  activity: Record<string, number>;
}

export interface ProgressBackend {
  /** A stable label for diagnostics / UI ("Local", "Cloud"). */
  readonly kind: "local" | "remote";
  load(): Promise<ProgressSnapshot>;
  save(snapshot: ProgressSnapshot): Promise<void>;
  /** Wipe all stored progress (used by "reset progress"). */
  clear(): Promise<void>;
}

export const EMPTY_SNAPSHOT: ProgressSnapshot = { completed: [], activity: {} };

const COMPLETED_KEY = "frc-learn:completed-lessons";
const ACTIVITY_KEY = "frc-learn:activity-progress";

/** Default backend: browser localStorage. Behaviour-identical to the original
 *  inline persistence, just behind the interface. Safe in SSR (no-ops). */
export class LocalBackend implements ProgressBackend {
  readonly kind = "local" as const;

  async load(): Promise<ProgressSnapshot> {
    if (typeof window === "undefined") return { ...EMPTY_SNAPSHOT };
    let completed: string[] = [];
    let activity: Record<string, number> = {};
    try {
      const raw = localStorage.getItem(COMPLETED_KEY);
      if (raw) completed = JSON.parse(raw);
    } catch { /* ignore corrupt storage */ }
    try {
      const raw = localStorage.getItem(ACTIVITY_KEY);
      if (raw) activity = JSON.parse(raw);
    } catch { /* ignore corrupt storage */ }
    return { completed, activity };
  }

  async save(snapshot: ProgressSnapshot): Promise<void> {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(COMPLETED_KEY, JSON.stringify(snapshot.completed));
      localStorage.setItem(ACTIVITY_KEY, JSON.stringify(snapshot.activity));
    } catch { /* storage unavailable (private mode); stays in memory */ }
  }

  async clear(): Promise<void> {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(COMPLETED_KEY);
      localStorage.removeItem(ACTIVITY_KEY);
    } catch { /* ignore */ }
  }
}

/** Cloud backend: syncs a signed-in user's progress through the API route.
 *  Keeps a localStorage mirror so the app works offline and loads instantly,
 *  then reconciles with the server (server wins on conflicts, union of
 *  completed lessons so progress is never lost). */
export class RemoteBackend implements ProgressBackend {
  readonly kind = "remote" as const;
  private mirror = new LocalBackend();

  constructor(private userId: string) {}

  private get url() {
    return `/api/progress/${encodeURIComponent(this.userId)}`;
  }

  async load(): Promise<ProgressSnapshot> {
    const local = await this.mirror.load();
    if (typeof window === "undefined") return local;
    try {
      const res = await fetch(this.url, { cache: "no-store" });
      if (!res.ok) return local;
      const remote = (await res.json()) as ProgressSnapshot;
      const merged = mergeSnapshots(local, remote);
      // Push the merged view back so server + mirror agree.
      await this.mirror.save(merged);
      void this.save(merged);
      return merged;
    } catch {
      return local; // offline → fall back to mirror
    }
  }

  async save(snapshot: ProgressSnapshot): Promise<void> {
    await this.mirror.save(snapshot);
    if (typeof window === "undefined") return;
    try {
      await fetch(this.url, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(snapshot),
      });
    } catch { /* offline → mirror already saved; will resync on next load */ }
  }

  async clear(): Promise<void> {
    await this.mirror.clear();
    if (typeof window === "undefined") return;
    try {
      await fetch(this.url, { method: "DELETE" });
    } catch { /* offline → mirror cleared; server reconciles later */ }
  }
}

/** Union completed lessons; take the max activity count per lesson so progress
 *  only ever moves forward. */
export function mergeSnapshots(a: ProgressSnapshot, b: ProgressSnapshot): ProgressSnapshot {
  const completed = Array.from(new Set([...a.completed, ...b.completed]));
  const activity: Record<string, number> = { ...a.activity };
  for (const [k, val] of Object.entries(b.activity)) {
    activity[k] = Math.max(activity[k] ?? 0, val);
  }
  return { completed, activity };
}
