export const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;

export type Note = (typeof NOTES)[number];

export interface ScaleDef {
  id: string;
  name: string;
  intervals: readonly number[];
}

export const SCALES: readonly ScaleDef[] = [
  { id: "major", name: "Major", intervals: [0, 2, 4, 5, 7, 9, 11] },
  { id: "natural-minor", name: "Natural Minor", intervals: [0, 2, 3, 5, 7, 8, 10] },
  { id: "major-pentatonic", name: "Major Pentatonic", intervals: [0, 2, 4, 7, 9] },
  { id: "minor-pentatonic", name: "Minor Pentatonic", intervals: [0, 3, 5, 7, 10] },
  { id: "blues", name: "Blues", intervals: [0, 3, 5, 6, 7, 10] },
  { id: "dorian", name: "Dorian", intervals: [0, 2, 3, 5, 7, 9, 10] },
  { id: "phrygian", name: "Phrygian", intervals: [0, 1, 3, 5, 7, 8, 10] },
  { id: "lydian", name: "Lydian", intervals: [0, 2, 4, 6, 7, 9, 11] },
  { id: "mixolydian", name: "Mixolydian", intervals: [0, 2, 4, 5, 7, 9, 10] },
  { id: "locrian", name: "Locrian", intervals: [0, 1, 3, 5, 6, 8, 10] },
  { id: "harmonic-minor", name: "Harmonic Minor", intervals: [0, 2, 3, 5, 7, 8, 11] },
  { id: "melodic-minor", name: "Melodic Minor", intervals: [0, 2, 3, 5, 7, 9, 11] },
  { id: "major-blues", name: "Major Blues", intervals: [0, 2, 3, 4, 7, 9] },
];

export interface ScaleMatch {
  root: Note;
  scale: ScaleDef;
  notes: Note[];
  matched: Note[];
  coverage: number;
}

export interface Connection {
  match: ScaleMatch;
  shared: Note[];
  onlyThere: Note[];
  reason: string;
}

export function noteIndex(note: Note): number {
  return NOTES.indexOf(note);
}

export function transpose(note: Note, semitones: number): Note {
  return NOTES[(((noteIndex(note) + semitones) % 12) + 12) % 12];
}

export function scaleNotes(root: Note, scale: ScaleDef): Note[] {
  return scale.intervals.map((interval) => transpose(root, interval));
}

export function scaleKey(item: { root: Note; scale: ScaleDef }): string {
  return `${item.root}-${item.scale.id}`;
}

export function scaleLabel(item: { root: Note; scale: ScaleDef }): string {
  return `${item.root} ${item.scale.name}`;
}

function buildMatch(root: Note, scale: ScaleDef, selected: readonly Note[]): ScaleMatch {
  const notes = scaleNotes(root, scale);
  const matched = notes.filter((n) => selected.includes(n));
  return { root, scale, notes, matched, coverage: matched.length / notes.length };
}

/**
 * Every root × scale that contains all selected notes. Scales rooted on a picked
 * note come first, then tighter fits (higher coverage).
 */
export function findScales(selectedNotes: readonly Note[]): ScaleMatch[] {
  const selected = [...new Set(selectedNotes)];
  if (selected.length === 0) return [];

  const results: { match: ScaleMatch; order: number }[] = [];
  let order = 0;
  for (const root of NOTES) {
    for (const scale of SCALES) {
      const match = buildMatch(root, scale, selected);
      if (match.matched.length === selected.length) results.push({ match, order });
      order++;
    }
  }

  return results
    .sort((a, b) => {
      const aRoot = selected.includes(a.match.root) ? 0 : 1;
      const bRoot = selected.includes(b.match.root) ? 0 : 1;
      if (aRoot !== bRoot) return aRoot - bRoot;
      if (a.match.coverage !== b.match.coverage) return b.match.coverage - a.match.coverage;
      return a.order - b.order;
    })
    .map((r) => r.match);
}

function joinNotes(notes: readonly Note[]): string {
  return notes.join(", ");
}

function connectionReason(
  from: { root: Note; scale: ScaleDef; notes: readonly Note[] },
  to: ScaleMatch,
  onlyThere: readonly Note[],
): string {
  const dropped = from.notes.filter((n) => !to.notes.includes(n));
  const sameRoot = from.root === to.root;

  if (onlyThere.length === 0 && dropped.length === 0) {
    return `Same notes as ${scaleLabel(from)}, but resolving to ${to.root}.`;
  }
  if (onlyThere.length === 0) {
    return `Drop ${joinNotes(dropped)} for a sparser, safer ${sameRoot ? "take on the same root" : "subset"}.`;
  }
  if (sameRoot && dropped.length > 0) {
    return `Same root — swap ${joinNotes(dropped)} for ${joinNotes(onlyThere)} to change the color.`;
  }
  if (sameRoot) {
    return `Same root — add ${joinNotes(onlyThere)} for extra flavor.`;
  }
  return `Shares ${to.notes.length - onlyThere.length} notes; pivot in and add ${joinNotes(onlyThere)}.`;
}

/**
 * Scales that differ from `scale` by at most 2 notes, or share its root.
 * Same-root scales rank first, then by number of shared notes.
 */
export function findConnections(
  scale: { root: Note; scale: ScaleDef; notes: readonly Note[] },
  limit = 4,
): Connection[] {
  const candidates: { connection: Connection; sameRoot: boolean; order: number }[] = [];
  let order = 0;

  for (const root of NOTES) {
    for (const def of SCALES) {
      order++;
      if (root === scale.root && def.id === scale.scale.id) continue;

      const notes = scaleNotes(root, def);
      const shared = notes.filter((n) => scale.notes.includes(n));
      const onlyThere = notes.filter((n) => !scale.notes.includes(n));
      const differing = Math.max(notes.length, scale.notes.length) - shared.length;
      const sameRoot = root === scale.root;
      if (!sameRoot && differing > 2) continue;

      const match: ScaleMatch = {
        root,
        scale: def,
        notes,
        matched: shared,
        coverage: shared.length / notes.length,
      };
      candidates.push({
        connection: { match, shared, onlyThere, reason: connectionReason(scale, match, onlyThere) },
        sameRoot,
        order,
      });
    }
  }

  return candidates
    .sort((a, b) => {
      if (a.sameRoot !== b.sameRoot) return a.sameRoot ? -1 : 1;
      const sharedDiff = b.connection.shared.length - a.connection.shared.length;
      if (sharedDiff !== 0) return sharedDiff;
      const newDiff = a.connection.onlyThere.length - b.connection.onlyThere.length;
      if (newDiff !== 0) return newDiff;
      return a.order - b.order;
    })
    .slice(0, Math.max(0, limit))
    .map((c) => c.connection);
}

/* ---------- Bass neck ---------- */

export interface BassString {
  name: Note;
  /** MIDI number of the open string. */
  midi: number;
}

/** Standard tuning, drawn top to bottom (highest string first). */
export const BASS_STRINGS: readonly BassString[] = [
  { name: "G", midi: 43 },
  { name: "D", midi: 38 },
  { name: "A", midi: 33 },
  { name: "E", midi: 28 },
];

export const FRET_COUNT = 12;
export const FRETS: readonly number[] = Array.from({ length: FRET_COUNT + 1 }, (_, i) => i);

export function noteAtFret(string: BassString, fret: number): Note {
  return transpose(string.name, fret);
}

/** E1 and B2 as MIDI numbers: the playback range of the synth. */
export const LOW_MIDI = 28;
export const HIGH_MIDI = 47;

export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * The scale one octave up from the lowest root at or above E1, ending on the
 * high root. For roots C–D# the top of the run passes B2 by a few semitones,
 * because an ascending octave cannot fit between E1 and B2 from those roots.
 */
export function playbackSequence(root: Note, scale: ScaleDef, reverse = false): number[] {
  const rootMidi = LOW_MIDI + ((noteIndex(root) - (LOW_MIDI % 12) + 12) % 12);
  const sequence = [...scale.intervals.map((i) => rootMidi + i), rootMidi + 12];
  return reverse ? sequence.reverse() : sequence;
}
