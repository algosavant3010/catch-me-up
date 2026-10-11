"use client";

import { useMatchRuntime } from "@/lib/match/match-context";
import { computeMatchState } from "@/lib/match/engine";
import { usePreferences } from "@/components/providers/preferences-provider";
import { t } from "@/lib/i18n";

export function AwayBadge() {
  const { meta, balls, awayFromBall } = useMatchRuntime();
  const { strings } = usePreferences();
  if (awayFromBall === null) return null;

  const since = balls.filter((b) => b.n > awayFromBall);
  const stateAtAway = computeMatchState(
    balls.filter((b) => b.n <= awayFromBall),
    meta,
  );
  const stateNow = computeMatchState(balls, meta);
  const runsMissed = stateNow.runs - stateAtAway.runs;
  const wicketsMissed = stateNow.wickets - stateAtAway.wickets;
  const ballsMissed = since.filter((b) => b.isLegal).length;

  return (
    <div
      role="status"
      aria-live="polite"
      className="my-3 border-l-2 border-(--color-accent) bg-(--color-surface-2) px-4 py-3 text-sm"
    >
      {t(strings, "away.missed", { balls: ballsMissed, runs: runsMissed, wickets: wicketsMissed })}
    </div>
  );
}
