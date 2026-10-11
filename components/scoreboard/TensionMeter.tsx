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
    <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-4 shadow-sm">
      <div className="flex items-center justify-between text-sm">
        <span className="eyebrow">Match Tension</span>
        <span className="rounded-md bg-(--color-accent)/10 px-2.5 py-0.5 text-xs font-bold text-(--color-accent)">
          {strings[LABEL_KEY[label]]}
        </span>
      </div>
      <div
        role="meter"
        aria-label="Match tension"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={state.tension}
        className="mt-3 h-2 w-full overflow-hidden rounded-full border border-(--color-border) bg-(--color-surface-2)"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-600 transition-[width] duration-500 ease-out motion-reduce:transition-none"
          style={{ width: `${state.tension}%` }}
        />
      </div>
    </div>
  );
}
