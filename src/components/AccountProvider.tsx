"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

// Lightweight identity layer. Today an account is created locally (no password)
// and its `userId` keys cloud-synced progress through /api/progress. The shape
// is intentionally compatible with a real auth provider: swap `signIn` to call
// an OAuth / email flow and populate `userId` from the verified session — the
// rest of the app (ProgressProvider keys off `account.userId`) is unchanged.

export interface Account {
  userId: string;
  displayName: string;
  teamNumber?: number;
}

interface AccountContextValue {
  account: Account | null;
  ready: boolean;
  signIn: (displayName: string, teamNumber?: number) => void;
  signOut: () => void;
}

const STORAGE_KEY = "frc-learn:account";

const AccountContext = createContext<AccountContextValue | null>(null);

function newUserId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "u_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setAccount(JSON.parse(raw));
    } catch { /* ignore corrupt storage */ }
    setReady(true);
  }, []);

  const signIn = useCallback((displayName: string, teamNumber?: number) => {
    setAccount((prev) => {
      // Keep the same userId across re-sign-ins so progress stays attached.
      const next: Account = {
        userId: prev?.userId ?? newUserId(),
        displayName: displayName.trim() || "Anonymous",
        teamNumber,
      };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const signOut = useCallback(() => {
    setAccount(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }, []);

  return (
    <AccountContext.Provider value={{ account, ready, signIn, signOut }}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount(): AccountContextValue {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccount must be used within AccountProvider");
  return ctx;
}
