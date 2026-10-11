"use client";

import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Compass, LoaderCircle, Sparkles, TrendingUp } from "lucide-react";
import { useMatchState } from "@/lib/match/use-match-state";
import { simulateNextOver } from "@/lib/match/simulator";
import type { WhatIfRoadmapResponse } from "@/lib/ai/what-if-roadmap-service";

export function WhatIfSimulatorPanel() {
  const { state, meta } = useMatchState();
  const [simRuns, setSimRuns] = useState<number>(8);
  const [simWickets, setSimWickets] = useState<number>(0);
  const [roadmap, setRoadmap] = useState<WhatIfRoadmapResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Compute deterministic simulation instant math
  const sim = useMemo(() => {
    return simulateNextOver({
      currentRuns: state.runs,
      currentWickets: state.wickets,
      currentBallsBowled: state.ballsBowled,
      target: meta.target,
      oversLimit: meta.oversLimit,
      simulatedRuns: simRuns,
      simulatedWickets: simWickets,
    });
  }, [state.runs, state.wickets, state.ballsBowled, meta.target, meta.oversLimit, simRuns, simWickets]);

  const scenarioSummary = `Current: ${state.runs}/${state.wickets} (Target: ${state.target}, Need: ${state.needed} off ${state.ballsLeft}b). Next over yields +${simRuns} runs and ${simWickets} wickets. Resulting: Need ${sim.newNeeded} off ${sim.newBallsLeft}b. RRR moves from ${sim.currentRrr ?? "—"} to ${sim.newRrr}. Win prob shifts from ${sim.currentWinProb}% to ${sim.newWinProb}% (${sim.winProbDelta >= 0 ? `+${sim.winProbDelta}%` : `${sim.winProbDelta}%`}).`;

  const fetchRoadmap = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/what-if-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioSummary,
          teamName: meta.battingTeam.name,
        }),
      });
      if (res.ok) {
        setRoadmap(await res.json());
      }
    } catch {
      // Fallback silently if offline
    } finally {
      setLoading(false);
    }
  };

  const handleRunsChange = (val: number) => {
    setSimRuns(val);
    setRoadmap(null);
  };

  const handleWicketsChange = (val: number) => {
    setSimWickets(val);
    setRoadmap(null);
  };

  const isPositive = sim.winProbDelta >= 0;

  return (
    <section className="feature-panel">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="section-heading mb-0">
          <Compass aria-hidden="true" />
          Chase Simulator
        </h3>
        <span className="eyebrow flex items-center gap-1.5 font-bold">
          <TrendingUp size={13} className="text-(--color-accent)" />
          What-If Engine
        </span>
      </div>

      <p className="mb-4 text-xs text-(--color-text-muted)">
        Simulate the next over to forecast win probability swings and tactical chase paths.
      </p>

      {/* Interactive Controls */}
      <div className="space-y-4 rounded-xl border border-(--color-border) bg-(--color-surface-2)/40 p-3.5">
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-(--color-text)">Runs in next over:</span>
            <span className="font-bold tabular-nums text-sm text-(--color-accent)">+{simRuns} runs</span>
          </div>
          <input
            type="range"
            min={0}
            max={24}
            step={1}
            value={simRuns}
            onChange={(e) => handleRunsChange(Number(e.target.value))}
            className="w-full accent-(--color-accent) cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-(--color-text-muted)">
            <span>0 (Maiden)</span>
            <span>8 (Par)</span>
            <span>16 (Big over)</span>
            <span>24 (Maximum)</span>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-(--color-text) mb-1.5">Wickets lost in next over:</p>
          <div className="flex gap-2">
            {[0, 1, 2].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => handleWicketsChange(w)}
                className={`flex-1 rounded-lg border py-1.5 text-xs font-bold transition ${
                  simWickets === w
                    ? "border-(--color-accent) bg-(--color-accent) text-white shadow-xs"
                    : "border-(--color-border) bg-(--color-surface) text-(--color-text) hover:border-(--color-border-hover)"
                }`}
              >
                {w} {w === 1 ? "Wicket" : "Wickets"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Simulated Delta Stats */}
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface-2) p-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-(--color-text-muted)">Win Chance Shift</p>
          <div className="mt-1 flex items-center justify-center gap-1">
            {isPositive ? (
              <ArrowUpRight size={18} className="text-emerald-500 font-bold" />
            ) : (
              <ArrowDownRight size={18} className="text-rose-500 font-bold" />
            )}
            <span
              className={`text-lg font-black tabular-nums ${
                isPositive ? "text-emerald-500" : "text-rose-500"
              }`}
            >
              {isPositive ? `+${sim.winProbDelta}%` : `${sim.winProbDelta}%`}
            </span>
          </div>
          <p className="text-[10px] text-(--color-text-muted)">{sim.currentWinProb}% → {sim.newWinProb}%</p>
        </div>

        <div className="rounded-xl border border-(--color-border) bg-(--color-surface-2) p-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-(--color-text-muted)">Required Run Rate</p>
          <p className="mt-1 text-lg font-black tabular-nums text-(--color-text)">
            {sim.newRrr}
          </p>
          <p className="text-[10px] text-(--color-text-muted)">
            Need {sim.newNeeded} off {sim.newBallsLeft}b
          </p>
        </div>
      </div>

      {/* Tactical Blueprint Card */}
      {roadmap ? (
        <div className="mt-4 space-y-2.5 rounded-xl border border-(--color-accent)/30 bg-(--color-surface-2)/80 p-3.5 text-xs">
          <div className="flex items-center justify-between border-b border-(--color-border) pb-2">
            <span className="font-bold text-(--color-text) flex items-center gap-1.5">
              <Sparkles size={13} className="text-(--color-accent)" />
              {roadmap.scenarioHeadline}
            </span>
            <span className="text-[10px] font-semibold text-(--color-text-muted) uppercase">
              {roadmap.source === "ai" ? "Gemini Coach" : "Tactical Blueprint"}
            </span>
          </div>
          <p className="text-(--color-text) font-medium leading-relaxed">{roadmap.coachAdvice}</p>
          <div className="rounded-lg bg-(--color-surface) p-2.5 border border-(--color-border) space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-(--color-text-muted)">Optimal Chase Roadmap</p>
            <p className="text-[11px] leading-relaxed text-(--color-text-muted)">{roadmap.controlledPath}</p>
          </div>
          <p className="text-[10px] italic text-(--color-text-muted)">
            <strong className="text-(--color-danger)">Risk Factor:</strong> {roadmap.riskFactor}
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={fetchRoadmap}
          disabled={loading}
          className="button-primary w-full mt-4 text-xs font-semibold"
        >
          {loading ? (
            <>
              <LoaderCircle size={15} className="animate-spin" />
              Formulating Blueprint...
            </>
          ) : (
            <>
              <Sparkles size={15} />
              Generate AI Tactical Blueprint
            </>
          )}
        </button>
      )}
    </section>
  );
}
