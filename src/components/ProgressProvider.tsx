"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { LocalBackend, RemoteBackend, type ProgressBackend } from "@/lib/progress/backend";
import { useAccount } from "./AccountProvider";

interface ProgressContextValue {
  completed: Set<string>;
  isComplete: (lessonId: string) => boolean;
  markComplete: (lessonId: string) => void;
  /** Mark several lessons complete at once (used by the diagnostic test). */
  markManyComplete: (lessonIds: string[]) => void;
  /** How many activities within a lesson the learner has passed so far. */
  activitiesDone: (lessonId: string) => number;
  /** Record the count of passed activities for a lesson (drives map segments). */
  setActivitiesDone: (lessonId: string, count: number) => void;
  reset: () => void;
  /** True once we've loaded persisted progress, so the UI can avoid flicker. */
  ready: boolean;
  /** Where progress is being stored right now ("local" or "remote"/cloud). */
  syncKind: "local" | "remote";
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const { account, ready: accountReady } = useAccount();
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [activity, setActivity] = useState<Record<string, number>>({});
  const [ready, setReady] = useState(false);

  // The active storage backend follows the signed-in user; signed-out → local.
  const backend = useMemo<ProgressBackend>(
    () => (account ? new RemoteBackend(account.userId) : new LocalBackend()),
    [account?.userId], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const backendRef = useRef(backend);
  backendRef.current = backend;

  // Load whenever the backend changes (initial mount, sign-in, sign-out).
  useEffect(() => {
    if (!accountReady) return;
    let cancelled = false;
    setReady(false);
    backend
      .load()
      .then((snap) => {
        if (cancelled) return;
        setCompleted(new Set(snap.completed));
        setActivity(snap.activity);
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [backend, accountReady]);

  // Persist (debounced) whenever progress changes after load.
  useEffect(() => {
    if (!ready) return;
    const snapshot = { completed: [...completed], activity };
    const t = setTimeout(() => {
      void backendRef.current.save(snapshot);
    }, 250);
    return () => clearTimeout(t);
  }, [completed, activity, ready]);

  const markComplete = useCallback((lessonId: string) => {
    setCompleted((prev) => (prev.has(lessonId) ? prev : new Set(prev).add(lessonId)));
  }, []);

  const markManyComplete = useCallback((lessonIds: string[]) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      let changed = false;
      for (const id of lessonIds) {
        if (!next.has(id)) {
          next.add(id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, []);

  const setActivitiesDone = useCallback((lessonId: string, count: number) => {
    setActivity((prev) => {
      if ((prev[lessonId] ?? 0) >= count) return prev; // never regress
      return { ...prev, [lessonId]: count };
    });
  }, []);

  const activitiesDone = useCallback(
    (lessonId: string) => activity[lessonId] ?? 0,
    [activity],
  );

  const reset = useCallback(() => {
    setCompleted(new Set());
    setActivity({});
    void backendRef.current.clear();
  }, []);

  const isComplete = useCallback(
    (lessonId: string) => completed.has(lessonId),
    [completed],
  );

  return (
    <ProgressContext.Provider
      value={{
        completed,
        isComplete,
        markComplete,
        markManyComplete,
        activitiesDone,
        setActivitiesDone,
        reset,
        ready,
        syncKind: backend.kind,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used within ProgressProvider");
  return ctx;
}
