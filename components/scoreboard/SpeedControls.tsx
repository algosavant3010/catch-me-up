"use client";

import { useMatchRuntime } from "@/lib/match/match-context";
import { Pause, Play, RotateCcw } from "lucide-react";
import type { SpeedMultiplier } from "@/lib/match/providers";

const SPEEDS: SpeedMultiplier[] = [1, 3, 8];

export function SpeedControls() {
  const { speed, setSpeed, paused, togglePause, restart } = useMatchRuntime();

  return (
    <div
      className="flex flex-wrap items-center gap-2 text-sm"
      role="group"
      aria-label="Match playback"
    >
      <span className="eyebrow mr-auto">Playback</span>
      <div className="flex overflow-hidden rounded-(--radius-md) border border-(--color-border)">
        {SPEEDS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSpeed(s)}
            aria-pressed={speed === s}
            className={`px-3 py-1.5 font-medium ${
              speed === s
                ? "bg-(--color-accent) text-white"
                : "bg-(--color-surface) text-(--color-text-muted)"
            }`}
          >
            {s}x
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={togglePause}
        className="icon-button"
        aria-label={paused ? "Resume" : "Pause"}
        title={paused ? "Resume" : "Pause"}
      >
        {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
      </button>
      <button
        type="button"
        onClick={restart}
        className="icon-button"
        aria-label="Restart"
        title="Restart"
      >
        <RotateCcw aria-hidden="true" />
      </button>
    </div>
  );
}
