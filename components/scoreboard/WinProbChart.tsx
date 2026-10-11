"use client";

import { useMemo } from "react";
import { computeMatchState } from "@/lib/match/engine";
import { useMatchState } from "@/lib/match/use-match-state";

const WIDTH = 320;
const HEIGHT = 96;

/**
 * Lightweight SVG line chart of win probability over the innings, with
 * wicket markers. No charting library — keeps this route's JS small and
 * this is a simple enough shape to hand-draw.
 */
export function WinProbChart() {
  const { meta, balls, state } = useMatchState();

  const points = useMemo(() => {
    const totalBalls = meta.oversLimit * 6;
    const series: { x: number; y: number; wicket: boolean; n: number }[] = [];
    for (let i = 0; i <= balls.length; i += 1) {
      const prefix = balls.slice(0, i);
      const state = computeMatchState(prefix, meta);
      const x = (state.ballsBowled / totalBalls) * WIDTH;
      const y = HEIGHT - state.winProb * HEIGHT;
      series.push({ x, y, wicket: i > 0 && balls[i - 1].wicket, n: i > 0 ? balls[i - 1].n : 0 });
    }
    return series;
  }, [balls, meta]);

  if (points.length < 2) {
    return (
      <div className="flex h-48 items-center justify-center border-b border-dashed border-(--color-border) text-sm text-(--color-text-muted)">
        Win probability chart will appear once the match starts.
      </div>
    );
  }

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  const wickets = points.filter((p) => p.wicket);

  return (
    <section aria-label="Win probability" className="min-w-0 pt-2">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">Chase momentum</h2>
          <p className="text-xs text-(--color-text-muted)">Estimated win probability</p>
        </div>
        <span className="text-3xl font-bold tabular-nums">
          {Math.round(state.winProb * 100)}
          <span className="text-base text-(--color-text-muted)">%</span>
        </span>
      </div>
      <div className="mb-2 flex justify-between text-xs text-(--color-text-muted)">
        <span>100%</span>
        <span>{meta.battingTeam.name}</span>
      </div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`Win probability chart, currently ${Math.round(state.winProb * 100)}%`}
        className="h-36 w-full overflow-visible motion-reduce:[&_*]:transition-none"
        preserveAspectRatio="none"
      >
        <line
          x1="0"
          y1={HEIGHT / 2}
          x2={WIDTH}
          y2={HEIGHT / 2}
          stroke="var(--color-border)"
          strokeDasharray="4 4"
        />
        <path
          d={path}
          fill="none"
          stroke="var(--color-accent-2)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {wickets.map((w, i) => (
          <circle
            key={i}
            cx={w.x}
            cy={w.y}
            r="3.5"
            fill="var(--color-danger)"
            stroke="var(--color-surface)"
            strokeWidth="1"
          />
        ))}
      </svg>
      <div className="mt-3 flex justify-between border-t border-(--color-border) pt-2 text-xs text-(--color-text-muted)">
        <span>0 overs</span>
        <span>
          Wicket markers / <span className="text-(--color-danger)">●</span>
        </span>
        <span>{meta.oversLimit} overs</span>
      </div>
    </section>
  );
}
