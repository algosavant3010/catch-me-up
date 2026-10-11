"use client";

import { usePreferences } from "@/components/providers/preferences-provider";
import { useMatchState } from "@/lib/match/use-match-state";

export function Scoreboard() {
  const { strings } = usePreferences();
  const { meta, state, stats, currentBowler } = useMatchState();

  return (
    <section
      aria-label="Live scoreboard"
      className="min-w-0 border-t-2 border-(--color-accent) bg-(--color-surface) p-5 sm:p-7"
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <span className="eyebrow">Second innings</span>
        <span className="flex items-center gap-2 text-xs font-semibold text-(--color-text-muted)">
          <span className="size-1.5 rounded-full bg-(--color-success)" />
          {state.ballsLeft === 0 || state.needed === 0 || state.wickets >= 10
            ? "RESULT"
            : "IN PLAY"}
        </span>
      </div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="mb-2 text-lg font-semibold">{meta.battingTeam.name}</p>
          <p className="score-number" aria-live="polite">
            {state.runs}/{state.wickets}
            <span className="mt-2 block font-sans text-sm leading-normal font-normal text-(--color-text-muted)">
              ({stats.oversDisplay} {strings["scoreboard.overs"].toLowerCase()})
            </span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-(--color-text-muted)">{strings["scoreboard.target"]}</p>
          <p className="text-3xl font-semibold tabular-nums">{state.target}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 divide-x divide-(--color-border) border-y border-(--color-border) py-4 text-sm">
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
        <p className="eyebrow">{strings["scoreboard.batters"]}</p>
        {state.crease.map((b) => (
          <div
            key={b.name}
            className="flex items-center justify-between gap-3 border-b border-(--color-border) py-2.5"
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
            <span className="shrink-0 font-semibold tabular-nums">
              {b.runs} ({b.balls})
            </span>
          </div>
        ))}
        {state.crease.length === 0 && <p className="text-(--color-text-muted)">—</p>}
      </div>

      <div className="mt-3 flex items-center justify-between gap-4 text-sm">
        <span className="text-(--color-text-muted)">{strings["scoreboard.bowler"]}</span>
        <span className="font-medium">{currentBowler}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
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
    <div className="px-3 first:pl-0">
      <p className="eyebrow">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
