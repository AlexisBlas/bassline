import { NOTES, type Note } from "@/lib/music";

export function NotePicker({
  selected,
  onToggle,
  onClear,
}: {
  selected: readonly Note[];
  onToggle: (note: Note) => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-12" role="group" aria-label="Notes">
        {NOTES.map((note) => {
          const on = selected.includes(note);
          const sharp = note.includes("#");
          return (
            <button
              key={note}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(note)}
              className={`h-12 rounded-lg border font-mono text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                on
                  ? "border-accent bg-accent text-accent-ink glow-accent"
                  : sharp
                    ? "border-line bg-bg text-muted hover:border-accent hover:text-fg"
                    : "border-line bg-surface text-fg hover:border-accent"
              }`}
            >
              {note}
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between gap-4 font-mono text-xs text-muted">
        <span>{selected.length > 0 ? `Picked: ${selected.join(" ")}` : "Tap the notes you're playing or hearing."}</span>
        {selected.length > 0 && (
          <button type="button" onClick={onClear} className="underline-offset-4 hover:text-fg hover:underline">
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
