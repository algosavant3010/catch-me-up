"use client";

import { useEffect, useState } from "react";
import { Crosshair } from "lucide-react";
import { useMatchState } from "@/lib/match/use-match-state";
import { usePreferences } from "@/components/providers/preferences-provider";
import {
  applyPrediction,
  initialGameState,
  resolveOverOutcome,
  type PredictionGameState,
  type PredictionOutcome,
} from "@/lib/game/scoring";
import { createPersistentStore } from "@/lib/utils/persistent-store";
import { track } from "@/lib/analytics/track";

interface GameStore extends Record<string, unknown> {
  game: PredictionGameState;
}

const gameStore = createPersistentStore<GameStore>("catch-me-up:game:v1", {
  game: initialGameState(),
});

export { gameStore };

const OUTCOMES: {
  key: PredictionOutcome;
  labelKey: "game.wicket" | "game.boundary" | "game.tenPlus" | "game.quietOver";
  dotColor: string;
}[] = [
  { key: "wicket", labelKey: "game.wicket", dotColor: "bg-rose-500" },
  { key: "boundary", labelKey: "game.boundary", dotColor: "bg-emerald-500" },
  { key: "ten_plus", labelKey: "game.tenPlus", dotColor: "bg-amber-500" },
  { key: "quiet_over", labelKey: "game.quietOver", dotColor: "bg-sky-500" },
];

export function CallTheNextOverPanel() {
  const { strings } = usePreferences();
  const { balls, meta, overSummaries } = useMatchState();
  const [state, setState] = useState<PredictionGameState>(() => gameStore.getSnapshot().game);
  const [pick, setPick] = useState<PredictionOutcome | null>(null);
  const [predictedOver, setPredictedOver] = useState<number | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);

  const nextOverToPredict = overSummaries.length + 1;
  const isMatchOver = balls.length > 0 && overSummaries.length >= meta.oversLimit;

  useEffect(() => {
    if (predictedOver === null || !pick) return;
    const summary = overSummaries.find((o) => o.over === predictedOver);
    if (!summary) return;

    function resolveFinishedOver() {
      const overBalls = balls.filter((b) => b.over === predictedOver);
      const outcomes = resolveOverOutcome(overBalls, summary!);
      const next = applyPrediction(state, predictedOver!, pick!, outcomes);
      setState(next);
      gameStore.set({ game: next });
      setPredictedOver(null);
      setPick(null);

      fetch("/api/explain-over", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ over: predictedOver, locale: "en" }),
      })
        .then((r) => r.json())
        .then((data) => setExplanation(data.explanation))
        .catch(() => setExplanation(null));
    }

    resolveFinishedOver();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overSummaries]);

  function choose(outcome: PredictionOutcome) {
    track("prediction_made");
    setPick(outcome);
    setPredictedOver(nextOverToPredict);
  }

  return (
    <section className="feature-panel">
      <h3 className="section-heading">
        <Crosshair aria-hidden="true" />
        {strings["game.title"]}
      </h3>
      <p className="mb-4 text-xs text-(--color-text-muted)">
        Free to play — no money, no prizes, just bragging rights.
      </p>

      {isMatchOver ? (
        <p className="rounded-xl border border-(--color-border) bg-(--color-surface-2) p-4 text-sm text-(--color-text-muted)">
          The match is over — final score:{" "}
          <strong className="text-(--color-text)">{state.totalPoints} points</strong>.
        </p>
      ) : predictedOver !== null ? (
        <div
          className="rounded-xl border-l-4 border-(--color-success) bg-(--color-surface-2) p-4 text-sm shadow-xs"
          role="status"
        >
          <p className="font-semibold text-(--color-text)">Prediction locked</p>
          <p className="mt-1 text-xs text-(--color-text-muted)">
            Locked in <strong className="text-(--color-accent)">{pick}</strong> for over{" "}
            {predictedOver}. Waiting for it to finish…
          </p>
        </div>
      ) : (
        <>
          <p className="mb-3 text-xs font-semibold tracking-wider text-(--color-text-muted) uppercase">
            {strings["game.pickOutcome"]} (over {nextOverToPredict})
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {OUTCOMES.map((o) => (
              <button
                key={o.key}
                type="button"
                onClick={() => choose(o.key)}
                className="button-secondary group relative flex items-center justify-between px-3.5 py-3 text-left text-sm font-semibold transition hover:border-(--color-accent)"
              >
                <span>{strings[o.labelKey]}</span>
                <span
                  className={`size-2 rounded-full ${o.dotColor} opacity-75 transition group-hover:scale-125 group-hover:opacity-100`}
                />
              </button>
            ))}
          </div>
        </>
      )}

      {explanation && (
        <p className="mt-3.5 rounded-xl border border-(--color-border) bg-(--color-surface-2) p-3 text-xs leading-relaxed text-(--color-text-muted) italic">
          {explanation}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-(--color-border) pt-3 text-xs font-medium text-(--color-text-muted) tabular-nums">
        <span>
          {strings["game.streak"]}: <strong className="text-(--color-text)">{state.streak}</strong>
        </span>
        <span>
          {strings["game.personalBest"]}:{" "}
          <strong className="text-(--color-text)">{state.personalBest}</strong>
        </span>
        <span>
          Total: <strong className="text-(--color-accent)">{state.totalPoints}</strong>
        </span>
      </div>
    </section>
  );
}
