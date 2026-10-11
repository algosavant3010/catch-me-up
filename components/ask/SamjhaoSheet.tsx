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
        <div className="grid gap-2">
          {SUGGESTED.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => ask(s)}
              disabled={loading}
              className="button-secondary justify-between text-left"
            >
              {s}
              <ArrowUpRight size={16} aria-hidden="true" />
            </button>
          ))}
        </div>

        <div className="flex max-h-64 flex-col gap-4 overflow-y-auto" aria-live="polite">
          {history.map((h, i) => (
            <div key={i} className="flex flex-col gap-1">
              <p className="self-end rounded-(--radius-md) bg-(--color-accent) px-3 py-2 text-sm text-white">
                {h.question}
              </p>
              <div className="rounded-(--radius-md) bg-(--color-surface-2) px-3 py-2 text-sm">
                <p>{h.response.onTopic ? h.response.answer : strings["ask.offTopic"]}</p>
                {h.response.refs.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {h.response.refs.map((r) => (
                      <RefChip key={r} ballNumber={r} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

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
              className="flex-1"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="button-primary shrink-0"
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
            <p role="status" className="mt-2 text-sm text-(--color-text-muted)">
              Checking the match...
            </p>
          )}
          {error && (
            <p role="alert" className="mt-2 text-sm text-(--color-danger)">
              {error}
            </p>
          )}
        </form>
      </div>
    </Sheet>
  );
}
