"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAccount } from "@/components/AccountProvider";
import { findLesson } from "@/lib/curriculum";
import type { Submission, SubmissionState } from "@/lib/submissions/types";

// Learner-facing history of graded coding attempts. Reads the submissions API
// (GET /api/submissions?userId=) the CodingExercise writes to, so practice
// attempts are now reviewable after the fact — the last in-app piece of the
// submissions thread (a real DB + the Tier-2 certification worker are infra
// steps tracked separately).

const STATE_BADGE: Record<SubmissionState, { label: string; cls: string }> = {
  DRAFT: { label: "Draft", cls: "border-edge text-muted" },
  SUBMITTED: { label: "Submitted", cls: "border-brand/40 text-brand2" },
  QUEUED: { label: "Queued", cls: "border-brand/40 text-brand2" },
  RUNNING: { label: "Running", cls: "border-brand/40 text-brand2" },
  PASSED: { label: "Passed", cls: "border-good/40 text-good" },
  FAILED: { label: "Failed", cls: "border-accent/50 text-accent" },
  ERROR: { label: "Error", cls: "border-accent/50 text-accent" },
  CANCELLED: { label: "Cancelled", cls: "border-edge text-muted" },
};

function lessonTitle(lessonId: string): string {
  return findLesson(lessonId)?.lesson.title ?? lessonId;
}

function timeAgo(ts: number): string {
  const s = Math.max(1, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export default function SubmissionsPage() {
  const { account, ready } = useAccount();
  const [subs, setSubs] = useState<Submission[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!account) return;
    setError(false);
    try {
      const res = await fetch(
        `/api/submissions?userId=${encodeURIComponent(account.userId)}`,
        { cache: "no-store" },
      );
      if (!res.ok) throw new Error();
      setSubs((await res.json()) as Submission[]);
    } catch {
      setError(true);
    }
  }, [account]);

  useEffect(() => {
    if (ready && account) void load();
  }, [ready, account, load]);

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <Link href="/" className="text-sm text-brand2 hover:underline">
        ← Back home
      </Link>

      <header className="mb-8 mt-3 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Your submissions</h1>
          <p className="mt-2 text-muted">Every coding attempt you&apos;ve graded, newest first.</p>
        </div>
        {account && (
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-full border border-edge px-4 py-2 text-sm text-muted transition hover:text-white active:scale-95"
          >
            Refresh
          </button>
        )}
      </header>

      {!ready ? null : !account ? (
        <div className="rounded-2xl border border-edge bg-panel p-8 text-center text-muted">
          Sign in (top-right) to see your graded attempts.
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-accent/40 bg-accent/5 p-6 text-center text-accent">
          Couldn&apos;t load submissions. <button onClick={() => void load()} className="underline">Try again</button>.
        </div>
      ) : subs === null ? (
        <div className="rounded-2xl border border-edge bg-panel p-8 text-center text-muted">Loading…</div>
      ) : subs.length === 0 ? (
        <div className="rounded-2xl border border-edge bg-panel p-8 text-center text-muted">
          No submissions yet. Grade a coding exercise and it&apos;ll show up here.
        </div>
      ) : (
        <ul className="space-y-3">
          {subs.map((s) => {
            const badge = STATE_BADGE[s.state];
            const latest = s.runs[s.runs.length - 1];
            const passedCount = latest ? latest.results.filter((r) => r.passed).length : 0;
            const totalCount = latest ? latest.results.length : 0;
            return (
              <li key={s.id} className="rounded-2xl border border-edge bg-panel p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/lessons/${s.lessonId}`}
                      className="font-semibold text-white hover:text-brand2 hover:underline"
                    >
                      {lessonTitle(s.lessonId)}
                    </Link>
                    <div className="mt-0.5 text-xs text-muted">
                      {timeAgo(s.createdAt)}
                      {totalCount > 0 && ` · ${passedCount}/${totalCount} checks passed`}
                      {s.tier === "certification" && " · certification"}
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${badge.cls}`}>
                    {badge.label}
                  </span>
                </div>

                {latest && totalCount > 0 && (
                  <ul className="mt-3 space-y-1 border-t border-edge pt-3">
                    {latest.results.map((r) => (
                      <li
                        key={r.id}
                        className={`flex items-start gap-2 text-sm ${r.passed ? "text-good" : "text-muted"}`}
                      >
                        <span className="mt-0.5">{r.passed ? "✓" : "✗"}</span>
                        <span>
                          {r.label}
                          {!r.passed && r.message && <span className="ml-2 text-accent">— {r.message}</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
