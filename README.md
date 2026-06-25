# FRC Code Academy

A structured, interactive platform that takes a student from *"I have never
programmed"* to *"I can read and write command-based FRC robot code."*

This repo is the **MVP**: a content-first Beginner learning path with interactive
lessons, inline quizzes, and per-lesson progress tracking. The larger vision
(in-browser robot simulator, auto-graded challenges, AI coach, swerve academy,
team dashboards) is layered on top of this foundation.

## What's built

- **Beginner track** — 4 modules, 9 lessons:
  - Programming Fundamentals: Variables · Loops · Functions · Classes
  - Java Fundamentals: Java Syntax Essentials
  - Robot Fundamentals: What is WPILib? · Motors & Driving
  - Command-Based Programming: Subsystems · Commands
- **Interactive lessons** — text, syntax-highlighted Java code blocks, callouts,
  and inline multiple-choice quizzes. A lesson can't be marked complete until its
  quiz is answered correctly.
- **Progress tracking** — completion is saved in `localStorage`; progress bars on
  the home page and each track update live.
- **Roadmap** — locked Intermediate/Advanced cards communicate the full vision.

## Tech stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS
- No backend yet — progress lives in the browser

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Architecture notes

- **Content model** lives in `src/lib/curriculum.ts` and is fully typed
  (`src/lib/types.ts`). Adding a lesson is pure data — no new components.
- **Code blocks are structured** (`{ lang: "java", code }`) on purpose. The
  long-term plan runs *real* Java via a WASM JVM + WPILib shim; a future runtime
  can attach to `lang: "java"` blocks to make them executable without changing
  the content schema.
- `ProgressProvider` (`src/components/ProgressProvider.tsx`) is the single source
  of truth for completion state.

## Roadmap (next slices)

1. Interactive robot simulator (2D field + real-Java execution)
2. Auto-graded coding challenges ("drive exactly 3 meters")
3. Intermediate track: PID, sensors, PathPlanner, state machines
4. AI code coach
5. Real-robot debugging exercises
6. Team progress dashboard
