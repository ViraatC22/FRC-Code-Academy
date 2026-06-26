"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Track, Lesson } from "@/lib/types";
import { trackLessons, activityCount } from "@/lib/curriculum";
import { useProgress } from "./ProgressProvider";
import { SegmentRing } from "./SegmentRing";
import { Decoration, type DecorKind } from "./MapDecor";

// --- Layout constants -----------------------------------------------------
const MAP_W = 340; // logical map width; centered via mx-auto
const CENTER = MAP_W / 2;
const ROW_H = 132; // vertical distance between consecutive nodes
const MODULE_GAP = 60; // extra space before a new module, so its banner has room
const START_Y = 116; // top padding so the first banner + START bubble fit
const BANNER_GAP = 88; // how far above a node its module banner sits
const MAX_OFFSET = 88; // how far nodes wander from the center line
const NODE = 64;

// Stable 0..1 seed from a track id, so each track gets a distinct winding path
// (the curve below is phase- and amplitude-shifted by this seed) while staying
// fully deterministic across SSR/client.
function trackSeed(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

// Deterministic "treasure-map" wander: smooth drift + stable jitter so the
// path looks hand-drawn rather than a perfect spiral. The `seed` shifts the
// phase, flips the lead direction, and varies amplitude per track so no two
// levels trace the same shape.
function wander(i: number, seed: number): number {
  const phase = seed * Math.PI * 2;
  const dir = seed < 0.5 ? 1 : -1; // some tracks lean left first, others right
  const amp = 0.78 + seed * 0.22; // 0.78..1.0 of MAX_OFFSET
  const jitterSeed = Math.sin((i + 1) * (12.9898 + seed * 4)) * 43758.5453;
  const jitter = jitterSeed - Math.floor(jitterSeed); // 0..1
  const drift = Math.sin(i * 0.9 + 0.6 + phase); // smooth -1..1
  const v = dir * (drift * 0.66 + (jitter - 0.5) * 0.9) * amp;
  // Round to an integer: keeps SSR and client style strings identical
  // (avoids float precision hydration mismatches).
  return Math.round(Math.max(-1, Math.min(1, v)) * MAX_OFFSET);
}

// Robotics landmarks themed to each lesson (cycled for longer tracks).
const DECOR: { kind: DecorKind; tilt: number }[] = [
  { kind: "battery", tilt: -6 },
  { kind: "gear", tilt: 8 },
  { kind: "wrench", tilt: -10 },
  { kind: "toolbox", tilt: 4 },
  { kind: "coffee", tilt: -5 },
  { kind: "antenna", tilt: 0 },
  { kind: "wheel", tilt: 0 },
  { kind: "robot", tilt: -4 },
  { kind: "apriltag", tilt: 6 },
  { kind: "cube", tilt: -8 },
  { kind: "cone", tilt: 0 },
  { kind: "bolt", tilt: 10 },
];

// Build a smooth dotted trail (vertical S-curves) through a list of points.
function trailPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 1];
    const p1 = points[i];
    const midY = (p0.y + p1.y) / 2;
    d += ` C ${p0.x.toFixed(1)} ${midY.toFixed(1)}, ${p1.x.toFixed(1)} ${midY.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
  }
  return d;
}

interface MapItem {
  lesson: Lesson;
  index: number;
  x: number;
  y: number;
  moduleTitle: string;
  firstOfModule: boolean;
}

export function LessonMap({ track }: { track: Track }) {
  const { completed, ready, activitiesDone } = useProgress();
  const router = useRouter();
  const lessons = trackLessons(track);

  function isUnlocked(index: number): boolean {
    if (!ready) return index === 0;
    if (index === 0) return true;
    return completed.has(lessons[index].id) || completed.has(lessons[index - 1].id);
  }

  const currentIndex = ready
    ? lessons.findIndex((l, i) => isUnlocked(i) && !completed.has(l.id))
    : 0;

  const seed = trackSeed(track.id);

  // Flatten lessons into absolute-positioned items, tagging module boundaries.
  // A running `y` lets us insert MODULE_GAP before each new module so its
  // banner gets its own band instead of colliding with the prior label.
  const items: MapItem[] = [];
  let gi = -1;
  let prevModule = "";
  let y = START_Y;
  for (const module of track.modules) {
    let firstInModule = true;
    for (const lesson of module.lessons) {
      gi += 1;
      const newModule = module.title !== prevModule;
      if (newModule && gi > 0) y += MODULE_GAP;
      items.push({
        lesson,
        index: gi,
        x: CENTER + wander(gi, seed),
        y,
        moduleTitle: module.title,
        firstOfModule: newModule && firstInModule,
      });
      prevModule = module.title;
      firstInModule = false;
      y += ROW_H;
    }
  }

  const trophy = { x: CENTER, y };
  const totalH = trophy.y + 110;
  const trail = trailPath([...items.map((it) => ({ x: it.x, y: it.y })), trophy]);

  return (
    <div className="relative mx-auto" style={{ width: MAP_W, height: totalH }}>
      {/* Dotted treasure-map trail */}
      <svg
        className="pointer-events-none absolute inset-0"
        width={MAP_W}
        height={totalH}
        viewBox={`0 0 ${MAP_W} ${totalH}`}
        fill="none"
      >
        {/* Soft under-stroke gives the path depth; dotted trail rides on top */}
        <path d={trail} stroke="#caa45a" strokeWidth="11" strokeLinecap="round" opacity="0.06" />
        <path
          d={trail}
          stroke="#caa45a"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="0.5 13"
          opacity="0.55"
        />
      </svg>

      {/* Landmarks — placed on the opposite side of each node's lean. The
          centering transform lives on the wrapper; the floaty animation only
          transforms the inner SVG, so the two never fight (which previously
          shoved every landmark down-right of its slot). */}
      {items.map((it) => {
        const decor = DECOR[it.index % DECOR.length];
        const onLeft = it.x >= CENTER; // node leans right -> decor on left
        const dx = onLeft ? -120 : 120;
        const lx = Math.max(24, Math.min(MAP_W - 24, it.x + dx));
        return (
          <div
            key={`decor-${it.index}`}
            className="pointer-events-none absolute"
            style={{ left: lx, top: it.y, transform: "translate(-50%, -50%)" }}
          >
            <Decoration
              kind={decor.kind}
              size={42}
              className="animate-floaty opacity-60"
              style={{
                ["--tilt" as string]: `${decor.tilt}deg`,
                animationDelay: `${(it.index % 5) * 0.5}s`,
              }}
            />
          </div>
        );
      })}

      {/* Module banners */}
      {items
        .filter((it) => it.firstOfModule)
        .map((it) => (
          <div
            key={`mod-${it.index}`}
            className="absolute z-10 -translate-x-1/2 text-center"
            style={{ left: CENTER, top: it.y - BANNER_GAP, width: MAP_W }}
          >
            <span className="rounded-full border border-edge bg-panel/95 px-4 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand2 shadow-[0_2px_0_rgba(0,0,0,0.35)]">
              {it.moduleTitle}
            </span>
          </div>
        ))}

      {/* Lesson nodes */}
      {items.map((it) => {
        const unlocked = isUnlocked(it.index);
        const done = ready && completed.has(it.lesson.id);
        const current = it.index === currentIndex;
        const total = activityCount(it.lesson);
        const ringDone = done ? total : Math.min(activitiesDone(it.lesson.id), total);

        const circle = (
          <div className="relative flex flex-col items-center">
            {current && (
              <div className="absolute -top-8 left-1/2 z-10 -translate-x-1/2 animate-bounce whitespace-nowrap rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-ink shadow">
                Start
              </div>
            )}
            <div className="relative flex items-center justify-center" style={{ width: 76, height: 76 }}>
              {unlocked && (
                <SegmentRing total={total} done={ringDone} filled={done ? "#22c55e" : "#a855f7"} />
              )}
              <div
                className={[
                  "flex items-center justify-center rounded-full border-2 text-2xl transition-transform",
                  "shadow-[0_6px_0_rgba(0,0,0,0.4)]",
                  done
                    ? "border-good bg-good/20 text-good"
                    : current
                      ? "border-brand2 bg-brand text-white"
                      : unlocked
                        ? "border-edge bg-panel2 text-brand2 hover:border-brand"
                        : "border-edge bg-panel/60 text-muted",
                ].join(" ")}
                style={{ width: NODE, height: NODE }}
              >
                {done ? "★" : unlocked ? "▶" : "🔒"}
              </div>
            </div>
            <div
              className={`pointer-events-none mt-2 max-w-[7.5rem] rounded-md bg-ink/75 px-2 py-0.5 text-center text-xs font-medium leading-snug backdrop-blur-sm ${
                unlocked ? "text-white" : "text-muted"
              }`}
            >
              {it.lesson.title}
            </div>
          </div>
        );

        return (
          <div
            key={it.lesson.id}
            className="absolute"
            style={{ left: it.x, top: it.y, transform: "translate(-50%, -50%)" }}
          >
            {unlocked ? (
              <button
                type="button"
                onClick={() => router.push(`/lessons/${it.lesson.id}`)}
                className="block rounded-full"
                aria-label={it.lesson.title}
              >
                {circle}
              </button>
            ) : (
              <div className="cursor-not-allowed opacity-80" title="Complete the previous lesson to unlock">
                {circle}
              </div>
            )}
          </div>
        );
      })}

      {/* Trophy — the treasure */}
      <div
        className="absolute flex flex-col items-center"
        style={{ left: trophy.x, top: trophy.y, transform: "translate(-50%, -50%)" }}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-accent bg-accent/15 text-2xl text-accent shadow-[0_6px_0_rgba(0,0,0,0.4)]">
          🏆
        </div>
        <div className="mt-2 text-center text-xs text-muted">Track complete</div>
      </div>
    </div>
  );
}

export function MapFooterLink({ trackId }: { trackId: string }) {
  return (
    <div className="mt-6 text-center">
      <Link href={`/tracks/${trackId}`} className="text-sm text-brand2 hover:underline">
        View as a list →
      </Link>
    </div>
  );
}
