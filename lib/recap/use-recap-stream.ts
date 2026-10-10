"use client";

import { useCallback, useState } from "react";
import type { LocaleCode } from "@/lib/i18n";
import type { FanMode } from "@/components/providers/preferences-provider";

export interface RecapLineData {
  kind: "what_happened" | "where_it_stands" | "why_it_matters";
  text: string;
  refs: number[];
}

interface RecapStreamState {
  status: "idle" | "loading" | "streaming" | "done" | "error";
  headline: string | null;
  trust: { source: "ai" | "fallback"; verified: number; total: number } | null;
  lines: RecapLineData[];
  errorMessage: string | null;
}

type StreamChunk =
  | { type: "headline"; text: string }
  | { type: "trust"; source: "ai" | "fallback"; verified: number; total: number }
  | { type: "line"; kind: RecapLineData["kind"]; text: string; refs: number[] }
  | { type: "done" };

const initialState: RecapStreamState = { status: "idle", headline: null, trust: null, lines: [], errorMessage: null };

export function useRecapStream() {
  const [state, setState] = useState<RecapStreamState>(initialState);

  const start = useCallback(async (args: { from: number; to: number; locale: LocaleCode; mode: FanMode }) => {
    setState({ ...initialState, status: "loading" });
    try {
      const res = await fetch("/api/recap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(args),
      });
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({}));
        setState((s) => ({ ...s, status: "error", errorMessage: body.error ?? `Request failed (${res.status}).` }));
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      setState((s) => ({ ...s, status: "streaming" }));

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          if (!part.trim()) continue;
          const chunk = JSON.parse(part) as StreamChunk;
          applyChunk(chunk, setState);
        }
      }
      setState((s) => (s.status === "error" ? s : { ...s, status: "done" }));
    } catch {
      setState((s) => ({ ...s, status: "error", errorMessage: "Could not reach the server." }));
    }
  }, []);

  const reset = useCallback(() => setState(initialState), []);

  return { ...state, start, reset };
}

function applyChunk(chunk: StreamChunk, setState: React.Dispatch<React.SetStateAction<RecapStreamState>>) {
  setState((s) => {
    switch (chunk.type) {
      case "headline":
        return { ...s, headline: chunk.text };
      case "trust":
        return { ...s, trust: { source: chunk.source, verified: chunk.verified, total: chunk.total } };
      case "line":
        return { ...s, lines: [...s.lines, { kind: chunk.kind, text: chunk.text, refs: chunk.refs }] };
      case "done":
        return { ...s, status: "done" };
      default:
        return s;
    }
  });
}
