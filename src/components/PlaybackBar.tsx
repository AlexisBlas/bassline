import type { PlaybackSettings } from "@/lib/bass-synth";

function Toggle({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`h-10 rounded-lg border px-3 font-mono text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        pressed ? "border-accent bg-surface-raised text-accent" : "border-line bg-surface text-muted hover:text-fg"
      }`}
    >
      {children}
    </button>
  );
}

export function PlaybackBar({
  disabled,
  isPlaying,
  settings,
  onTogglePlay,
  onChange,
}: {
  disabled: boolean;
  isPlaying: boolean;
  settings: PlaybackSettings;
  onTogglePlay: () => void;
  onChange: (patch: Partial<PlaybackSettings>) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface p-3">
      <button
        type="button"
        onClick={onTogglePlay}
        disabled={disabled}
        className={`h-10 min-w-32 rounded-lg px-4 font-mono text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40 ${
          isPlaying ? "bg-fg text-bg" : "bg-accent text-accent-ink hover:brightness-110"
        }`}
      >
        {isPlaying ? "■ Stop" : "▶ Play scale"}
      </button>

      <label className="flex items-center gap-3 font-mono text-xs text-muted">
        Speed
        <input
          type="range"
          min={0.25}
          max={2}
          step={0.25}
          value={settings.speed}
          onChange={(e) => onChange({ speed: Number(e.target.value) })}
          className="w-28 sm:w-36"
          aria-valuetext={`${settings.speed}×`}
        />
        <span className="w-10 text-fg">{settings.speed}×</span>
      </label>

      <div className="flex gap-2">
        <Toggle pressed={settings.loop} onClick={() => onChange({ loop: !settings.loop })}>
          ∞ Loop
        </Toggle>
        <Toggle pressed={settings.reverse} onClick={() => onChange({ reverse: !settings.reverse })}>
          ⇩ Reverse
        </Toggle>
      </div>
    </div>
  );
}
