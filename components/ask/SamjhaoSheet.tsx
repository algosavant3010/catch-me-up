"use client";

import { useState } from "react";
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

  const cutoffBall = balls.length > 0 ? balls[balls.length - 1].n : 0;

  async function ask(q: string) {
    if (!q.trim() || loading) return;
    track("ask_submitted");
    setLoading(true);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, cutoffBall, locale, mode }),
      });
      const data = (await res.json()) as AskResponse;
      setHistory((h) => [...h, { question: q, response: data }]);
      setQuestion("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={strings["nav.ask"]}>
      <div className="flex max-h-[60vh] flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {SUGGESTED.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => ask(s)}
              className="rounded-full border border-(--color-border) bg-(--color-surface-2) px-3 py-1 text-xs"
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
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
          className="flex gap-2"
        >
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={strings["ask.placeholder"]}
            maxLength={500}
            className="flex-1 rounded-full border border-(--color-border) bg-(--color-bg) px-4 py-2 text-sm outline-none focus:border-(--color-accent)"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-(--color-accent) px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {strings["nav.ask"]}
          </button>
        </form>
      </div>
    </Sheet>
  );
}
