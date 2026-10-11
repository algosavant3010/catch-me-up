"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Flame, MessageSquareQuote } from "lucide-react";
import { useMatchState } from "@/lib/match/use-match-state";
import { usePreferences } from "@/components/providers/preferences-provider";
import { generateChatForBall, type ChatMessage } from "@/lib/chat/generator";

interface PulseData {
  topTakes: string[];
  mood: string;
  hypeScore: number;
  standoutMessage: string;
  source: "ai" | "fallback";
}

const PULSE_INTERVAL_MS = 20_000;

export function ChatPulsePanel() {
  const { locale } = usePreferences();
  const { balls } = useMatchState();
  const [pulse, setPulse] = useState<PulseData | null>(null);
  const [loading, setLoading] = useState(false);

  // Pure derivation of chat from display balls — no state, no effect needed.
  const messages = useMemo<ChatMessage[]>(
    () => balls.flatMap((ball) => generateChatForBall(ball)).slice(-60),
    [balls],
  );

  useEffect(() => {
    const id = setInterval(async () => {
      if (messages.length === 0) return;
      setLoading(true);
      try {
        const res = await fetch("/api/chat-pulse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: messages
              .slice(-20)
              .map((m) => ({ username: m.username, text: m.text, toxic: m.toxic })),
            locale,
          }),
        });
        if (res.ok) setPulse(await res.json());
      } catch {
        // Network failure: keep showing the last known pulse, no crash.
      } finally {
        setLoading(false);
      }
    }, PULSE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [messages, locale]);

  return (
    <section className="feature-panel">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="section-heading mb-0">
          <Activity aria-hidden="true" />
          Chat Pulse
        </h3>
        <span className="eyebrow flex items-center gap-1.5 font-bold">
          <span className="size-1.5 animate-pulse rounded-full bg-(--color-success)" />
          Simulated chat
        </span>
      </div>

      {!pulse && loading && <SkeletonPulse />}
      {!pulse && !loading && (
        <div className="flex min-h-28 flex-col items-center justify-center rounded-xl border border-dashed border-(--color-border) p-4 text-center">
          <MessageSquareQuote className="mb-2 size-6 text-(--color-text-muted)" />
          <p className="text-xs text-(--color-text-muted)">Waiting for match chat to build up…</p>
        </div>
      )}
      {pulse && (
        <div className="flex flex-col gap-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-(--color-accent)/10 px-3 py-1 text-xs font-bold text-(--color-accent) capitalize">
              <Flame size={12} />
              {pulse.mood}
            </span>
            <span className="text-xs font-semibold text-(--color-text-muted) tabular-nums">
              Hype <strong className="text-(--color-text)">{pulse.hypeScore}</strong>/100
            </span>
          </div>
          <ul className="space-y-1.5 rounded-xl border border-(--color-border) bg-(--color-surface-2)/40 p-3 text-xs leading-relaxed">
            {pulse.topTakes.filter(Boolean).map((take, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1 size-1 shrink-0 rounded-full bg-(--color-accent)" />
                <span>{take}</span>
              </li>
            ))}
          </ul>
          <p className="rounded-xl border-l-2 border-(--color-accent) bg-(--color-surface-2) p-3 text-xs text-(--color-text-muted) italic">
            &quot;{pulse.standoutMessage}&quot;
          </p>
        </div>
      )}
    </section>
  );
}

function SkeletonPulse() {
  return (
    <div className="animate-pulse space-y-2.5 motion-reduce:animate-none">
      <div className="h-4 w-1/3 rounded-lg bg-(--color-surface-2)" />
      <div className="h-12 w-full rounded-lg bg-(--color-surface-2)" />
      <div className="h-8 w-2/3 rounded-lg bg-(--color-surface-2)" />
    </div>
  );
}
