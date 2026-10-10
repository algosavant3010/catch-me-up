"use client";

import type { MatchMeta } from "@/lib/match/types";
import { MatchRuntimeProvider } from "@/lib/match/match-context";
import { usePreferences } from "@/components/providers/preferences-provider";
import { Scoreboard } from "@/components/scoreboard/Scoreboard";
import { WinProbChart } from "@/components/scoreboard/WinProbChart";
import { TensionMeter } from "@/components/scoreboard/TensionMeter";
import { SpeedControls } from "@/components/scoreboard/SpeedControls";

export function MatchExperience({ meta, startAtBall }: { meta: MatchMeta; startAtBall: number }) {
  return (
    <MatchRuntimeProvider meta={meta} startAtBall={startAtBall}>
      <MatchLayout />
    </MatchRuntimeProvider>
  );
}

function MatchLayout() {
  const { strings } = usePreferences();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 pt-4 pb-24 sm:pb-8">
      <div className="rounded-(--radius-md) bg-(--color-surface-2) px-3 py-1.5 text-center text-xs text-(--color-text-muted)">
        {strings["app.simulatedBanner"]}
      </div>

      <Scoreboard />
      <WinProbChart />
      <TensionMeter />
      <SpeedControls />
    </div>
  );
}
