import type { ReactNode } from "react";

export function Section({
  number,
  title,
  aside,
  children,
}: {
  number: number;
  title: string;
  aside?: string;
  children: ReactNode;
}) {
  const id = `section-${number}`;
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-4 border-b border-line pb-2">
        <h2 id={id} className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-muted">
          {number} · {title}
        </h2>
        {aside && <span className="truncate font-mono text-xs text-accent">{aside}</span>}
      </div>
      {children}
    </section>
  );
}
