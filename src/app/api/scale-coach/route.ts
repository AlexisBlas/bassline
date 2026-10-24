import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { COACH_SYSTEM_PROMPT, friendlyCoachError, normalizePrompt } from "@/lib/coach";

const MODEL = process.env.OPENAI_MODEL || "gpt-5.4-mini";

export async function POST(request: Request) {
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    // An unreadable body is treated like an empty prompt.
  }

  const prompt = normalizePrompt((body as { prompt?: unknown } | null)?.prompt);
  if (!prompt) {
    return new Response("Please describe a progression or feel.", {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let failed = false;
      const fail = (error: unknown) => {
        if (failed || request.signal.aborted) return;
        failed = true;
        console.error("[scale-coach]", error);
        controller.enqueue(encoder.encode(`\n\n**Heads up:** ${friendlyCoachError(error)}`));
      };

      try {
        const result = streamText({
          model: openai(MODEL),
          instructions: COACH_SYSTEM_PROMPT,
          prompt,
          abortSignal: request.signal,
        });
        for await (const part of result.stream) {
          if (part.type === "text-delta") controller.enqueue(encoder.encode(part.text));
          else if (part.type === "error") fail(part.error);
        }
      } catch (error) {
        fail(error);
      } finally {
        try {
          controller.close();
        } catch {
          // Already closed because the client disconnected.
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
