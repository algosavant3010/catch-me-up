"use client";

import { useState } from "react";
import { Check, Copy, Gavel, LoaderCircle, MessageSquareWarning, Send, Sparkles } from "lucide-react";
import { useMatchState } from "@/lib/match/use-match-state";
import type { BanterVerdictResponse } from "@/lib/ai/banter-arbitrator-service";

const SEED_DEBATES = [
  "Did the 15th over (only 3 runs, 1 wicket) choke the chase?",
  "Was sending Aditya Rao ahead of Vikram Shah a blunder?",
  "Is the required run rate still reachable with this tail?",
];

export function SettleTheBanterPanel() {
  const { balls, state, stats, meta } = useMatchState();
  const [query, setQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<BanterVerdictResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const matchStateSummary = `${meta.battingTeam.name} are ${state.runs}/${state.wickets} in ${stats.oversDisplay} overs (target ${state.target}). Need ${state.needed} runs off ${state.ballsLeft} balls (CRR ${stats.crr.toFixed(1)}, RRR ${stats.rrr !== null ? stats.rrr.toFixed(1) : "—"}). Win prob: ${Math.round(state.winProb * 100)}%.`;

  const recentBalls = balls.slice(-12);
  const recentEvents = recentBalls
    .map((b) => `${b.over}.${b.ballInOver}: ${b.wicket ? "WICKET" : `${b.runs}r`} by ${b.bowler} to ${b.batter}`)
    .join("; ");

  const settleDebate = async (debateText: string) => {
    if (!debateText.trim() || loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/banter-arbitrator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          debateTopic: debateText,
          matchStateSummary,
          recentEvents: recentEvents || "Match in initial overs.",
        }),
      });

      if (!res.ok) throw new Error("Could not reach arbitrator");
      setVerdict(await res.json());
    } catch {
      setError("Umpire is reviewing the tapes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyVerdict = () => {
    if (!verdict) return;
    const text = `⚖️ *Third Umpire Banter Ruling*\n\n📌 *Debate:* "${selectedTopic || query}"\n🎯 *Verdict:* ${verdict.verdict}\n📝 ${verdict.verdictSummary}\n\n📊 *Match Evidence:*\n${verdict.evidence.map((e) => `• ${e}`).join("\n")}\n\n💬 *Banter Take:* _"${verdict.banterTake}"_`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="feature-panel">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="section-heading mb-0">
          <Gavel aria-hidden="true" />
          Settle The Banter
        </h3>
        <span className="eyebrow flex items-center gap-1.5 font-bold">
          <MessageSquareWarning size={13} className="text-(--color-accent)" />
          AI Arbitrator
        </span>
      </div>

      <p className="mb-3 text-xs text-(--color-text-muted)">
        Fighting in the WhatsApp group? Let the AI Third Umpire settle the debate using real match data.
      </p>

      {/* Suggested Debate Topics */}
      <div className="space-y-1.5 mb-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-(--color-text-muted)">Common Debates</p>
        <div className="flex flex-col gap-1.5">
          {SEED_DEBATES.map((topic) => (
            <button
              key={topic}
              type="button"
              onClick={() => {
                setSelectedTopic(topic);
                setQuery(topic);
                settleDebate(topic);
              }}
              disabled={loading}
              className={`rounded-lg border px-3 py-2 text-left text-xs font-semibold transition ${
                selectedTopic === topic
                  ? "border-(--color-accent) bg-(--color-accent)/10 text-(--color-text)"
                  : "border-(--color-border) bg-(--color-surface-2)/60 text-(--color-text) hover:border-(--color-border-hover)"
              }`}
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Debate Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSelectedTopic(null);
          settleDebate(query);
        }}
        className="mb-4"
      >
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Or type what you and your friend are arguing..."
            maxLength={300}
            className="flex-1 rounded-xl border border-(--color-border) bg-(--color-surface-2) px-3 py-2 text-xs transition focus:border-(--color-accent) focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="button-primary shrink-0 px-3.5 text-xs"
          >
            {loading ? <LoaderCircle size={15} className="animate-spin" /> : <Send size={15} />}
            <span className="hidden sm:inline">Rule</span>
          </button>
        </div>
      </form>

      {error && (
        <p role="alert" className="mb-3 text-xs font-semibold text-(--color-danger)">
          {error}
        </p>
      )}

      {/* Umpire Verdict Card */}
      {verdict && (
        <div className="space-y-3 rounded-xl border border-(--color-accent)/30 bg-(--color-surface-2)/80 p-4 text-xs">
          <div className="flex items-center justify-between gap-2 border-b border-(--color-border) pb-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-(--color-accent) px-3 py-1 font-bold text-white shadow-xs">
              <Gavel size={12} />
              {verdict.verdict}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-(--color-text-muted)">
              <Sparkles size={11} className="text-(--color-accent)" />
              {verdict.source === "ai" ? "Gemini Ruling" : "Telemetry Rule"}
            </span>
          </div>

          <p className="font-semibold text-sm leading-snug text-(--color-text)">
            {verdict.verdictSummary}
          </p>

          <div className="space-y-1 rounded-lg bg-(--color-surface) p-2.5 border border-(--color-border)">
            <p className="text-[10px] font-bold uppercase tracking-wider text-(--color-text-muted)">Telemetry Evidence</p>
            <ul className="space-y-1 text-[11px] text-(--color-text-muted) leading-relaxed">
              {verdict.evidence.map((point, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="mt-1 size-1 rounded-full bg-(--color-accent) shrink-0" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="rounded-lg border-l-2 border-(--color-accent) bg-(--color-surface) p-2.5 italic text-[11px] text-(--color-text-muted)">
            &quot;{verdict.banterTake}&quot;
          </p>

          <button
            type="button"
            onClick={copyVerdict}
            className="button-secondary w-full text-xs font-semibold"
          >
            {copied ? (
              <>
                <Check size={14} className="text-emerald-500" />
                Copied ruling to clipboard!
              </>
            ) : (
              <>
                <Copy size={14} />
                Copy Ruling to WhatsApp
              </>
            )}
          </button>
        </div>
      )}
    </section>
  );
}
