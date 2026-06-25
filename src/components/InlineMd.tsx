import React from "react";

// Minimal inline renderer: supports **bold**, `code`, and line breaks.
// Deliberately tiny — no markdown dependency for the MVP.

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // Split on **bold** or `code`, keeping the delimiters via capture groups.
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  parts.forEach((part, i) => {
    if (!part) return;
    if (part.startsWith("**") && part.endsWith("**")) {
      nodes.push(
        <strong key={`${keyPrefix}-b-${i}`} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>,
      );
    } else if (part.startsWith("`") && part.endsWith("`")) {
      nodes.push(<code key={`${keyPrefix}-c-${i}`}>{part.slice(1, -1)}</code>);
    } else {
      nodes.push(<React.Fragment key={`${keyPrefix}-t-${i}`}>{part}</React.Fragment>);
    }
  });
  return nodes;
}

/**
 * Renders a small subset of markdown: paragraphs separated by blank lines,
 * `- ` bullet lists, plus inline **bold** and `code`.
 */
export function InlineMd({ md }: { md: string }) {
  const blocks = md.split(/\n\n+/);
  return (
    <div className="prose-frc space-y-3">
      {blocks.map((block, bi) => {
        const lines = block.split("\n");
        const isList = lines.every((l) => l.trim().startsWith("- "));
        if (isList) {
          return (
            <ul key={bi} className="list-disc space-y-1 pl-5 text-[#c4cce0]">
              {lines.map((l, li) => (
                <li key={li}>{renderInline(l.trim().slice(2), `${bi}-${li}`)}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={bi} className="leading-relaxed text-[#c4cce0]">
            {renderInline(block, `${bi}`)}
          </p>
        );
      })}
    </div>
  );
}
