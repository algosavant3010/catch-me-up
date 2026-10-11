"use client";

import { useMatchRuntime } from "@/lib/match/match-context";
import { usePreferences } from "@/components/providers/preferences-provider";
import { Pause, Play, RotateCcw } from "lucide-react";
import type { SpeedMultiplier } from "@/lib/match/providers";

const SPEEDS: SpeedMultiplier[] = [1, 3, 8];

export function SpeedControls() {
  const { strings } = usePreferences();
  const { speed, setSpeed, paused, togglePause, restart } = useMatchRuntime();

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-(--color-border) bg-(--color-surface) p-3 shadow-sm"
      role="group"
      aria-label="Match playback"
    >
      <div className="flex items-center gap-2.5">
        <span className="eyebrow">Playback</span>
        <div className="flex overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface-2)">
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeed(s)}
              aria-pressed={speed === s}
              className={`px-3 py-1.5 text-xs font-bold transition ${
                speed === s
                  ? "bg-(--color-accent) text-white shadow-xs"
                  : "text-(--color-text-muted) hover:bg-(--color-surface-hover) hover:text-(--color-text)"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={togglePause}
          className="icon-button size-9 rounded-lg"
          aria-label={paused ? strings["listen.play"] : strings["listen.pause"]}
          title={paused ? strings["listen.play"] : strings["listen.pause"]}
        >
          {paused ? (
            <Play size={16} aria-hidden="true" className="text-(--color-accent)" />
          ) : (
            <Pause size={16} aria-hidden="true" />
          )}
        </button>
        <button
          type="button"
          onClick={restart}
          className="icon-button size-9 rounded-lg"
          aria-label="Restart"
          title="Restart"
        >
          <RotateCcw size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
