"use client";

import { useMatchRuntime } from "@/lib/match/match-context";
import type { SpeedMultiplier } from "@/lib/match/providers";

const SPEEDS: SpeedMultiplier[] = [1, 3, 8];

export function SpeedControls() {
  const { speed, setSpeed, paused, togglePause, restart } = useMatchRuntime();

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <div className="flex overflow-hidden rounded-full border border-(--color-border)">
        {SPEEDS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSpeed(s)}
            aria-pressed={speed === s}
            className={`px-3 py-1.5 font-medium ${
              speed === s ? "bg-(--color-accent) text-white" : "bg-(--color-surface) text-(--color-text-muted)"
            }`}
          >
            {s}x
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={togglePause}
        className="rounded-full border border-(--color-border) bg-(--color-surface) px-3 py-1.5 font-medium"
      >
        {paused ? "Resume" : "Pause"}
      </button>
      <button
        type="button"
        onClick={restart}
        className="rounded-full border border-(--color-border) bg-(--color-surface) px-3 py-1.5 font-medium"
      >
        Restart
      </button>
    </div>
  );
}
