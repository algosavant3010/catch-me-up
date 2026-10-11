"use client";

import { usePreferences } from "@/components/providers/preferences-provider";
import { tensionLabel } from "@/lib/match/engine";
import { useMatchState } from "@/lib/match/use-match-state";
import type { TensionLabel } from "@/lib/match/types";

const LABEL_KEY: Record<
  TensionLabel,
  "tension.calm" | "tension.building" | "tension.tense" | "tension.edgeOfSeat"
> = {
  Calm: "tension.calm",
  Building: "tension.building",
  Tense: "tension.tense",
  "Edge of seat": "tension.edgeOfSeat",
};

export function TensionMeter() {
  const { strings } = usePreferences();
  const { state } = useMatchState();
  const label = tensionLabel(state.tension);

  return (
    <div className="border-y border-(--color-border) py-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-(--color-text-muted)">Tension</span>
        <span className="font-semibold">{strings[LABEL_KEY[label]]}</span>
      </div>
      <div
        role="meter"
        aria-label="Match tension"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={state.tension}
        className="mt-3 h-1.5 w-full overflow-hidden bg-(--color-surface-2)"
      >
        <div
          className="h-full bg-(--color-accent) transition-[width] duration-500 ease-out motion-reduce:transition-none"
          style={{ width: `${state.tension}%` }}
        />
      </div>
    </div>
  );
}
