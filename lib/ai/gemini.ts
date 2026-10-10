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

export interface ToolCallingParams<T> {
  task: string;
  model: string;
  systemInstruction: string;
  contents: import("@google/genai").Content[];
  tools: import("@google/genai").FunctionDeclaration[];
  schema: z.ZodType<T>;
  geminiSchema: Schema;
  timeoutMs: number;
  maxRounds?: number;
  executeTool: (name: string, args: Record<string, unknown>) => Record<string, unknown>;
}

/**
 * Bounded function-calling loop: the model may call tools for up to
 * `maxRounds` turns before it must produce a final answer matching the
 * given schema. Tool execution happens entirely server-side via the
 * caller-supplied `executeTool`.
 */
export async function generateWithTools<T>(params: ToolCallingParams<T>): Promise<AiResult<T>> {
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
  const maxRounds = params.maxRounds ?? 4;
  const contents = [...params.contents];

  try {
    for (let round = 0; round < maxRounds; round += 1) {
      const response = await ai.models.generateContent({
        model: params.model,
        contents,
        config: {
          systemInstruction: params.systemInstruction,
          temperature: 0.2,
          maxOutputTokens: 500,
          responseMimeType: "application/json",
          responseSchema: params.geminiSchema,
          tools: [{ functionDeclarations: params.tools }],
          safetySettings: SAFETY_SETTINGS,
          thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
          abortSignal: controller.signal,
        },
      });

      const finishReason = response.candidates?.[0]?.finishReason;
      if (finishReason && finishReason !== "STOP" && finishReason !== "MAX_TOKENS") {
        const latencyMs = Date.now() - start;
        logCall({
          task: params.task,
          model: params.model,
          result: "blocked",
          finishReason,
          latencyMs,
        });
        return { ok: false, kind: "blocked", message: `Blocked: ${finishReason}`, latencyMs };
      }

      const calls = response.functionCalls;
      if (!calls || calls.length === 0) {
        const latencyMs = Date.now() - start;
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
          return {
            ok: false,
            kind: "invalid_response",
            message: "Model did not return valid JSON.",
            latencyMs,
          };
        }
        const parsed = params.schema.safeParse(parsedJson);
        if (!parsed.success) {
          return {
            ok: false,
            kind: "invalid_response",
            message: `Response did not match schema: ${parsed.error.issues.map((i) => i.message).join("; ")}`,
            latencyMs,
          };
        }
        const totalTokens = response.usageMetadata?.totalTokenCount ?? 0;
        logCall({
          task: params.task,
          model: params.model,
          result: "ok",
          latencyMs,
          totalTokens,
          rounds: round,
        });
        return { ok: true, data: parsed.data, latencyMs, totalTokens };
      }

      const modelContent = response.candidates?.[0]?.content ?? {
        role: "model",
        parts: calls.map((c) => ({ functionCall: c })),
      };
      contents.push(modelContent);
      contents.push({
        role: "user",
        parts: calls.map((call) => ({
          functionResponse: {
            name: call.name,
            response: { output: params.executeTool(call.name ?? "", call.args ?? {}) },
          },
        })),
      });
    }

    const latencyMs = Date.now() - start;
    logCall({ task: params.task, model: params.model, result: "max_rounds_exceeded", latencyMs });
    return {
      ok: false,
      kind: "invalid_response",
      message: "Exceeded maximum tool-call rounds.",
      latencyMs,
    };
  } catch (err) {
    const latencyMs = Date.now() - start;
    if (controller.signal.aborted) {
      logCall({ task: params.task, model: params.model, result: "timeout", latencyMs });
      return { ok: false, kind: "timeout", message: "Request timed out.", latencyMs };
    }
    const status = (err as { status?: number })?.status;
    if (status === 429) {
      return { ok: false, kind: "rate_limited", message: "Gemini rate limit hit.", latencyMs };
    }
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

interface VisionCallParams<T> {
  task: string;
  model: string;
  systemInstruction: string;
  imageBase64: string;
  mimeType: string;
  schema: z.ZodType<T>;
  geminiSchema: Schema;
  timeoutMs: number;
}

/** Single-shot multimodal call: one image in, structured JSON out. Used only by Snap the TV. */
export async function generateVision<T>(params: VisionCallParams<T>): Promise<AiResult<T>> {
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
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: params.mimeType, data: params.imageBase64 } },
            { text: "Read this cricket scoreboard image." },
          ],
        },
      ],
      config: {
        systemInstruction: params.systemInstruction,
        temperature: 0.1,
        maxOutputTokens: 300,
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
      return { ok: false, kind: "blocked", message: `Blocked: ${finishReason}`, latencyMs };
    }
    const text = response.text;
    if (!text)
      return {
        ok: false,
        kind: "invalid_response",
        message: "Empty response from model.",
        latencyMs,
      };

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(text);
    } catch {
      return {
        ok: false,
        kind: "invalid_response",
        message: "Model did not return valid JSON.",
        latencyMs,
      };
    }
    const parsed = params.schema.safeParse(parsedJson);
    if (!parsed.success) {
      return {
        ok: false,
        kind: "invalid_response",
        message: "Response did not match schema.",
        latencyMs,
      };
    }

    const totalTokens = response.usageMetadata?.totalTokenCount ?? 0;
    logCall({ task: params.task, model: params.model, result: "ok", latencyMs, totalTokens });
    return { ok: true, data: parsed.data, latencyMs, totalTokens };
  } catch (err) {
    const latencyMs = Date.now() - start;
    if (controller.signal.aborted) {
      return { ok: false, kind: "timeout", message: "Request timed out.", latencyMs };
    }
    const status = (err as { status?: number })?.status;
    if (status === 429) {
      return { ok: false, kind: "rate_limited", message: "Gemini rate limit hit.", latencyMs };
    }
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
