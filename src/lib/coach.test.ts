import { describe, expect, it } from "vitest";
import { MAX_PROMPT_LENGTH, friendlyCoachError, normalizePrompt } from "./coach";

describe("normalizePrompt", () => {
  it("trims and rejects empty or non-string prompts", () => {
    expect(normalizePrompt("  12-bar blues in E  ")).toBe("12-bar blues in E");
    expect(normalizePrompt("   ")).toBeNull();
    expect(normalizePrompt(undefined)).toBeNull();
    expect(normalizePrompt(42)).toBeNull();
  });

  it("limits prompts to 1000 characters", () => {
    expect(normalizePrompt("a".repeat(1500))).toHaveLength(MAX_PROMPT_LENGTH);
  });
});

describe("friendlyCoachError", () => {
  it("explains quota, rate limit and generic failures", () => {
    expect(friendlyCoachError({ statusCode: 429, responseBody: '{"error":{"code":"insufficient_quota"}}' })).toMatch(
      /out of credits/,
    );
    expect(friendlyCoachError({ statusCode: 429, message: "Too many requests" })).toMatch(/lot of requests/);
    expect(friendlyCoachError(new Error("OpenAI API key is missing"))).toMatch(/unavailable/);
  });
});
