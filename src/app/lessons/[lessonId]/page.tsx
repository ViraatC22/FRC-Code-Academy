"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { findLesson, nextLesson, previousLesson } from "@/lib/curriculum";
import { LessonView } from "@/components/LessonView";
import { useProgress } from "@/components/ProgressProvider";

export default function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { isComplete, ready } = useProgress();
  const location = findLesson(lessonId);

  if (!location) return notFound();

  const prev = previousLesson(lessonId);
  const next = nextLesson(lessonId);

  // A lesson is locked until the previous one in the track is complete.
  const locked =
    ready && prev !== undefined && !isComplete(prev.id) && !isComplete(lessonId);

  if (locked) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-20 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-edge bg-panel text-2xl">
          🔒
        </div>
        <h1 className="text-2xl font-bold text-white">This lesson is locked</h1>
        <p className="mx-auto mt-2 max-w-md text-muted">
          Finish <span className="text-white">{prev!.title}</span> first — complete its
          activities and this lesson unlocks automatically.
        </p>
        <Link
          href={`/lessons/${prev!.id}`}
          className="mt-6 inline-block rounded-full bg-brand px-6 py-2.5 font-semibold text-white shadow-[0_4px_0_#1d4ed8] transition-transform hover:bg-brand2 active:translate-y-[3px] active:shadow-none"
        >
          Go to {prev!.title} →
        </Link>
      </div>
    );
  }

  return (
    <LessonView
      lesson={location.lesson}
      backHref={`/tracks/${location.track.id}`}
      next={next ? { id: next.id, title: next.title } : undefined}
    />
  );
}
