import React from "react";

// Lightweight Java-ish syntax highlighter. No dependency — just regex passes
// over a handful of token classes. Good enough to make code readable; a real
// editor/runtime can replace this later.

const JAVA_KEYWORDS =
  /\b(public|private|protected|class|extends|implements|new|return|void|int|double|boolean|true|false|if|else|for|while|this|static|final|import|package)\b/g;

function highlightJava(code: string): React.ReactNode[] {
  const lines = code.split("\n");
  return lines.flatMap((line, li) => {
    const segments: React.ReactNode[] = [];
    // Pull out comments first (everything after // on a line).
    const commentIdx = line.indexOf("//");
    const codePart = commentIdx >= 0 ? line.slice(0, commentIdx) : line;
    const commentPart = commentIdx >= 0 ? line.slice(commentIdx) : "";

    let lastIndex = 0;
    let m: RegExpExecArray | null;
    JAVA_KEYWORDS.lastIndex = 0;
    while ((m = JAVA_KEYWORDS.exec(codePart)) !== null) {
      if (m.index > lastIndex) {
        segments.push(codePart.slice(lastIndex, m.index));
      }
      segments.push(
        <span key={`k-${li}-${m.index}`} className="text-[#c792ea]">
          {m[0]}
        </span>,
      );
      lastIndex = m.index + m[0].length;
    }
    if (lastIndex < codePart.length) segments.push(codePart.slice(lastIndex));
    if (commentPart) {
      segments.push(
        <span key={`c-${li}`} className="text-[#5b6577] italic">
          {commentPart}
        </span>,
      );
    }
    return (
      <React.Fragment key={li}>
        {segments}
        {li < lines.length - 1 ? "\n" : null}
      </React.Fragment>
    );
  });
}

export function CodeBlock({
  code,
  lang,
  caption,
}: {
  code: string;
  lang: string;
  caption?: string;
}) {
  return (
    <figure className="my-4 overflow-hidden rounded-xl border border-edge bg-[#0d1320]">
      <div className="flex items-center justify-between border-b border-edge bg-panel2 px-4 py-2">
        <span className="text-xs font-medium uppercase tracking-wider text-muted">
          {lang}
        </span>
        {caption && <span className="text-xs text-muted">{caption}</span>}
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
        <code className="font-mono text-[#d6deef]">
          {lang === "java" ? highlightJava(code) : code}
        </code>
      </pre>
    </figure>
  );
}
