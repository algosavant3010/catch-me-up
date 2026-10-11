"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Settings2, Zap } from "lucide-react";
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
    <main className="page-shell flex flex-1 flex-col pb-28 sm:pb-8">
      <header className="flex items-center justify-between gap-4 border-b border-(--color-border) py-5">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold"
          aria-label="Catch Me Up home"
        >
          <Zap className="size-6 text-(--color-accent-2)" aria-hidden="true" />
          CATCH ME UP
          <span className="hidden text-xs font-medium text-(--color-text-muted) sm:inline">
            {" "}
            / MATCH CENTRE
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          aria-label={strings["nav.settings"]}
          title={strings["nav.settings"]}
          className="icon-button"
        >
          <Settings2 aria-hidden="true" />
        </button>
      </header>
      <div className="flex flex-wrap items-center justify-between gap-3 py-5 text-xs text-(--color-text-muted)">
        <p>{strings["app.simulatedBanner"]}</p>
        <span className="flex items-center gap-1 font-semibold">
          <ArrowUpRight size={14} aria-hidden="true" /> T20 / FINAL CHASE
        </span>
      </div>
      <h1 className="sr-only">Match centre</h1>
      <div className="match-grid">
        <Scoreboard />
        <div className="flex min-w-0 flex-col justify-between gap-5">
          <WinProbChart />
          <TensionMeter />
          <SpeedControls />
        </div>
      </div>
      <div className="mt-8 mb-3 flex items-center justify-between border-t border-(--color-border) pt-6">
        <h2 className="text-xl font-bold">Beyond the score</h2>
        <span className="eyebrow">The fan side</span>
      </div>
      <div className="match-tools">
        <ChatPulsePanel />
        <CallTheNextOverPanel />
        <RoomPanel />
        <SnapTheTV />
      </div>

      <ActionBar />
      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </main>
  );
}
