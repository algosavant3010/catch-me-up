"use client";

import { useState } from "react";
import { ArrowUpRight, LoaderCircle, Send } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { usePreferences } from "@/components/providers/preferences-provider";
import { useMatchRuntime } from "@/lib/match/match-context";
import { RefChip } from "@/components/recap/RefChip";
import { track } from "@/lib/analytics/track";

const SUGGESTED = ["What's the required rate?", "Who's on strike?", "What does powerplay mean?"];

interface AskResponse {
  answer: string;
  refs: number[];
  onTopic: boolean;
  source: "ai" | "fallback";
}

export function SamjhaoSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { locale, mode, strings } = usePreferences();
  const { balls } = useMatchRuntime();
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<{ question: string; response: AskResponse }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cutoffBall = balls.length > 0 ? balls[balls.length - 1].n : 0;

  async function ask(q: string) {
    if (!q.trim() || loading) return;
    track("ask_submitted");
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, cutoffBall, locale, mode }),
      });
      if (!res.ok) throw new Error("Request failed");
      const data = (await res.json()) as AskResponse;
      setHistory((h) => [...h, { question: q, response: data }]);
      setQuestion("");
    } catch {
      setError("Could not get an answer. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={strings["nav.ask"]}>
      <div className="flex flex-col gap-5">
        <div>
          <p className="field-label mb-2">Suggested questions</p>
          <div className="grid gap-2">
            {SUGGESTED.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => ask(s)}
                disabled={loading}
                className="button-secondary justify-between text-left text-xs font-semibold sm:text-sm"
              >
                <span>{s}</span>
                <ArrowUpRight
                  size={16}
                  aria-hidden="true"
                  className="shrink-0 text-(--color-accent)"
                />
              </button>
            ))}
          </div>
        </div>

        {history.length > 0 && (
          <div
            className="flex max-h-72 flex-col gap-3 overflow-y-auto rounded-xl border border-(--color-border) bg-(--color-surface-2)/30 p-3"
            aria-live="polite"
          >
            {history.map((h, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <p className="self-end rounded-xl bg-(--color-accent) px-3.5 py-2 text-xs font-semibold text-white shadow-xs sm:text-sm">
                  {h.question}
                </p>
                <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-3 text-xs leading-relaxed sm:text-sm">
                  <p>{h.response.onTopic ? h.response.answer : strings["ask.offTopic"]}</p>
                  {h.response.refs.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {h.response.refs.map((r) => (
                        <RefChip key={r} ballNumber={r} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(question);
          }}
          className="border-t border-(--color-border) pt-4"
        >
          <label htmlFor="match-question" className="field-label">
            Your question
          </label>
          <div className="flex gap-2">
            <input
              id="match-question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={strings["ask.placeholder"]}
              maxLength={500}
              className="flex-1 rounded-xl border border-(--color-border) bg-(--color-surface-2) px-3.5 py-2.5 text-sm transition focus:border-(--color-accent) focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="button-primary shrink-0 px-4"
              aria-label={strings["nav.ask"]}
            >
              {loading ? (
                <LoaderCircle size={18} className="animate-spin" aria-hidden="true" />
              ) : (
                <Send size={18} aria-hidden="true" />
              )}
              <span className="hidden sm:inline">{strings["nav.ask"]}</span>
            </button>
          </div>
          {loading && (
            <p
              role="status"
              className="mt-2 flex items-center gap-2 text-xs text-(--color-text-muted)"
            >
              <LoaderCircle size={14} className="animate-spin text-(--color-accent)" />
              Checking the match...
            </p>
          )}
          {error && (
            <p role="alert" className="mt-2 text-xs font-semibold text-(--color-danger)">
              {error}
            </p>
          )}
        </form>
      </div>
    </Sheet>
  );
}
