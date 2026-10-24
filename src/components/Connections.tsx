import { scaleKey, type Connection, type ScaleMatch } from "@/lib/music";

export function Connections({
  active,
  connections,
  activeKey,
  onToggle,
}: {
  active: ScaleMatch | null;
  connections: readonly Connection[];
  activeKey: string | null;
  onToggle: (key: string) => void;
}) {
  if (!active) {
    return <p className="font-mono text-sm text-muted">Choose a scale to see where you can go next.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">
        Scales that sit close to <span className="font-mono text-fg">{active.root} {active.scale.name}</span>. Tap one
        to overlay it on the neck.
      </p>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {connections.map((c) => {
          const key = scaleKey(c.match);
          const on = key === activeKey;
          return (
            <li key={key}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => onToggle(key)}
                className={`flex h-full w-full flex-col gap-2 rounded-xl border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-connect ${
                  on ? "border-connect bg-surface-raised glow-connect" : "border-line bg-surface hover:border-faint"
                }`}
              >
                <span className="flex items-baseline gap-2">
                  <span className="font-mono text-lg font-bold text-connect">{c.match.root}</span>
                  <span className="font-display text-base font-medium">{c.match.scale.name}</span>
                </span>
                <span className="flex flex-wrap gap-1 font-mono text-xs">
                  {c.match.notes.map((n) =>
                    c.shared.includes(n) ? (
                      <span key={n} className="rounded bg-connect/15 px-1.5 py-0.5 text-connect">
                        {n}
                      </span>
                    ) : (
                      <span key={n} className="rounded px-1.5 py-0.5 text-faint ring-1 ring-line">
                        {n}
                      </span>
                    ),
                  )}
                </span>
                <span className="text-xs leading-snug text-muted">{c.reason}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
