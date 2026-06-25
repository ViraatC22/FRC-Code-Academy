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
      type: "coding";
      prompt: string;
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
    };

/** A method-level runtime test executed by the in-browser Java interpreter. */
export interface RuntimeTest {
  /** Method to invoke (must be defined in the learner's code). */
  method: string;
  /** Arguments passed to the method. */
  args: (number | string | boolean)[];
  /** Expected return value. */
  expected: number | string | boolean;
  /** Optional label override; defaults to `method(args) → expected`. */
  label?: string;
  /** Float comparison tolerance (default 1e-6). */
  tolerance?: number;
}

export interface Lesson {
  id: string;
  title: string;
  /** One-line summary shown in lists. */
  blurb: string;
  /** Estimated minutes to complete. */
  minutes: number;
  blocks: Block[];
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
  level: "Beginner" | "Intermediate" | "Advanced" | "Specialist";
  blurb: string;
  modules: Module[];
}
