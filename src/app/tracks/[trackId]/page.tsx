"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { getTrack, trackLessons, lessonMinutes } from "@/lib/curriculum";
import { useProgress } from "@/components/ProgressProvider";

export default function TrackPage() {
  const { trackId } = useParams<{ trackId: string }>();
  const track = getTrack(trackId);
  const { completed, ready } = useProgress();

  if (!track) return notFound();

  const allLessons = trackLessons(track);
  const doneCount = ready ? allLessons.filter((l) => completed.has(l.id)).length : 0;
  const pct = allLessons.length ? Math.round((doneCount / allLessons.length) * 100) : 0;

  // A lesson is unlocked if it's the first, already complete, or the lesson
  // immediately before it (in track order) is complete.
  function isUnlocked(lessonId: string): boolean {
    if (!ready) return true; // avoid flashing locks before storage loads
    const idx = allLessons.findIndex((l) => l.id === lessonId);
    if (idx <= 0) return true;
    return completed.has(lessonId) || completed.has(allLessons[idx - 1].id);
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <Link href="/" className="text-sm text-brand2 hover:underline">
        ← All tracks
      </Link>

      <header className="mb-8 mt-3">
        <span className="rounded-full bg-brand/15 px-3 py-1 text-xs font-medium text-brand2">
          {track.level}
        </span>
        <h1 className="mt-3 text-3xl font-bold text-white">{track.title}</h1>
        <p className="mt-2 text-muted">{track.blurb}</p>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted">Track progress</span>
            <span className="text-muted">
              {doneCount}/{allLessons.length} · {pct}%
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-panel2">
            <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </header>

      <div className="space-y-8">
        {track.modules.map((module, mi) => (
          <section key={module.id}>
            <div className="mb-3 flex items-baseline gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-panel2 text-sm font-semibold text-brand2">
                {mi + 1}
              </span>
              <div>
                <h2 className="text-lg font-semibold text-white">{module.title}</h2>
                <p className="text-sm text-muted">{module.blurb}</p>
              </div>
            </div>

            <ol className="space-y-2 border-l border-edge pl-6">
              {module.lessons.map((lesson) => {
                const done = ready && completed.has(lesson.id);
                const unlocked = isUnlocked(lesson.id);

                const inner = (
                  <>
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${
                          done
                            ? "border-good bg-good/15 text-good"
                            : unlocked
                              ? "border-edge text-muted"
                              : "border-edge text-muted"
                        }`}
                      >
                        {done ? "✓" : unlocked ? "" : "🔒"}
                      </span>
                      <div>
                        <div
                          className={`font-medium ${
                            unlocked ? "text-white group-hover:text-brand2" : "text-muted"
                          }`}
                        >
                          {lesson.title}
                        </div>
                        <div className="text-sm text-muted">{lesson.blurb}</div>
                      </div>
                    </div>
                    <span className="shrink-0 text-xs text-muted">
                      {lessonMinutes(lesson)} min
                      {lesson.difficulty && ` · ${lesson.difficulty}`}
                    </span>
                  </>
                );

                return (
                  <li key={lesson.id}>
                    {unlocked ? (
                      <Link
                        href={`/lessons/${lesson.id}`}
                        className="group flex items-center justify-between rounded-xl border border-edge bg-panel p-4 transition hover:border-brand"
                      >
                        {inner}
                      </Link>
                    ) : (
                      <div
                        className="flex cursor-not-allowed items-center justify-between rounded-xl border border-edge bg-panel/40 p-4 opacity-70"
                        title="Complete the previous lesson to unlock"
                      >
                        {inner}
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
