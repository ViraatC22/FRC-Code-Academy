"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAccount } from "./AccountProvider";
import { useProgress } from "./ProgressProvider";

export function AccountMenu() {
  const { account, ready, signIn, signOut } = useAccount();
  const { syncKind } = useProgress();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [team, setTeam] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!ready) {
    return <span className="h-7 w-7 rounded-full bg-panel2" aria-hidden />;
  }

  const initials = account
    ? account.displayName.slice(0, 2).toUpperCase()
    : null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = team.trim() ? parseInt(team.trim(), 10) : undefined;
    signIn(name, Number.isFinite(t) ? t : undefined);
    setName("");
    setTeam("");
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-edge px-1 py-1 pr-3 text-sm text-muted transition hover:border-brand hover:text-white active:scale-95"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-[0.7rem] font-bold text-white">
          {initials ?? "+"}
        </span>
        <span className="hidden sm:inline">
          {account ? account.displayName : "Sign in"}
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Account"
          className="absolute right-0 top-full z-20 mt-2 w-64 rounded-2xl border border-edge bg-panel p-4 shadow-xl"
        >
          {account ? (
            <div className="space-y-3">
              <div>
                <div className="font-semibold text-white">{account.displayName}</div>
                {account.teamNumber != null && (
                  <div className="text-xs text-muted">Team {account.teamNumber}</div>
                )}
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-good/30 bg-good/5 px-3 py-2 text-xs text-good">
                <span className="h-1.5 w-1.5 rounded-full bg-good" />
                Progress syncing to the cloud
              </div>
              <Link
                href="/submissions"
                onClick={() => setOpen(false)}
                className="block w-full rounded-full border border-edge px-4 py-2 text-center text-sm text-muted transition hover:text-white active:scale-95"
              >
                My submissions
              </Link>
              <button
                type="button"
                onClick={() => { signOut(); setOpen(false); }}
                className="w-full rounded-full border border-edge px-4 py-2 text-sm text-muted transition hover:text-white active:scale-95"
              >
                Sign out
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <div>
                <div className="mb-1 font-semibold text-white">Create your profile</div>
                <p className="text-xs text-muted">
                  Sign in to sync your progress across devices. ({syncKind === "remote" ? "cloud" : "local"})
                </p>
              </div>
              <label className="block">
                <span className="mb-1 block text-xs text-muted">Display name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Alex"
                  className="w-full rounded-lg border border-edge bg-panel2 px-3 py-2 text-sm text-white outline-none focus:border-brand"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-muted">Team number (optional)</span>
                <input
                  value={team}
                  onChange={(e) => setTeam(e.target.value.replace(/[^0-9]/g, ""))}
                  inputMode="numeric"
                  placeholder="e.g. 254"
                  className="w-full rounded-lg border border-edge bg-panel2 px-3 py-2 text-sm text-white outline-none focus:border-brand"
                />
              </label>
              <button
                type="submit"
                className="w-full rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-[0_3px_0_#1d4ed8] transition active:translate-y-[2px] active:shadow-none hover:bg-brand2"
              >
                Sign in
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
