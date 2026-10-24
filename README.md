# Bassline

A one-page web app for bass players: pick notes, get scale suggestions, see and hear them on a 4-string bass neck, find nearby scales to connect to, and ask an AI coach for scale ideas over a progression.

Built with Next.js (App Router), React, TypeScript and Tailwind CSS. No login, no database. Sound is synthesized with the Web Audio API (no audio libraries).

## Setup

Requires Node.js 20.9+ (tested on Node 22).

```bash
git clone https://github.com/AlexisBlas/bassline.git
cd bassline
npm install
cp .env.example .env    # then add your OpenAI key
npm run dev             # http://localhost:3000
```

### Environment

| Variable         | Required          | Description                                                   |
| ---------------- | ----------------- | ------------------------------------------------------------- |
| `OPENAI_API_KEY` | For the AI coach  | Read on the server only by `POST /api/scale-coach`.           |
| `OPENAI_MODEL`   | No                | Overrides the coach model (default `gpt-5.4-mini`).           |

Everything except section 5 ("Ask the coach") works without a key. Without one, the coach replies with a friendly "unavailable" message.

## Scripts

| Command             | What it does                        |
| ------------------- | ----------------------------------- |
| `npm run dev`       | Start the dev server                |
| `npm run build`     | Production build                    |
| `npm start`         | Serve the production build          |
| `npm run typecheck` | TypeScript check (`tsc --noEmit`)   |
| `npm run lint`      | ESLint                              |
| `npm test`          | Unit tests (Vitest)                 |

## How it works

- `src/lib/music.ts` — notes, the 13 scales, `findScales`, `findConnections`, bass tuning and playback ranges. Unit tests live next to it in `music.test.ts`.
- `src/lib/bass-synth.ts` — Web Audio synth bass (sawtooth + sub sine, 900→300 Hz lowpass sweep, pluck envelope) and a timer-loop scale player whose speed, loop and reverse settings apply live.
- `src/app/api/scale-coach/route.ts` — streams the coach's answer as plain text using the Vercel AI SDK (`ai` + `@ai-sdk/openai`).
- `src/components/` — the UI sections: note picker, scale grid, fretboard with playback bar, connections and the coach.

### API

`POST /api/scale-coach` with JSON `{ "prompt": "12-bar blues in E, shuffle" }`. The prompt is trimmed and limited to 1000 characters; an empty prompt returns `400`. The response is a `text/plain` stream of Markdown. Provider failures (out of credits, rate limits, outages) append a friendly message to the stream.
