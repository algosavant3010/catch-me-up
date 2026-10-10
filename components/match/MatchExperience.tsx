"use client";

import { useState } from "react";
import type { MatchMeta } from "@/lib/match/types";
import { MatchRuntimeProvider } from "@/lib/match/match-context";
import { usePreferences } from "@/components/providers/preferences-provider";
import { Scoreboard } from "@/components/scoreboard/Scoreboard";
import { WinProbChart } from "@/components/scoreboard/WinProbChart";
import { TensionMeter } from "@/components/scoreboard/TensionMeter";
import { SpeedControls } from "@/components/scoreboard/SpeedControls";
import { ActionBar } from "@/components/match/ActionBar";
import { AlertToasts } from "@/components/alerts/AlertToasts";
import { SettingsSheet } from "@/components/settings/SettingsSheet";
import { ChatPulsePanel } from "@/components/chat/ChatPulsePanel";
import { CallTheNextOverPanel } from "@/components/game/CallTheNextOverPanel";
import { RoomPanel } from "@/components/game/RoomPanel";
import { SnapTheTV } from "@/components/vision/SnapTheTV";

export function MatchExperience({ meta, startAtBall }: { meta: MatchMeta; startAtBall: number }) {
  return (
    <MatchRuntimeProvider meta={meta} startAtBall={startAtBall}>
      <AlertToasts />
      <MatchLayout />
    </MatchRuntimeProvider>
  );
}

function MatchLayout() {
  const { strings } = usePreferences();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 pt-4 pb-24 sm:pb-8">
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 rounded-(--radius-md) bg-(--color-surface-2) px-3 py-1.5 text-center text-xs text-(--color-text-muted)">
          {strings["app.simulatedBanner"]}
        </div>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          aria-label={strings["nav.settings"]}
          className="rounded-full border border-(--color-border) bg-(--color-surface) p-2"
        >
          ⚙️
        </button>
      </div>

      <Scoreboard />
      <WinProbChart />
      <TensionMeter />
      <SpeedControls />

      <div className="grid gap-4 sm:grid-cols-2">
        <ChatPulsePanel />
        <CallTheNextOverPanel />
        <RoomPanel />
        <SnapTheTV />
      </div>

      <ActionBar />
      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
