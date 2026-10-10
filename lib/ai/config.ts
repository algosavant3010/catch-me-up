/**
 * Central place for AI configuration. Model names are never hardcoded at
 * call sites — see docs/DECISIONS.md #1 for why these two defaults were
 * chosen over gemini-3.8-flash.
 */
export const DEFAULT_QUALITY_MODEL = "gemini-3.6-flash";
export const DEFAULT_FAST_MODEL = "gemini-3.5-flash-lite";

export const PROMPT_VERSION = "v1";

export function getQualityModel(): string {
  return process.env.GEMINI_MODEL_QUALITY?.trim() || DEFAULT_QUALITY_MODEL;
}

export function getFastModel(): string {
  return process.env.GEMINI_MODEL_FAST?.trim() || DEFAULT_FAST_MODEL;
}

export function isAiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

export const TIMEOUTS = {
  quickMs: 8_000,
  recapMs: 15_000,
} as const;
