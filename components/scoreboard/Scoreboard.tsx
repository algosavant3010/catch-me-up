"use client";

import { usePreferences } from "@/components/providers/preferences-provider";
import { useMatchState } from "@/lib/match/use-match-state";

export function Scoreboard() {
  const { strings } = usePreferences();
  const { meta, state, stats, currentBowler } = useMatchState();

  const isComplete = state.ballsLeft === 0 || state.needed === 0 || state.wickets >= 10;

  return (
    <section
      aria-label="Live scoreboard"
      className="relative overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface) p-5 shadow-sm sm:p-7"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-(--color-accent) to-transparent" />

      <div className="mb-5 flex items-center justify-between gap-3">
        <span className="eyebrow flex items-center gap-1.5 font-bold">
          <span className="size-1.5 rounded-full bg-(--color-accent)" />
          Second innings
        </span>
        <span className="flex items-center gap-2 text-xs font-bold tracking-wider text-(--color-text-muted) uppercase">
          <span
            className={`size-2 rounded-full ${isComplete ? "bg-amber-500" : "animate-pulse bg-(--color-success)"}`}
          />
          {isComplete ? "RESULT" : "IN PLAY"}
        </span>
      </div>

      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight sm:text-2xl">
              {meta.battingTeam.name}
            </span>
            <span className="rounded bg-(--color-surface-2) px-1.5 py-0.5 text-[10px] font-bold text-(--color-accent)">
              CHASING
            </span>
          </div>
          <p className="score-number flex items-baseline gap-3" aria-live="polite">
            <span>
              {state.runs}/{state.wickets}
            </span>
            <span className="font-sans text-sm font-medium text-(--color-text-muted)">
              ({stats.oversDisplay} {strings["scoreboard.overs"].toLowerCase()})
            </span>
          </p>
        </div>

        <div className="rounded-xl border border-(--color-border) bg-(--color-surface-2)/80 px-4 py-2.5 text-right backdrop-blur-sm">
          <p className="text-[10px] font-bold tracking-wider text-(--color-text-muted) uppercase">
            {strings["scoreboard.target"]}
          </p>
          <p className="text-2xl font-extrabold tracking-tight text-(--color-text) tabular-nums sm:text-3xl">
            {state.target}
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 divide-x divide-(--color-border) rounded-xl border border-(--color-border) bg-(--color-surface-2)/40 py-3.5 text-sm">
        <Stat
          label={strings["scoreboard.need"]}
          value={state.needed > 0 ? `${state.needed} / ${state.ballsLeft}b` : "—"}
          highlight={state.needed > 0}
        />
        <Stat label={strings["scoreboard.crr"]} value={stats.crr.toFixed(1)} />
        <Stat
          label={strings["scoreboard.rrr"]}
          value={stats.rrr !== null ? stats.rrr.toFixed(1) : "—"}
        />
      </div>

      <div className="mt-5 space-y-2 text-sm">
        <p className="eyebrow">{strings["scoreboard.batters"]}</p>
        <div className="divide-y divide-(--color-border) rounded-xl border border-(--color-border) bg-(--color-surface-2)/20 px-3.5">
          {state.crease.map((b) => (
            <div key={b.name} className="flex items-center justify-between gap-3 py-2.5">
              <span className="flex items-center gap-2 font-medium">
                {b.onStrike ? (
                  <span
                    aria-hidden
                    className="size-2 animate-pulse rounded-full bg-(--color-accent)"
                  />
                ) : (
                  <span aria-hidden className="size-2 rounded-full bg-transparent" />
                )}
                <span
                  className={b.onStrike ? "font-bold text-(--color-text)" : "text-(--color-text)"}
                >
                  {b.name}
                </span>
                {b.onStrike && (
                  <span className="rounded bg-(--color-accent)/15 px-1.5 py-0.5 text-[10px] font-bold text-(--color-accent)">
                    STRIKE
                  </span>
                )}
                {b.onStrike && <span className="sr-only"> (on strike)</span>}
              </span>
              <span className="shrink-0 font-bold tabular-nums">
                {b.runs}{" "}
                <span className="text-xs font-normal text-(--color-text-muted)">({b.balls})</span>
              </span>
            </div>
          ))}
          {state.crease.length === 0 && <p className="py-2.5 text-(--color-text-muted)">—</p>}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2.5 border-t border-(--color-border) pt-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-(--color-text-muted)">
            {strings["scoreboard.bowler"]}:
          </span>
          <span className="font-bold text-(--color-text)">{currentBowler}</span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-(--color-text-muted)">
            {strings["scoreboard.winProbability"]}:
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-(--color-accent)/10 px-2 py-0.5 font-bold text-(--color-accent) tabular-nums">
            {meta.battingTeam.name} {Math.round(state.winProb * 100)}%
          </span>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="px-3.5 first:pl-3.5">
      <p className="eyebrow">{label}</p>
      <p
        className={`mt-1 text-lg font-bold tabular-nums sm:text-xl ${highlight ? "text-(--color-accent)" : "text-(--color-text)"}`}
      >
        {value}
      </p>
    </div>
  );
}
