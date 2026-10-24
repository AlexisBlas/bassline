import type { ReactNode } from "react";

type Block =
  | { type: "heading"; level: number; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "paragraph"; text: string };

function parseBlocks(source: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) blocks.push({ type: "paragraph", text: paragraph.join(" ") });
    paragraph = [];
  };

  for (const rawLine of source.split("\n")) {
    const line = rawLine.trim();
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    const bullet = /^[-*•]\s+(.*)$/.exec(line);
    const numbered = /^\d+[.)]\s+(.*)$/.exec(line);

    if (!line) {
      flushParagraph();
    } else if (heading) {
      flushParagraph();
      blocks.push({ type: "heading", level: heading[1].length, text: heading[2] });
    } else if (bullet || numbered) {
      flushParagraph();
      const ordered = Boolean(numbered);
      const text = (bullet ?? numbered)![1];
      const last = blocks.at(-1);
      if (last?.type === "list" && last.ordered === ordered) last.items.push(text);
      else blocks.push({ type: "list", ordered, items: [text] });
    } else {
      paragraph.push(line);
    }
  }
  flushParagraph();
  return blocks;
}

/** Inline **bold**, *italic* and `code`. */
function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*|_[^_\s][^_]*_)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={i} className="font-semibold text-fg">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code key={i} className="rounded bg-surface-raised px-1 font-mono text-[0.9em] text-accent">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (/^([*_]).+\1$/.test(part) && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

const HEADING_STYLES = [
  "font-display text-xl font-semibold text-fg",
  "font-display text-lg font-semibold text-fg",
  "font-display text-base font-semibold text-accent",
];

export function Markdown({ source }: { source: string }) {
  return (
    <div className="flex flex-col gap-3 text-sm leading-relaxed text-fg/90">
      {parseBlocks(source).map((block, i) => {
        if (block.type === "heading") {
          const className = HEADING_STYLES[Math.min(block.level, 3) - 1];
          const content = renderInline(block.text);
          if (block.level === 1) return <h3 key={i} className={className}>{content}</h3>;
          if (block.level === 2) return <h4 key={i} className={className}>{content}</h4>;
          return <h5 key={i} className={className}>{content}</h5>;
        }
        if (block.type === "list") {
          const items = block.items.map((item, j) => <li key={j}>{renderInline(item)}</li>);
          return block.ordered ? (
            <ol key={i} className="flex list-decimal flex-col gap-1 pl-5 marker:font-mono marker:text-accent">
              {items}
            </ol>
          ) : (
            <ul key={i} className="flex list-disc flex-col gap-1 pl-5 marker:text-accent">
              {items}
            </ul>
          );
        }
        return <p key={i}>{renderInline(block.text)}</p>;
      })}
    </div>
  );
}
