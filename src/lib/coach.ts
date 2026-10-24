export const MAX_PROMPT_LENGTH = 1000;

export const COACH_SYSTEM_PROMPT =
  "You are a friendly, practical bass teacher. The player describes a chord progression or musical feel. Reply in concise Markdown with: 1. Recommended scales — 2–4 scales (root + name) with their notes, why each fits and which chords it covers. 2. How to connect them — pivot/shared notes, when to switch, and one concrete fretboard tip for 4-string bass in standard tuning (E A D G) with string and fret numbers. 3. Groove idea — one short line about rhythm. Under 250 words. Use sharps.";

export const EXAMPLE_PROMPTS = [
  "ii–V–I in C, jazzy walking feel",
  "Am – F – C – G, slow and moody",
  "12-bar blues in E, shuffle",
  "Funky one-chord vamp on D7",
] as const;

/** Trimmed, length-limited prompt, or null when there is nothing to ask. */
export function normalizePrompt(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const prompt = input.trim().slice(0, MAX_PROMPT_LENGTH).trim();
  return prompt.length > 0 ? prompt : null;
}

function errorDetails(error: unknown): { status?: number; text: string } {
  if (typeof error !== "object" || error === null) return { text: String(error ?? "") };
  const e = error as { statusCode?: unknown; status?: unknown; message?: unknown; responseBody?: unknown; name?: unknown };
  const status =
    typeof e.statusCode === "number" ? e.statusCode : typeof e.status === "number" ? e.status : undefined;
  const text = [e.name, e.message, e.responseBody].filter((v) => typeof v === "string").join(" ");
  return { status, text: text.toLowerCase() };
}

/** A friendly, user-facing explanation for an AI provider failure. */
export function friendlyCoachError(error: unknown): string {
  const { status, text } = errorDetails(error);
  if (text.includes("insufficient_quota") || text.includes("quota") || text.includes("billing") || status === 402) {
    return "The coach is out of credits right now. Please try again later.";
  }
  if (status === 429 || text.includes("rate limit")) {
    return "The coach is getting a lot of requests — please wait a moment and try again.";
  }
  return "The coach is unavailable right now. Please try again in a little while.";
}
