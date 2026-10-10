"use client";

import { useEffect, useState } from "react";
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
}[] = [
  { key: "wicket", labelKey: "game.wicket" },
  { key: "boundary", labelKey: "game.boundary" },
  { key: "ten_plus", labelKey: "game.tenPlus" },
  { key: "quiet_over", labelKey: "game.quietOver" },
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

    // Resolving a finished over is a reaction to the match engine ticking
    // forward, not a value derivable during render — nested one level so the
    // state updates read as "callbacks reacting to an external change".
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
    setPick(outcome);
    setPredictedOver(nextOverToPredict);
  }

  return (
    <section className="rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-4">
      <h3 className="mb-1 font-semibold">{strings["game.title"]}</h3>
      <p className="mb-3 text-xs text-(--color-text-muted)">
        Free to play — no money, no prizes, just bragging rights.
      </p>

      {isMatchOver ? (
        <p className="text-sm text-(--color-text-muted)">
          The match is over — final score: {state.totalPoints} points.
        </p>
      ) : predictedOver !== null ? (
        <p className="text-sm">
          Locked in <strong>{pick}</strong> for over {predictedOver}. Waiting for it to finish…
        </p>
      ) : (
        <>
          <p className="mb-2 text-sm">
            {strings["game.pickOutcome"]} (over {nextOverToPredict})
          </p>
          <div className="grid grid-cols-2 gap-2">
            {OUTCOMES.map((o) => (
              <button
                key={o.key}
                onClick={() => choose(o.key)}
                className="rounded-(--radius-md) bg-(--color-surface-2) px-3 py-2 text-sm font-medium hover:bg-(--color-accent) hover:text-white"
              >
                {strings[o.labelKey]}
              </button>
            ))}
          </div>
        </>
      )}

      {explanation && (
        <p className="mt-3 rounded-(--radius-md) bg-(--color-surface-2) p-2 text-xs italic">
          {explanation}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between text-xs text-(--color-text-muted)">
        <span>
          {strings["game.streak"]}: {state.streak}
        </span>
        <span>
          {strings["game.personalBest"]}: {state.personalBest}
        </span>
        <span>Total: {state.totalPoints}</span>
      </div>
    </section>
  );
}
