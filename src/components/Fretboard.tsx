import {
  BASS_STRINGS,
  FRETS,
  noteAtFret,
  noteIndex,
  type Connection,
  type Note,
  type ScaleMatch,
} from "@/lib/music";

type DotKind = "playing" | "new" | "shared" | "root" | "picked" | "scale";

const DOT_STYLES: Record<DotKind, string> = {
  playing: "size-9 bg-accent text-accent-ink glow-playing z-10",
  new: "size-7 border-2 border-connect bg-bg text-connect",
  shared: "size-7 bg-connect text-connect-ink glow-connect",
  root: "size-7 bg-accent text-accent-ink glow-accent",
  picked: "size-7 border-2 border-accent bg-surface-raised text-fg",
  scale: "size-6 border border-line bg-surface-raised text-muted",
};

const LEGEND: { kind: DotKind; label: string }[] = [
  { kind: "root", label: "Root" },
  { kind: "picked", label: "Picked note" },
  { kind: "scale", label: "Scale tone" },
  { kind: "playing", label: "Now playing" },
  { kind: "shared", label: "Shared (connection)" },
  { kind: "new", label: "New (connection)" },
];

const SINGLE_INLAYS = new Set([3, 5, 7, 9]);
const STRING_THICKNESS = ["h-px", "h-[1.5px]", "h-[2px]", "h-[3px]"];

/** Priority: playing > new connection note > shared > root > picked > scale tone. */
function dotKind(
  note: Note,
  active: ScaleMatch | null,
  selected: readonly Note[],
  connection: Connection | null,
  playingNote: number | null,
): DotKind | null {
  const inScale = active?.notes.includes(note) ?? false;
  if (inScale && playingNote === noteIndex(note)) return "playing";
  if (connection?.onlyThere.includes(note)) return "new";
  if (connection?.shared.includes(note)) return "shared";
  if (!active || !inScale) return null;
  if (note === active.root) return "root";
  if (selected.includes(note)) return "picked";
  return "scale";
}

function Dot({ kind, note }: { kind: DotKind; note?: string }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-bold leading-none transition-all duration-150 ${DOT_STYLES[kind]}`}
    >
      {note}
    </span>
  );
}

export function Fretboard({
  active,
  selected,
  connection,
  playingNote,
}: {
  active: ScaleMatch | null;
  selected: readonly Note[];
  connection: Connection | null;
  playingNote: number | null;
}) {
  const summary = active
    ? `Bass fretboard showing ${active.root} ${active.scale.name}: ${active.notes.join(" ")}${
        connection ? `, with ${connection.match.root} ${connection.match.scale.name} overlaid` : ""
      }`
    : "Bass fretboard, no scale selected";

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-xl border border-line bg-surface">
        <div
          role="img"
          aria-label={summary}
          className="grid min-w-[760px] grid-cols-[2.25rem_3rem_repeat(12,minmax(0,1fr))] px-2 py-3"
        >
          <span />
          {FRETS.map((fret) => (
            <span key={fret} className="pb-1 text-center font-mono text-[10px] text-faint">
              {fret}
            </span>
          ))}

          {BASS_STRINGS.map((string, s) => (
            <div key={string.name} className="contents">
              <span className="flex h-11 items-center justify-center font-mono text-xs font-semibold text-muted">
                {string.name}
              </span>
              {FRETS.map((fret) => {
                const note = noteAtFret(string, fret);
                const kind = dotKind(note, active, selected, connection, playingNote);
                return (
                  <div
                    key={fret}
                    title={`${string.name} string, fret ${fret}: ${note}`}
                    className={`relative flex h-11 items-center justify-center ${
                      fret === 0 ? "border-r-4 border-string" : "border-r border-line"
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`absolute inset-x-0 top-1/2 -translate-y-1/2 bg-string ${STRING_THICKNESS[s]}`}
                    />
                    {kind && (
                      <span className="relative">
                        <Dot kind={kind} note={note} />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          <span />
          {FRETS.map((fret) => (
            <span key={fret} aria-hidden className="flex h-4 items-center justify-center gap-1">
              {SINGLE_INLAYS.has(fret) && <span className="size-1.5 rounded-full bg-faint" />}
              {fret === 12 && (
                <>
                  <span className="size-1.5 rounded-full bg-faint" />
                  <span className="size-1.5 rounded-full bg-faint" />
                </>
              )}
            </span>
          ))}
        </div>
      </div>

      <ul className="flex flex-wrap gap-x-5 gap-y-2 font-mono text-xs text-muted" aria-label="Legend">
        {LEGEND.map(({ kind, label }) => (
          <li key={kind} className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center">
              <span className="origin-center scale-[0.6]">
                <Dot kind={kind} />
              </span>
            </span>
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}
