"use client";

import Link from "next/link";
import { useState } from "react";
import { tracks, allLessonsInOrder } from "@/lib/curriculum";
import { useProgress } from "@/components/ProgressProvider";
import { LessonMap, MapFooterLink } from "@/components/LessonMap";

export default function HomePage() {
  const { completed, ready } = useProgress();
  const all = allLessonsInOrder();
  const totalLessons = all.length;
  const doneCount = ready ? all.filter((l) => completed.has(l.lesson.id)).length : 0;
  const pct = totalLessons ? Math.round((doneCount / totalLessons) * 100) : 0;

  const [activeTrackId, setActiveTrackId] = useState(tracks[0].id);
  const activeTrack = tracks.find((t) => t.id === activeTrackId) ?? tracks[0];

  return (
    <div className="mx-auto max-w-5xl px-5">
      {/* Hero */}
      <section className="py-16 text-center sm:py-24">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight text-white sm:text-5xl">
          Go from <span className="text-muted">&ldquo;never programmed&rdquo;</span> to{" "}
          <span className="text-brand2">championship robot code</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted">
          A structured, interactive path that teaches programming through real FRC
          robots — variables to command-based architecture, every concept on a robot
          example.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/tracks/beginner"
            className="rounded-full bg-brand px-7 py-3 font-semibold text-white shadow-[0_4px_0_#1d4ed8] transition-transform hover:bg-brand2 active:translate-y-[3px] active:shadow-none"
          >
            Start the Beginner Track
          </Link>
          <Link
            href="/diagnostic"
            className="rounded-full border border-edge px-7 py-3 font-semibold text-muted transition hover:border-brand hover:text-white active:scale-95"
          >
            Already know some? Take the diagnostic
          </Link>
        </div>
      </section>

      {/* Overall progress */}
      {ready && doneCount > 0 && (
        <section className="mb-12 rounded-2xl border border-edge bg-panel p-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-white">Your progress</span>
            <span className="text-muted">
              {doneCount} / {totalLessons} lessons · {pct}%
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-panel2">
            <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
          </div>
        </section>
      )}

      {/* Roadmap — treasure-map style winding path */}
      <section id="roadmap" className="pb-12">
        <div className="mb-4 text-center">
          <h2 className="text-2xl font-bold text-white">Your Learning Path</h2>
          <p className="text-sm text-muted">
            {activeTrack.title} · {activeTrack.modules.flatMap((m) => m.lessons).length} lessons
          </p>
        </div>

        {/* Track switcher */}
        <div className="mx-auto mb-6 flex max-w-md gap-1 rounded-full border border-edge bg-panel p-1">
          {tracks.map((t) => {
            const lessonsInTrack = t.modules.flatMap((m) => m.lessons);
            const doneInTrack = ready
              ? lessonsInTrack.filter((l) => completed.has(l.id)).length
              : 0;
            const isActive = t.id === activeTrackId;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTrackId(t.id)}
                className={`flex-1 rounded-full px-3 py-2 text-xs font-semibold transition ${
                  isActive
                    ? "bg-brand text-white shadow"
                    : "text-muted hover:text-white"
                }`}
              >
                {t.level}
                {ready && doneInTrack > 0 && (
                  <span className="ml-1 opacity-70">
                    {doneInTrack}/{lessonsInTrack.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <LessonMap track={activeTrack} />
        <MapFooterLink trackId={activeTrack.id} />
      </section>

      {/* All tracks overview */}
      <section className="pb-20">
        <h2 className="mb-4 text-center text-lg font-semibold text-muted">
          The full journey
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {tracks.map((t) => {
            const lessonsInTrack = t.modules.flatMap((m) => m.lessons);
            const doneInTrack = ready
              ? lessonsInTrack.filter((l) => completed.has(l.id)).length
              : 0;
            return (
              <Link
                key={t.id}
                href={`/tracks/${t.id}`}
                className="group rounded-2xl border border-edge bg-panel p-5 transition hover:border-brand"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-brand/15 px-3 py-1 text-xs font-medium text-brand2">
                    {t.level}
                  </span>
                  <span className="text-xs text-muted">
                    {doneInTrack}/{lessonsInTrack.length}
                  </span>
                </div>
                <h3 className="mt-3 font-semibold text-white group-hover:text-brand2">
                  {t.title}
                </h3>
                <p className="mt-1 text-sm text-muted">{t.blurb}</p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
