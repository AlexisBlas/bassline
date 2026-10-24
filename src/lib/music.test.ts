import { describe, expect, it } from "vitest";
import {
  BASS_STRINGS,
  FRETS,
  NOTES,
  SCALES,
  findConnections,
  findScales,
  noteAtFret,
  playbackSequence,
  scaleKey,
  scaleNotes,
  type Note,
  type ScaleDef,
} from "./music";

const scale = (id: string): ScaleDef => {
  const def = SCALES.find((s) => s.id === id);
  if (!def) throw new Error(`unknown scale ${id}`);
  return def;
};

const asScale = (root: Note, id: string) => ({ root, scale: scale(id), notes: scaleNotes(root, scale(id)) });

describe("constants", () => {
  it("uses 12 sharp note names", () => {
    expect(NOTES).toEqual(["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]);
  });

  it("defines 13 scales including the required 12", () => {
    expect(SCALES).toHaveLength(13);
    const ids = SCALES.map((s) => s.id);
    for (const id of [
      "major",
      "natural-minor",
      "major-pentatonic",
      "minor-pentatonic",
      "blues",
      "dorian",
      "phrygian",
      "lydian",
      "mixolydian",
      "locrian",
      "harmonic-minor",
      "melodic-minor",
    ]) {
      expect(ids).toContain(id);
    }
    expect(new Set(ids).size).toBe(13);
  });

  it("builds scale notes from intervals", () => {
    expect(scaleNotes("C", scale("major"))).toEqual(["C", "D", "E", "F", "G", "A", "B"]);
    expect(scaleNotes("A", scale("minor-pentatonic"))).toEqual(["A", "C", "D", "E", "G"]);
    expect(scaleNotes("E", scale("blues"))).toEqual(["E", "G", "A", "A#", "B", "D"]);
  });
});

describe("findScales", () => {
  it("returns nothing when no notes are picked", () => {
    expect(findScales([])).toEqual([]);
  });

  it("only returns scales that contain every selected note", () => {
    const selected: Note[] = ["C", "E", "G", "B"];
    const results = findScales(selected);
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      for (const n of selected) expect(r.notes).toContain(n);
      expect(r.matched).toHaveLength(selected.length);
      expect(r.coverage).toBeCloseTo(selected.length / r.notes.length);
    }
    const keys = results.map(scaleKey);
    expect(keys).toContain("C-major");
    expect(keys).toContain("G-major");
    expect(keys).toContain("E-natural-minor");
    expect(keys).not.toContain("C-mixolydian");
  });

  it("checks every root × scale", () => {
    const results = findScales(["C"]);
    const containingC = NOTES.flatMap((root) =>
      SCALES.filter((s) => scaleNotes(root, s).includes("C")).map((s) => `${root}-${s.id}`),
    );
    expect(results.map(scaleKey).sort()).toEqual(containingC.sort());
  });

  it("puts scales rooted on a selected note first", () => {
    const selected: Note[] = ["A", "C", "E"];
    const results = findScales(selected);
    const firstOther = results.findIndex((r) => !selected.includes(r.root));
    expect(firstOther).toBeGreaterThan(0);
    expect(results.slice(0, firstOther).every((r) => selected.includes(r.root))).toBe(true);
    expect(results.slice(firstOther).every((r) => !selected.includes(r.root))).toBe(true);
  });

  it("returns the root, scale, notes, matched and coverage fields", () => {
    const [first] = findScales(["E", "G", "A", "B", "D"]);
    expect(first).toMatchObject({ root: expect.any(String), scale: expect.any(Object) });
    expect(first.notes.length).toBeGreaterThanOrEqual(5);
    expect(first.coverage).toBeGreaterThan(0);
    expect(first.coverage).toBeLessThanOrEqual(1);
  });

  it("returns nothing for a chromatic cluster no scale contains", () => {
    expect(findScales(["C", "C#", "D", "D#"])).toEqual([]);
  });
});

describe("findConnections", () => {
  it("returns at most `limit` results, defaulting to 4", () => {
    expect(findConnections(asScale("C", "major"))).toHaveLength(4);
    expect(findConnections(asScale("C", "major"), 2)).toHaveLength(2);
  });

  it("never suggests the scale itself", () => {
    const results = findConnections(asScale("C", "major"), 200);
    expect(results.map((c) => scaleKey(c.match))).not.toContain("C-major");
  });

  it("only keeps same-root scales or scales differing by 2 or fewer notes", () => {
    const from = asScale("A", "natural-minor");
    const results = findConnections(from, 200);
    expect(results.length).toBeGreaterThan(4);
    for (const c of results) {
      const differing = Math.max(c.match.notes.length, from.notes.length) - c.shared.length;
      expect(c.match.root === "A" || differing <= 2).toBe(true);
    }
    const keys = results.map((c) => scaleKey(c.match));
    expect(keys).toContain("C-major");
    expect(keys).toContain("A-locrian");
    expect(keys).not.toContain("F#-major");
  });

  it("ranks same-root scales first, then by shared notes", () => {
    const results = findConnections(asScale("A", "natural-minor"), 200);
    const firstOther = results.findIndex((c) => c.match.root !== "A");
    expect(firstOther).toBeGreaterThan(0);
    expect(results.slice(firstOther).every((c) => c.match.root !== "A")).toBe(true);
    for (const group of [results.slice(0, firstOther), results.slice(firstOther)]) {
      for (let i = 1; i < group.length; i++) {
        expect(group[i - 1].shared.length).toBeGreaterThanOrEqual(group[i].shared.length);
      }
    }
  });

  it("splits notes into shared and onlyThere with a short reason", () => {
    const from = asScale("C", "major");
    for (const c of findConnections(from, 200)) {
      expect([...c.shared, ...c.onlyThere].sort()).toEqual([...c.match.notes].sort());
      for (const n of c.shared) expect(from.notes).toContain(n);
      for (const n of c.onlyThere) expect(from.notes).not.toContain(n);
      expect(c.reason.length).toBeGreaterThan(0);
      expect(c.reason.length).toBeLessThan(120);
      expect(c.reason.endsWith(".")).toBe(true);
    }
  });

  it("explains a modal swap on the same root", () => {
    const [first] = findConnections(asScale("C", "major"));
    expect(first.match.root).toBe("C");
    expect(first.shared).toHaveLength(6);
    expect(first.onlyThere).toHaveLength(1);
    expect(first.reason).toMatch(/Same root/);
  });

  it("returns an empty list for limit 0", () => {
    expect(findConnections(asScale("E", "blues"), 0)).toEqual([]);
  });
});

describe("bass neck", () => {
  it("is tuned G D A E from top to bottom with frets 0–12", () => {
    expect(BASS_STRINGS.map((s) => s.name)).toEqual(["G", "D", "A", "E"]);
    expect(FRETS).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(noteAtFret(BASS_STRINGS[3], 5)).toBe("A");
    expect(noteAtFret(BASS_STRINGS[0], 12)).toBe("G");
  });

  it("plays the scale up an octave and ends on the high root", () => {
    const seq = playbackSequence("E", scale("major-pentatonic"));
    expect(seq).toEqual([28, 30, 32, 35, 37, 40]);
    expect(playbackSequence("E", scale("major-pentatonic"), true)).toEqual([40, 37, 35, 32, 30, 28]);
  });

  it("starts on the lowest root at or above E1", () => {
    expect(playbackSequence("B", scale("major"))[0]).toBe(35);
    expect(playbackSequence("A", scale("major")).at(-1)).toBe(45);
    expect(playbackSequence("C", scale("major"))[0]).toBe(36);
  });
});
