"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { EXAMPLE_PROMPTS, MAX_PROMPT_LENGTH } from "@/lib/coach";
import { Markdown } from "./Markdown";

export function Coach() {
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const ask = async (text: string) => {
    const question = text.trim();
    if (!question) {
      setError("Describe a progression or feel first.");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setAnswer("");
    setError(null);
    setStreaming(true);

    try {
      const res = await fetch("/api/scale-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: question }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        setError((await res.text()) || "The coach is unavailable right now.");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setAnswer((prev) => prev + chunk);
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") setError("Couldn't reach the coach. Check your connection and try again.");
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        setStreaming(false);
      }
    }
  };

  const stop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (streaming) stop();
    else void ask(prompt);
  };

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <label htmlFor="coach-prompt" className="sr-only">
          Describe a progression or feel
        </label>
        <textarea
          id="coach-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
          maxLength={MAX_PROMPT_LENGTH}
          rows={3}
          placeholder="Describe a progression or feel…"
          className="w-full resize-y rounded-xl border border-line bg-surface p-3 text-sm text-fg placeholder:text-faint focus:border-accent focus:outline-none"
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="submit"
            className={`h-10 min-w-28 rounded-lg px-4 font-mono text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              streaming ? "bg-fg text-bg" : "bg-accent text-accent-ink hover:brightness-110"
            }`}
          >
            {streaming ? "Stop" : "Get scales"}
          </button>
          {EXAMPLE_PROMPTS.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => {
                setPrompt(example);
                void ask(example);
              }}
              className="rounded-full border border-line px-3 py-1.5 font-mono text-xs text-muted transition-colors hover:border-accent hover:text-fg"
            >
              {example}
            </button>
          ))}
        </div>
      </form>

      {error && (
        <p role="alert" className="font-mono text-sm text-danger">
          {error}
        </p>
      )}

      {(answer || streaming) && (
        <div className="rounded-xl border border-line bg-surface p-4" aria-live="polite" aria-busy={streaming}>
          {answer ? (
            <Markdown source={answer} />
          ) : (
            <p className="font-mono text-sm text-muted">The coach is thinking…</p>
          )}
          {streaming && answer && <span className="mt-2 inline-block h-4 w-2 animate-pulse bg-accent" aria-hidden />}
        </div>
      )}
    </div>
  );
}
