import { scaleKey, type Note, type ScaleMatch } from "@/lib/music";

export function ScaleGrid({
  matches,
  activeKey,
  selected,
  onSelect,
}: {
  matches: readonly ScaleMatch[];
  activeKey: string | null;
  selected: readonly Note[];
  onSelect: (key: string) => void;
}) {
  if (selected.length === 0) {
    return <p className="font-mono text-sm text-muted">Pick at least one note to see matching scales.</p>;
  }
  if (matches.length === 0) {
    return (
      <p className="font-mono text-sm text-muted">
        No scale contains all of {selected.join(" ")}. Try removing a note.
      </p>
    );
  }

  return (
    <ul className="grid max-h-[26rem] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
      {matches.map((m) => {
        const key = scaleKey(m);
        const active = key === activeKey;
        return (
          <li key={key}>
            <button
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(key)}
              className={`flex w-full flex-col gap-2 rounded-xl border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                active ? "border-accent bg-surface-raised" : "border-line bg-surface hover:border-faint"
              }`}
            >
              <span className="flex items-baseline gap-2">
                <span className={`font-mono text-lg font-bold ${active ? "text-accent" : "text-fg"}`}>{m.root}</span>
                <span className="font-display text-base font-medium">{m.scale.name}</span>
              </span>
              <span className="flex flex-wrap gap-1 font-mono text-xs">
                {m.notes.map((n) => (
                  <span
                    key={n}
                    className={`rounded px-1.5 py-0.5 ${
                      n === m.root
                        ? "bg-accent text-accent-ink"
                        : selected.includes(n)
                          ? "bg-surface-raised text-fg ring-1 ring-accent/60"
                          : "text-muted"
                    }`}
                  >
                    {n}
                  </span>
                ))}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
