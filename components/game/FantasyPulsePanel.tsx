"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Crown, Flame, Sparkles, Trophy } from "lucide-react";
import { useMatchState } from "@/lib/match/use-match-state";
import { computeFantasyScores } from "@/lib/fantasy/scoring";
import type { FantasyImpactResponse } from "@/lib/ai/fantasy-impact-service";

export function FantasyPulsePanel() {
  const { balls, state, meta } = useMatchState();
  const [insight, setInsight] = useState<FantasyImpactResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Derive fantasy scores dynamically from match balls
  const leaderboard = useMemo(() => computeFantasyScores(balls), [balls]);

  const matchSituation = `${meta.battingTeam.name} ${state.runs}/${state.wickets} in ${(state.ballsBowled / 6).toFixed(1)} ov, needing ${state.needed} off ${state.ballsLeft} balls`;

  useEffect(() => {
    if (!leaderboard.mvp || leaderboard.topPerformers.length === 0) return;

    let cancelled = false;
    const fetchInsight = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/fantasy-impact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mvpName: leaderboard.mvp!.name,
            mvpPoints: leaderboard.mvp!.totalPoints,
            topPerformers: leaderboard.topPerformers.slice(0, 5),
            matchSituation,
          }),
        });
        if (res.ok && !cancelled) {
          setInsight(await res.json());
        }
      } catch {
        // Fallback silently if network drops
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchInsight();
    return () => {
      cancelled = true;
    };
    // Fetch only when balls count advances significantly (every over / 6 balls)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Math.floor(balls.length / 6)]);

  const copyForWhatsApp = () => {
    if (!leaderboard.mvp) return;
    const text = `🏏 *Dream11 Live Impact*\n👑 MVP: ${leaderboard.mvp.name} (${leaderboard.mvp.totalPoints} pts)\n${leaderboard.topPerformers
      .slice(0, 3)
      .map((p, i) => `${i + 1}. ${p.name}: ${p.totalPoints} pts`)
      .join("\n")}\n\n💡 _${insight?.headline ?? "Live fantasy leaderboard"}_`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="feature-panel">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="section-heading mb-0">
          <Trophy aria-hidden="true" />
          Fantasy Impact
        </h3>
        <span className="eyebrow flex items-center gap-1.5 font-bold">
          <Flame size={13} className="text-(--color-accent)" />
          Dream11 Pulse
        </span>
      </div>

      {!leaderboard.mvp ? (
        <p className="flex min-h-24 items-center justify-center rounded-xl border border-dashed border-(--color-border) p-4 text-xs text-(--color-text-muted)">
          Fantasy points will calculate once the innings begins…
        </p>
      ) : (
        <div className="space-y-4">
          {/* MVP Spotlight Banner */}
          <div className="relative overflow-hidden rounded-xl border border-(--color-accent)/30 bg-gradient-to-r from-(--color-accent)/15 via-(--color-surface-2) to-(--color-surface-2) p-3.5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-lg bg-(--color-accent) text-white shadow-xs">
                  <Crown size={18} />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-(--color-accent)">
                    Match Fantasy MVP
                  </p>
                  <p className="font-bold text-base text-(--color-text)">{leaderboard.mvp.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-extrabold tabular-nums text-(--color-accent)">
                  {leaderboard.mvp.totalPoints}
                </p>
                <p className="text-[10px] font-semibold text-(--color-text-muted)">pts</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-(--color-text-muted)">{leaderboard.mvp.breakdown}</p>
          </div>

          {/* Top 3 Performers */}
          <div className="space-y-1.5">
            <p className="eyebrow">Top Point Scorers</p>
            <div className="divide-y divide-(--color-border) rounded-xl border border-(--color-border) bg-(--color-surface-2)/40 px-3">
              {leaderboard.topPerformers.slice(0, 4).map((p, i) => (
                <div key={p.name} className="flex items-center justify-between py-2 text-xs">
                  <span className="flex items-center gap-2 font-medium">
                    <span className="size-4 flex items-center justify-center rounded-full bg-(--color-surface) text-[10px] font-bold text-(--color-text-muted)">
                      {i + 1}
                    </span>
                    <span>{p.name}</span>
                    <span className="text-[10px] text-(--color-text-muted) capitalize">({p.role})</span>
                  </span>
                  <span className="font-bold tabular-nums text-(--color-text)">{p.totalPoints} pts</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Fantasy Insight */}
          {insight && (
            <div className="rounded-xl border border-(--color-border) bg-(--color-surface-2)/70 p-3.5 text-xs leading-relaxed space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 font-bold text-(--color-accent)">
                  <Sparkles size={13} />
                  AI Fantasy Analysis
                </span>
                <span className="text-[10px] font-semibold text-(--color-text-muted) uppercase">
                  {insight.source === "ai" ? "Gemini 2.5 Flash" : "Rule Engine"}
                </span>
              </div>
              <p className="font-semibold text-(--color-text)">{insight.headline}</p>
              <p className="text-(--color-text-muted)">{insight.captainVerdict}</p>
              <div className="rounded-lg bg-(--color-surface) p-2 border border-(--color-border)/60 text-[11px] text-(--color-text-muted)">
                <strong className="text-(--color-text)">Differential Pick:</strong> {insight.differentialPick}
              </div>
            </div>
          )}

          {loading && !insight && (
            <div className="animate-pulse space-y-2 rounded-xl bg-(--color-surface-2) p-3">
              <div className="h-3 w-1/3 rounded bg-(--color-border)" />
              <div className="h-6 w-full rounded bg-(--color-border)" />
            </div>
          )}

          {/* Share Action */}
          <button
            type="button"
            onClick={copyForWhatsApp}
            className="button-secondary w-full text-xs font-semibold"
          >
            {copied ? (
              <>
                <Check size={14} className="text-emerald-500" />
                Copied to clipboard!
              </>
            ) : (
              <>
                <Copy size={14} />
                Copy Fantasy Card for WhatsApp
              </>
            )}
          </button>
        </div>
      )}
    </section>
  );
}
