// Content model for lessons. Code blocks are kept structured (lang + code)
// so a real Java/WASM runtime can later attach to `lang: "java"` blocks
// and make them executable without changing the content schema.

/** A single pass/fail rule checked against the learner's submitted code. */
export interface CodeCheck {
  /** Human-readable description of what must be true. */
  label: string;
  /** Regex source string tested against the submission (whitespace-normalized). */
  pattern: string;
  /** If true, the check passes only when the pattern is NOT found. */
  negate?: boolean;
}

export type Block =
  | { type: "text"; md: string }
  | { type: "code"; lang: "java" | "bash" | "text"; code: string; caption?: string }
  | { type: "callout"; tone: "info" | "tip" | "warn"; md: string }
  | {
      type: "quiz";
      question: string;
      options: string[];
      answerIndex: number;
      explanation: string;
    }
  | {
      /** A grouped set of MCQs (the "Knowledge Check" assessment tier). Passes
       *  only when every question is answered correctly. Use this instead of
       *  scattering single `quiz` blocks when verifying conceptual mastery. */
      type: "knowledgeCheck";
      title?: string;
      questions: {
        question: string;
        options: string[];
        answerIndex: number;
        explanation: string;
      }[];
    }
  | {
      /** "Predict the output": learner reads code and picks what it prints /
       *  returns. Trains code tracing without writing any. */
      type: "predict";
      prompt: string;
      code: string;
      options: string[];
      answerIndex: number;
      explanation: string;
    }
  | {
      type: "coding";
      prompt: string;
      /** Which assessment tier this exercise serves, for labelling/structure:
       *  - "exercise" (default): fill-in / write-from-prompt practice
       *  - "debug": starter is intentionally broken; learner repairs it
       *  - "lab": a substantial Implement-section build-from-scratch task */
      variant?: "exercise" | "debug" | "lab";
      /** Optional heading shown above the exercise (e.g. lab name). */
      title?: string;
      /** Pre-filled editor contents. */
      starter: string;
      /** A reference solution revealed after success or via "Show solution". */
      solution: string;
      /** All checks must pass for the exercise to be complete. */
      checks: CodeCheck[];
      hint?: string;
      /** Optional runtime test cases executed by the Java-subset interpreter.
       *  When present, the exercise actually RUNS the learner's code and every
       *  case must pass too (in addition to the regex checks). */
      tests?: RuntimeTest[];
      /** Optional stateful tests: construct a class instance and drive it
       *  through a sequence of calls that share state (controllers with an
       *  integral term, slew-rate limiters, motion-profile integrators, …). */
      stateTests?: RuntimeStateTest[];
    };

/** A method-level runtime test executed by the in-browser Java interpreter. */
export interface RuntimeTest {
  /** Method to invoke (must be defined in the learner's code). */
  method: string;
  /** Arguments passed to the method (scalars or 1-D arrays for array params). */
  args: (number | string | boolean | number[])[];
  /** Expected return value. */
  expected: number | string | boolean;
  /** Optional label override; defaults to `method(args) → expected`. */
  label?: string;
  /** Float comparison tolerance (default 1e-6). */
  tolerance?: number;
}

/** One call in a stateful test sequence (runs on a shared class instance). */
export interface RuntimeStateStep {
  /** Instance method to call. */
  method: string;
  args: (number | string | boolean | number[])[];
  /** If set, the call's return value is checked against this. Omit for a
   *  "drive" step that only advances state. */
  expected?: number | string | boolean;
  tolerance?: number;
  label?: string;
}

/** A stateful test: build one instance, then run the steps in order on it. */
export interface RuntimeStateTest {
  /** User class to instantiate. */
  className: string;
  ctorArgs?: (number | string | boolean | number[])[];
  steps: RuntimeStateStep[];
  label?: string;
}

/** Per-lesson difficulty, surfaced on the roadmap node as a quick signal.
 *  Distinct from a Track's `level` (which tiers the whole curriculum). */
export type LessonDifficulty = "Easy" | "Medium" | "Hard" | "Expert";

/** The four-part pedagogy every redesigned lesson follows. */
export type SectionKind = "learn" | "practice" | "implement" | "master";

/** A phase of a lesson. Blocks reuse the existing/assessment block types, so a
 *  section is just a titled, time-estimated bundle of them. */
export interface LessonSection {
  kind: SectionKind;
  /** Optional title override; a sensible default is derived from `kind`. */
  title?: string;
  blurb?: string;
  /** Estimated minutes for this section (sums to the lesson estimate). */
  minutes: number;
  blocks: Block[];
}

export interface Lesson {
  id: string;
  title: string;
  /** One-line summary shown in lists. */
  blurb: string;
  /** Estimated minutes to complete. Legacy lessons set this directly; for
   *  sectioned lessons it's the sum of section minutes (see lessonMinutes). */
  minutes: number;
  /** Roadmap difficulty signal. Optional for legacy lessons. */
  difficulty?: LessonDifficulty;
  /** "By the end you can…" goals shown atop the detail page. */
  objectives?: string[];
  /** New structured model: Learn → Practice → Implement → Master. */
  sections?: LessonSection[];
  /** Legacy flat model. Present on un-migrated lessons; mutually exclusive
   *  with `sections` in practice. Read both via lessonBlocks(). */
  blocks?: Block[];
}

export interface Module {
  id: string;
  title: string;
  blurb: string;
  lessons: Lesson[];
}

export interface Track {
  id: string;
  title: string;
  level: "Java" | "Beginner" | "Intermediate" | "Advanced" | "Specialist";
  blurb: string;
  modules: Module[];
}
