"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ScalePlayer, type PlaybackSettings } from "@/lib/bass-synth";
import {
  NOTES,
  findConnections,
  findScales,
  playbackSequence,
  scaleKey,
  type Note,
} from "@/lib/music";
import { Coach } from "./Coach";
import { Connections } from "./Connections";
import { Fretboard } from "./Fretboard";
import { NotePicker } from "./NotePicker";
import { PlaybackBar } from "./PlaybackBar";
import { ScaleGrid } from "./ScaleGrid";
import { Section } from "./Section";

const DEFAULT_NOTES: Note[] = ["A", "C", "E"];

export function Bassline() {
  const [selected, setSelected] = useState<Note[]>(DEFAULT_NOTES);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [connectionKey, setConnectionKey] = useState<string | null>(null);
  const [settings, setSettings] = useState<PlaybackSettings>({ speed: 1, loop: false, reverse: false });
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingNote, setPlayingNote] = useState<number | null>(null);
  const playerRef = useRef<ScalePlayer | null>(null);

  const matches = useMemo(() => findScales(selected), [selected]);
  const active = matches.find((m) => scaleKey(m) === activeKey) ?? matches[0] ?? null;
  const connections = useMemo(() => (active ? findConnections(active) : []), [active]);
  const connection = connections.find((c) => scaleKey(c.match) === connectionKey) ?? null;

  useEffect(() => () => playerRef.current?.dispose(), []);

  const getPlayer = () => {
    playerRef.current ??= new ScalePlayer(setPlayingNote, () => setIsPlaying(false));
    return playerRef.current;
  };

  const stopPlayback = () => playerRef.current?.stop();

  const toggleNote = (note: Note) => {
    stopPlayback();
    setConnectionKey(null);
    setSelected((prev) =>
      prev.includes(note) ? prev.filter((n) => n !== note) : NOTES.filter((n) => n === note || prev.includes(n)),
    );
  };

  const clearNotes = () => {
    stopPlayback();
    setConnectionKey(null);
    setSelected([]);
  };

  const selectScale = (key: string) => {
    if (active && key !== scaleKey(active)) stopPlayback();
    setActiveKey(key);
    setConnectionKey(null);
  };

  const togglePlay = () => {
    if (!active) return;
    const player = getPlayer();
    if (player.playing) {
      player.stop();
      return;
    }
    player.play(playbackSequence(active.root, active.scale), settings);
    setIsPlaying(player.playing);
  };

  const changeSettings = (patch: Partial<PlaybackSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    playerRef.current?.update(next);
  };

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 sm:px-6 sm:py-12">
      <header className="flex flex-col gap-3">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-accent">Bassline</p>
        <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Pick notes. Find the scale.
          <span className="block text-muted">See it, hear it, connect it.</span>
        </h1>
      </header>

      <Section number={1} title="Pick notes">
        <NotePicker selected={selected} onToggle={toggleNote} onClear={clearNotes} />
      </Section>

      <Section
        number={2}
        title="Scales"
        aside={selected.length > 0 ? `${matches.length} match${matches.length === 1 ? "" : "es"}` : undefined}
      >
        <ScaleGrid matches={matches} activeKey={active ? scaleKey(active) : null} selected={selected} onSelect={selectScale} />
      </Section>

      <Section number={3} title="Fretboard" aside={active ? `${active.root} ${active.scale.name}` : undefined}>
        <div className="flex flex-col gap-4">
          <PlaybackBar
            disabled={!active}
            isPlaying={isPlaying}
            settings={settings}
            onTogglePlay={togglePlay}
            onChange={changeSettings}
          />
          <Fretboard active={active} selected={selected} connection={connection} playingNote={playingNote} />
        </div>
      </Section>

      <Section number={4} title="Connect it">
        <Connections
          active={active}
          connections={connections}
          activeKey={connection ? scaleKey(connection.match) : null}
          onToggle={(key) => setConnectionKey((prev) => (prev === key ? null : key))}
        />
      </Section>

      <Section number={5} title="Ask the coach">
        <Coach />
      </Section>

      <footer className="border-t border-line pt-6 font-mono text-xs leading-relaxed text-muted">
        Standard 4-string tuning (E A D G), 12 frets. Root notes glow brightest — land on them to resolve your lines.
      </footer>
    </main>
  );
}
