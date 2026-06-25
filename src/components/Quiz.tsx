"use client";

import { useState } from "react";
import { InlineMd } from "./InlineMd";

interface QuizProps {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  onAnswered?: (correct: boolean) => void;
}

export function Quiz({
  question,
  options,
  answerIndex,
  explanation,
  onAnswered,
}: QuizProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const answered = selected !== null;
  const correct = selected === answerIndex;

  function choose(i: number) {
    if (answered) return;
    setSelected(i);
    onAnswered?.(i === answerIndex);
  }

  return (
    <div className="my-5 rounded-xl border border-edge bg-panel p-5">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-accent">
        Check your understanding
      </div>
      <p className="mb-4 font-medium text-white">{question}</p>
      <div className="space-y-2">
        {options.map((opt, i) => {
          const isAnswer = i === answerIndex;
          const isPicked = i === selected;
          let cls =
            "w-full rounded-lg border px-4 py-2.5 text-left text-sm transition ";
          if (!answered) {
            cls +=
              "border-edge bg-panel2 hover:border-brand hover:bg-[#1d2740] cursor-pointer";
          } else if (isAnswer) {
            cls += "border-good bg-good/10 text-good";
          } else if (isPicked) {
            cls += "border-bad bg-bad/10 text-bad";
          } else {
            cls += "border-edge bg-panel2 opacity-60";
          }
          return (
            <button key={i} className={cls} onClick={() => choose(i)} disabled={answered}>
              <span className="mr-2 font-mono text-muted">
                {String.fromCharCode(65 + i)}.
              </span>
              {opt}
              {answered && isAnswer && <span className="ml-2">✓</span>}
              {answered && isPicked && !isAnswer && <span className="ml-2">✗</span>}
            </button>
          );
        })}
      </div>
      {answered && (
        <div
          className={`mt-4 rounded-lg border p-3 text-sm ${
            correct ? "border-good/40 bg-good/5" : "border-accent/40 bg-accent/5"
          }`}
        >
          <div className="mb-1 font-semibold">
            {correct ? "Correct!" : "Not quite."}
          </div>
          <InlineMd md={explanation} />
        </div>
      )}
    </div>
  );
}
