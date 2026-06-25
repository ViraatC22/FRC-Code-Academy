"use client";

import Link from "next/link";
import { useState } from "react";
import { diagnostic, diagnosticLessonIds, type DiagnosticItem } from "@/lib/diagnostic";
import { allPassed } from "@/lib/grade";
import { useProgress } from "@/components/ProgressProvider";

function itemCorrect(
  item: DiagnosticItem,
  mcq: Record<number, number>,
  code: Record<number, string>,
  index: number,
): boolean {
  if (item.kind === "mcq") return mcq[index] === item.answerIndex;
  return allPassed(code[index] ?? "", item.checks);
}

export default function DiagnosticPage() {
  const { markManyComplete } = useProgress();
  const [mcq, setMcq] = useState<Record<number, number>>({});
  const [code, setCode] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const lessonIds = diagnosticLessonIds();
  const titleOf: Record<string, string> = {};
  for (const item of diagnostic) titleOf[item.lessonId] = item.lessonTitle;

  // Every MCQ must be answered; every coding box must have something typed.
  const allAnswered = diagnostic.every((item, i) =>
    item.kind === "mcq" ? mcq[i] !== undefined : (code[i] ?? "").trim().length > 0,
  );

  // A lesson is tested out only if all of its diagnostic items are correct.
  const passedLessons = lessonIds.filter((lessonId) =>
    diagnostic.every((item, i) =>
      item.lessonId === lessonId ? itemCorrect(item, mcq, code, i) : true,
    ),
  );
  const reviewLessons = lessonIds.filter((id) => !passedLessons.includes(id));

  function submit() {
    markManyComplete(passedLessons);
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="text-3xl font-bold text-white">Your placement results</h1>
        <p className="mt-2 text-muted">
          You tested out of{" "}
          <span className="font-semibold text-good">{passedLessons.length}</span> of{" "}
          {lessonIds.length} lessons. We&apos;ve marked those complete so you can jump
          straight to what&apos;s new.
        </p>

        {passedLessons.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-good">
              Tested out ({passedLessons.length})
            </h2>
            <ul className="space-y-1.5">
              {passedLessons.map((id) => (
                <li
                  key={id}
                  className="flex items-center gap-2 rounded-lg border border-good/30 bg-good/5 px-4 py-2.5 text-sm"
                >
                  <span className="text-good">✓</span>
                  <span className="text-white">{titleOf[id]}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {reviewLessons.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted">
              Worth reviewing ({reviewLessons.length})
            </h2>
            <ul className="space-y-1.5">
              {reviewLessons.map((id) => (
                <li
                  key={id}
                  className="flex items-center gap-2 rounded-lg border border-edge bg-panel px-4 py-2.5 text-sm"
                >
                  <span className="text-muted">○</span>
                  <span className="text-white">{titleOf[id]}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-8 flex gap-3">
          <Link
            href="/tracks/beginner"
            className="rounded-full bg-brand px-6 py-2.5 font-semibold text-white shadow-[0_4px_0_#1d4ed8] transition-transform hover:bg-brand2 active:translate-y-[3px] active:shadow-none"
          >
            Go to my track →
          </Link>
          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              setMcq({});
              setCode({});
            }}
            className="rounded-full border border-edge px-6 py-2.5 font-semibold text-muted transition hover:border-brand hover:text-white active:scale-95"
          >
            Retake
          </button>
        </div>
      </div>
    );
  }

  const answeredCount = diagnostic.filter((item, i) =>
    item.kind === "mcq" ? mcq[i] !== undefined : (code[i] ?? "").trim().length > 0,
  ).length;

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <Link href="/" className="text-sm text-brand2 hover:underline">
        ← Home
      </Link>

      <header className="mb-8 mt-3">
        <h1 className="text-3xl font-bold text-white">Diagnostic placement test</h1>
        <p className="mt-2 text-muted">
          Already know some of this? Work through these {diagnostic.length} questions —
          a mix of multiple choice and short coding tasks — and we&apos;ll skip you past
          every lesson you can prove you&apos;ve mastered.
        </p>
      </header>

      <div className="space-y-6">
        {diagnostic.map((item, qi) => (
          <div key={qi} className="rounded-xl border border-edge bg-panel p-5">
            <div className="mb-1 text-xs font-medium uppercase tracking-wider text-muted">
              Question {qi + 1} · {item.lessonTitle} ·{" "}
              {item.kind === "coding" ? "coding" : "multiple choice"}
            </div>

            {item.kind === "mcq" ? (
              <>
                <p className="mb-3 font-medium text-white">{item.question}</p>
                <div className="space-y-2">
                  {item.options.map((opt, oi) => {
                    const picked = mcq[qi] === oi;
                    return (
                      <button
                        key={oi}
                        onClick={() => setMcq((a) => ({ ...a, [qi]: oi }))}
                        className={`flex w-full items-center gap-2 rounded-lg border px-4 py-2.5 text-left text-sm transition ${
                          picked
                            ? "border-brand bg-brand/10 text-white"
                            : "border-edge bg-panel2 text-[#c4cce0] hover:border-brand/60"
                        }`}
                      >
                        <span className="font-mono text-muted">
                          {String.fromCharCode(65 + oi)}.
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <p className="mb-3 font-medium text-white">{item.prompt}</p>
                <div className="overflow-hidden rounded-lg border border-edge bg-[#0d1320]">
                  <div className="border-b border-edge bg-panel2 px-3 py-1.5 text-xs uppercase tracking-wider text-muted">
                    java
                  </div>
                  <textarea
                    value={code[qi] ?? item.starter}
                    onChange={(e) => setCode((c) => ({ ...c, [qi]: e.target.value }))}
                    spellCheck={false}
                    aria-label={`Code editor for question ${qi + 1}`}
                    rows={Math.max(3, (code[qi] ?? item.starter).split("\n").length + 1)}
                    className="w-full resize-y bg-transparent p-4 font-mono text-sm leading-relaxed text-[#d6deef] outline-none"
                  />
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="sticky bottom-0 mt-6 flex items-center justify-between gap-4 border-t border-edge bg-ink/90 py-4 backdrop-blur">
        <span className="text-sm text-muted">
          {answeredCount} / {diagnostic.length} answered
        </span>
        <button
          type="button"
          onClick={submit}
          disabled={!allAnswered}
          className="rounded-full bg-brand px-7 py-2.5 font-semibold text-white shadow-[0_4px_0_#1d4ed8] transition-transform hover:bg-brand2 active:translate-y-[3px] active:shadow-none disabled:cursor-not-allowed disabled:bg-edge disabled:text-muted disabled:shadow-none"
        >
          See my results
        </button>
      </div>
    </div>
  );
}
