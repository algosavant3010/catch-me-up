"use client";

import { usePreferences } from "@/components/providers/preferences-provider";
import { useMatchState } from "@/lib/match/use-match-state";

export function Scoreboard() {
  const { strings } = usePreferences();
  const { meta, state, stats, currentBowler } = useMatchState();

  return (
    <section
      aria-label="Live scoreboard"
      className="rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-4 shadow-sm"
    >
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <p className="text-xs text-(--color-text-muted)">{meta.battingTeam.name}</p>
          <p className="text-3xl font-bold tabular-nums" aria-live="polite">
            {state.runs}/{state.wickets}
            <span className="ml-2 text-base font-normal text-(--color-text-muted)">
              ({stats.oversDisplay} {strings["scoreboard.overs"].toLowerCase()})
            </span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-(--color-text-muted)">{strings["scoreboard.target"]}</p>
          <p className="text-xl font-semibold tabular-nums">{state.target}</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
        <Stat
          label={strings["scoreboard.need"]}
          value={state.needed > 0 ? `${state.needed} / ${state.ballsLeft}b` : "—"}
        />
        <Stat label={strings["scoreboard.crr"]} value={stats.crr.toFixed(1)} />
        <Stat
          label={strings["scoreboard.rrr"]}
          value={stats.rrr !== null ? stats.rrr.toFixed(1) : "—"}
        />
      </div>

      <div className="mt-4 grid gap-2 text-sm">
        <p className="text-xs text-(--color-text-muted)">{strings["scoreboard.batters"]}</p>
        {state.crease.map((b) => (
          <div
            key={b.name}
            className="flex items-center justify-between rounded-(--radius-sm) bg-(--color-surface-2) px-3 py-1.5"
          >
            <span className="flex items-center gap-1.5 font-medium">
              {b.onStrike && (
                <span aria-hidden className="text-(--color-accent)">
                  ●
                </span>
              )}
              {b.name}
              {b.onStrike && <span className="sr-only"> (on strike)</span>}
            </span>
            <span className="text-(--color-text-muted) tabular-nums">
              {b.runs} ({b.balls})
            </span>
          </div>
        ))}
        {state.crease.length === 0 && <p className="text-(--color-text-muted)">—</p>}
      </div>

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-(--color-text-muted)">{strings["scoreboard.bowler"]}</span>
        <span className="font-medium">{currentBowler}</span>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-(--color-text-muted)">{strings["scoreboard.winProbability"]}</span>
        <span className="font-semibold tabular-nums">
          {meta.battingTeam.name} {Math.round(state.winProb * 100)}%
        </span>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-(--radius-sm) bg-(--color-surface-2) px-2 py-2">
      <p className="text-[10px] text-(--color-text-muted) uppercase">{label}</p>
      <p className="font-semibold tabular-nums">{value}</p>
    </div>
  );
}
