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
      <div className="flex h-24 items-center justify-center text-xs text-(--color-text-muted)">
        Win probability chart will appear once the match starts.
      </div>
    );
  }

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  const wickets = points.filter((p) => p.wicket);

  return (
    <div className="rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-3">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`Win probability chart, currently ${Math.round(state.winProb * 100)}%`}
        className="h-24 w-full motion-reduce:[&_*]:transition-none"
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
          stroke="var(--color-accent)"
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
    </div>
  );
}
