"use client";

import { useEffect, useMemo, useState } from "react";
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
    <section className="rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-semibold">Chat Pulse</h3>
        <span className="rounded-full bg-(--color-surface-2) px-2 py-0.5 text-[10px] text-(--color-text-muted)">
          Simulated chat
        </span>
      </div>

      {!pulse && loading && <SkeletonPulse />}
      {!pulse && !loading && (
        <p className="text-sm text-(--color-text-muted)">Waiting for chat to build up…</p>
      )}
      {pulse && (
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-(--color-accent) px-2 py-0.5 text-xs text-white capitalize">
              {pulse.mood}
            </span>
            <span className="text-xs text-(--color-text-muted)">Hype {pulse.hypeScore}/100</span>
          </div>
          <ul className="list-disc pl-4">
            {pulse.topTakes.filter(Boolean).map((take, i) => (
              <li key={i}>{take}</li>
            ))}
          </ul>
          <p className="text-(--color-text-muted) italic">&quot;{pulse.standoutMessage}&quot;</p>
        </div>
      )}
    </section>
  );
}

function SkeletonPulse() {
  return (
    <div className="animate-pulse space-y-2 motion-reduce:animate-none">
      <div className="h-3 w-1/3 rounded bg-(--color-surface-2)" />
      <div className="h-3 w-2/3 rounded bg-(--color-surface-2)" />
      <div className="h-3 w-1/2 rounded bg-(--color-surface-2)" />
    </div>
  );
}
