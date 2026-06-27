"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Block, Lesson, LessonSection, SectionKind } from "@/lib/types";
import { lessonBlocks, lessonMinutes } from "@/lib/curriculum";
import { InlineMd } from "./InlineMd";
import { CodeBlock } from "./CodeBlock";
import { Quiz } from "./Quiz";
import { CodingExercise } from "./CodingExercise";
import { KnowledgeCheck, Predict } from "./Assessment";
import { useProgress } from "./ProgressProvider";

const calloutStyles: Record<string, { border: string; bg: string; label: string }> = {
  info: { border: "border-brand/40", bg: "bg-brand/5", label: "Note" },
  tip: { border: "border-good/40", bg: "bg-good/5", label: "Tip" },
  warn: { border: "border-accent/50", bg: "bg-accent/5", label: "Watch out" },
};

// Each lesson phase gets a distinct accent + one-line intent, so the page reads
// as Learn → Practice → Implement → Master rather than an undifferentiated wall.
const sectionMeta: Record<SectionKind, { label: string; accent: string; tag: string }> = {
  learn: { label: "Learn", accent: "text-brand2", tag: "Understand the concept and the math" },
  practice: { label: "Practice", accent: "text-accent", tag: "Check understanding, trace, write & debug" },
  implement: { label: "Implement", accent: "text-good", tag: "Build a real robot controller" },
  master: { label: "Master", accent: "text-purple", tag: "Harden it and prove you can reason about it" },
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

function isGradable(b: Block): boolean {
  return (
    b.type === "quiz" ||
    b.type === "coding" ||
    b.type === "knowledgeCheck" ||
    b.type === "predict"
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

  // Flatten to the lesson's blocks in order (works for both the sectioned and
  // legacy models). Activity indices are global across the whole lesson so the
  // sectioned layout and the progress ring agree.
  const blocks = useMemo(() => lessonBlocks(lesson), [lesson]);
  const activityIds = useMemo(
    () => blocks.map((b, i) => (isGradable(b) ? i : -1)).filter((i) => i >= 0),
    [blocks],
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

  useEffect(() => {
    if (ready) setActivitiesDone(lesson.id, passed.size);
  }, [ready, passed, setActivitiesDone, lesson.id]);

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
        return <CodeBlock key={i} code={block.code} lang={block.lang} caption={block.caption} />;
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
      case "knowledgeCheck":
        return (
          <KnowledgeCheck
            key={i}
            title={block.title}
            questions={block.questions}
            onAnswered={(ok) => setActivity(i, ok)}
          />
        );
      case "predict":
        return (
          <Predict
            key={i}
            prompt={block.prompt}
            code={block.code}
            options={block.options}
            answerIndex={block.answerIndex}
            explanation={block.explanation}
            onAnswered={(ok) => setActivity(i, ok)}
          />
        );
      case "coding":
        return (
          <CodingExercise
            key={i}
            lessonId={lesson.id}
            blockIndex={i}
            variant={block.variant}
            title={block.title}
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

  // Render either the sectioned layout (with phase headers) or the flat legacy
  // list. A running counter keeps global block indices aligned with `blocks`.
  function renderBody() {
    if (lesson.sections?.length) {
      let gi = -1;
      return lesson.sections.map((section, si) => {
        const els = section.blocks.map((b) => {
          gi += 1;
          return renderBlock(b, gi);
        });
        return <SectionBlock key={si} section={section}>{els}</SectionBlock>;
      });
    }
    return <div className="space-y-1">{blocks.map(renderBlock)}</div>;
  }

  const minutes = lessonMinutes(lesson);

  return (
    <article className="mx-auto max-w-3xl px-5 py-10">
      <Link href={backHref} className="text-sm text-brand2 hover:underline">
        ← Back to track
      </Link>

      <header className="mb-8 mt-3">
        <div className="mb-2 flex items-center gap-3 text-xs text-muted">
          <span>{minutes} min</span>
          {lesson.difficulty && (
            <span className="rounded-full border border-edge px-2 py-0.5">{lesson.difficulty}</span>
          )}
          {done && <span className="rounded-full bg-good/15 px-2 py-0.5 text-good">Completed</span>}
        </div>
        <h1 className="text-3xl font-bold text-white">{lesson.title}</h1>
        <p className="mt-2 text-muted">{lesson.blurb}</p>

        {lesson.objectives && lesson.objectives.length > 0 && (
          <div className="mt-5 rounded-xl border border-edge bg-panel p-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
              By the end you can
            </div>
            <ul className="space-y-1.5">
              {lesson.objectives.map((o, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-white">
                  <span className="mt-0.5 text-brand2">→</span>
                  {o}
                </li>
              ))}
            </ul>
          </div>
        )}
      </header>

      {renderBody()}

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

function SectionBlock({ section, children }: { section: LessonSection; children: React.ReactNode }) {
  const meta = sectionMeta[section.kind];
  return (
    <section className="mt-8 first:mt-2">
      <div className="mb-3 border-b border-edge pb-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className={`text-lg font-bold uppercase tracking-wide ${meta.accent}`}>
            {section.title ?? meta.label}
          </h2>
          <span className="shrink-0 text-xs text-muted">{section.minutes} min</span>
        </div>
        <p className="mt-1 text-sm text-muted">{section.blurb ?? meta.tag}</p>
      </div>
      <div className="space-y-1">{children}</div>
    </section>
  );
}
