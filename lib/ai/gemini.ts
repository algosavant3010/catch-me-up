import {
  GoogleGenAI,
  ThinkingLevel,
  HarmCategory,
  HarmBlockThreshold,
  type Schema,
} from "@google/genai";
import type { z } from "zod";
import { isAiConfigured } from "./config";

export type AiErrorKind =
  "rate_limited" | "blocked" | "timeout" | "upstream" | "invalid_response" | "not_configured";

export type AiResult<T> =
  | { ok: true; data: T; latencyMs: number; totalTokens: number }
  | { ok: false; kind: AiErrorKind; message: string; latencyMs: number };

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI | null {
  if (!isAiConfigured()) return null;
  if (!client) client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

const SAFETY_SETTINGS = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

interface StructuredCallParams<T> {
  task: string;
  model: string;
  systemInstruction: string;
  userContent: string;
  schema: z.ZodType<T>;
  geminiSchema: Schema;
  timeoutMs: number;
  maxOutputTokens?: number;
  temperature?: number;
}

function logCall(entry: Record<string, unknown>): void {
  // Structured, user-text-free logging — never logs prompt/response content.
  console.log(JSON.stringify({ at: "ai.call", ...entry }));
}

/**
 * Calls Gemini with JSON-mode structured output, validates the result
 * against the Zod schema, and maps every failure mode to a typed result.
 * Never throws — callers always get a discriminated `AiResult`.
 */
export async function generateStructured<T>(params: StructuredCallParams<T>): Promise<AiResult<T>> {
  const ai = getClient();
  const start = Date.now();
  if (!ai) {
    return {
      ok: false,
      kind: "not_configured",
      message: "GEMINI_API_KEY is not set.",
      latencyMs: 0,
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), params.timeoutMs);

  try {
    const response = await ai.models.generateContent({
      model: params.model,
      contents: params.userContent,
      config: {
        systemInstruction: params.systemInstruction,
        temperature: params.temperature ?? 0.3,
        maxOutputTokens: params.maxOutputTokens ?? 512,
        responseMimeType: "application/json",
        responseSchema: params.geminiSchema,
        safetySettings: SAFETY_SETTINGS,
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
        abortSignal: controller.signal,
      },
    });
    const latencyMs = Date.now() - start;

    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== "STOP" && finishReason !== "MAX_TOKENS") {
      logCall({
        task: params.task,
        model: params.model,
        result: "blocked",
        finishReason,
        latencyMs,
      });
      return { ok: false, kind: "blocked", message: `Blocked: ${finishReason}`, latencyMs };
    }

    const text = response.text;
    if (!text) {
      logCall({ task: params.task, model: params.model, result: "empty", latencyMs });
      return {
        ok: false,
        kind: "invalid_response",
        message: "Empty response from model.",
        latencyMs,
      };
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(text);
    } catch {
      logCall({ task: params.task, model: params.model, result: "malformed_json", latencyMs });
      return {
        ok: false,
        kind: "invalid_response",
        message: "Model did not return valid JSON.",
        latencyMs,
      };
    }

    const parsed = params.schema.safeParse(parsedJson);
    if (!parsed.success) {
      logCall({ task: params.task, model: params.model, result: "schema_invalid", latencyMs });
      return {
        ok: false,
        kind: "invalid_response",
        message: `Response did not match schema: ${parsed.error.issues.map((i) => i.message).join("; ")}`,
        latencyMs,
      };
    }

    const totalTokens = response.usageMetadata?.totalTokenCount ?? 0;
    logCall({ task: params.task, model: params.model, result: "ok", latencyMs, totalTokens });
    return { ok: true, data: parsed.data, latencyMs, totalTokens };
  } catch (err) {
    const latencyMs = Date.now() - start;
    if (controller.signal.aborted) {
      logCall({ task: params.task, model: params.model, result: "timeout", latencyMs });
      return { ok: false, kind: "timeout", message: "Request timed out.", latencyMs };
    }
    const status = (err as { status?: number })?.status;
    if (status === 429) {
      logCall({ task: params.task, model: params.model, result: "rate_limited", latencyMs });
      return { ok: false, kind: "rate_limited", message: "Gemini rate limit hit.", latencyMs };
    }
    logCall({
      task: params.task,
      model: params.model,
      result: "upstream_error",
      latencyMs,
      status,
    });
    return {
      ok: false,
      kind: "upstream",
      message: err instanceof Error ? err.message : "Unknown upstream error.",
      latencyMs,
    };
  } finally {
    clearTimeout(timer);
  }
}

export { getClient as _getGeminiClientForTesting };
