"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Block, Lesson } from "@/lib/types";
import { InlineMd } from "./InlineMd";
import { CodeBlock } from "./CodeBlock";
import { Quiz } from "./Quiz";
import { CodingExercise } from "./CodingExercise";
import { useProgress } from "./ProgressProvider";

const calloutStyles: Record<string, { border: string; bg: string; label: string }> = {
  info: { border: "border-brand/40", bg: "bg-brand/5", label: "Note" },
  tip: { border: "border-good/40", bg: "bg-good/5", label: "Tip" },
  warn: { border: "border-accent/50", bg: "bg-accent/5", label: "Watch out" },
};

function Callout({ tone, md }: { tone: string; md: string }) {
  const s = calloutStyles[tone] ?? calloutStyles.info;
  return (
    <div className={`my-4 rounded-xl border ${s.border} ${s.bg} p-4`}>
      <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">
        {s.label}
      </div>
      <InlineMd md={md} />
    </div>
  );
}

export function LessonView({
  lesson,
  next,
  backHref,
}: {
  lesson: Lesson;
  next?: { id: string; title: string };
  backHref: string;
}) {
  const { isComplete, markComplete, setActivitiesDone, ready } = useProgress();
  const done = ready && isComplete(lesson.id);

  // Every gradable block (quiz or coding) is an "activity". The lesson completes
  // only once all of them are passed.
  const activityIds = useMemo(
    () =>
      lesson.blocks
        .map((b, i) => (b.type === "quiz" || b.type === "coding" ? i : -1))
        .filter((i) => i >= 0),
    [lesson],
  );
  const [passed, setPassed] = useState<Set<number>>(new Set());
  const allActivitiesDone = activityIds.every((i) => passed.has(i));

  function setActivity(i: number, ok: boolean) {
    setPassed((prev) => {
      const has = prev.has(i);
      if (ok === has) return prev;
      const nextSet = new Set(prev);
      if (ok) nextSet.add(i);
      else nextSet.delete(i);
      return nextSet;
    });
  }

  // Persist how many activities are passed so the map can draw segment fill.
  useEffect(() => {
    if (ready) setActivitiesDone(lesson.id, passed.size);
  }, [ready, passed, setActivitiesDone, lesson.id]);

  // Auto-complete the lesson once every activity on the page is finished.
  // (Lessons with no quizzes complete as soon as they're read.)
  useEffect(() => {
    if (ready && allActivitiesDone && !isComplete(lesson.id)) {
      markComplete(lesson.id);
    }
  }, [ready, allActivitiesDone, isComplete, markComplete, lesson.id]);

  function renderBlock(block: Block, i: number) {
    switch (block.type) {
      case "text":
        return <InlineMd key={i} md={block.md} />;
      case "code":
        return (
          <CodeBlock key={i} code={block.code} lang={block.lang} caption={block.caption} />
        );
      case "callout":
        return <Callout key={i} tone={block.tone} md={block.md} />;
      case "quiz":
        return (
          <Quiz
            key={i}
            question={block.question}
            options={block.options}
            answerIndex={block.answerIndex}
            explanation={block.explanation}
            onAnswered={(correct) => setActivity(i, correct)}
          />
        );
      case "coding":
        return (
          <CodingExercise
            key={i}
            prompt={block.prompt}
            starter={block.starter}
            solution={block.solution}
            checks={block.checks}
            hint={block.hint}
            tests={block.tests}
            stateTests={block.stateTests}
            onSolved={(ok) => setActivity(i, ok)}
          />
        );
    }
  }

  return (
    <article className="mx-auto max-w-3xl px-5 py-10">
      <Link href={backHref} className="text-sm text-brand2 hover:underline">
        ← Back to track
      </Link>

      <header className="mb-8 mt-3">
        <div className="mb-2 flex items-center gap-3 text-xs text-muted">
          <span>{lesson.minutes} min</span>
          {done && <span className="rounded-full bg-good/15 px-2 py-0.5 text-good">Completed</span>}
        </div>
        <h1 className="text-3xl font-bold text-white">{lesson.title}</h1>
        <p className="mt-2 text-muted">{lesson.blurb}</p>
      </header>

      <div className="space-y-1">{lesson.blocks.map(renderBlock)}</div>

      <footer className="mt-10 border-t border-edge pt-6">
        {!done ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-muted">
              {activityIds.length > 0
                ? `Complete all ${activityIds.length === 1 ? "the activity" : `${activityIds.length} activities`} above to unlock the next lesson.`
                : "Finish reading to continue."}
            </span>
            <button
              disabled
              className="cursor-not-allowed rounded-lg bg-edge px-5 py-2.5 font-medium text-muted"
            >
              {next ? `Next: ${next.title}` : "Finish track"} →
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-good">✓ Lesson complete — nice work.</span>
            {next ? (
              <Link
                href={`/lessons/${next.id}`}
                className="rounded-full bg-brand px-6 py-2.5 font-semibold text-white shadow-[0_4px_0_#1d4ed8] transition-transform hover:bg-brand2 active:translate-y-[3px] active:shadow-none"
              >
                Next: {next.title} →
              </Link>
            ) : (
              <Link href={backHref} className="rounded-full bg-brand px-6 py-2.5 font-semibold text-white shadow-[0_4px_0_#1d4ed8] transition-transform hover:bg-brand2 active:translate-y-[3px] active:shadow-none">
                Back to track →
              </Link>
            )}
          </div>
        )}
      </footer>
    </article>
  );
}
