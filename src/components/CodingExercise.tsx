"use client";

import { useMemo, useState } from "react";
import type { CodeCheck, RuntimeTest, RuntimeStateTest } from "@/lib/types";
import { gradeCode, normalize, type CheckResult } from "@/lib/grade";
import { runJava, runTests, runSequences, type TestOutcome } from "@/lib/java";
import { persistGradedSubmission, toTestResults } from "@/lib/submissions/client";
import { useAccount } from "./AccountProvider";
import { InlineMd } from "./InlineMd";

interface CodingExerciseProps {
  /** Identifies which exercise this attempt belongs to, for persisted submissions. */
  lessonId: string;
  blockIndex: number;
  /** Assessment tier, drives the header label. Defaults to a plain exercise. */
  variant?: "exercise" | "debug" | "lab";
  /** Optional heading shown above the exercise (e.g. a lab name). */
  title?: string;
  prompt: string;
  starter: string;
  solution: string;
  checks: CodeCheck[];
  hint?: string;
  tests?: RuntimeTest[];
  stateTests?: RuntimeStateTest[];
  onSolved?: (solved: boolean) => void;
}

// Strip comments + whitespace so "unchanged starter" detection isn't fooled by
// the learner just leaving the prompt comment in place.
function meaningful(code: string): string {
  return normalize(code.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, ""));
}

const variantLabel: Record<NonNullable<CodingExerciseProps["variant"]>, string> = {
  exercise: "Coding exercise",
  debug: "Debugging challenge",
  lab: "Implementation lab",
};

export function CodingExercise({
  lessonId,
  blockIndex,
  variant = "exercise",
  title,
  prompt,
  starter,
  solution,
  checks,
  hint,
  tests,
  stateTests,
  onSolved,
}: CodingExerciseProps) {
  const { account } = useAccount();
  const [code, setCode] = useState(starter);
  const [results, setResults] = useState<CheckResult[] | null>(null);
  const [testResults, setTestResults] = useState<TestOutcome[] | null>(null);
  const [output, setOutput] = useState<{ text: string; error?: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  const hasTests = (!!tests && tests.length > 0) || (!!stateTests && stateTests.length > 0);

  const solved = useMemo(() => {
    const checksOk = results !== null && results.length > 0 && results.every((r) => r.passed);
    const testsOk = !hasTests || (testResults !== null && testResults.length > 0 && testResults.every((t) => t.passed));
    return checksOk && testsOk;
  }, [results, testResults, hasTests]);

  function unchanged(): boolean {
    const written = meaningful(code);
    return written.length === 0 || written === meaningful(starter);
  }

  // "Run" actually executes the code in the in-browser Java interpreter and
  // shows real console output — separate from grading.
  function run() {
    setNotice(null);
    const res = runJava(code);
    setOutput({ text: res.output, error: res.ok ? undefined : res.error });
  }

  function check() {
    // Guard: empty, or nothing beyond the starter's scaffolding/comments.
    if (unchanged()) {
      setResults(null);
      setTestResults(null);
      setNotice("Write some code in the editor before running the checks.");
      onSolved?.(false);
      return;
    }
    setNotice(null);
    const r = gradeCode(code, checks);
    setResults(r);

    let testsOk = true;
    let finalTests: TestOutcome[] | null = null;
    if (hasTests) {
      const outcomes: TestOutcome[] = [];
      let compileErr: string | undefined;
      if (tests && tests.length > 0) {
        const t = runTests(code, tests);
        if (!t.compiled) compileErr = t.error;
        else outcomes.push(...t.outcomes);
      }
      if (!compileErr && stateTests && stateTests.length > 0) {
        const s = runSequences(code, stateTests);
        if (!s.compiled) compileErr = s.error;
        else outcomes.push(...s.outcomes);
      }
      if (compileErr) {
        finalTests = [{ label: "Code compiles and runs", passed: false, detail: compileErr }];
        setTestResults(finalTests);
        testsOk = false;
      } else {
        finalTests = outcomes;
        setTestResults(outcomes);
        testsOk = outcomes.length > 0 && outcomes.every((o) => o.passed);
      }
    } else {
      setTestResults(null);
    }

    const checksOk = r.length > 0 && r.every((x) => x.passed);
    onSolved?.(checksOk && testsOk);

    // Persist this graded attempt as a submission (Tier-1 practice). Fire-and-
    // forget: signed-out learners or an unreachable server never block grading.
    if (account) {
      void persistGradedSubmission({
        userId: account.userId,
        lessonId,
        blockIndex,
        code,
        results: toTestResults(r, finalTests),
      });
    }
  }

  return (
    <div className="my-6 rounded-xl border border-edge bg-panel p-5">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-brand2">
        {variantLabel[variant]}
      </div>
      {title && <div className="mb-1 text-base font-semibold text-white">{title}</div>}
      <div className="mb-3">
        <InlineMd md={prompt} />
      </div>

      <div className="overflow-hidden rounded-lg border border-edge bg-[#0d1320]">
        <div className="flex items-center justify-between border-b border-edge bg-panel2 px-3 py-1.5">
          <span className="text-xs uppercase tracking-wider text-muted">java</span>
          <button
            type="button"
            onClick={() => {
              setCode(starter);
              setResults(null);
              setTestResults(null);
              setOutput(null);
              setNotice(null);
            }}
            className="rounded text-xs text-muted transition hover:text-white active:scale-95"
          >
            Reset
          </button>
        </div>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          aria-label="Code editor — write your Java solution here"
          rows={Math.max(5, code.split("\n").length + 1)}
          className="w-full resize-y bg-transparent p-4 font-mono text-sm leading-relaxed text-[#d6deef] outline-none"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={run}
          className="rounded-full border border-brand/50 bg-brand/10 px-4 py-2 text-sm font-semibold text-brand2 transition hover:bg-brand/20 active:scale-95"
        >
          ▶ Run
        </button>
        <button
          type="button"
          onClick={check}
          className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white shadow-[0_3px_0_#1d4ed8] transition active:translate-y-[2px] active:shadow-none hover:bg-brand2"
        >
          {hasTests ? "Run tests & checks" : "Run checks"}
        </button>
        {hint && (
          <button
            type="button"
            onClick={() => setShowHint((s) => !s)}
            className="rounded-full border border-edge px-4 py-2 text-sm text-muted transition hover:text-white active:scale-95"
          >
            {showHint ? "Hide hint" : "Hint"}
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowSolution((s) => !s)}
          className="rounded-full border border-edge px-4 py-2 text-sm text-muted transition hover:text-white active:scale-95"
        >
          {showSolution ? "Hide solution" : "Show solution"}
        </button>
      </div>

      {notice && (
        <div className="mt-3 rounded-lg border border-accent/40 bg-accent/5 p-3 text-sm text-accent">
          {notice}
        </div>
      )}

      {output && (
        <div className="mt-3 overflow-hidden rounded-lg border border-edge bg-[#0d1320]">
          <div className="border-b border-edge bg-panel2 px-3 py-1.5 text-xs uppercase tracking-wider text-muted">
            Console
          </div>
          <pre className="max-h-60 overflow-auto p-4 font-mono text-sm leading-relaxed text-[#d6deef]">
            {output.text || (output.error ? "" : "(no output)")}
            {output.error && (
              <span className="text-accent">{output.text ? "\n" : ""}{output.error}</span>
            )}
          </pre>
        </div>
      )}

      {showHint && hint && (
        <div className="mt-3 rounded-lg border border-accent/40 bg-accent/5 p-3 text-sm">
          <InlineMd md={hint} />
        </div>
      )}

      {results && (
        <ul className="mt-4 space-y-1.5">
          {results.map((r, i) => (
            <li
              key={i}
              className={`flex items-center gap-2 text-sm ${
                r.passed ? "text-good" : "text-muted"
              }`}
            >
              <span>{r.passed ? "✓" : "○"}</span>
              {r.label}
            </li>
          ))}
        </ul>
      )}

      {testResults && (
        <div className="mt-3">
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
            Test cases
          </div>
          <ul className="space-y-1.5">
            {testResults.map((t, i) => (
              <li
                key={i}
                className={`flex items-start gap-2 text-sm ${t.passed ? "text-good" : "text-muted"}`}
              >
                <span className="mt-0.5">{t.passed ? "✓" : "✗"}</span>
                <span>
                  <code className="font-mono text-[0.8rem]">{t.label}</code>
                  {!t.passed && t.detail && (
                    <span className="ml-2 text-accent">— {t.detail}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {solved && (
        <div className="mt-3 rounded-lg border border-good/40 bg-good/5 p-3 text-sm text-good">
          All checks passed — nicely done.
        </div>
      )}

      {showSolution && (
        <div className="mt-3 overflow-hidden rounded-lg border border-edge bg-[#0d1320]">
          <div className="border-b border-edge bg-panel2 px-3 py-1.5 text-xs uppercase tracking-wider text-muted">
            Reference solution
          </div>
          <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
            <code className="font-mono text-[#d6deef]">{solution}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
