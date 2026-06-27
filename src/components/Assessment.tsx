"use client";

import { useState } from "react";
import { Quiz } from "./Quiz";
import { CodeBlock } from "./CodeBlock";

interface Question {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

/** Knowledge Check — a grouped set of MCQs. The activity passes only once every
 *  question has been answered correctly (the assessment tier above a lone quiz). */
export function KnowledgeCheck({
  title,
  questions,
  onAnswered,
}: {
  title?: string;
  questions: Question[];
  onAnswered?: (passed: boolean) => void;
}) {
  const [results, setResults] = useState<Record<number, boolean>>({});
  const answered = Object.keys(results).length;
  const correct = Object.values(results).filter(Boolean).length;

  function mark(i: number, ok: boolean) {
    setResults((prev) => {
      if (i in prev) return prev;
      const next = { ...prev, [i]: ok };
      const passed =
        Object.keys(next).length === questions.length &&
        Object.values(next).every(Boolean);
      onAnswered?.(passed);
      return next;
    });
  }

  return (
    <div className="my-6 rounded-2xl border border-edge bg-panel/60 p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wider text-accent">
          {title ?? "Knowledge check"}
        </div>
        <div className="text-xs text-muted">
          {correct}/{questions.length} correct
          {answered > 0 && answered < questions.length && ` · ${answered} answered`}
        </div>
      </div>
      <div className="space-y-1">
        {questions.map((q, i) => (
          <Quiz key={i} {...q} onAnswered={(ok) => mark(i, ok)} />
        ))}
      </div>
    </div>
  );
}

/** Predict-the-output: read code, choose what it returns/prints. Trains tracing. */
export function Predict({
  prompt,
  code,
  options,
  answerIndex,
  explanation,
  onAnswered,
}: {
  prompt: string;
  code: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  onAnswered?: (correct: boolean) => void;
}) {
  return (
    <div className="my-6 rounded-2xl border border-edge bg-panel/60 p-5">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand2">
        Predict the output
      </div>
      <CodeBlock code={code} lang="java" />
      <div className="mt-2">
        <Quiz
          question={prompt}
          options={options}
          answerIndex={answerIndex}
          explanation={explanation}
          onAnswered={onAnswered}
        />
      </div>
    </div>
  );
}
